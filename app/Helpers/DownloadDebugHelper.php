<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;

class DownloadDebugHelper
{
    /**
     * Logger tout le contexte d'une requête de téléchargement
     */
    public static function logDownloadAttempt(string $type, array $params, array $context = [])
    {
        Log::channel('daily')->info("🎯 DOWNLOAD ATTEMPT - {$type}", [
            'timestamp' => now()->toDateTimeString(),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'user_id' => auth()->id(),
            'params' => $params,
            'headers' => [
                'accept' => request()->header('Accept'),
                'content-type' => request()->header('Content-Type'),
                'referer' => request()->header('Referer'),
            ],
            'context' => $context,
        ]);
    }

    /**
     * Logger une réponse de téléchargement
     */
    public static function logDownloadResponse(string $type, string $filePath, array $context = [])
    {
        $fileExists = file_exists($filePath);
        $fileSize = $fileExists ? filesize($filePath) : 0;
        
        Log::channel('daily')->info("📦 DOWNLOAD RESPONSE - {$type}", [
            'timestamp' => now()->toDateTimeString(),
            'file_path' => $filePath,
            'file_exists' => $fileExists,
            'file_size' => $fileSize,
            'file_size_mb' => $fileExists ? round($fileSize / 1024 / 1024, 2) : 0,
            'mime_type' => $fileExists ? mime_content_type($filePath) : null,
            'context' => $context,
        ]);
    }

    /**
     * Logger une erreur de téléchargement
     */
    public static function logDownloadError(string $type, \Exception $e, array $context = [])
    {
        Log::channel('daily')->error("❌ DOWNLOAD ERROR - {$type}", [
            'timestamp' => now()->toDateTimeString(),
            'error_message' => $e->getMessage(),
            'error_file' => $e->getFile(),
            'error_line' => $e->getLine(),
            'error_trace' => $e->getTraceAsString(),
            'context' => $context,
        ]);
    }

    /**
     * Vérifier l'état du stockage
     */
    public static function checkStorageState(): array
    {
        $publicPath = storage_path('app/public');
        $documentsPath = $publicPath . '/pieces_jointes/documents';
        
        return [
            'public_path_exists' => file_exists($publicPath),
            'public_path_writable' => is_writable($publicPath),
            'documents_path_exists' => file_exists($documentsPath),
            'documents_path_writable' => is_writable($documentsPath),
            'disk_free_space' => disk_free_space($publicPath),
            'disk_free_space_gb' => round(disk_free_space($publicPath) / 1024 / 1024 / 1024, 2),
        ];
    }
}