// components/UploadPieceJointeDialog.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { UploadForm, BaseDemandeur, BasePropriete } from '@/pages/PiecesJointes/pieces-jointes';
import { CATEGORIES, TYPES_DOCUMENTS } from '@/pages/PiecesJointes/pieces-jointes';

interface UploadPieceJointeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachableType: 'Dossier' | 'Demandeur' | 'Propriete';
    attachableId: number;
    demandeurs?: BaseDemandeur[];
    proprietes?: BasePropriete[];
    onSuccess: () => void;
}

export default function UploadPieceJointeDialog({
    open,
    onOpenChange,
    attachableType,
    attachableId,
    demandeurs = [],
    proprietes = [],
    onSuccess
}: UploadPieceJointeDialogProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState<UploadForm>({
        files: [],
        type_document: '',
        categorie: 'global',
        description: '',
        linked_entity_type: '',
        linked_entity_id: '',
    });

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
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                onOpenChange(false);
                setUploadForm({
                    files: [],
                    type_document: '',
                    categorie: 'global',
                    description: '',
                    linked_entity_type: '',
                    linked_entity_id: '',
                });
                onSuccess();
            } else {
                toast.error(data.message || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            toast.error('Erreur de connexion');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
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
    );
}