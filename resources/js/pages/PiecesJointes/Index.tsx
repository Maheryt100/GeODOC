// pages/PiecesJointes/Index.tsx
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FolderOpen, Search, Filter, Loader2, FileText, User, Home } from 'lucide-react';
import { toast } from 'sonner';
import PreviewModal from '@/components/PreviewModal';
import PieceJointeItem from '@/pages/PiecesJointes/components/PieceJointeItem';
import UploadPieceJointeDialog from '@/pages/PiecesJointes/components/UploadPieceJointeDialog';
import type { 
    PieceJointe, 
    RelatedPieces, 
    PiecesJointesIndexProps 
} from '@/pages/PiecesJointes/pieces-jointes';
import { CATEGORIES } from '@/pages/PiecesJointes/pieces-jointes';

export default function PiecesJointesIndex({
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
}: PiecesJointesIndexProps) {
    const [pieces, setPieces] = useState<PieceJointe[]>([]);
    const [relatedPieces, setRelatedPieces] = useState<RelatedPieces>({ 
        demandeurs: {}, 
        proprietes: {} 
    });
    const [loading, setLoading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategorie, setFilterCategorie] = useState<string>('all');

    const fetchPieces = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                attachable_type: attachableType,
                attachable_id: String(attachableId),
                include_related: showRelated && attachableType === 'Dossier' ? 'true' : 'false',
            });

            const response = await fetch(`/pieces-jointes?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setPieces(data.pieces_jointes || []);
                if (data.related_pieces) {
                    setRelatedPieces(data.related_pieces);
                }
            } else {
                toast.error('Erreur lors du chargement des pièces jointes');
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
            toast.error('Erreur de chargement des pièces jointes');
        } finally {
            setLoading(false);
        }
    }, [attachableType, attachableId, showRelated]);

    useEffect(() => {
        fetchPieces();
    }, [fetchPieces]);

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer ce fichier ?')) return;

        try {
            const response = await fetch(`/pieces-jointes/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
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
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
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

    const filteredPieces = pieces.filter(p => {
        const matchSearch = p.nom_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.type_document?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchCategorie = filterCategorie === 'all' || p.categorie === filterCategorie;
        return matchSearch && matchCategorie;
    });

    const totalCount = pieces.length + 
        Object.values(relatedPieces.demandeurs).reduce((acc, d) => acc + (d.pieces?.length || 0), 0) +
        Object.values(relatedPieces.proprietes).reduce((acc, p) => acc + (p.pieces?.length || 0), 0);

    return (
        <>
            <Card className="border-0 shadow-lg">
                {/* Header avec design cohérent */}
                <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20 p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {totalCount} document{totalCount > 1 ? 's' : ''} disponible{totalCount > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        
                        {canUpload && (
                            <Button onClick={() => setUploadDialogOpen(true)} size="sm">
                                <Upload className="mr-2 h-4 w-4" />
                                Ajouter
                            </Button>
                        )}
                    </div>
                </div>

                <CardContent className="p-6">
                    {/* Filtres */}
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un document..."
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

                    {/* Contenu avec onglets ou liste simple */}
                    {attachableType === 'Dossier' && showRelated ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-4 bg-muted/30">
                                <TabsTrigger value="all">
                                    Tous 
                                    <Badge variant="secondary" className="ml-2">{totalCount}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="dossier">
                                    Dossier
                                    <Badge variant="secondary" className="ml-2">{pieces.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="demandeurs">
                                    Demandeurs
                                    <Badge variant="secondary" className="ml-2">{Object.keys(relatedPieces.demandeurs).length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="proprietes">
                                    Propriétés
                                    <Badge variant="secondary" className="ml-2">{Object.keys(relatedPieces.proprietes).length}</Badge>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="space-y-2">
                                {filteredPieces.map(p => (
                                    <PieceJointeItem
                                        key={p.id}
                                        piece={p}
                                        canVerify={canVerify}
                                        canDelete={canDelete}
                                        onPreview={setPreviewUrl}
                                        onVerify={handleVerify}
                                        onDelete={handleDelete}
                                    />
                                ))}
                                {Object.values(relatedPieces.demandeurs).map((d) =>
                                    d.pieces?.map((p: PieceJointe) => (
                                        <PieceJointeItem
                                            key={p.id}
                                            piece={p}
                                            canVerify={canVerify}
                                            canDelete={canDelete}
                                            onPreview={setPreviewUrl}
                                            onVerify={handleVerify}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}
                                {Object.values(relatedPieces.proprietes).map((pr) =>
                                    pr.pieces?.map((p: PieceJointe) => (
                                        <PieceJointeItem
                                            key={p.id}
                                            piece={p}
                                            canVerify={canVerify}
                                            canDelete={canDelete}
                                            onPreview={setPreviewUrl}
                                            onVerify={handleVerify}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}
                                {totalCount === 0 && (
                                    <div className="text-center text-muted-foreground py-12">
                                        <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">Aucune pièce jointe</p>
                                        <p className="text-sm mt-1 opacity-70">Ajoutez des documents pour commencer</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="dossier" className="space-y-2">
                                {filteredPieces.map(p => (
                                    <PieceJointeItem
                                        key={p.id}
                                        piece={p}
                                        canVerify={canVerify}
                                        canDelete={canDelete}
                                        onPreview={setPreviewUrl}
                                        onVerify={handleVerify}
                                        onDelete={handleDelete}
                                    />
                                ))}
                                {filteredPieces.length === 0 && (
                                    <div className="text-center text-muted-foreground py-12">
                                        <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">Aucune pièce jointe du dossier</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="demandeurs" className="space-y-4">
                                {Object.entries(relatedPieces.demandeurs).map(([id, data]) => (
                                    <div key={id} className="border rounded-lg p-4 bg-muted/20">
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {data.demandeur.nom_demandeur} {data.demandeur.prenom_demandeur}
                                            <Badge variant="outline" className="text-xs">{data.demandeur.cin}</Badge>
                                        </h4>
                                        <div className="space-y-2">
                                            {data.pieces?.map((p: PieceJointe) => (
                                                <PieceJointeItem
                                                    key={p.id}
                                                    piece={p}
                                                    canVerify={canVerify}
                                                    canDelete={canDelete}
                                                    onPreview={setPreviewUrl}
                                                    onVerify={handleVerify}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(relatedPieces.demandeurs).length === 0 && (
                                    <div className="text-center text-muted-foreground py-12">
                                        <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">Aucune pièce jointe de demandeur</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="proprietes" className="space-y-4">
                                {Object.entries(relatedPieces.proprietes).map(([id, data]) => (
                                    <div key={id} className="border rounded-lg p-4 bg-muted/20">
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <Home className="h-4 w-4" />
                                            Lot {data.propriete.lot}
                                            {data.propriete.titre && <Badge variant="outline">TNº{data.propriete.titre}</Badge>}
                                        </h4>
                                        <div className="space-y-2">
                                            {data.pieces?.map((p: PieceJointe) => (
                                                <PieceJointeItem
                                                    key={p.id}
                                                    piece={p}
                                                    canVerify={canVerify}
                                                    canDelete={canDelete}
                                                    onPreview={setPreviewUrl}
                                                    onVerify={handleVerify}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(relatedPieces.proprietes).length === 0 && (
                                    <div className="text-center text-muted-foreground py-12">
                                        <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">Aucune pièce jointe de propriété</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="space-y-2">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredPieces.length > 0 ? (
                                filteredPieces.map(p => (
                                    <PieceJointeItem
                                        key={p.id}
                                        piece={p}
                                        canVerify={canVerify}
                                        canDelete={canDelete}
                                        onPreview={setPreviewUrl}
                                        onVerify={handleVerify}
                                        onDelete={handleDelete}
                                    />
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-12">
                                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">Aucune pièce jointe</p>
                                    <p className="text-sm mt-1 opacity-70">Ajoutez des documents pour commencer</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <UploadPieceJointeDialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                attachableType={attachableType}
                attachableId={attachableId}
                demandeurs={demandeurs}
                proprietes={proprietes}
                onSuccess={fetchPieces}
            />

            <PreviewModal 
                url={previewUrl} 
                onClose={() => setPreviewUrl(null)} 
            />
        </>
    );
}