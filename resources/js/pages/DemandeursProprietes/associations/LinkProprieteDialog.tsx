// associations/LinkProprieteDialog.tsx
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, LandPlot, Link2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Demandeur, Propriete } from '@/types';

interface LinkProprieteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    demandeur: Demandeur;
    proprietesDossier: Propriete[];
    dossierId: number;
}

export function LinkProprieteDialog({
    open,
    onOpenChange,
    demandeur,
    proprietesDossier,
    dossierId
}: LinkProprieteDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ CORRECTION : Réinitialiser l'état à la fermeture
    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setSelectedPropriete(null);
            setIsSubmitting(false);
        }
    }, [open]);

    // Filtrer les propriétés déjà liées à ce demandeur
    const proprietesDisponibles = proprietesDossier.filter(prop => {
        // Exclure les propriétés archivées
        if (prop.is_archived) return false;

        // Exclure les propriétés déjà liées
        const dejaLie = prop.demandeurs?.some(d => d.id === demandeur.id);
        return !dejaLie;
    });

    // Recherche
    const proprietesFiltrees = proprietesDisponibles.filter(prop => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            prop.lot.toLowerCase().includes(search) ||
            prop.titre?.toLowerCase().includes(search) ||
            prop.proprietaire?.toLowerCase().includes(search)
        );
    });

    const handleSubmit = () => {
        if (!selectedPropriete) {
            toast.error('Veuillez sélectionner une propriété');
            return;
        }

        setIsSubmitting(true);

        router.post(route('association.link'), {
            id_demandeur: demandeur.id,
            id_propriete: selectedPropriete.id,
            id_dossier: dossierId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Propriété liée avec succès');
                onOpenChange(false);
            },
            onError: (errors) => {
                toast.error('Erreur', {
                    description: Object.values(errors).join('\n')
                });
                setIsSubmitting(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Lier à une propriété existante</DialogTitle>
                    <DialogDescription>
                        Demandeur : {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Barre de recherche */}
                    <div className="sticky top-0 bg-background pb-4 border-b z-10">
                        <Label>Rechercher par lot, titre ou propriétaire</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Lot, titre ou propriétaire..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Liste des propriétés */}
                    {proprietesDisponibles.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Aucune propriété disponible dans ce dossier ou toutes sont déjà liées à ce demandeur.
                            </AlertDescription>
                        </Alert>
                    ) : proprietesFiltrees.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Aucun résultat pour "{searchTerm}"
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-2">
                            {proprietesFiltrees.map((prop) => (
                                <div
                                    key={prop.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                                        selectedPropriete?.id === prop.id
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border'
                                    } ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                                    onClick={() => !isSubmitting && setSelectedPropriete(prop)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <LandPlot className="h-4 w-4 text-muted-foreground" />
                                                <p className="font-semibold">
                                                    Lot {prop.lot}
                                                    {prop.titre && ` - TNº${prop.titre}`}
                                                </p>
                                                {selectedPropriete?.id === prop.id && (
                                                    <Badge variant="default">Sélectionné</Badge>
                                                )}
                                                {prop.is_incomplete && (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400">
                                                        Incomplet
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                <p><strong>Contenance:</strong> {prop.contenance}m²</p>
                                                <p><strong>Nature:</strong> {prop.nature}</p>
                                                <p><strong>Vocation:</strong> {prop.vocation}</p>
                                                <p><strong>Propriétaire:</strong> {prop.proprietaire || '-'}</p>
                                                {prop.situation && (
                                                    <p className="col-span-2"><strong>Situation:</strong> {prop.situation}</p>
                                                )}
                                            </div>
                                            {prop.demandeurs && prop.demandeurs.length > 0 && (
                                                <div className="mt-2 pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground">
                                                        Déjà lié à : {prop.demandeurs.map(d => d.nom_demandeur).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer avec actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        {proprietesFiltrees.length} propriété(s) disponible(s)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedPropriete || isSubmitting}
                        >
                            <Link2 className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Liaison...' : 'Lier la propriété'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}