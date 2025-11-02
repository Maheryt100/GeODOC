<?php

namespace App\Http\Controllers;

use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\UserCSF;
use App\Models\UserDemande;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use NumberFormatter;
use PhpOffice\PhpWord\TemplateProcessor;

class DocumentGenerationController extends Controller
{
    /**
     * Page principale de génération de documents
     */
    public function index($id_dossier)
    {
        $dossier = Dossier::with(['proprietes', 'demandeurs'])->findOrFail($id_dossier);
        
        // Récupérer les propriétés avec leurs demandeurs liés
        $proprietes = $dossier->proprietes->map(function ($propriete) {
            $propriete->demandeurs_lies = Demander::with('demandeur')
                ->where('id_propriete', $propriete->id)
                ->where('status', 'active')
                ->get()
                ->map(function ($demande) {
                    return [
                        'id' => $demande->id_demandeur,
                        'id_demande' => $demande->id,
                        'nom' => $demande->demandeur->nom_demandeur,
                        'prenom' => $demande->demandeur->prenom_demandeur,
                        'cin' => $demande->demandeur->cin,
                        'status_consort' => $demande->status_consort,
                    ];
                });
            return $propriete;
        });

        return Inertia::render('documents/Generate', [
            'dossier' => $dossier,
            'proprietes' => $proprietes,
            'demandeurs' => $dossier->demandeurs,
        ]);
    }

    /**
     * Prévisualisation des données du document
     */
    public function preview(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:acte_vente,csf,requisition',
                'id_propriete' => 'required_if:type,acte_vente,requisition|exists:proprietes,id',
                'id_demandeur' => 'required_if:type,acte_vente,csf|exists:demandeurs,id',
            ]);

            $data = [];
            
            if ($request->type === 'acte_vente') {
                $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
                $demandeur = Demandeur::findOrFail($request->id_demandeur);
                
                // Utiliser la nouvelle méthode getPrixFromDistrict
                $prix = $this->getPrixFromDistrict($propriete);
                $prixTotal = $prix * $propriete->contenance;
                
                // Chercher si une demande existe
                $demande = Demander::where('id_propriete', $request->id_propriete)
                    ->where('id_demandeur', $request->id_demandeur)
                    ->where('status', 'active')
                    ->first();
                
                $data = [
                    'demandeur' => $demandeur,
                    'propriete' => $propriete,
                    'dossier' => $propriete->dossier,
                    'prix' => $prix,
                    'prix_total' => $prixTotal,
                    'status_consort' => $demande ? $demande->status_consort : false,
                ];
                
            } elseif ($request->type === 'csf') {
                $demandeur = Demandeur::findOrFail($request->id_demandeur);
                $data = $this->prepareCsfData($demandeur, $request->id_propriete);
            } elseif ($request->type === 'requisition') {
                $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
                $data = $this->prepareRequisitionData($propriete);
            }

            return response()->json($data);
            
        } catch (\Exception $e) {
            Log::error('Erreur preview', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer Acte de Vente
     */
    public function generateActeVente(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'id_demandeur' => 'required|exists:demandeurs,id',
        ]);

        try {
            $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);
            
            // Chercher ou créer la demande
            $demande = Demander::with(['demandeur', 'propriete.dossier'])
                ->where('id_propriete', $request->id_propriete)
                ->where('id_demandeur', $request->id_demandeur)
                ->where('status', 'active')
                ->first();
            
            // Si pas de demande existante, créer une
            if (!$demande) {
                // Utiliser la méthode centralisée pour le prix
                $prix = $this->getPrixFromDistrict($propriete);
                $prixTotal = $prix * $propriete->contenance;
                
                // Créer la demande
                $demande = Demander::create([
                    'id_demandeur' => $demandeur->id,
                    'id_propriete' => $propriete->id,
                    'total_prix' => $prixTotal,
                    'id_user' => Auth::id(),
                    'status' => 'active',
                    'status_consort' => false,
                ]);
                
                // Recharger les relations
                $demande->load(['demandeur', 'propriete.dossier']);
            }
            
            $filePath = $this->createActeVente($demande);
            
            UserDemande::create([
                'id_user' => Auth::id(),
                'id_demande' => $demande->id,
            ]);

            return response()->download($filePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Erreur génération Acte de Vente', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Générer CSF
     */
    public function generateCsf(Request $request)
    {
        $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $demandeur = Demandeur::findOrFail($request->id_demandeur);
            $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
            
            $filePath = $this->createCsf($demandeur, $propriete);
            
            $demande = Demander::where('id_demandeur', $demandeur->id)
                ->where('id_propriete', $propriete->id)
                ->first();
                
            if ($demande) {
                UserCSF::create([
                    'id_user' => Auth::id(),
                    'id_demande' => $demande->id,
                ]);
            }

            return response()->download($filePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Erreur génération CSF', [
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    /**
     * Générer Réquisition
     */
    public function generateRequisition(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
            
            $filePath = $this->createRequisition($propriete);
            
            return response()->download($filePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Erreur génération Réquisition', [
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private function normalizeVocation(string $vocation): string
    {
        $mapping = [
            'Edilitaire' => 'edilitaire',
            'Agricole' => 'agricole',
            'Forestière' => 'forestiere',
            'Forestiere' => 'forestiere',
            'Touristique' => 'touristique',
        ];

        return $mapping[$vocation] ?? 'edilitaire';
    }

    private function getPrixFromDistrict($propriete): int
    {
        $dossier = $propriete->dossier;
        $vocationColumn = $this->normalizeVocation($propriete->vocation);
        
        Log::info('Récupération prix', [
            'vocation' => $propriete->vocation,
            'colonne' => $vocationColumn,
            'dossier_id' => $dossier->id,
        ]);

        $prixDistrict = DB::table('districts')
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select("districts.$vocationColumn as prix", 'districts.nom_district', 'dossiers.nom_dossier')
            ->where('dossiers.id', $dossier->id)
            ->first();

        if (!$prixDistrict) {
            Log::error('District introuvable', [
                'dossier_id' => $dossier->id,
                'id_district' => $dossier->id_district,
            ]);
            throw new \Exception("Configuration de prix introuvable pour ce dossier");
        }

        // Gérer les NULL explicitement
        $prix = $prixDistrict->prix ?? 0;
        
        if ($prix <= 0) {
            Log::warning('Prix = 0 ou NULL', [
                'district' => $prixDistrict->nom_district,
                'vocation' => $propriete->vocation,
                'colonne' => $vocationColumn,
                'prix_brut' => $prixDistrict->prix,
            ]);
            
            throw new \Exception(
                "Le prix pour la vocation '{$propriete->vocation}' n'est pas configuré dans le district '{$prixDistrict->nom_district}'. " .
                "Veuillez configurer les prix dans la section 'Prix des terrains'."
            );
        }

        return (int) $prix;
    }

    private function prepareActeVenteData($demande)
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $propriete = $demande->propriete;
        $dossier = $propriete->dossier;
        $demandeur = $demande->demandeur;

        // Calcul du prix
        $vocationColumn = $this->normalizeVocation($propriete->vocation);
        
        $prixDistrict = DB::table('districts')
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select("districts.$vocationColumn as prix")
            ->where('dossiers.id', $dossier->id)
            ->first();

        $prix = $prixDistrict->prix ?? 0;
        $prixTotal = $prix * $propriete->contenance;

        return [
            'demandeur' => $demandeur,
            'propriete' => $propriete,
            'dossier' => $dossier,
            'prix' => $prix,
            'prix_total' => $prixTotal,
            'prix_lettre' => Str::upper(ucfirst($formatter->format($prix))),
            'total_lettre' => Str::upper(ucfirst($formatter->format($prixTotal))),
            'status_consort' => $demande->status_consort,
        ];
    }

    private function prepareCsfData($demandeur, $id_propriete)
    {
        $propriete = Propriete::with('dossier')->findOrFail($id_propriete);
        $dossier = $propriete->dossier;

        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->where('dossiers.id', $dossier->id)
            ->select('districts.nom_district')
            ->first();

        return [
            'demandeur' => $demandeur,
            'propriete' => $propriete,
            'district' => $place->nom_district,
        ];
    }

    private function prepareRequisitionData($propriete)
    {
        $dossier = $propriete->dossier;

        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        return [
            'propriete' => $propriete,
            'dossier' => $dossier,
            'province' => $place->nom_province,
            'region' => $place->nom_region,
            'district' => $place->nom_district,
        ];
    }

    private function createActeVente($demande)
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $demandeur = $demande->demandeur;
        $propriete = $demande->propriete;
        $dossier = $propriete->dossier;

        // Utiliser la méthode centralisée pour récupérer le prix
        $prix = $this->getPrixFromDistrict($propriete);
        $prixLettre = Str::upper(ucfirst($formatter->format($prix)));
        $prixTotal = $demande->total_prix;
        $superficie = $propriete->contenance;

        // Calcul contenance Ha A Ca
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

        // Localisation
        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $firstLetterDistrict = strtolower(mb_substr($place->nom_district, 0, 1));
        $firstLetterCommune = strtolower(mb_substr($dossier->commune, 0, 1));

        $type_operation = $propriete->type_operation;

        if ($demande->status_consort == false) {
            // SANS CONSORT
            $templatePath = $type_operation == 'morcellement' 
                ? 'app/public/modele_odoc/sans_consort/morcellement.docx'
                : 'app/public/modele_odoc/sans_consort/immatriculation.docx';
                
            $modele_odoc = new TemplateProcessor(storage_path($templatePath));

            // Dates
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

            $fileName = 'ACTE_DE_VENTE_' . $demandeur->nom_demandeur . '_' . ($demandeur->prenom_demandeur ?? '') . '.docx';
            $filePath = storage_path('app/public/modele_odoc/sans_consort/documents/' . $fileName);
            
            $modele_odoc->saveAs($filePath);
            return $filePath;
            
        } else {
            // AVEC CONSORT
            $templatePath = $type_operation == 'morcellement' 
                ? 'app/public/modele_odoc/avec_consort/morcellement.docx'
                : 'app/public/modele_odoc/avec_consort/immatriculation.docx';
                
            $modele_odoc = new TemplateProcessor(storage_path($templatePath));

            // Consorts
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

            $fileName = 'ACTE_DE_VENTE_' . $demandeur->nom_demandeur . '_consort.docx';
            $filePath = storage_path('app/public/modele_odoc/avec_consort/documents/' . $fileName);
            
            $modele_odoc->saveAs($filePath);
            return $filePath;
        }
    }

    private function createCsf($demandeur, $propriete)
    {
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

        $fileName = 'CSF_' . $dossier->nom_dossier . '_TN' . ($propriete->titre ?? 'sans_titre') . '.docx';
        $filePath = storage_path('app/public/modele_odoc/document_CSF/documents/' . $fileName);
        
        $modele_csf->saveAs($filePath);
        
        return $filePath;
    }

    private function createRequisition($propriete)
    {
        $dossier = $propriete->dossier;

        if ($propriete->type_operation == 'morcellement') {
            $requisition_model = new TemplateProcessor(
                storage_path('app/public/modele_odoc/requisition_MO.docx')
            );
        } else {
            $requisition_model = new TemplateProcessor(
                storage_path('app/public/modele_odoc/requisition_IM.docx')
            );
        }

        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $requisition_model->setValues([
            'Province' => $place->nom_province,
            'Region' => $place->nom_region,
            'District' => $place->nom_district,
            'DISTRICT' => Str::upper($place->nom_district),
            'Situation' => $propriete->situation,
            'Nom_propriete' => Str::upper($propriete->proprietaire),
            'Titre' => $propriete->titre,
            'Commune' => $dossier->commune,
            'Fokotany' => $dossier->fokontany,
            'Numero_fn' => $propriete->numero_FN,
            'Propriete_mere' => Str::upper($propriete->propriete_mere ?? ''),
            'Titre_mere' => $propriete->titre_mere ?? '',
        ]);

        $fileName = 'Requisition_' . $propriete->titre . '_' . $propriete->lot . '_' . $propriete->type_operation . '.docx';
        $filePath = storage_path('app/public/modele_odoc/document_requisition/' . $fileName);
        
        $requisition_model->saveAs($filePath);
        
        return $filePath;
    }
}