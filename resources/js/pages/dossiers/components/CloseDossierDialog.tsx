// dossiers/components/CloseDossierDialog.tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, LockOpen, AlertTriangle } from 'lucide-react';
import type { Dossier } from '@/types';

interface CloseDossierDialogProps {
    dossier: Dossier & {
        is_closed?: boolean;
        date_ouverture?: string;
        date_fermeture?: string;
        can_close?: boolean;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CloseDossierDialog({ dossier, open, onOpenChange }: CloseDossierDialogProps) {
    const [dateFermeture, setDateFermeture] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [motifFermeture, setMotifFermeture] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        if (isSubmitting) return;

        if (dossier.is_closed) {
            // Rouvrir le dossier
            setIsSubmitting(true);
            router.post(
                route('dossiers.reopen', dossier.id),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Dossier rouvert avec succès');
                        onOpenChange(false);
                        setIsSubmitting(false);
                    },
                    onError: (errors) => {
                        console.error('Erreurs:', errors);
                        toast.error('Erreur lors de la réouverture', {
                            description: Object.values(errors).join('\n')
                        });
                        setIsSubmitting(false);
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                    }
                }
            );
        } else {
            // Fermer le dossier
            if (!dateFermeture) {
                toast.error('Veuillez sélectionner une date de fermeture');
                return;
            }

            setIsSubmitting(true);
            router.post(
                route('dossiers.close', dossier.id),
                {
                    date_fermeture: dateFermeture,
                    motif_fermeture: motifFermeture || null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Dossier fermé avec succès');
                        onOpenChange(false);
                        setMotifFermeture('');
                        setIsSubmitting(false);
                    },
                    onError: (errors) => {
                        console.error('Erreurs:', errors);
                        toast.error('Erreur lors de la fermeture', {
                            description: Object.values(errors).join('\n')
                        });
                        setIsSubmitting(false);
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                    }
                }
            );
        }
    };

    const minDate = dossier.date_ouverture 
        ? new Date(dossier.date_ouverture).toISOString().split('T')[0]
        : undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {dossier.is_closed ? (
                            <>
                                <LockOpen className="h-5 w-5 text-green-600" />
                                Rouvrir le dossier
                            </>
                        ) : (
                            <>
                                <Lock className="h-5 w-5 text-orange-600" />
                                Fermer le dossier
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {dossier.is_closed ? (
                            <>
                                Le dossier sera rouvert et pourra à nouveau être modifié.
                                Toutes les propriétés et demandeurs redeviendront accessibles.
                            </>
                        ) : (
                            <>
                                Une fois fermé, ce dossier ne pourra plus être modifié.
                                Seuls les administrateurs pourront le rouvrir.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {!dossier.is_closed && (
                    <div className="space-y-4 py-4">
                        {/* Avertissement */}
                        <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-orange-800 dark:text-orange-200">
                                <p className="font-semibold mb-1">Attention !</p>
                                <ul className="space-y-1 list-disc list-inside">
                                    <li>Les utilisateurs ne pourront plus modifier ce dossier</li>
                                    <li>Aucune propriété ou demandeur ne pourra être ajouté</li>
                                    <li>Les données existantes resteront consultables</li>
                                </ul>
                            </div>
                        </div>

                        {/* Date de fermeture */}
                        <div className="space-y-2">
                            <Label htmlFor="date_fermeture" className="required">
                                Date de fermeture
                            </Label>
                            <Input
                                id="date_fermeture"
                                type="date"
                                value={dateFermeture}
                                onChange={(e) => setDateFermeture(e.target.value)}
                                min={minDate}
                                max={new Date().toISOString().split('T')[0]}
                                required
                                disabled={isSubmitting}
                            />
                            {minDate && (
                                <p className="text-xs text-muted-foreground">
                                    La date doit être après la date d'ouverture ({new Date(minDate).toLocaleDateString('fr-FR')})
                                </p>
                            )}
                        </div>

                        {/* Motif de fermeture */}
                        <div className="space-y-2">
                            <Label htmlFor="motif_fermeture">
                                Motif de fermeture (optionnel)
                            </Label>
                            <Textarea
                                id="motif_fermeture"
                                value={motifFermeture}
                                onChange={(e) => setMotifFermeture(e.target.value)}
                                placeholder="Ex: Tous les titres ont été délivrés, dossier complété..."
                                rows={3}
                                maxLength={500}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                {motifFermeture.length}/500 caractères
                            </p>
                        </div>
                    </div>
                )}

                {dossier.is_closed && (
                    <div className="py-4">
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <LockOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-semibold mb-1">Réouverture du dossier</p>
                                <p>
                                    Les utilisateurs pourront à nouveau modifier ce dossier et ajouter
                                    des propriétés ou des demandeurs.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleClose}
                        disabled={isSubmitting || (!dossier.is_closed && !dateFermeture)}
                        className={
                            dossier.is_closed
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-orange-600 hover:bg-orange-700'
                        }
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {dossier.is_closed ? 'Réouverture...' : 'Fermeture...'}
                            </span>
                        ) : (
                            <>
                                {dossier.is_closed ? (
                                    <>
                                        <LockOpen className="mr-2 h-4 w-4" />
                                        Rouvrir le dossier
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Fermer le dossier
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}