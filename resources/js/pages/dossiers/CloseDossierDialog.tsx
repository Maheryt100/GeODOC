// components/dossiers/CloseDossierDialog.tsx
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Lock, LockOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CloseDossierDialogProps {
    dossier: {
        id: number;
        nom_dossier: string;
        is_closed: boolean;
        date_ouverture: string;
        date_fermeture?: string;
        motif_fermeture?: string;
        closed_by?: {
            name: string;
            email: string;
        };
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CloseDossierDialog({ dossier, open, onOpenChange }: CloseDossierDialogProps) {
    const [isConfirming, setIsConfirming] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        date_fermeture: dossier.date_fermeture || new Date().toISOString().split('T')[0],
        motif_fermeture: dossier.motif_fermeture || '',
    });

    const handleClose = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        post(route('dossiers.close', dossier.id), {
            onSuccess: () => {
                toast.success('Dossier fermé avec succès');
                onOpenChange(false);
                reset();
                setIsConfirming(false);
            },
            onError: (errors) => {
                toast.error('Erreur lors de la fermeture', {
                    description: Object.values(errors).join('\n'),
                });
            },
        });
    };

    const handleReopen = () => {
        if (!confirm('Êtes-vous sûr de vouloir rouvrir ce dossier ?')) {
            return;
        }

        post(route('dossiers.reopen', dossier.id), {
            onSuccess: () => {
                toast.success('Dossier rouvert avec succès');
                onOpenChange(false);
            },
            onError: (errors) => {
                toast.error('Erreur lors de la réouverture', {
                    description: Object.values(errors).join('\n'),
                });
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
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
                        Dossier: <strong>{dossier.nom_dossier}</strong>
                    </DialogDescription>
                </DialogHeader>

                {dossier.is_closed ? (
                    // Vue pour dossier fermé
                    <div className="space-y-4">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Ce dossier est actuellement fermé. Aucune modification n'est possible.
                            </AlertDescription>
                        </Alert>

                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Date de fermeture</Label>
                                <Input
                                    type="text"
                                    value={new Date(dossier.date_fermeture!).toLocaleDateString('fr-FR')}
                                    disabled
                                />
                            </div>

                            {dossier.closed_by && (
                                <div className="space-y-2">
                                    <Label>Fermé par</Label>
                                    <Input
                                        type="text"
                                        value={`${dossier.closed_by.name} (${dossier.closed_by.email})`}
                                        disabled
                                    />
                                </div>
                            )}

                            {dossier.motif_fermeture && (
                                <div className="space-y-2">
                                    <Label>Motif de fermeture</Label>
                                    <Textarea
                                        value={dossier.motif_fermeture}
                                        disabled
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Annuler
                            </Button>
                            <Button
                                onClick={handleReopen}
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <LockOpen className="mr-2 h-4 w-4" />
                                {processing ? 'Réouverture...' : 'Rouvrir le dossier'}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    // Vue pour fermer un dossier
                    <form onSubmit={handleClose}>
                        {!isConfirming ? (
                            <>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-red-500">Date de fermeture *</Label>
                                        <Input
                                            type="date"
                                            value={data.date_fermeture}
                                            onChange={(e) => setData('date_fermeture', e.target.value)}
                                            min={dossier.date_ouverture}
                                            required
                                        />
                                        {errors.date_fermeture && (
                                            <p className="text-sm text-red-500">{errors.date_fermeture}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Motif de fermeture (optionnel)</Label>
                                        <Textarea
                                            value={data.motif_fermeture}
                                            onChange={(e) => setData('motif_fermeture', e.target.value)}
                                            placeholder="Ex: Tous les lots ont été attribués et les documents générés"
                                            rows={4}
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {data.motif_fermeture.length}/500 caractères
                                        </p>
                                    </div>
                                </div>

                                <Alert className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Attention :</strong> Une fois fermé, les utilisateurs ne pourront plus
                                        modifier ce dossier. Seuls les administrateurs pourront le rouvrir.
                                    </AlertDescription>
                                </Alert>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        Continuer
                                    </Button>
                                </DialogFooter>
                            </>
                        ) : (
                            <>
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Confirmation requise</strong>
                                        <p className="mt-2">
                                            Vous êtes sur le point de fermer le dossier <strong>{dossier.nom_dossier}</strong>.
                                            Cette action empêchera toute modification par les utilisateurs standards.
                                        </p>
                                        {data.motif_fermeture && (
                                            <p className="mt-2">
                                                <strong>Motif :</strong> {data.motif_fermeture}
                                            </p>
                                        )}
                                    </AlertDescription>
                                </Alert>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsConfirming(false)}
                                        disabled={processing}
                                    >
                                        Retour
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        <Lock className="mr-2 h-4 w-4" />
                                        {processing ? 'Fermeture...' : 'Confirmer la fermeture'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}