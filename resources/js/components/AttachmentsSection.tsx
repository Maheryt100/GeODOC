// components/AttachmentsSection.tsx
import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
    Upload, FileText, Image, Trash2, Download, Eye, 
    CheckCircle, MoreVertical, Loader2, FolderOpen,
    User, Home, FileIcon, Filter, Search, X
} from 'lucide-react';
import type { Demandeur, Propriete } from '@/types';

interface PieceJointe {
    id: number;
    nom_original: string;
    type_mime: string;
    taille_formatee: string;
    extension: string;
    type_document: string | null;
    categorie: string;
    categorie_label: string;
    description: string | null;
    is_verified: boolean;
    is_image: boolean;
    is_pdf: boolean;
    url: string;
    view_url: string;
    created_at: string;
    user: { id: number; name: string } | null;
    verified_by: { id: number; name: string } | null;
    demandeur_id?: number;
    demandeur_nom?: string;
    propriete_id?: number;
    propriete_lot?: string;
}

interface AttachmentsSectionProps {
    attachableType: 'Dossier' | 'Demandeur' | 'Propriete';
    attachableId: number;
    title?: string;
    canUpload?: boolean;
    canDelete?: boolean;
    canVerify?: boolean;
    initialCount?: number;
    // Pour le dossier: lier à des demandeurs/propriétés
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    showRelated?: boolean;
}

const CATEGORIES = {
    global: { label: 'Document général', icon: FileIcon, color: 'bg-blue-100 text-blue-700' },
    demandeur: { label: 'Document demandeur', icon: User, color: 'bg-green-100 text-green-700' },
    propriete: { label: 'Document propriété', icon: Home, color: 'bg-purple-100 text-purple-700' },
    administratif: { label: 'Document administratif', icon: FileText, color: 'bg-orange-100 text-orange-700' },
};

const TYPES_DOCUMENTS = {
    'CIN': 'CIN',
    'Acte de naissance': 'Acte de naissance',
    'Acte de mariage': 'Acte de mariage',
    'Certificat de résidence': 'Certificat de résidence',
    'Plan du terrain': 'Plan du terrain',
    'Titre foncier': 'Titre foncier',
    'PV de bornage': 'PV de bornage',
    'Autre': 'Autre',
};

export default function AttachmentsSection({
    attachableType,
    attachableId,
    title = 'Pièces jointes',
    canUpload = true,
    canDelete = true,
    canVerify = false,
    initialCount = 0,
    demandeurs = [],
    proprietes = [],
    showRelated = true,
}: AttachmentsSectionProps) {
    const [pieces, setPieces] = useState<PieceJointe[]>([]);
    const [relatedPieces, setRelatedPieces] = useState<any>({ demandeurs: {}, proprietes: {} });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategorie, setFilterCategorie] = useState<string>('all');

    // État du formulaire d'upload
    const [uploadForm, setUploadForm] = useState({
        files: [] as File[],
        type_document: '',
        categorie: 'global',
        description: '',
        linked_entity_type: '' as '' | 'Demandeur' | 'Propriete',
        linked_entity_id: '' as string | number,
    });

    const fetchPieces = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                attachable_type: attachableType,
                attachable_id: String(attachableId),
                include_related: showRelated && attachableType === 'Dossier' ? 'true' : 'false',
            });

            const response = await fetch(`/pieces-jointes?${params}`);
            const data = await response.json();

            if (data.success) {
                setPieces(data.pieces_jointes || []);
                if (data.related_pieces) {
                    setRelatedPieces(data.related_pieces);
                }
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
        } finally {
            setLoading(false);
        }
    }, [attachableType, attachableId, showRelated]);

    useEffect(() => {
        fetchPieces();
    }, [fetchPieces]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setUploadForm(prev => ({ ...prev, files }));
    };

    const handleUpload = async () => {
        if (uploadForm.files.length === 0) {
            toast.error('Sélectionnez au moins un fichier');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        
        uploadForm.files.forEach(file => formData.append('files[]', file));
        formData.append('attachable_type', attachableType);
        formData.append('attachable_id', String(attachableId));
        
        if (uploadForm.type_document) {
            formData.append('type_document', uploadForm.type_document);
        }
        formData.append('categorie', uploadForm.categorie);
        
        if (uploadForm.description) {
            formData.append('descriptions[0]', uploadForm.description);
        }

        // Si lié à une entité spécifique
        if (uploadForm.linked_entity_type && uploadForm.linked_entity_id) {
            formData.append('linked_entity_type', uploadForm.linked_entity_type);
            formData.append('linked_entity_id', String(uploadForm.linked_entity_id));
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
                setUploadDialogOpen(false);
                setUploadForm({
                    files: [],
                    type_document: '',
                    categorie: 'global',
                    description: '',
                    linked_entity_type: '',
                    linked_entity_id: '',
                });
                fetchPieces();
            } else {
                toast.error(data.message || 'Erreur lors de l\'upload');
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
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleVerify = async (id: number) => {
        try {
            const response = await fetch(`/pieces-jointes/${id}/verify`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Document vérifié');
                fetchPieces();
            }
        } catch (error) {
            toast.error('Erreur');
        }
    };

    // Filtrer les pièces
    const filteredPieces = pieces.filter(p => {
        const matchSearch = p.nom_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.type_document?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchCategorie = filterCategorie === 'all' || p.categorie === filterCategorie;
        return matchSearch && matchCategorie;
    });

    const getFileIcon = (piece: PieceJointe) => {
        if (piece.is_image) return <Image className="h-5 w-5 text-green-600" />;
        if (piece.is_pdf) return <FileText className="h-5 w-5 text-red-600" />;
        return <FileIcon className="h-5 w-5 text-gray-600" />;
    };

    const renderPieceItem = (piece: PieceJointe, showEntity = false) => (
        <div 
            key={piece.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition"
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {getFileIcon(piece)}
                <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{piece.nom_original}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{piece.taille_formatee}</span>
                        {piece.type_document && (
                            <Badge variant="outline" className="text-xs">{piece.type_document}</Badge>
                        )}
                        <Badge className={`text-xs ${CATEGORIES[piece.categorie as keyof typeof CATEGORIES]?.color || ''}`}>
                            {piece.categorie_label}
                        </Badge>
                        {piece.is_verified && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Vérifié
                            </Badge>
                        )}
                        {showEntity && piece.demandeur_nom && (
                            <span className="text-blue-600">• {piece.demandeur_nom}</span>
                        )}
                        {showEntity && piece.propriete_lot && (
                            <span className="text-purple-600">• Lot {piece.propriete_lot}</span>
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
                    {canVerify && !piece.is_verified && (
                        <DropdownMenuItem onClick={() => handleVerify(piece.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Vérifier
                        </DropdownMenuItem>
                    )}
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
    );

    const totalCount = pieces.length + 
        Object.values(relatedPieces.demandeurs).reduce((acc: number, d: any) => acc + (d.pieces?.length || 0), 0) +
        Object.values(relatedPieces.proprietes).reduce((acc: number, p: any) => acc + (p.pieces?.length || 0), 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        {title}
                        <Badge variant="secondary">{totalCount}</Badge>
                    </CardTitle>
                    {canUpload && (
                        <Button onClick={() => setUploadDialogOpen(true)} size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Ajouter
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Filtres */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filterCategorie} onValueChange={setFilterCategorie}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {Object.entries(CATEGORIES).map(([key, val]) => (
                                <SelectItem key={key} value={key}>{val.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Onglets pour Dossier */}
                {attachableType === 'Dossier' && showRelated ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">
                                Tous ({totalCount})
                            </TabsTrigger>
                            <TabsTrigger value="dossier">
                                Dossier ({pieces.length})
                            </TabsTrigger>
                            <TabsTrigger value="demandeurs">
                                Demandeurs ({Object.keys(relatedPieces.demandeurs).length})
                            </TabsTrigger>
                            <TabsTrigger value="proprietes">
                                Propriétés ({Object.keys(relatedPieces.proprietes).length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-2">
                            {filteredPieces.map(p => renderPieceItem(p))}
                            {Object.values(relatedPieces.demandeurs).map((d: any) =>
                                d.pieces?.map((p: PieceJointe) => renderPieceItem(p, true))
                            )}
                            {Object.values(relatedPieces.proprietes).map((pr: any) =>
                                pr.pieces?.map((p: PieceJointe) => renderPieceItem(p, true))
                            )}
                            {totalCount === 0 && (
                                <p className="text-center text-muted-foreground py-8">Aucune pièce jointe</p>
                            )}
                        </TabsContent>

                        <TabsContent value="dossier" className="space-y-2">
                            {filteredPieces.map(p => renderPieceItem(p))}
                            {filteredPieces.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">Aucune pièce jointe du dossier</p>
                            )}
                        </TabsContent>

                        <TabsContent value="demandeurs" className="space-y-4">
                            {Object.entries(relatedPieces.demandeurs).map(([id, data]: [string, any]) => (
                                <div key={id} className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {data.demandeur.nom} {data.demandeur.prenom}
                                        <Badge variant="outline" className="text-xs">{data.demandeur.cin}</Badge>
                                    </h4>
                                    <div className="space-y-2">
                                        {data.pieces?.map((p: PieceJointe) => renderPieceItem(p))}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(relatedPieces.demandeurs).length === 0 && (
                                <p className="text-center text-muted-foreground py-8">Aucune pièce jointe de demandeur</p>
                            )}
                        </TabsContent>

                        <TabsContent value="proprietes" className="space-y-4">
                            {Object.entries(relatedPieces.proprietes).map(([id, data]: [string, any]) => (
                                <div key={id} className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Home className="h-4 w-4" />
                                        Lot {data.propriete.lot}
                                        {data.propriete.titre && <Badge variant="outline">TNº{data.propriete.titre}</Badge>}
                                    </h4>
                                    <div className="space-y-2">
                                        {data.pieces?.map((p: PieceJointe) => renderPieceItem(p))}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(relatedPieces.proprietes).length === 0 && (
                                <p className="text-center text-muted-foreground py-8">Aucune pièce jointe de propriété</p>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="space-y-2">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : filteredPieces.length > 0 ? (
                            filteredPieces.map(p => renderPieceItem(p))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Aucune pièce jointe</p>
                        )}
                    </div>
                )}
            </CardContent>

            {/* Dialog Upload */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajouter des pièces jointes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Fichiers</Label>
                            <Input
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                            />
                            {uploadForm.files.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {uploadForm.files.length} fichier(s) sélectionné(s)
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
                                    {Object.entries(TYPES_DOCUMENTS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Catégorie</Label>
                            <Select 
                                value={uploadForm.categorie} 
                                onValueChange={(v) => setUploadForm(p => ({ ...p, categorie: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CATEGORIES).map(([key, val]) => (
                                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Lier à un demandeur ou propriété (pour Dossier) */}
                        {attachableType === 'Dossier' && (demandeurs.length > 0 || proprietes.length > 0) && (
                            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                                <Label className="text-sm font-medium">Lier à une entité (optionnel)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {demandeurs.length > 0 && (
                                        <Select 
                                            value={uploadForm.linked_entity_type === 'Demandeur' ? String(uploadForm.linked_entity_id) : ''}
                                            onValueChange={(v) => setUploadForm(p => ({ 
                                                ...p, 
                                                linked_entity_type: 'Demandeur',
                                                linked_entity_id: v,
                                                categorie: 'demandeur'
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Demandeur" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {demandeurs.map(d => (
                                                    <SelectItem key={d.id} value={String(d.id)}>
                                                        {d.nom_demandeur} {d.prenom_demandeur}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {proprietes.length > 0 && (
                                        <Select 
                                            value={uploadForm.linked_entity_type === 'Propriete' ? String(uploadForm.linked_entity_id) : ''}
                                            onValueChange={(v) => setUploadForm(p => ({ 
                                                ...p, 
                                                linked_entity_type: 'Propriete',
                                                linked_entity_id: v,
                                                categorie: 'propriete'
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Propriété" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {proprietes.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        Lot {p.lot}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                {uploadForm.linked_entity_id && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setUploadForm(p => ({ 
                                            ...p, 
                                            linked_entity_type: '',
                                            linked_entity_id: '',
                                            categorie: 'global'
                                        }))}
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Retirer la liaison
                                    </Button>
                                )}
                            </div>
                        )}

                        <div>
                            <Label>Description (optionnel)</Label>
                            <Textarea
                                value={uploadForm.description}
                                onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Description du document..."
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                            Annuler
                        </Button>
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

            {/* Preview Dialog */}
            <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Aperçu</DialogTitle>
                    </DialogHeader>
                    {previewUrl && (
                        <div className="flex justify-center overflow-auto max-h-[70vh]">
                            {previewUrl.includes('.pdf') ? (
                                <iframe src={previewUrl} className="w-full h-[70vh]" />
                            ) : (
                                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}