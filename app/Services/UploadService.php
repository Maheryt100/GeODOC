<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UploadService
{
    // Extensions autorisées par catégorie
    const ALLOWED_DOCUMENTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
    const ALLOWED_IMAGES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ALLOWED_ARCHIVES = ['zip', 'rar', '7z'];
    
    // Tailles maximales (en octets)
    const MAX_FILE_SIZE = 10485760; // 10 MB
    const MAX_IMAGE_SIZE = 5242880;  // 5 MB
    
    /**
     * Valider un fichier
     */
    public static function validateFile(UploadedFile $file): array
    {
        $errors = [];
        
        // Vérifier la taille
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $errors[] = "Le fichier dépasse la taille maximale de " . 
                       (self::MAX_FILE_SIZE / 1048576) . " MB";
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
        if (!self::isValidMimeType($mimeType)) {
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
     * Valider le MIME type
     */
    private static function isValidMimeType(string $mimeType): bool
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
            
            // Archives
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
        ];
        
        return in_array($mimeType, $validMimeTypes);
    }

    /**
     * Générer un nom de fichier sécurisé
     */
    public static function generateSecureFileName(string $originalName): string
    {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $baseNameSecure = \Illuminate\Support\Str::slug(pathinfo($originalName, PATHINFO_FILENAME));
        
        return $baseNameSecure . '_' . \Illuminate\Support\Str::uuid() . '.' . $extension;
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
                // Vérifier si le fichier est référencé dans la base
                $nomFichier = basename($file);
                
                if (class_exists(\App\Models\PieceJointe::class)) {
                    $exists = \App\Models\PieceJointe::where('nom_fichier', $nomFichier)
                        ->orWhere('chemin', $file)
                        ->exists();
                    
                    if (!$exists) {
                        Storage::disk('public')->delete($file);
                        $deleted++;
                        Log::info('Fichier orphelin supprimé', ['file' => $file]);
                    }
                }
            }
            
            Log::info("Nettoyage fichiers orphelins terminé", ['deleted' => $deleted]);
            
        } catch (\Exception $e) {
            Log::error('Erreur nettoyage fichiers', ['error' => $e->getMessage()]);
        }
        
        return $deleted;
    }
}