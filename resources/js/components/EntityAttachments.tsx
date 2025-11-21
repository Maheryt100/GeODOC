// components/EntityAttachments.tsx
// Composant simplifié pour les pièces jointes sur les pages demandeur/propriété

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
    Upload, FileText, Image, Trash2, Download, Eye, 
    CheckCircle, Loader2, Paperclip, FileIcon, MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PieceJointe {
    id: number;
    nom_original: string;
    taille_formatee: string;
    type_document: string | null;
    is_verified: boolean;
    is_image: boolean;
    is_pdf: boolean;
    url: string;
    view_url: string;
    created_at: string;
}

interface EntityAttachmentsProps {
    entityType: 'Demandeur' | 'Propriete';
    entityId: number;
    canUpload?: boolean;
    canDelete?: boolean;
    compact?: boolean;
}

const TYPES_DEMANDEUR = ['CIN', 'Acte de naissance', 'Acte de mariage', 'Certificat de résidence', 'Autre'];
const TYPES_PROPRIETE = ['Plan du terrain', 'Titre foncier', 'PV de bornage', 'Autre'];

export default function EntityAttachments({
    entityType,
    entityId,
    canUpload = true,
    canDelete = true,
    compact = false,
}: EntityAttachmentsProps) {
    const [pieces, setPieces] = useState<PieceJointe[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [uploadForm, setUploadForm] = useState({
        files: [] as File[],
        type_document: '',
    });

    const types = entityType === 'Demandeur' ? TYPES_DEMANDEUR : TYPES_PROPRIETE;
    const categorie = entityType === 'Demandeur' ? 'demandeur' : 'propriete';

    const fetchPieces = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                attachable_type: entityType,
                attachable_id: String(entityId),
            });

            const response = await fetch(`/pieces-jointes?${params}`);
            const data = await response.json();

            if (data.success) {
                setPieces(data.pieces_jointes || []);
            }
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId]);

    useEffect(() => {
        fetchPieces();
    }, [fetchPieces]);

    const handleUpload = async () => {
        if (uploadForm.files.length === 0) {
            toast.error('Sélectionnez un fichier');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        
        uploadForm.files.forEach(file => formData.append('files[]', file));
        formData.append('attachable_type', entityType);
        formData.append('attachable_id', String(entityId));
        formData.append('categorie', categorie);
        
        if (uploadForm.type_document) {
            formData.append('type_document', uploadForm.type_document);
        }

        try {
            const response = await fetch('/pieces-jointes/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                setDialogOpen(false);
                setUploadForm({ files: [], type_document: '' });
                fetchPieces();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Erreur de connexion');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer ce fichier ?')) return;

        try {
            const response = await fetch(`/pieces-jointes/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Fichier supprimé');
                fetchPieces();
            }
        } catch (error) {
            toast.error('Erreur');
        }
    };

    const getFileIcon = (piece: PieceJointe) => {
        if (piece.is_image) return <Image className="h-4 w-4 text-green-600" />;
        if (piece.is_pdf) return <FileText className="h-4 w-4 text-red-600" />;
        return <FileIcon className="h-4 w-4 text-gray-600" />;
    };

    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Paperclip className="h-4 w-4" />
                        Pièces jointes
                        <Badge variant="secondary" className="text-xs">{pieces.length}</Badge>
                    </div>
                    {canUpload && (
                        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                            <Upload className="h-3 w-3 mr-1" />
                            Ajouter
                        </Button>
                    )}
                </div>

                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : pieces.length > 0 ? (
                    <div className="space-y-1">
                        {pieces.slice(0, 3).map(piece => (
                            <div key={piece.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                                {getFileIcon(piece)}
                                <span className="truncate flex-1">{piece.nom_original}</span>
                                <a href={piece.url} download className="text-blue-600 hover:underline">
                                    <Download className="h-3 w-3" />
                                </a>
                            </div>
                        ))}
                        {pieces.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{pieces.length - 3} autre(s)</p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Aucune pièce jointe</p>
                )}

                {/* Dialog d'upload */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajouter une pièce jointe</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Fichier</Label>
                                <Input
                                    type="file"
                                    onChange={(e) => setUploadForm(p => ({ 
                                        ...p, 
                                        files: Array.from(e.target.files || []) 
                                    }))}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                            </div>
                            <div>
                                <Label>Type de document</Label>
                                <Select 
                                    value={uploadForm.type_document} 
                                    onValueChange={(v) => setUploadForm(p => ({ ...p, type_document: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {types.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Uploader'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Version complète
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Pièces jointes
                    <Badge variant="secondary">{pieces.length}</Badge>
                </h3>
                {canUpload && (
                    <Button onClick={() => setDialogOpen(true)} size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Ajouter
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : pieces.length > 0 ? (
                <div className="space-y-2">
                    {pieces.map(piece => (
                        <div 
                            key={piece.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                            <div className="flex items-center gap-3">
                                {getFileIcon(piece)}
                                <div>
                                    <p className="font-medium">{piece.nom_original}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{piece.taille_formatee}</span>
                                        {piece.type_document && (
                                            <Badge variant="outline" className="text-xs">{piece.type_document}</Badge>
                                        )}
                                        {piece.is_verified && (
                                            <Badge className="text-xs bg-green-100 text-green-700">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Vérifié
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {(piece.is_image || piece.is_pdf) && (
                                        <DropdownMenuItem onClick={() => setPreviewUrl(piece.view_url)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Visualiser
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <a href={piece.url} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Télécharger
                                        </a>
                                    </DropdownMenuItem>
                                    {canDelete && (
                                        <DropdownMenuItem 
                                            className="text-red-600"
                                            onClick={() => handleDelete(piece.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune pièce jointe</p>
                </div>
            )}

            {/* Dialog d'upload */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter une pièce jointe</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Fichiers</Label>
                            <Input
                                type="file"
                                multiple
                                onChange={(e) => setUploadForm(p => ({ 
                                    ...p, 
                                    files: Array.from(e.target.files || []) 
                                }))}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                            {uploadForm.files.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {uploadForm.files.length} fichier(s)
                                </p>
                            )}
                        </div>
                        <div>
                            <Label>Type de document</Label>
                            <Select 
                                value={uploadForm.type_document} 
                                onValueChange={(v) => setUploadForm(p => ({ ...p, type_document: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {types.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleUpload} disabled={uploading || uploadForm.files.length === 0}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Upload...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Uploader
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview */}
            <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Aperçu</DialogTitle>
                    </DialogHeader>
                    {previewUrl && (
                        <div className="flex justify-center max-h-[70vh] overflow-auto">
                            {previewUrl.includes('.pdf') ? (
                                <iframe src={previewUrl} className="w-full h-[70vh]" />
                            ) : (
                                <img src={previewUrl} alt="Preview" className="max-w-full object-contain" />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}