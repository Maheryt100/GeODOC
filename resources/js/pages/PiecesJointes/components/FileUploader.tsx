// this is components/FileUploader.tsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, X, FileText, Image, Archive, File, Check, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';

interface FileUploaderProps {
    attachableType: 'Dossier' | 'Demandeur' | 'Propriete';
    attachableId: number;
    typeDocument?: string;
    maxFiles?: number;
    onUploadComplete?: () => void;
}

interface FileWithPreview {
    file: File;
    preview?: string;
    description?: string;
    id: string;
}

export default function FileUploader({
    attachableType,
    attachableId,
    typeDocument,
    maxFiles = 10,
    onUploadComplete
}: FileUploaderProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image;
        if (['pdf', 'doc', 'docx'].includes(ext || '')) return FileText;
        if (['zip', 'rar', '7z'].includes(ext || '')) return Archive;
        return File;
    };

    const handleFiles = (newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);
        
        if (files.length + fileArray.length > maxFiles) {
            toast.error(`Maximum ${maxFiles} fichiers autorisés`);
            return;
        }

        const validFiles: FileWithPreview[] = [];

        fileArray.forEach((file) => {
            // Validation taille (10 MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name}: Fichier trop volumineux (max 10 MB)`);
                return;
            }

            // Validation extensions
            const ext = file.name.split('.').pop()?.toLowerCase();
            const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'zip', 'rar', '7z'];
            
            if (!ext || !allowedExts.includes(ext)) {
                toast.error(`${file.name}: Type de fichier non autorisé`);
                return;
            }

            // Créer preview pour images
            let preview: string | undefined;
            if (file.type.startsWith('image/')) {
                preview = URL.createObjectURL(file);
            }

            validFiles.push({
                file,
                preview,
                description: '',
                id: Math.random().toString(36).substr(2, 9)
            });
        });

        setFiles(prev => [...prev, ...validFiles]);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove?.preview) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    const updateDescription = (id: string, description: string) => {
        setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, description } : f
        ));
    };

    const uploadFiles = async () => {
        if (files.length === 0) {
            toast.error('Aucun fichier sélectionné');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            
            files.forEach((fileItem, index) => {
                formData.append(`files[${index}]`, fileItem.file);
                if (fileItem.description) {
                    formData.append(`descriptions[${index}]`, fileItem.description);
                }
            });

            formData.append('attachable_type', attachableType);
            formData.append('attachable_id', attachableId.toString());
            
            if (typeDocument) {
                formData.append('type_document', typeDocument);
            }

            const response = await fetch(route('pieces-jointes.upload'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                
                // Nettoyer
                files.forEach(f => {
                    if (f.preview) URL.revokeObjectURL(f.preview);
                });
                setFiles([]);
                
                if (onUploadComplete) {
                    onUploadComplete();
                } else {
                    // Recharger la page
                    router.reload();
                }
            } else {
                toast.error(data.message || 'Erreur lors de l\'upload');
                
                if (data.errors && data.errors.length > 0) {
                    data.errors.forEach((error: any) => {
                        toast.error(`${error.file}: ${error.errors.join(', ')}`);
                    });
                }
            }

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erreur lors de l\'upload des fichiers');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return bytes + ' octets';
    };

    return (
        <div className="space-y-4">
            {/* Zone de drop */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">
                    Glissez-déposez vos fichiers ici
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                    ou cliquez pour sélectionner
                </p>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Parcourir
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z"
                />
                <p className="text-xs text-muted-foreground mt-4">
                    Max {maxFiles} fichiers • 10 MB par fichier
                    <br />
                    PDF, Word, Excel, Images, Archives
                </p>
            </div>

            {/* Liste des fichiers */}
            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                            Fichiers sélectionnés ({files.length})
                        </Label>
                        {files.length > 0 && !uploading && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    files.forEach(f => {
                                        if (f.preview) URL.revokeObjectURL(f.preview);
                                    });
                                    setFiles([]);
                                }}
                            >
                                Tout effacer
                            </Button>
                        )}
                    </div>

                    {files.map((fileItem) => {
                        const Icon = getFileIcon(fileItem.file);
                        
                        return (
                            <Card key={fileItem.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Preview ou icône */}
                                        <div className="flex-shrink-0">
                                            {fileItem.preview ? (
                                                <img
                                                    src={fileItem.preview}
                                                    alt={fileItem.file.name}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                                                    <Icon className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Informations */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {fileItem.file.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatFileSize(fileItem.file.size)}
                                            </p>

                                            {/* Description */}
                                            <Input
                                                type="text"
                                                placeholder="Description (optionnelle)"
                                                value={fileItem.description}
                                                onChange={(e) => updateDescription(fileItem.id, e.target.value)}
                                                className="mt-2 h-8 text-sm"
                                                disabled={uploading}
                                            />
                                        </div>

                                        {/* Bouton supprimer */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFile(fileItem.id)}
                                            disabled={uploading}
                                            className="flex-shrink-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Bouton upload */}
            {files.length > 0 && (
                <Button
                    onClick={uploadFiles}
                    disabled={uploading}
                    className="w-full"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Upload en cours...
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Uploader {files.length} fichier{files.length > 1 ? 's' : ''}
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}