<?php

namespace App\Http\Controllers;

use App\Models\Consort;
use App\Models\DemandeConsort;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\UserCSF;
use App\Models\UserDemande;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use NumberFormatter;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpWord\TemplateProcessor;

class DemandeController extends Controller
{
    public function index(Request $request, $dossierId)
    {
        $dossier = Dossier::findOrFail($dossierId);

        $query = Demander::with(['demandeur', 'propriete'])
            ->where('status', 'active')
            ->whereHas('propriete', fn($q) => $q->where('id_dossier', $dossier->id));

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->whereHas('propriete', fn($sub) =>
                $sub->where('lot', 'ilike', "%{$search}%")
                    ->orWhere('titre', 'ilike', "%{$search}%")
                )
                    ->orWhereHas('demandeur', fn($sub) =>
                    $sub->where('nom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('prenom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('cin', 'like', "%{$search}%")
                    );
            });
        }

        $demandes = $query->paginate(20);

        return Inertia::render('documents/index', [
            'dossier' => $dossier,
            'documents' => $demandes,
        ]);
    }

    public function create($id)
    {
        $dossier = Dossier::find($id);
        $demandeurs = $dossier->demandeurs->toArray();
        return Inertia::render('documents/create',[
            'proprietes' => Propriete::where('status',false)->where('id_dossier', $dossier->id)->get(),
            'demandeurs' => $demandeurs,
            'dossier' => $dossier,
        ]);
    }

    public function exportList($id)
    {
        $dossier = Dossier::find($id);
        $demandes = Demander::with(['demandeur', 'propriete'])
            ->whereHas('propriete', function ($q) use ($dossier) {
                $q->where('id_dossier', $dossier->id);
            })
            ->where('status', 'active')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'Lot');
        $sheet->setCellValue('B1', 'Demandeur');
        $sheet->setCellValue('C1', 'lieu Dite');
        $sheet->setCellValue('D1', 'fokontany');
        $sheet->setCellValue('E1', 'Nom Propriete');
        $sheet->setCellValue('F1', 'Nature');
        $sheet->setCellValue('G1', 'Superficie');
        $sheet->setCellValue('H1', 'PT');

        $row = 2;
        foreach ($demandes as $demande) {
            $sheet->setCellValue("A{$row}", $demande->propriete->lot);
            $sheet->setCellValue("B{$row}", $demande->demandeur->nom_demandeur . " " . $demande->demandeur->prenom_demandeur);
            $sheet->setCellValue("C{$row}", $demande->propriete->situation);
            $sheet->setCellValue("D{$row}", $dossier->fokontany);
            $sheet->setCellValue("E{$row}", $demande->propriete->proprietaire);
            $sheet->setCellValue("F{$row}", $demande->propriete->nature);
            $sheet->setCellValue("G{$row}",$demande->propriete->contenance);
            $sheet->setCellValue("H{$row}",$demande->total_prix);
            $row++;
        }
        $writer = new Xlsx($spreadsheet);
        $fileName = 'listes.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName);
    }

    /**
     * Normalise le nom de la vocation pour correspondre aux colonnes de districts
     */
    private function normalizeVocation(string $vocation): string
    {
        $mapping = [
            'Edilitaire' => 'edilitaire',
            'Agricole' => 'agricole',
            'Forestière' => 'forestiere',
            'Forestiere' => 'forestiere',
            'Touristique' => 'touristique',
        ];

        return $mapping[$vocation] ?? strtolower($vocation);
    }

    public function store(Request $request)
    {
        $validate = $request->validate([
            'id_dossier' => 'required|exists:dossiers,id',
            'propriete_id' => 'required|exists:proprietes,id',
            'demandeur_id' => 'required|exists:demandeurs,id',
            'consort' => 'array|nullable',
            'consort.*' => 'exists:demandeurs,id',
        ]);

        try {
            $dossier = Dossier::findOrFail($validate['id_dossier']);
            $propriete = Propriete::findOrFail($validate['propriete_id']);
            
            // Normaliser le nom de la vocation
            $vocationColumn = $this->normalizeVocation($propriete->vocation);
            
            Log::info('Calcul prix', [
                'vocation_originale' => $propriete->vocation,
                'colonne' => $vocationColumn,
                'dossier_id' => $dossier->id
            ]);

            // Récupération du prix
            $prixDistrict = DB::table('districts')
                ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
                ->select("districts.$vocationColumn as prix")
                ->where('dossiers.id', $dossier->id)
                ->first();

            if (!$prixDistrict || !isset($prixDistrict->prix) || $prixDistrict->prix <= 0) {
                Log::error('Prix introuvable ou invalide', [
                    'vocation' => $propriete->vocation,
                    'colonne' => $vocationColumn,
                    'dossier_id' => $dossier->id,
                    'resultat' => $prixDistrict
                ]);
                
                return back()->withErrors([
                    'error' => "Prix introuvable pour la vocation '{$propriete->vocation}'. Veuillez configurer le prix dans le district."
                ]);
            }

            $prix = $prixDistrict->prix;
            $superficie = $propriete->contenance;
            $prixTotal = $prix * $superficie;

            // Création de la demande
            $document = Demander::create([
                'id_demandeur' => $validate['demandeur_id'],
                'id_propriete' => $validate['propriete_id'],
                'total_prix' => $prixTotal,
                'id_user' => Auth::id(),
                'status' => 'active',
                'status_consort' => !empty($validate['consort']),
            ]);

            // Mise à jour du statut de la propriété
            $propriete->update(['status' => true]);

            // Gestion des consorts
            if (!empty($validate['consort'])) {
                foreach ($validate['consort'] as $id_consort) {
                    $consort = Consort::firstOrCreate([
                        'id_demandeur' => $validate['demandeur_id'],
                        'id_consort' => $id_consort,
                    ]);

                    DemandeConsort::create([
                        'id_consort' => $consort->id,
                        'id_demande' => $document->id,
                    ]);
                }
            }

            return redirect()->route('dossiers.list', $dossier->id)
                ->with('message', 'Document créé avec succès!');

        } catch (\Exception $exception) {
            Log::error('Erreur store demande', [
                'message' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function download($id)
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        try {
            $demande = Demander::with(['demandeur', 'propriete.dossier'])->findOrFail($id);
            
            $demandeur = $demande->demandeur;
            $propriete = $demande->propriete;
            $dossier = $propriete->dossier;

            // Normaliser la vocation
            $vocationColumn = $this->normalizeVocation($propriete->vocation);

            // Récupération du prix
            $prixDistrict = DB::table('districts')
                ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
                ->select("districts.$vocationColumn as prix")
                ->where('dossiers.id', $dossier->id)
                ->first();

            if (!$prixDistrict || !isset($prixDistrict->prix)) {
                return back()->withErrors([
                    'error' => "Prix introuvable pour la vocation: {$propriete->vocation}"
                ]);
            }

            $prix = $prixDistrict->prix;
            $prixLettre = Str::upper(ucfirst($formatter->format($prix)));
            $prixTotal = $demande->total_prix;
            $superficie = $propriete->contenance;

            // Calcul contenance en Ha A Ca
            $hectares = intdiv($superficie, 10000);
            $reste = $superficie % 10000;
            $ares = intdiv($reste, 100);
            $centiares = $reste % 100;

            $parts = [];
            $contenanceFormat = '';

            if ($hectares > 0) {
                $contenanceFormat .= str_pad($hectares, 2, '0', STR_PAD_LEFT) . 'Ha ';
                $label = $hectares === 1 ? 'HECTARE' : 'HECTARES';
                $parts[] = strtoupper($formatter->format($hectares)) . " $label";
            }

            if ($ares > 0 || $hectares > 0) {
                $contenanceFormat .= str_pad($ares, 2, '0', STR_PAD_LEFT) . 'A ';
                $label = $ares === 1 ? 'ARE' : 'ARES';
                $parts[] = strtoupper($formatter->format($ares)) . " $label";
            }

            $label = $centiares === 1 ? 'CENTIARE' : 'CENTIARES';
            $parts[] = strtoupper($formatter->format($centiares)) . " $label";

            $contenanceFormat .= str_pad($centiares, 2, '0', STR_PAD_LEFT) . 'Ca';
            $contenanceFormatLettre = implode(' ', $parts);
            $totalLettre = Str::upper(ucfirst($formatter->format($prixTotal)));

            // Récupération des informations géographiques
            $place = DB::table('dossiers')
                ->join('districts', 'districts.id', '=', 'dossiers.id_district')
                ->join('regions', 'regions.id', '=', 'districts.id_region')
                ->join('provinces', 'provinces.id', '=', 'regions.id_province')
                ->where('dossiers.id', $dossier->id)
                ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
                ->first();

            $firstLetterDistrict = strtolower(mb_substr($place->nom_district, 0, 1));
            $firstLetterCommune = strtolower(mb_substr($dossier->commune, 0, 1));

            // Enregistrer l'action
            UserDemande::create([
                'id_user' => Auth::id(),
                'id_demande' => $demande->id,
            ]);

            $type_operation = $propriete->type_operation;

            // Générer le document
            if ($demande->status_consort == false) {
                // SANS CONSORT
                $templatePath = $type_operation == 'morcellement' 
                    ? 'app/public/modele_odoc/sans_consort/morcellement.docx'
                    : 'app/public/modele_odoc/sans_consort/immatriculation.docx';
                    
                $modele_odoc = new TemplateProcessor(storage_path($templatePath));

                // Dates formatées
                $dateNaissance = Carbon::parse($demandeur->date_naissance)->translatedFormat('d F Y');
                $dateMariage = $demandeur->date_mariage ? Carbon::parse($demandeur->date_mariage)->translatedFormat('d F Y') : '';
                $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d F Y');
                $dateDescenteDebut = Carbon::parse($dossier->date_descente_debut)->translatedFormat('d');
                $dateDescenteFin = Carbon::parse($dossier->date_descente_fin)->translatedFormat('d F Y');
                $dateDescente = $dateDescenteDebut . ' au ' . $dateDescenteFin;
                
                $dateRequisition = $propriete->date_requisition ? Carbon::parse($propriete->date_requisition)->translatedFormat('d F Y') : '';
                $dateInscription = $propriete->date_inscription ? Carbon::parse($propriete->date_inscription)->translatedFormat('d F Y') : '';

                $modele_odoc->setValues([
                    'Titre_long' => $demandeur->titre_demandeur,
                    'Nom' => $demandeur->nom_demandeur,
                    'Prenom' => $demandeur->prenom_demandeur ?? '',
                    'Occupation' => $demandeur->occupation,
                    'Date_naissance' => $dateNaissance,
                    'Lieu_naissance' => $demandeur->lieu_naissance,
                    'Cin' => implode('.', str_split($demandeur->cin, 3)),
                    'Date_delivrance' => $dateDelivrance,
                    'Lieu_delivrance' => $demandeur->lieu_delivrance,
                    'Domiciliation' => $demandeur->domiciliation,
                    'Nationalite' => $demandeur->nationalite,
                    'Date_mariage' => $demandeur->date_mariage ? 'le ' . $dateMariage : '',
                    'Lieu_mariage' => $demandeur->lieu_mariage ? ' à ' . $demandeur->lieu_mariage . ', ' : '',
                    'Nom_mere' => $demandeur->nom_mere,
                    'Nom_pere' => $demandeur->nom_pere ? $demandeur->nom_pere . ' et de ' : '',
                    
                    'ContenanceFormatLettre' => $contenanceFormatLettre,
                    'ContenanceFormat' => $contenanceFormat,
                    'Prix' => $prixLettre,
                    'PrixTotal' => number_format($prixTotal, 0, ',', '.'),
                    'TotalLettre' => $totalLettre,
                    'PrixCarre' => number_format($prix, 0, ',', '.'),
                    
                    'Nature' => $propriete->nature,
                    'Vocation' => $propriete->vocation,
                    'Situation' => $propriete->situation,
                    'Fokotany' => $dossier->fokontany,
                    'Commune' => $dossier->commune,
                    'Tcommune' => $dossier->type_commune,
                    'Propriete_mere' => Str::upper($propriete->propriete_mere ?? ''),
                    'Titre_mere' => $propriete->titre_mere ?? '',
                    'Titre' => $propriete->titre ?? '',
                    'DateDescente' => $dateDescente,
                    'Requisition' => $dateRequisition,
                    'Inscription' => $dateInscription,
                    'Dep_vol' => $propriete->dep_vol ?? '',
                    
                    'Proprietaire' => Str::upper($propriete->proprietaire),
                    'Province' => $place->nom_province,
                    'Region' => $place->nom_region,
                    'District' => $place->nom_district,
                    'DISTRICT' => Str::upper($place->nom_district),
                    'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
                    'd_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
                    'd_com' => in_array($firstLetterCommune, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
                ]);

                if ($demandeur->sexe == 'Homme') {
                    $modele_odoc->setValues([
                        'EnfantDe' => 'fils',
                        'Demandeur' => 'au demandeur',
                        'Marie_a' => $demandeur->marie_a ? 'marié à la dame ' . $demandeur->marie_a . ',' : '',
                    ]);
                } else {
                    $modele_odoc->setValues([
                        'EnfantDe' => 'fille',
                        'Demandeur' => 'à la demanderesse',
                        'Marie_a' => $demandeur->marie_a ? 'mariée à monsieur ' . $demandeur->marie_a . ',' : '',
                    ]);
                }

                $fileName = 'ACTE_DE_VENTE_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
                $filePath = sys_get_temp_dir() . '/' . $fileName;
                
                $modele_odoc->saveAs($filePath);
                return response()->download($filePath)->deleteFileAfterSend(true);
                
            } else {
                // AVEC CONSORT
                $templatePath = $type_operation == 'morcellement' 
                    ? 'app/public/modele_odoc/avec_consort/morcellement.docx'
                    : 'app/public/modele_odoc/avec_consort/immatriculation.docx';
                    
                $modele_odoc = new TemplateProcessor(storage_path($templatePath));

                // Récupération des consorts
                $consorts = $demande->consorts()->pluck('consorts.id_consort')->toArray();
                array_unshift($consorts, $demande->id_demandeur);

                $modele_odoc->cloneBlock('consort_block_1', count($consorts), true, true);
                $modele_odoc->cloneBlock('consort_block_2', count($consorts), true, true);

                foreach ($consorts as $key => $consort_id) {
                    $n = $key + 1;
                    $dmdr = Demandeur::findOrFail($consort_id);

                    $dateNaissance = Carbon::parse($dmdr->date_naissance)->translatedFormat('d F Y');
                    $dateMariage = $dmdr->date_mariage ? Carbon::parse($dmdr->date_mariage)->translatedFormat('d F Y') : '';
                    $dateDelivrance = Carbon::parse($dmdr->date_delivrance)->translatedFormat('d F Y');

                    $modele_odoc->setValues([
                        'Numero#' . $n => $n,
                        'Titre_long#' . $n => $dmdr->titre_demandeur,
                        'Nom#' . $n => $dmdr->nom_demandeur,
                        'Prenom#' . $n => $dmdr->prenom_demandeur ?? '',
                        'Occupation#' . $n => $dmdr->occupation,
                        'Date_naissance#' . $n => $dateNaissance,
                        'Lieu_naissance#' . $n => $dmdr->lieu_naissance,
                        'Cin#' . $n => implode('.', str_split($dmdr->cin, 3)),
                        'Date_delivrance#' . $n => $dateDelivrance,
                        'Lieu_delivrance#' . $n => $dmdr->lieu_delivrance,
                        'Domiciliation#' . $n => $dmdr->domiciliation,
                        'Nationalite#' . $n => $dmdr->nationalite,
                        'Date_mariage#' . $n => $dmdr->date_mariage ? 'le ' . $dateMariage : '',
                        'Lieu_mariage#' . $n => $dmdr->lieu_mariage ? ' à ' . $dmdr->lieu_mariage . ', ' : '',
                        'Nom_mere#' . $n => $dmdr->nom_mere,
                        'Nom_pere#' . $n => $dmdr->nom_pere ? $dmdr->nom_pere . ' et de ' : '',
                        'ET#' . $n => ($n == 1) ? 'ET - ' : '',
                    ]);

                    if ($dmdr->sexe == 'Homme') {
                        $modele_odoc->setValues([
                            'EnfantDe#' . $n => 'fils',
                            'Demandeur#' . $n => 'au demandeur',
                            'Marie_a#' . $n => $dmdr->marie_a ? 'marié à la dame ' . $dmdr->marie_a . ',' : '',
                        ]);
                    } else {
                        $modele_odoc->setValues([
                            'EnfantDe#' . $n => 'fille',
                            'Demandeur#' . $n => 'à la demanderesse',
                            'Marie_a#' . $n => $dmdr->marie_a ? 'mariée à monsieur ' . $dmdr->marie_a . ',' : '',
                        ]);
                    }
                }

                // Valeurs communes
                $dateDescenteDebut = Carbon::parse($dossier->date_descente_debut)->translatedFormat('d');
                $dateDescenteFin = Carbon::parse($dossier->date_descente_fin)->translatedFormat('d F Y');
                $dateDescente = $dateDescenteDebut . ' au ' . $dateDescenteFin;
                
                $dateRequisition = $propriete->date_requisition ? Carbon::parse($propriete->date_requisition)->translatedFormat('d F Y') : '';
                $dateInscription = $propriete->date_inscription ? Carbon::parse($propriete->date_inscription)->translatedFormat('d F Y') : '';

                $modele_odoc->setValues([
                    'ContenanceFormatLettre' => $contenanceFormatLettre,
                    'ContenanceFormat' => $contenanceFormat,
                    'Prix' => $prixLettre,
                    'PrixTotal' => number_format($prixTotal, 0, ',', '.'),
                    'TotalLettre' => $totalLettre,
                    'PrixCarre' => number_format($prix, 0, ',', '.'),
                    'Nature' => $propriete->nature,
                    'Vocation' => $propriete->vocation,
                    'Situation' => $propriete->situation,
                    'Fokotany' => $dossier->fokontany,
                    'Tcommune' => $dossier->type_commune,
                    'Commune' => $dossier->commune,
                    'Propriete_mere' => Str::upper($propriete->propriete_mere ?? ''),
                    'Titre_mere' => $propriete->titre_mere ?? '',
                    'Titre' => $propriete->titre ?? '',
                    'Date_descente' => $dateDescente,
                    'Requisition' => $dateRequisition,
                    'Inscription' => $dateInscription,
                    'Dep_vol' => $propriete->dep_vol ?? '',
                    
                    'Proprietaire' => Str::upper($propriete->proprietaire),
                    'Province' => $place->nom_province,
                    'Region' => $place->nom_region,
                    'District' => $place->nom_district,
                    'DISTRICT' => Str::upper($place->nom_district),
                    'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
                    'd_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
                    'd_com' => in_array($firstLetterCommune, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
                ]);

                $fileName = 'ACTE_DE_VENTE_CONSORTS_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
                $filePath = sys_get_temp_dir() . '/' . $fileName;
                
                $modele_odoc->saveAs($filePath);
                return response()->download($filePath)->deleteFileAfterSend(true);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur download document', [
                'demande_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de la génération: ' . $e->getMessage()]);
        }
    }

    public function archive(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|exists:demander,id',
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        try {
            DB::beginTransaction();

            $demande = Demander::findOrFail($validated['id']);
            
            // Marquer la demande comme archivée
            $demande->status = 'archive';
            $demande->save();

            // Bloquer la propriété
            $propriete = Propriete::findOrFail($demande->id_propriete);
            $propriete->status = true;
            $propriete->save();

            DB::commit();

            Log::info('Document archivé et propriété bloquée', [
                'demande_id' => $demande->id,
                'propriete_id' => $propriete->id,
                'propriete_lot' => $propriete->lot
            ]);

            return redirect()
                ->route('dossiers.list', $validated['id_dossier'])
                ->with('success', 'Document archivé et propriété bloquée avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur archivage document', [
                'demande_id' => $request->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Erreur lors de l\'archivage : ' . $e->getMessage());
        }
    }

    public function downloadCSF($id)
    {
        $demande = Demander::with(['demandeur', 'propriete.dossier'])->findOrFail($id);
        
        $demandeur = $demande->demandeur;
        $propriete = $demande->propriete;
        $dossier = $propriete->dossier;

        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $firstLetterDistrict = strtolower(mb_substr($place->nom_district, 0, 1));

        $modele_csf = new TemplateProcessor(
            storage_path('app/public/modele_odoc/document_CSF/Certificat_situation_financiere.docx')
        );

        $modele_csf->setValues([
            'Titre_long' => $demandeur->titre_demandeur,
            'Nom' => $demandeur->nom_demandeur,
            'Prenom' => $demandeur->prenom_demandeur ?? '',
            'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
            'Numero_FN' => $propriete->numero_FN ?? '',
            'DISTRICT' => Str::upper($place->nom_district),
            'Province' => $place->nom_province,
        ]);

        $fileName = 'CSF_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        
        $modele_csf->saveAs($filePath);
        
        UserCSF::create([
            'id_user' => Auth::id(),
            'id_demande' => $demande->id,
        ]);

        return response()->download($filePath)->deleteFileAfterSend(true);
    }

    public function list($id)
    {
        $dossier = Dossier::find($id);
        
        // Charger TOUS les documents (actifs ET archivés)
        $demandes = Demander::with(['demandeur', 'propriete'])
            ->whereHas('propriete', function ($q) use ($dossier) {
                $q->where('id_dossier', $dossier->id);
            })
            ->orderBy('status', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('documents/index',[
            'dossier' => $dossier,
            'documents'=> $demandes,
        ]);
    }

    public function unarchive(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|exists:demander,id',
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        try {
            DB::beginTransaction();

            $demande = Demander::findOrFail($validated['id']);
            
            // Réactiver la demande
            $demande->status = 'active';
            $demande->save();

            DB::commit();

            Log::info('Document désarchivé', [
                'demande_id' => $demande->id,
                'propriete_id' => $demande->id_propriete
            ]);

            return redirect()
                ->route('dossiers.list', $validated['id_dossier'])
                ->with('success', 'Document désarchivé avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur désarchivage document', [
                'demande_id' => $request->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Erreur lors de la désarchivation : ' . $e->getMessage());
        }
    }
}