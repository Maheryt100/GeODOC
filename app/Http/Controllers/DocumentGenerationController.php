<?php

namespace App\Http\Controllers;

use App\Models\Propriete;
use App\Models\Dossier;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\UserDemande;
use App\Models\UserCSF;
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
        
        // ✅ Récupérer les propriétés avec leurs demandeurs liés (ACTIFS)
        $proprietes = $dossier->proprietes->map(function ($propriete) {
            $propriete->demandeurs_lies = Demander::with('demandeur')
                ->where('id_propriete', $propriete->id)
                ->where('status', 'active') // ✅ SEULEMENT LES ACTIFS
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
     * Générer Acte de Vente (GET - téléchargement direct)
     */
    public function generateActeVente(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'id_demandeur' => 'required|exists:demandeurs,id',
        ]);

        try {
            $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
            
            // Récupérer TOUS les demandeurs liés à cette propriété
            $tousLesDemandeurs = Demander::with('demandeur')
                ->where('id_propriete', $request->id_propriete)
                ->where('status', 'active')
                ->get();
            
            $hasConsorts = $tousLesDemandeurs->count() > 1;
            
            // Générer le document
            $filePath = $this->createActeVente($propriete, $tousLesDemandeurs, $hasConsorts);
            
            // Enregistrer dans user_demande pour traçabilité
            foreach ($tousLesDemandeurs as $demande) {
                UserDemande::firstOrCreate([
                    'id_user' => Auth::id(),
                    'id_demande' => $demande->id,
                ]);
            }

            // ✅ Télécharger et supprimer le fichier temporaire (comme l'ancienne version)
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
     * Générer CSF (GET - téléchargement direct)
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
            
            // Enregistrer dans user_csf pour traçabilité
            $demande = Demander::where('id_demandeur', $demandeur->id)
                ->where('id_propriete', $propriete->id)
                ->first();
                
            if ($demande) {
                UserCSF::create([
                    'id_user' => Auth::id(),
                    'id_demande' => $demande->id,
                ]);
            }

            // ✅ Télécharger et supprimer le fichier temporaire (comme l'ancienne version)
            return response()->download($filePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Erreur génération CSF', [
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    /**
     * Générer Réquisition (GET - téléchargement direct)
     */
    public function generateRequisition(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
            
            $filePath = $this->createRequisition($propriete);
            
            // ✅ Télécharger et supprimer le fichier temporaire (comme l'ancienne version)
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
        
        $prixDistrict = DB::table('districts')
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select("districts.$vocationColumn as prix", 'districts.nom_district')
            ->where('dossiers.id', $dossier->id)
            ->first();

        if (!$prixDistrict) {
            throw new \Exception("Configuration de prix introuvable pour ce dossier");
        }

        $prix = $prixDistrict->prix ?? 0;
        
        if ($prix <= 0) {
            throw new \Exception(
                "Le prix pour la vocation '{$propriete->vocation}' n'est pas configuré dans le district '{$prixDistrict->nom_district}'. " .
                "Veuillez configurer les prix dans la section 'Prix des terrains'."
            );
        }

        return (int) $prix;
    }

    /**
     * Créer l'acte de vente (avec ou sans consorts)
     */
    private function createActeVente($propriete, $tousLesDemandeurs, $hasConsorts)
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $dossier = $propriete->dossier;
        $type_operation = $propriete->type_operation;

        // Calcul du prix
        $prix = $this->getPrixFromDistrict($propriete);
        $prixLettre = Str::upper(ucfirst($formatter->format($prix)));
        $prixTotal = $prix * $propriete->contenance;
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

        // Dates communes
        $dateDescenteDebut = Carbon::parse($dossier->date_descente_debut)->translatedFormat('d');
        $dateDescenteFin = Carbon::parse($dossier->date_descente_fin)->translatedFormat('d F Y');
        $dateDescente = $dateDescenteDebut . ' au ' . $dateDescenteFin;
        
        $dateRequisition = $propriete->date_requisition ? Carbon::parse($propriete->date_requisition)->translatedFormat('d F Y') : '';
        $dateInscription = $propriete->date_inscription ? Carbon::parse($propriete->date_inscription)->translatedFormat('d F Y') : '';

        if (!$hasConsorts) {
            // ===== SANS CONSORT =====
            $demandeur = $tousLesDemandeurs->first()->demandeur;
            
            $templatePath = $type_operation == 'morcellement' 
                ? 'app/public/modele_odoc/sans_consort/morcellement.docx'
                : 'app/public/modele_odoc/sans_consort/immatriculation.docx';
                
            $modele_odoc = new TemplateProcessor(storage_path($templatePath));

            $dateNaissance = Carbon::parse($demandeur->date_naissance)->translatedFormat('d F Y');
            $dateMariage = $demandeur->date_mariage ? Carbon::parse($demandeur->date_mariage)->translatedFormat('d F Y') : '';
            $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d F Y');

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

            // ✅ Générer dans un fichier temporaire (comme l'ancienne version)
            $fileName = 'ACTE_VENTE_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
            $filePath = sys_get_temp_dir() . '/' . $fileName;
            
            $modele_odoc->saveAs($filePath);
            return $filePath;
            
        } else {
            // ===== AVEC CONSORTS =====
            $templatePath = $type_operation == 'morcellement' 
                ? 'app/public/modele_odoc/avec_consort/morcellement.docx'
                : 'app/public/modele_odoc/avec_consort/immatriculation.docx';
                
            $modele_odoc = new TemplateProcessor(storage_path($templatePath));

            // Cloner les blocs pour tous les demandeurs
            $nombreDemandeurs = $tousLesDemandeurs->count();
            $modele_odoc->cloneBlock('consort_block_1', $nombreDemandeurs, true, true);
            $modele_odoc->cloneBlock('consort_block_2', $nombreDemandeurs, true, true);

            // Remplir les données pour chaque demandeur
            foreach ($tousLesDemandeurs as $key => $demande) {
                $n = $key + 1;
                $dmdr = $demande->demandeur;

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

            $premierDemandeur = $tousLesDemandeurs->first()->demandeur;
            $fileName = 'ACTE_VENTE_CONSORTS_' . uniqid() . '_' . $premierDemandeur->nom_demandeur . '.docx';
            $filePath = sys_get_temp_dir() . '/' . $fileName;
            
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

        $fileName = 'CSF_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        
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

        $fileName = 'REQUISITION_' . uniqid() . '_' . $propriete->titre . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        
        $requisition_model->saveAs($filePath);
        
        return $filePath;
    }
}