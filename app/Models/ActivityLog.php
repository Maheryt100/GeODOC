<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class ActivityLog extends Model
{
    protected $fillable = [
        'id_user',
        'action',
        'entity_type',
        'entity_id',
        'document_type',
        'id_district',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ============ RELATIONS ============
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    // ============ SCOPES ============
    
    public function scopeDocuments($query)
    {
        return $query->where('entity_type', self::ENTITY_DOCUMENT);
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('id_user', $userId);
    }

    public function scopeByDistrict($query, int $districtId)
    {
        return $query->where('id_district', $districtId);
    }

    public function scopeInDateRange($query, $dateFrom, $dateTo)
    {
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
        return $query;
    }

    /**
     * ✅ NOUVEAU : Scope pour les activités récentes
     */
    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }

    /**
     * ✅ NOUVEAU : Scope pour les dossiers (toutes actions)
     */
    public function scopeDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER);
    }

    /**
     * ✅ NOUVEAU : Scope pour les fermetures de dossiers
     */
    public function scopeClosedDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER)
                     ->where('action', self::ACTION_CLOSE);
    }

    /**
     * ✅ NOUVEAU : Scope pour les réouvertures de dossiers
     */
    public function scopeReopenedDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER)
                     ->where('action', self::ACTION_REOPEN);
    }

    // ============ CONSTANTES ============
    
    // Actions
    const ACTION_LOGIN = 'login';
    const ACTION_LOGOUT = 'logout';
    const ACTION_GENERATE = 'generate';
    const ACTION_DOWNLOAD = 'download';
    const ACTION_CREATE = 'create';
    const ACTION_UPDATE = 'update';
    const ACTION_DELETE = 'delete';
    const ACTION_ARCHIVE = 'archive';
    const ACTION_UNARCHIVE = 'unarchive';
    const ACTION_EXPORT = 'export';
    const ACTION_VIEW = 'view'; // ✅ AJOUTÉ
    const ACTION_CLOSE = 'close'; // ✅ NOUVEAU
    const ACTION_REOPEN = 'reopen'; // ✅ NOUVEAU
    const ACTION_UPLOAD = 'upload'; // ✅ NOUVEAU
    const ACTION_VERIFY = 'verify'; // ✅ NOUVEAU
    
    // Types d'entités
    const ENTITY_DOCUMENT = 'document';
    const ENTITY_DOSSIER = 'dossier';
    const ENTITY_PROPRIETE = 'propriete';
    const ENTITY_DEMANDEUR = 'demandeur';
    const ENTITY_USER = 'user';
    const ENTITY_AUTH = 'auth';
    const ENTITY_DISTRICT = 'district';
    const ENTITY_PIECE_JOINTE = 'piece_jointe'; // ✅ NOUVEAU
    
    // Types de documents
    const DOC_RECU = 'recu';
    const DOC_ACTE_VENTE = 'acte_vente';
    const DOC_CSF = 'csf';
    const DOC_REQUISITION = 'requisition';

    // ============ HELPERS ============
    
    /**
     * Logger une activité
     */
    public static function logActivity(
        string $action,
        string $entityType,
        ?int $entityId = null,
        array $metadata = []
    ): self {
        $user = Auth::user();
        
        if (!$user) {
            throw new \Exception('Utilisateur non authentifié pour logger l\'activité');
        }
        
        return self::create([
            'id_user' => $user->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'document_type' => $metadata['document_type'] ?? null,
            'id_district' => $metadata['id_district'] ?? $user->id_district,
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * ✅ NOUVEAU : Logger un upload de pièce jointe
     */
    public static function logPieceJointeUpload(
        int $pieceJointeId,
        string $nomFichier,
        int $taille,
        string $attachableType,
        int $attachableId,
        int $districtId,
        ?string $typeDocument = null
    ): self {
        return self::logActivity(
            self::ACTION_UPLOAD,
            self::ENTITY_PIECE_JOINTE,
            $pieceJointeId,
            [
                'nom_fichier' => $nomFichier,
                'taille' => $taille,
                'type_document' => $typeDocument,
                'attachable_type' => $attachableType,
                'attachable_id' => $attachableId,
                'id_district' => $districtId,
            ]
        );
    }

    /**
     * ✅ NOUVEAU : Logger une vérification de document
     */
    public static function logPieceJointeVerification(
        int $pieceJointeId,
        string $nomFichier,
        int $districtId
    ): self {
        return self::logActivity(
            self::ACTION_VERIFY,
            self::ENTITY_PIECE_JOINTE,
            $pieceJointeId,
            [
                'nom_fichier' => $nomFichier,
                'id_district' => $districtId,
            ]
        );
    }


    /**
     * ✅ NOUVEAU : Logger une fermeture de dossier
     */
    public static function logDossierClosure(
        int $dossierId,
        int $districtId,
        ?string $motif = null,
        ?string $dateFermeture = null
    ): self {
        return self::logActivity(
            self::ACTION_CLOSE,
            self::ENTITY_DOSSIER,
            $dossierId,
            [
                'id_district' => $districtId,
                'motif_fermeture' => $motif,
                'date_fermeture' => $dateFermeture,
                'timestamp' => now()->toDateTimeString(),
            ]
        );
    }

    /**
     * ✅ NOUVEAU : Logger une réouverture de dossier
     */
    public static function logDossierReopen(
        int $dossierId,
        int $districtId,
        ?string $reason = null
    ): self {
        return self::logActivity(
            self::ACTION_REOPEN,
            self::ENTITY_DOSSIER,
            $dossierId,
            [
                'id_district' => $districtId,
                'reopen_reason' => $reason,
                'timestamp' => now()->toDateTimeString(),
            ]
        );
    }

    /**
     * ✅ NOUVEAU : Logger une génération de document
     */
    public static function logDocumentGeneration(
        string $documentType,
        int $entityId,
        int $districtId,
        array $additionalMetadata = []
    ): self {
        return self::logActivity(
            self::ACTION_GENERATE,
            self::ENTITY_DOCUMENT,
            $entityId,
            array_merge([
                'document_type' => $documentType,
                'id_district' => $districtId,
                'generated_at' => now()->toDateTimeString(),
            ], $additionalMetadata)
        );
    }

    /**
     * ✅ NOUVEAU : Logger un téléchargement de document
     */
    public static function logDocumentDownload(
        string $documentType,
        int $entityId,
        int $districtId,
        array $additionalMetadata = []
    ): self {
        return self::logActivity(
            self::ACTION_DOWNLOAD,
            self::ENTITY_DOCUMENT,
            $entityId,
            array_merge([
                'document_type' => $documentType,
                'id_district' => $districtId,
                'downloaded_at' => now()->toDateTimeString(),
            ], $additionalMetadata)
        );
    }

    /**
     * Obtenir le label de l'action
     */
    public function getActionLabelAttribute(): string
    {
        return match($this->action) {
            self::ACTION_LOGIN => 'Connexion',
            self::ACTION_LOGOUT => 'Déconnexion',
            self::ACTION_GENERATE => 'Génération',
            self::ACTION_DOWNLOAD => 'Téléchargement',
            self::ACTION_CREATE => 'Création',
            self::ACTION_UPDATE => 'Modification',
            self::ACTION_DELETE => 'Suppression',
            self::ACTION_ARCHIVE => 'Archivage',
            self::ACTION_UNARCHIVE => 'Désarchivage',
            self::ACTION_EXPORT => 'Export',
            self::ACTION_VIEW => 'Consultation',
            self::ACTION_CLOSE => 'Fermeture', // ✅ NOUVEAU
            self::ACTION_REOPEN => 'Réouverture', // ✅ NOUVEAU
            self::ACTION_UPLOAD => 'Upload', // ✅ NOUVEAU
            self::ACTION_VERIFY => 'Vérification', // ✅ NOUVEAU
            default => ucfirst($this->action),
        };
    }

    /**
     * Obtenir le label du type d'entité
     */
    public function getEntityLabelAttribute(): string
    {
        return match($this->entity_type) {
            self::ENTITY_DOCUMENT => 'Document',
            self::ENTITY_DOSSIER => 'Dossier',
            self::ENTITY_PROPRIETE => 'Propriété',
            self::ENTITY_DEMANDEUR => 'Demandeur',
            self::ENTITY_USER => 'Utilisateur',
            self::ENTITY_AUTH => 'Authentification',
            self::ENTITY_DISTRICT => 'District',
            self::ENTITY_PIECE_JOINTE => 'Pièce jointe', // ✅ NOUVEAU
            default => ucfirst($this->entity_type),
        };
    }

    /**
     * Obtenir la description lisible de l'activité
     */
    public function getDescriptionAttribute(): string
    {
        $description = "{$this->action_label} de {$this->entity_label}";
        
        if ($this->document_type) {
            $docType = match($this->document_type) {
                self::DOC_RECU => 'Reçu',
                self::DOC_ACTE_VENTE => 'Acte de Vente',
                self::DOC_CSF => 'CSF',
                self::DOC_REQUISITION => 'Réquisition',
                default => ucfirst($this->document_type),
            };
            $description .= " ({$docType})";
        }
        
        // ✅ NOUVEAU : Ajouter des détails pour les fermetures/réouvertures
        if ($this->action === self::ACTION_CLOSE && isset($this->metadata['motif_fermeture'])) {
            $description .= " - Motif: " . \Illuminate\Support\Str::limit($this->metadata['motif_fermeture'], 50);
        }
        
        return $description;
    }

    /**
     * ✅ NOUVEAU : Obtenir le badge de couleur selon l'action
     */
    public function getActionColorAttribute(): string
    {
        return match($this->action) {
            self::ACTION_CREATE => 'green',
            self::ACTION_UPDATE => 'blue',
            self::ACTION_DELETE => 'red',
            self::ACTION_CLOSE => 'orange',
            self::ACTION_REOPEN => 'green',
            self::ACTION_ARCHIVE => 'gray',
            self::ACTION_UNARCHIVE => 'blue',
            self::ACTION_GENERATE => 'purple',
            self::ACTION_DOWNLOAD => 'indigo',
            self::ACTION_EXPORT => 'pink',
            self::ACTION_VIEW => 'slate',
            self::ACTION_LOGIN => 'cyan',
            self::ACTION_LOGOUT => 'gray',
            self::ACTION_UPLOAD => 'teal', // ✅ NOUVEAU
            self::ACTION_VERIFY => 'emerald', // ✅ NOUVEAU
            default => 'gray',
        };
    }

    /**
     * ✅ NOUVEAU : Obtenir l'icône selon l'action
     */
    public function getActionIconAttribute(): string
    {
        return match($this->action) {
            self::ACTION_CREATE => 'plus-circle',
            self::ACTION_UPDATE => 'edit',
            self::ACTION_DELETE => 'trash',
            self::ACTION_CLOSE => 'lock',
            self::ACTION_REOPEN => 'lock-open',
            self::ACTION_ARCHIVE => 'archive',
            self::ACTION_UNARCHIVE => 'archive-restore',
            self::ACTION_GENERATE => 'file-text',
            self::ACTION_DOWNLOAD => 'download',
            self::ACTION_EXPORT => 'file-export',
            self::ACTION_VIEW => 'eye',
            self::ACTION_LOGIN => 'log-in',
            self::ACTION_LOGOUT => 'log-out',
            self::ACTION_UPLOAD => 'upload', // ✅ NOUVEAU
            self::ACTION_VERIFY => 'check-circle', // ✅ NOUVEAU
            default => 'activity',
        };
    }

    // ============ STATISTIQUES ============
    
    /**
     * ✅ NOUVEAU : Obtenir les statistiques d'activité par période
     */
    public static function getStatsByPeriod(
        string $period = 'week',
        ?int $districtId = null
    ): array {
        $query = self::query();
        
        $days = match($period) {
            'today' => 1,
            'week' => 7,
            'month' => 30,
            'quarter' => 90,
            'year' => 365,
            default => 7,
        };
        
        $query->where('created_at', '>=', now()->subDays($days));
        
        if ($districtId) {
            $query->where('id_district', $districtId);
        }
        
        return [
            'total_actions' => $query->count(),
            'by_action' => $query->groupBy('action')
                ->selectRaw('action, COUNT(*) as count')
                ->pluck('count', 'action')
                ->toArray(),
            'by_entity' => $query->groupBy('entity_type')
                ->selectRaw('entity_type, COUNT(*) as count')
                ->pluck('count', 'entity_type')
                ->toArray(),
            'unique_users' => $query->distinct('id_user')->count('id_user'),
            'documents_generated' => $query->where('action', self::ACTION_GENERATE)
                ->where('entity_type', self::ENTITY_DOCUMENT)
                ->count(),
            'dossiers_closed' => $query->where('action', self::ACTION_CLOSE)
                ->where('entity_type', self::ENTITY_DOSSIER)
                ->count(),
            'dossiers_reopened' => $query->where('action', self::ACTION_REOPEN)
                ->where('entity_type', self::ENTITY_DOSSIER)
                ->count(),
            'pieces_jointes_uploaded' => $query->where('action', self::ACTION_UPLOAD)
                ->where('entity_type', self::ENTITY_PIECE_JOINTE)
                ->count(),
        ];
    }

    /**
     * ✅ NOUVEAU : Obtenir l'historique de fermeture d'un dossier
     */
    public static function getDossierClosureHistory(int $dossierId): array
    {
        $closures = self::where('entity_type', self::ENTITY_DOSSIER)
            ->where('entity_id', $dossierId)
            ->whereIn('action', [self::ACTION_CLOSE, self::ACTION_REOPEN])
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $closures->map(function($log) {
            return [
                'action' => $log->action,
                'action_label' => $log->action_label,
                'user' => $log->user?->name,
                'date' => $log->created_at->format('d/m/Y H:i'),
                'motif' => $log->metadata['motif_fermeture'] ?? null,
                'metadata' => $log->metadata,
            ];
        })->toArray();
    }

    /**
     * ✅ NOUVEAU : Obtenir les utilisateurs les plus actifs
     */
    public static function getMostActiveUsers(
        int $limit = 10,
        ?int $districtId = null,
        int $days = 30
    ): array {
        $query = self::with('user:id,name,email,role')
            ->where('created_at', '>=', now()->subDays($days));
        
        if ($districtId) {
            $query->where('id_district', $districtId);
        }
        
        return $query->selectRaw('id_user, COUNT(*) as actions_count')
            ->groupBy('id_user')
            ->orderByDesc('actions_count')
            ->limit($limit)
            ->get()
            ->map(function($log) {
                return [
                    'user' => $log->user,
                    'actions_count' => $log->actions_count,
                ];
            })
            ->toArray();
    }

    /**
     * ✅ NOUVEAU : Obtenir les documents les plus générés
     */
    public static function getMostGeneratedDocuments(
        int $limit = 5,
        ?int $districtId = null,
        int $days = 30
    ): array {
        $query = self::where('action', self::ACTION_GENERATE)
            ->where('entity_type', self::ENTITY_DOCUMENT)
            ->where('created_at', '>=', now()->subDays($days));
        
        if ($districtId) {
            $query->where('id_district', $districtId);
        }
        
        return $query->selectRaw('document_type, COUNT(*) as count')
            ->whereNotNull('document_type')
            ->groupBy('document_type')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->map(function($log) {
                $label = match($log->document_type) {
                    self::DOC_RECU => 'Reçu',
                    self::DOC_ACTE_VENTE => 'Acte de Vente',
                    self::DOC_CSF => 'CSF',
                    self::DOC_REQUISITION => 'Réquisition',
                    default => ucfirst($log->document_type),
                };
                
                return [
                    'type' => $log->document_type,
                    'label' => $label,
                    'count' => $log->count,
                ];
            })
            ->toArray();
    }

    /**
     * ✅ NOUVEAU : Nettoyer les anciens logs (à exécuter via CRON)
     */
    public static function cleanOldLogs(int $keepDays = 365): int
    {
        return self::where('created_at', '<', now()->subDays($keepDays))->delete();
    }
}