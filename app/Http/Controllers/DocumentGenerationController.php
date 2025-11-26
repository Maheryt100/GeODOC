<?php

namespace App\Http\Controllers;

use App\Models\Propriete;
use App\Models\Dossier;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\UserDemande;
use App\Models\UserCSF;
use App\Models\RecuPaiement;
use App\Models\ActivityLog; // ✅ AJOUT
use App\Models\DocumentGenere; // ✅ AJOUT
use App\Services\ActivityLogger; // ✅ AJOUT
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
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
        
        // Récupérer les propriétés avec leurs demandeurs liés (ACTIFS)
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
            
            // ✅ Vérifier si un reçu existe (via nouvelle table)
            $recu = DocumentGenere::findExisting(
                DocumentGenere::TYPE_RECU,
                $propriete->id
            );
            
            $propriete->has_recu = $recu !== null;
            $propriete->dernier_recu = $recu ? [
                'id' => $recu->id,
                'numero_recu' => $recu->numero_document,
                'montant' => $recu->montant,
                'date_recu' => $recu->date_document,
                'generated_by' => $recu->generatedBy->name ?? 'Inconnu',
                'generated_at' => $recu->generated_at->format('d/m/Y H:i'),
                'download_count' => $recu->download_count,
            ] : null;
            
            return $propriete;
        });

        return Inertia::render('documents/Generate', [
            'dossier' => $dossier,
            'proprietes' => $proprietes,
            'demandeurs' => $dossier->demandeurs,
        ]);
    }

    /**
     * ✅ SIMPLIFIÉ : Générer et télécharger directement le reçu (comme les autres documents)
     */
     /**
     * Générer et télécharger le reçu (avec logging)
     */
    public function generateRecu(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'id_demandeur' => 'required|exists:demandeurs,id',
        ]);

        try {
            $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);
            
            // ✅ Vérifier si le document existe déjà
            $documentExistant = DocumentGenere::findExisting(
                DocumentGenere::TYPE_RECU,
                $request->id_propriete,
                $request->id_demandeur
            );

            if ($documentExistant) {
                return $this->downloadExistingDocument($documentExistant, 'reçu');
            }

            // ✅ Sinon, générer le nouveau document
            return $this->createNewRecu($propriete, $demandeur);
            
        } catch (\Exception $e) {
            Log::error('Erreur génération/téléchargement reçu', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ Retélécharger un reçu existant
     */
    /**
     * Télécharger un reçu existant (avec logging)
     */
    public function downloadRecu($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);
            
            if (!$document->fileExists()) {
                return $this->regenerateDocument($document);
            }
            
            return $this->downloadExistingDocument($document, 'reçu');
            
        } catch (\Exception $e) {
            Log::error('Erreur téléchargement reçu', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Impossible de télécharger: ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ Régénérer un reçu si le fichier est perdu
     */
    private function regenerateRecu(RecuPaiement $recu)
    {
        try {
            $propriete = $recu->propriete()->with('dossier')->first();
            $demandeur = $recu->demandeur;
            
            // Régénérer le document Word
            $tempFilePath = $this->createRecu(
                $propriete, 
                $demandeur, 
                $recu->numero_recu, 
                (int) $recu->montant
            );
            
            // Sauvegarder à nouveau dans le storage
            $savedPath = $this->saveDocumentCopy($tempFilePath, 'RECU', $propriete, $demandeur);
            
            // Mettre à jour le chemin dans la BD
            $recu->update(['file_path' => $savedPath]);
            
            // ✅ Logger la régénération
            ActivityLogger::logDocumentDownload(ActivityLog::DOC_RECU, $recu->id, [
                'numero_recu' => $recu->numero_recu,
                'action_type' => 'regenerate',
                'id_district' => $propriete->dossier->id_district,
            ]);
            
            Log::info('Reçu régénéré avec succès', [
                'recu_id' => $recu->id,
                'new_path' => $savedPath,
                'user_id' => Auth::id()
            ]);
            
            // Télécharger le fichier régénéré
            return response()->download($tempFilePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Erreur régénération reçu', [
                'recu_id' => $recu->id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * ✅ Obtenir l'historique des reçus d'une propriété
     */
    public function getRecuHistory($id_propriete)
    {
        try {
            $documents = DocumentGenere::with(['demandeur', 'generatedBy'])
                ->where('id_propriete', $id_propriete)
                ->where('type_document', DocumentGenere::TYPE_RECU)
                ->orderBy('generated_at', 'desc')
                ->get()
                ->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'numero_recu' => $doc->numero_document,
                        'montant' => number_format($doc->montant, 0, ',', '.'),
                        'date_recu' => $doc->date_document->format('d/m/Y'),
                        'demandeur' => $doc->demandeur->nom_demandeur . ' ' . ($doc->demandeur->prenom_demandeur ?? ''),
                        'cree_par' => $doc->generatedBy->name ?? 'Utilisateur inconnu',
                        'cree_le' => $doc->generated_at->format('d/m/Y H:i'),
                        'status' => $doc->status,
                        'download_count' => $doc->download_count,
                        'file_exists' => $doc->fileExists(),
                    ];
                });
            
            return response()->json([
                'success' => true,
                'recus' => $documents
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération historique', [
                'id_propriete' => $id_propriete,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * ✅ Télécharger un document existant
     */
    private function downloadExistingDocument(DocumentGenere $document, string $typeName)
    {
        if (!$document->fileExists()) {
            Log::warning('Fichier introuvable, régénération', [
                'document_id' => $document->id,
                'file_path' => $document->file_path
            ]);
            
            return $this->regenerateDocument($document);
        }
        
        // Incrémenter le compteur
        $document->incrementDownloadCount();
        
        // Logger le téléchargement
        ActivityLogger::logDocumentDownload(
            $this->getActivityLogType($document->type_document),
            $document->id,
            [
                'numero_document' => $document->numero_document,
                'action_type' => 'download_existing',
                'download_count' => $document->download_count,
                'id_district' => $document->id_district,
            ]
        );
        
        Log::info('Document existant téléchargé', [
            'document_id' => $document->id,
            'type' => $document->type_document,
            'download_count' => $document->download_count,
            'user_id' => Auth::id()
        ]);
        
        return response()->download($document->full_path, $document->nom_fichier);
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
            
            // ✅ Vérifier qu'un reçu existe
            $recuExists = DocumentGenere::findExisting(
                DocumentGenere::TYPE_RECU,
                $request->id_propriete
            );
            
            if (!$recuExists) {
                return back()->withErrors([
                    'error' => 'Vous devez d\'abord générer le reçu de paiement.'
                ]);
            }
            
            // ✅ Vérifier si l'ADV existe déjà
            $documentExistant = DocumentGenere::findExisting(
                DocumentGenere::TYPE_ADV,
                $request->id_propriete,
                $request->id_demandeur
            );

            if ($documentExistant) {
                return $this->downloadExistingDocument($documentExistant, 'acte de vente');
            }

            // ✅ Sinon, générer le nouveau ADV
            return $this->createNewActeVente($propriete, $request->id_demandeur);
            
        } catch (\Exception $e) {
            Log::error('Erreur génération/téléchargement ADV', [
                'error' => $e->getMessage()
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
            $propriete = Propriete::with('dossier')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);
            
            // ✅ Vérifier si le CSF existe déjà
            $documentExistant = DocumentGenere::findExisting(
                DocumentGenere::TYPE_CSF,
                $request->id_propriete,
                $request->id_demandeur
            );

            if ($documentExistant) {
                return $this->downloadExistingDocument($documentExistant, 'CSF');
            }

            // ✅ Sinon, générer le nouveau CSF
            return $this->createNewCsf($propriete, $demandeur);
            
        } catch (\Exception $e) {
            Log::error('Erreur génération/téléchargement CSF', [
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }
    

    /**
     * ✅ Créer un nouveau reçu
     */
    private function createNewRecu($propriete, $demandeur)
    {
        DB::beginTransaction();

        try {
            // Calculer le prix
            $prix = $this->getPrixFromDistrict($propriete);
            $prixTotal = (int) ($prix * $propriete->contenance);
            
            // Générer le numéro
            $numeroRecu = $this->generateNumeroRecu($propriete->dossier->id_district);
            
            // Créer le fichier Word
            $tempFilePath = $this->createRecu($propriete, $demandeur, $numeroRecu, $prixTotal);
            
            if (!file_exists($tempFilePath)) {
                throw new \Exception("Échec de création du fichier Word");
            }
            
            // Sauvegarder dans le storage
            $savedPath = $this->saveDocumentCopy($tempFilePath, 'RECU', $propriete, $demandeur);
            $nomFichier = basename($savedPath);
            
            // ✅ Enregistrer dans documents_generes
            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_RECU,
                'id_propriete' => $propriete->id,
                'id_demandeur' => $demandeur->id,
                'id_dossier' => $propriete->id_dossier,
                'id_district' => $propriete->dossier->id_district,
                'numero_document' => $numeroRecu,
                'file_path' => $savedPath,
                'nom_fichier' => $nomFichier,
                'montant' => $prixTotal,
                'date_document' => Carbon::now(),
                'has_consorts' => false,
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);
            
            // ✅ Maintenir la compatibilité avec l'ancienne table
            RecuPaiement::create([
                'id_propriete' => $propriete->id,
                'id_demandeur' => $demandeur->id,
                'id_user' => Auth::id(),
                'numero_recu' => $numeroRecu,
                'montant' => $prixTotal,
                'date_recu' => Carbon::now(),
                'file_path' => $savedPath,
                'status' => 'confirmed',
            ]);
            
            DB::commit();
            
            // Logger la génération
            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_RECU, $document->id, [
                'numero_recu' => $numeroRecu,
                'propriete_id' => $propriete->id,
                'demandeur_id' => $demandeur->id,
                'montant' => $prixTotal,
                'lot' => $propriete->lot,
                'id_district' => $propriete->dossier->id_district,
            ]);
            
            Log::info('Nouveau reçu généré', [
                'document_id' => $document->id,
                'numero' => $numeroRecu,
                'file_path' => $savedPath
            ]);
            
            return response()->download($tempFilePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
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
            
            // ✅ Vérifier si la réquisition existe déjà
            $documentExistant = DocumentGenere::findExisting(
                DocumentGenere::TYPE_REQ,
                $request->id_propriete
            );

            if ($documentExistant) {
                return $this->downloadExistingDocument($documentExistant, 'réquisition');
            }

            // ✅ Sinon, générer la nouvelle réquisition
            return $this->createNewRequisition($propriete);
            
        } catch (\Exception $e) {
            Log::error('Erreur génération/téléchargement réquisition', [
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }



    /**
     * ✅ Créer un nouvel acte de vente
     */
    private function createNewActeVente($propriete, $idDemandeur)
    {
        DB::beginTransaction();

        try {
            // Récupérer TOUS les demandeurs liés
            $tousLesDemandeurs = Demander::with('demandeur')
                ->where('id_propriete', $propriete->id)
                ->where('status', 'active')
                ->get();
            
            $hasConsorts = $tousLesDemandeurs->count() > 1;
            $demandeursPrincipal = $tousLesDemandeurs->firstWhere('id_demandeur', $idDemandeur);
            
            if (!$demandeursPrincipal) {
                throw new \Exception("Demandeur introuvable dans les associations");
            }
            
            // Générer le fichier Word
            $tempFilePath = $this->createActeVente($propriete, $tousLesDemandeurs, $hasConsorts);
            
            // Sauvegarder
            $savedPath = $this->saveDocumentCopy($tempFilePath, 'ADV', $propriete, $demandeursPrincipal->demandeur);
            $nomFichier = basename($savedPath);
            
            // ✅ Enregistrer dans documents_generes
            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_ADV,
                'id_propriete' => $propriete->id,
                'id_demandeur' => $idDemandeur,
                'id_dossier' => $propriete->id_dossier,
                'id_district' => $propriete->dossier->id_district,
                'numero_document' => null,
                'file_path' => $savedPath,
                'nom_fichier' => $nomFichier,
                'has_consorts' => $hasConsorts,
                'demandeurs_ids' => $tousLesDemandeurs->pluck('id_demandeur')->toArray(),
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);
            
            DB::commit();
            
            // Logger
            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_ACTE_VENTE, $document->id, [
                'propriete_id' => $propriete->id,
                'demandeurs_count' => $tousLesDemandeurs->count(),
                'lot' => $propriete->lot,
                'titre' => $propriete->titre,
                'id_district' => $propriete->dossier->id_district,
            ]);
            
            Log::info('Nouvel ADV généré', [
                'document_id' => $document->id,
                'has_consorts' => $hasConsorts
            ]);
            
            return response()->download($tempFilePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }



    /**
     * ✅ Créer un nouveau CSF
     */
    private function createNewCsf($propriete, $demandeur)
    {
        DB::beginTransaction();

        try {
            $tempFilePath = $this->createCsf($demandeur, $propriete);
            $savedPath = $this->saveDocumentCopy($tempFilePath, 'CSF', $propriete, $demandeur);
            $nomFichier = basename($savedPath);
            
            // ✅ Enregistrer dans documents_generes
            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_CSF,
                'id_propriete' => $propriete->id,
                'id_demandeur' => $demandeur->id,
                'id_dossier' => $propriete->id_dossier,
                'id_district' => $propriete->dossier->id_district,
                'file_path' => $savedPath,
                'nom_fichier' => $nomFichier,
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);
            
            DB::commit();
            
            // Logger
            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_CSF, $document->id, [
                'propriete_id' => $propriete->id,
                'demandeur_id' => $demandeur->id,
                'lot' => $propriete->lot,
                'id_district' => $propriete->dossier->id_district,
            ]);
            
            return response()->download($tempFilePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * ✅ Créer une nouvelle réquisition
     */
    private function createNewRequisition($propriete)
    {
        DB::beginTransaction();

        try {
            $tempFilePath = $this->createRequisition($propriete);
            $savedPath = $this->saveDocumentCopy($tempFilePath, 'REQ', $propriete);
            $nomFichier = basename($savedPath);
            
            // ✅ Enregistrer dans documents_generes
            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_REQ,
                'id_propriete' => $propriete->id,
                'id_dossier' => $propriete->id_dossier,
                'id_district' => $propriete->dossier->id_district,
                'numero_document' => $propriete->numero_requisition,
                'file_path' => $savedPath,
                'nom_fichier' => $nomFichier,
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);
            
            DB::commit();
            
            // Logger
            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_REQUISITION, $document->id, [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'titre' => $propriete->titre,
                'numero_requisition' => $propriete->numero_requisition,
                'id_district' => $propriete->dossier->id_district,
            ]);
            
            return response()->download($tempFilePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }


    /**
     * ✅ Régénérer un document si le fichier est perdu
     */
    private function regenerateDocument(DocumentGenere $document)
    {
        try {
            $propriete = $document->propriete()->with('dossier')->first();
            
            $tempFilePath = match($document->type_document) {
                DocumentGenere::TYPE_RECU => $this->createRecu(
                    $propriete,
                    $document->demandeur,
                    $document->numero_document,
                    $document->montant
                ),
                DocumentGenere::TYPE_CSF => $this->createCsf(
                    $document->demandeur,
                    $propriete
                ),
                DocumentGenere::TYPE_REQ => $this->createRequisition($propriete),
                DocumentGenere::TYPE_ADV => throw new \Exception("La régénération d'ADV n'est pas supportée"),
                default => throw new \Exception("Type de document inconnu")
            };
            
            // Sauvegarder à nouveau
            $savedPath = $this->saveDocumentCopy(
                $tempFilePath,
                $document->type_document,
                $propriete,
                $document->demandeur
            );
            
            $document->update(['file_path' => $savedPath]);
            
            // Logger
            ActivityLogger::logDocumentDownload(
                $this->getActivityLogType($document->type_document),
                $document->id,
                [
                    'action_type' => 'regenerate',
                    'id_district' => $document->id_district,
                ]
            );
            
            Log::info('Document régénéré', [
                'document_id' => $document->id,
                'type' => $document->type_document
            ]);
            
            return response()->download($tempFilePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Erreur régénération document', [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * Helper pour obtenir le type de log
     */
    private function getActivityLogType(string $docType): string
    {
        return match($docType) {
            DocumentGenere::TYPE_RECU => ActivityLog::DOC_RECU,
            DocumentGenere::TYPE_ADV => ActivityLog::DOC_ACTE_VENTE,
            DocumentGenere::TYPE_CSF => ActivityLog::DOC_CSF,
            DocumentGenere::TYPE_REQ => ActivityLog::DOC_REQUISITION,
            default => 'document'
        };
    }

    // ==================== MÉTHODES PRIVÉES ====================

    /**
     * ✅ Générer un numéro de reçu unique basé sur l'année et le district
     */
    private function generateNumeroRecu($idDistrict): string
    {
        $year = Carbon::now()->format('y');
        
        $count = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
            ->whereYear('generated_at', Carbon::now()->year)
            ->where('id_district', $idDistrict)
            ->count() + 1;
        
        return sprintf('%03d/%s', $count, $year);
    }

    /**
     * ✅ Sauvegarder une copie permanente du document dans le storage
     */
    private function saveDocumentCopy(string $tempFilePath, string $type, Propriete $propriete, ?Demandeur $demandeur = null): string
    {
        $date = Carbon::now()->format('Y-m-d_His');
        $baseName = '';
        
        switch ($type) {
            case 'RECU':
                $nomDemandeur = $demandeur ? $demandeur->nom_demandeur : 'DEMANDEUR';
                $baseName = "{$date}_RECU_{$nomDemandeur}_LOT{$propriete->lot}.docx";
                $directory = 'pieces_jointes/documents/RECU';
                break;
                
            case 'ADV':
                $nomDemandeur = $demandeur ? $demandeur->nom_demandeur : 'CONSORTS';
                $baseName = "{$date}_ACTE_VENTE_{$nomDemandeur}_LOT{$propriete->lot}.docx";
                $directory = 'pieces_jointes/documents/ADV';
                break;
                
            case 'CSF':
                $nomDemandeur = $demandeur ? $demandeur->nom_demandeur : 'DEMANDEUR';
                $baseName = "{$date}_CSF_{$nomDemandeur}_LOT{$propriete->lot}.docx";
                $directory = 'pieces_jointes/documents/CSF';
                break;
                
            case 'REQ':
                $baseName = "{$date}_REQUISITION_LOT{$propriete->lot}_TN{$propriete->titre}.docx";
                $directory = 'pieces_jointes/documents/REQ';
                break;
                
            default:
                throw new \Exception("Type de document inconnu: {$type}");
        }
        
        $storagePath = $directory . '/' . $baseName;
        Storage::disk('public')->makeDirectory($directory);
        $fileContent = file_get_contents($tempFilePath);
        Storage::disk('public')->put($storagePath, $fileContent);
        
        return $storagePath;
    }


    /**
     * ✅ Créer le document de reçu Word
     */
    private function createRecu($propriete, $demandeur, $numeroRecu, $montantTotal)
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);
        
        $templatePath = storage_path('app/public/modele_odoc/recu_paiement.docx');
        
        if (!file_exists($templatePath)) {
            throw new \Exception("Template de reçu introuvable: {$templatePath}");
        }
        
        $modele_recu = new TemplateProcessor($templatePath);
        
        // Récupérer le district
        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->where('dossiers.id', $propriete->dossier->id)
            ->select('districts.nom_district')
            ->first();
        
        if (!$place) {
            throw new \Exception("District introuvable pour le dossier {$propriete->dossier->id}");
        }
        
        // Formatter les données
        $dateRecu = Carbon::now()->translatedFormat('d/m/Y');
        $montantLettres = Str::upper(ucfirst($formatter->format((int) $montantTotal)));
        $cinFormate = implode('.', str_split($demandeur->cin, 3));
        $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d/m/Y');
        
        $titreDemandeur = $demandeur->sexe === 'Homme' ? 'M.' : 'Mme';
        $nomComplet = $demandeur->nom_demandeur . ' ' . ($demandeur->prenom_demandeur ?? '');
        
        $motif = "Achat terrain Lot {$propriete->lot} TN°{$propriete->titre}";
        $details = "Propriété \"{$propriete->proprietaire}\" - Commune {$propriete->dossier->commune}";
        
        // Remplacer les variables
        $modele_recu->setValues([
            'District' => $place->nom_district,
            'NumeroRecu' => $numeroRecu,
            'DateRecu' => $dateRecu,
            'MontantChiffres' => number_format((int) $montantTotal, 0, ',', '.'),
            'TitreDemandeur' => $titreDemandeur,
            'NomComplet' => $nomComplet,
            'NumCIN' => $cinFormate,
            'DateDelivrance' => $dateDelivrance,
            'Domiciliation' => $demandeur->domiciliation,
            'MontantLettres' => $montantLettres,
            'Motif' => $motif,
            'Details' => $details,
        ]);
        
        // Sauvegarder dans un fichier temporaire
        $fileName = 'RECU_' . str_replace('/', '-', $numeroRecu) . '_' . uniqid() . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        
        $modele_recu->saveAs($filePath);
        
        Log::info('Fichier reçu créé', [
            'template' => $templatePath,
            'output' => $filePath,
            'exists' => file_exists($filePath)
        ]);
        
        return $filePath;
    }

    
   
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