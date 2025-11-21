<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
        $baseNameSecure = Str::slug(pathinfo($originalName, PATHINFO_FILENAME));
        
        return $baseNameSecure . '_' . Str::uuid() . '.' . $extension;
    }

    /**
     * Compresser une image si nécessaire
     */
    public static function optimizeImage(UploadedFile $file, string $destinationPath): bool
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, self::ALLOWED_IMAGES)) {
            return false;
        }

        try {
            $image = match($extension) {
                'jpg', 'jpeg' => imagecreatefromjpeg($file->getRealPath()),
                'png' => imagecreatefrompng($file->getRealPath()),
                'gif' => imagecreatefromgif($file->getRealPath()),
                'webp' => imagecreatefromwebp($file->getRealPath()),
                default => false,
            };

            if (!$image) {
                return false;
            }

            // Redimensionner si trop grande (max 2000px)
            $width = imagesx($image);
            $height = imagesy($image);
            $maxDimension = 2000;

            if ($width > $maxDimension || $height > $maxDimension) {
                $ratio = min($maxDimension / $width, $maxDimension / $height);
                $newWidth = (int)($width * $ratio);
                $newHeight = (int)($height * $ratio);

                $resized = imagecreatetruecolor($newWidth, $newHeight);
                
                // Préserver la transparence pour PNG
                if ($extension === 'png') {
                    imagealphablending($resized, false);
                    imagesavealpha($resized, true);
                }
                
                imagecopyresampled(
                    $resized, $image,
                    0, 0, 0, 0,
                    $newWidth, $newHeight,
                    $width, $height
                );
                
                $image = $resized;
            }

            // Sauvegarder avec compression
            $fullPath = Storage::disk('public')->path($destinationPath);
            $dir = dirname($fullPath);
            
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            $saved = match($extension) {
                'jpg', 'jpeg' => imagejpeg($image, $fullPath, 85),
                'png' => imagepng($image, $fullPath, 8),
                'gif' => imagegif($image, $fullPath),
                'webp' => imagewebp($image, $fullPath, 85),
                default => false,
            };

            imagedestroy($image);
            
            return $saved;
            
        } catch (\Exception $e) {
            Log::error('Erreur optimisation image', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName()
            ]);
            return false;
        }
    }

    /**
     * Créer un thumbnail pour une image
     */
    public static function createThumbnail(
        string $sourcePath,
        string $thumbnailPath,
        int $maxWidth = 200,
        int $maxHeight = 200
    ): bool {
        try {
            $fullSourcePath = Storage::disk('public')->path($sourcePath);
            
            if (!file_exists($fullSourcePath)) {
                return false;
            }

            $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
            
            $image = match($extension) {
                'jpg', 'jpeg' => imagecreatefromjpeg($fullSourcePath),
                'png' => imagecreatefrompng($fullSourcePath),
                'gif' => imagecreatefromgif($fullSourcePath),
                'webp' => imagecreatefromwebp($fullSourcePath),
                default => false,
            };

            if (!$image) {
                return false;
            }

            $width = imagesx($image);
            $height = imagesy($image);
            
            // Calculer les nouvelles dimensions
            $ratio = min($maxWidth / $width, $maxHeight / $height);
            $newWidth = (int)($width * $ratio);
            $newHeight = (int)($height * $ratio);

            $thumbnail = imagecreatetruecolor($newWidth, $newHeight);
            
            // Préserver la transparence
            if ($extension === 'png') {
                imagealphablending($thumbnail, false);
                imagesavealpha($thumbnail, true);
            }
            
            imagecopyresampled(
                $thumbnail, $image,
                0, 0, 0, 0,
                $newWidth, $newHeight,
                $width, $height
            );

            $fullThumbnailPath = Storage::disk('public')->path($thumbnailPath);
            $dir = dirname($fullThumbnailPath);
            
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            $saved = match($extension) {
                'jpg', 'jpeg' => imagejpeg($thumbnail, $fullThumbnailPath, 85),
                'png' => imagepng($thumbnail, $fullThumbnailPath, 8),
                'gif' => imagegif($thumbnail, $fullThumbnailPath),
                'webp' => imagewebp($thumbnail, $fullThumbnailPath, 85),
                default => false,
            };

            imagedestroy($image);
            imagedestroy($thumbnail);
            
            return $saved;
            
        } catch (\Exception $e) {
            Log::error('Erreur création thumbnail', [
                'error' => $e->getMessage(),
                'source' => $sourcePath
            ]);
            return false;
        }
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
                $exists = \App\Models\PieceJointe::where('nom_fichier', $nomFichier)->exists();
                
                if (!$exists) {
                    Storage::disk('public')->delete($file);
                    $deleted++;
                }
            }
            
            Log::info("Nettoyage fichiers orphelins", ['deleted' => $deleted]);
            
        } catch (\Exception $e) {
            Log::error('Erreur nettoyage fichiers', ['error' => $e->getMessage()]);
        }
        
        return $deleted;
    }
}