import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    File, FileText, Image, FileSpreadsheet, Download, Trash, Upload, 
    Eye, FolderOpen, AlertCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import type { BreadcrumbItem, Dossier } from '@/types';

interface PieceJointe {
    id: number;
    nom_original: string;
    taille_formatee: string;
    type_document: string;
    description: string | null;
    icone: string;
    created_at: string;
    user: {
        name: string;
    };
}

interface PageProps {
    dossier: Dossier;
    piecesJointes: {
        dossier: PieceJointe[];
        proprietes: Array<{
            id: number;
            lot: string;
            titre: string;
            pieces: PieceJointe[];
        }>;
        demandeurs: Array<{
            id: number;
            nom: string;
            cin: string;
            pieces: PieceJointe[];
        }>;
    };
}

export default function Index({ dossier, piecesJointes }: PageProps) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadData, setUploadData] = useState({
        fichier: null as File | null,
        type_document: 'autre',
        description: '',
        attachable_type: 'dossier',
        attachable_id: dossier.id,
    });

    const getIconComponent = (iconName: string) => {
        const icons: Record<string, any> = {
            FileText,
            Image,
            FileSpreadsheet,
            File,
        };
        return icons[iconName] || File;
    };

    const handleUpload = () => {
        if (!uploadData.fichier) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        const formData = new FormData();
        formData.append('fichier', uploadData.fichier);
        formData.append('type_document', uploadData.type_document);
        formData.append('description', uploadData.description);
        formData.append('attachable_type', uploadData.attachable_type);
        formData.append('attachable_id', String(uploadData.attachable_id));

        router.post(route('pieces-jointes.store'), formData, {
            onSuccess: () => {
                toast.success('Fichier uploadé avec succès');
                setUploadDialogOpen(false);
                setUploadData({
                    fichier: null,
                    type_document: 'autre',
                    description: '',
                    attachable_type: 'dossier',
                    attachable_id: dossier.id,
                });
            },
            onError: (errors) => {
                toast.error(Object.values(errors).join('\n'));
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
            router.delete(route('pieces-jointes.destroy', id), {
                onSuccess: () => toast.success('Fichier supprimé'),
                onError: (errors) => toast.error(Object.values(errors).join('\n')),
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Pièces jointes', href: '#' },
    ];

    const renderPieceJointe = (piece: PieceJointe) => {
        const IconComponent = getIconComponent(piece.icone);
        
        return (
            <div 
                key={piece.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
            >
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                        <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{piece.nom_original}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{piece.taille_formatee}</span>
                            <span>•</span>
                            <span>{new Date(piece.created_at).toLocaleDateString('fr-FR')}</span>
                            <span>•</span>
                            <span>{piece.user.name}</span>
                        </div>
                        {piece.description && (
                            <p className="text-xs text-muted-foreground mt-1">{piece.description}</p>
                        )}
                    </div>
                    <Badge variant="outline">{piece.type_document.replace('_', ' ')}</Badge>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        asChild
                    >
                        <a href={route('pieces-jointes.download', piece.id)}>
                            <Download className="h-4 w-4" />
                        </a>
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(piece.id)}
                    >
                        <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pièces jointes" />
            <Toaster position="top-right" richColors />

            <div className="p-6 space-y-6">
                {/* En-tête */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Pièces jointes</h1>
                        <p className="text-muted-foreground mt-1">
                            Dossier: {dossier.nom_dossier}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('pieces-jointes.documents-generes', dossier.id)}>
                                <FolderOpen className="mr-2 h-4 w-4" />
                                Documents générés
                            </Link>
                        </Button>
                        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Ajouter un fichier
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Uploader un fichier</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Fichier</Label>
                                        <Input 
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setUploadData(prev => ({ ...prev, fichier: file }));
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label>Type de document</Label>
                                        <Select 
                                            value={uploadData.type_document}
                                            onValueChange={(value) => setUploadData(prev => ({ ...prev, type_document: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="piece_identite">Pièce d'identité</SelectItem>
                                                <SelectItem value="autre">Autre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Description (optionnel)</Label>
                                        <Textarea 
                                            value={uploadData.description}
                                            onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Description du document..."
                                        />
                                    </div>
                                    <Button onClick={handleUpload} className="w-full">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Uploader
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Pièces du dossier */}
                <Card>
                    <CardHeader>
                        <CardTitle>Documents du dossier</CardTitle>
                        <CardDescription>
                            {piecesJointes.dossier.length} fichier(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {piecesJointes.dossier.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Aucun fichier pour ce dossier</p>
                            </div>
                        ) : (
                            piecesJointes.dossier.map(renderPieceJointe)
                        )}
                    </CardContent>
                </Card>

                {/* Pièces des propriétés */}
                {piecesJointes.proprietes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents des propriétés</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {piecesJointes.proprietes.map((prop) => (
                                <div key={prop.id}>
                                    <h4 className="font-semibold mb-2">
                                        Lot {prop.lot} - TN°{prop.titre}
                                    </h4>
                                    <div className="space-y-2 ml-4">
                                        {prop.pieces.map(renderPieceJointe)}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Pièces des demandeurs */}
                {piecesJointes.demandeurs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents des demandeurs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {piecesJointes.demandeurs.map((dem) => (
                                <div key={dem.id}>
                                    <h4 className="font-semibold mb-2">
                                        {dem.nom} (CIN: {dem.cin})
                                    </h4>
                                    <div className="space-y-2 ml-4">
                                        {dem.pieces.map(renderPieceJointe)}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}