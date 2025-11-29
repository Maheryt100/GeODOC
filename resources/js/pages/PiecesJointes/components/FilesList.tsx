// this is components/LilesList.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    Download, 
    Eye, 
    Trash2, 
    FileText, 
    Image, 
    Archive, 
    File,
    CheckCircle2,
    User,
    Calendar,
    HardDrive
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { router } from '@inertiajs/react';

interface PieceJointe {
    id: number;
    nom_original: string;
    nom_fichier: string;
    type_mime: string;
    taille: number;
    extension: string;
    type_document?: string;
    description?: string;
    is_verified: boolean;
    url: string;
    icone: string;
    taille_formatee: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
    };
    verified_by?: {
        id: number;
        name: string;
    };
    verified_at?: string;
}

interface FilesListProps {
    attachableType: 'Dossier' | 'Demandeur' | 'Propriete';
    attachableId: number;
    canDelete?: boolean;
    canVerify?: boolean;
}

export default function FilesList({
    attachableType,
    attachableId,
    canDelete = false,
    canVerify = false
}: FilesListProps) {
    const [files, setFiles] = useState<PieceJointe[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadFiles = async () => {
        try {
            const response = await fetch(
                route('pieces-jointes.index') + 
                `?attachable_type=${attachableType}&attachable_id=${attachableId}`
            );
            
            const data = await response.json();
            
            if (data.success) {
                setFiles(data.pieces_jointes);
            }
        } catch (error) {
            console.error('Erreur chargement fichiers:', error);
            toast.error('Erreur lors du chargement des fichiers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [attachableType, attachableId]);

    const getFileIcon = (extension: string) => {
        const ext = extension.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return Image;
        if (['pdf', 'doc', 'docx'].includes(ext)) return FileText;
        if (['zip', 'rar', '7z'].includes(ext)) return Archive;
        return File;
    };

    const handleDownload = (file: PieceJointe) => {
        window.location.href = route('pieces-jointes.download', file.id);
    };

    const handleView = (file: PieceJointe) => {
        window.open(route('pieces-jointes.view', file.id), '_blank');
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);

        try {
            const response = await fetch(route('pieces-jointes.destroy', deleteId), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Fichier supprimé');
                setFiles(prev => prev.filter(f => f.id !== deleteId));
            } else {
                toast.error(data.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const handleVerify = async (id: number) => {
        try {
            const response = await fetch(route('pieces-jointes.verify', id), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Document vérifié');
                loadFiles();
            } else {
                toast.error(data.message || 'Erreur');
            }
        } catch (error) {
            console.error('Erreur vérification:', error);
            toast.error('Erreur lors de la vérification');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <File className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Aucun fichier attaché</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {files.map((file) => {
                    const Icon = getFileIcon(file.extension);
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.extension.toLowerCase());
                    const isPdf = file.extension.toLowerCase() === 'pdf';
                    
                    return (
                        <Card key={file.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Icône */}
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                                            <Icon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    </div>

                                    {/* Informations */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate">
                                                    {file.nom_original}
                                                </h4>
                                                {file.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {file.description}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {file.is_verified && (
                                                <Badge variant="outline" className="flex-shrink-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    Vérifié
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Métadonnées */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                                            <div className="flex items-center gap-1">
                                                <HardDrive className="h-3 w-3" />
                                                {file.taille_formatee}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {file.user?.name || 'Inconnu'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(file.created_at)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDownload(file)}
                                            >
                                                <Download className="mr-1 h-3 w-3" />
                                                Télécharger
                                            </Button>

                                            {(isImage || isPdf) && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleView(file)}
                                                >
                                                    <Eye className="mr-1 h-3 w-3" />
                                                    Voir
                                                </Button>
                                            )}

                                            {canVerify && !file.is_verified && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleVerify(file.id)}
                                                >
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    Vérifier
                                                </Button>
                                            )}

                                            {canDelete && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => confirmDelete(file.id)}
                                                >
                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                    Supprimer
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Dialog de confirmation */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}