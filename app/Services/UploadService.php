<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\PieceJointe;

class UploadService
{
    // Extensions autorisées par catégorie
    const ALLOWED_DOCUMENTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
    const ALLOWED_IMAGES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const ALLOWED_ARCHIVES = ['zip', 'rar', '7z'];
    
    // Tailles maximales (en octets)
    const MAX_FILE_SIZE = 10485760; // 10 MB
    const MAX_IMAGE_SIZE = 5242880;  // 5 MB
    
    /**
     * Valider un fichier
     */
    public function validateFile(UploadedFile $file): array
    {
        $errors = [];
        
        // Vérifier la taille
        $maxSize = $this->isImage($file) ? self::MAX_IMAGE_SIZE : self::MAX_FILE_SIZE;
        
        if ($file->getSize() > $maxSize) {
            $maxMB = $maxSize / 1048576;
            $errors[] = "Le fichier dépasse la taille maximale de {$maxMB} MB";
        }
        
        // Vérifier l'extension
        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = array_merge(
            self::ALLOWED_DOCUMENTS,
            self::ALLOWED_IMAGES,
            self::ALLOWED_ARCHIVES
        );
        
        if (!in_array($extension, $allowedExtensions)) {
            $errors[] = "Type de fichier non autorisé: {$extension}";
        }
        
        // Vérifier le MIME type
        $mimeType = $file->getMimeType();
        if (!$this->isValidMimeType($mimeType)) {
            $errors[] = "Type MIME non autorisé: {$mimeType}";
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'info' => [
                'nom_original' => $file->getClientOriginalName(),
                'taille' => $file->getSize(),
                'extension' => $extension,
                'mime_type' => $mimeType,
            ]
        ];
    }

    /**
     * Vérifier si c'est une image
     */
    private function isImage(UploadedFile $file): bool
    {
        $extension = strtolower($file->getClientOriginalExtension());
        return in_array($extension, self::ALLOWED_IMAGES);
    }

    /**
     * Valider le MIME type
     */
    private function isValidMimeType(string $mimeType): bool
    {
        $validMimeTypes = [
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            
            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            
            // Archives
            'application/zip',
            'application/x-zip-compressed',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
        ];
        
        return in_array($mimeType, $validMimeTypes);
    }

    /**
     * Nettoyer les fichiers orphelins
     */
    public static function cleanOrphanFiles(): int
    {
        $deleted = 0;
        
        try {
            $files = Storage::disk('public')->allFiles('pieces_jointes');
            
            foreach ($files as $file) {
                $nomFichier = basename($file);
                
                // Vérifier si le fichier est référencé dans la base
                $exists = PieceJointe::where('nom_fichier', $nomFichier)
                    ->orWhere('chemin', $file)
                    ->exists();
                
                if (!$exists) {
                    Storage::disk('public')->delete($file);
                    $deleted++;
                    Log::info('Fichier orphelin supprimé', ['file' => $file]);
                }
            }
            
            Log::info("Nettoyage fichiers orphelins terminé", ['deleted' => $deleted]);
            
        } catch (\Exception $e) {
            Log::error('Erreur nettoyage fichiers', ['error' => $e->getMessage()]);
        }
        
        return $deleted;
    }

    /**
     * Vérifier l'intégrité des fichiers
     */
    public static function checkIntegrity(): array
    {
        $missing = [];
        $totalChecked = 0;
        
        try {
            PieceJointe::whereNull('deleted_at')
                ->chunk(100, function($pieces) use (&$missing, &$totalChecked) {
                    foreach ($pieces as $piece) {
                        $totalChecked++;
                        
                        if (!Storage::disk('public')->exists($piece->chemin ?? '')) {
                            $missing[] = [
                                'id' => $piece->id,
                                'nom_original' => $piece->nom_original,
                                'chemin' => $piece->chemin,
                                'created_at' => $piece->created_at->format('Y-m-d H:i:s'),
                            ];
                        }
                    }
                });

        } catch (\Exception $e) {
            Log::error('Erreur vérification intégrité', ['error' => $e->getMessage()]);
        }
        
        return [
            'total_checked' => $totalChecked,
            'missing_files' => $missing,
            'missing_count' => count($missing),
        ];
    }

    /**
     * Obtenir les statistiques de stockage
     */
    public static function getStorageStats(): array
    {
        $totalSize = PieceJointe::whereNull('deleted_at')->sum('taille');
        $totalCount = PieceJointe::whereNull('deleted_at')->count();
        
        $byCategorie = PieceJointe::whereNull('deleted_at')
            ->selectRaw('categorie, COUNT(*) as count, SUM(taille) as size')
            ->groupBy('categorie')
            ->get()
            ->mapWithKeys(fn($item) => [
                $item->categorie => [
                    'count' => $item->count,
                    'size' => $item->size,
                    'size_formatted' => self::formatBytes($item->size),
                ]
            ]);

        return [
            'total_count' => $totalCount,
            'total_size' => $totalSize,
            'total_size_formatted' => self::formatBytes($totalSize),
            'by_categorie' => $byCategorie,
        ];
    }

    /**
     * Formater les bytes
     */
    public static function formatBytes(int $bytes, int $precision = 2): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, $precision) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, $precision) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, $precision) . ' KB';
        }
        
        return $bytes . ' octets';
    }
}