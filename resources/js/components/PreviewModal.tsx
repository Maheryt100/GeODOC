import { useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewModalProps {
    url: string | null;
    onClose: () => void;
}

export default function PreviewModal({ url, onClose }: PreviewModalProps) {
    // Bloquer le scroll du body quand le modal est ouvert
    useEffect(() => {
        if (url) {
            document.body.style.overflow = 'hidden';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [url]);

    // Fermer avec Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (url) {
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [url, onClose]);

    if (!url) return null;

    const isPdf = url.includes('.pdf') || url.includes('application/pdf');
    const downloadUrl = url.replace('/view/', '/download/');

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Container principal */}
            <div 
                className="relative w-[95vw] h-[95vh] max-w-7xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header avec actions */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Aperçu du document
                    </h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                        >
                            <a href={downloadUrl} download>
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-center min-h-full">
                        {isPdf ? (
                            <iframe
                                src={url}
                                className="w-full h-full min-h-[80vh] border-0 rounded"
                                title="Aperçu PDF"
                            />
                        ) : (
                            <img
                                src={url}
                                alt="Aperçu"
                                className="max-w-full max-h-full object-contain rounded shadow-lg"
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-gray-700 flex justify-end">
                    <Button onClick={onClose}>
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
}