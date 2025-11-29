// associations/DissociateDialog.tsx - NOUVEAU COMPOSANT
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Unlink, AlertTriangle, Info, Users } from 'lucide-react';

interface DissociateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: {
        demandeurId: number;
        proprieteId: number;
        demandeurNom: string;
        proprieteLot: string;
        type: 'from-demandeur' | 'from-propriete';
        autresDemandeurs?: number;
    } | null;
    isProcessing: boolean;
    onConfirm: () => void;
}

export function DissociateDialog({
    open,
    onOpenChange,
    data,
    isProcessing,
    onConfirm
}: DissociateDialogProps) {
    if (!data) return null;

    const willRemoveProperty = data.autresDemandeurs === 0;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Unlink className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <AlertDialogTitle>Confirmer la dissociation</AlertDialogTitle>
                    </div>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    <AlertDialogDescription className="text-base">
                        Vous êtes sur le point de dissocier :
                    </AlertDialogDescription>

                    {/* Informations principales */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Demandeur :</span>
                            <span className="text-sm font-semibold">{data.demandeurNom}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Propriété :</span>
                            <span className="text-sm font-semibold">Lot {data.proprieteLot}</span>
                        </div>
                    </div>

                    {/* Avertissement si d'autres demandeurs */}
                    {data.autresDemandeurs !== undefined && data.autresDemandeurs > 0 && (
                        <Alert>
                            <Users className="h-4 w-4" />
                            <AlertDescription>
                                <strong>{data.autresDemandeurs}</strong> autre{data.autresDemandeurs > 1 ? 's' : ''} demandeur{data.autresDemandeurs > 1 ? 's' : ''} restera{data.autresDemandeurs > 1 ? 'nt' : ''} associé{data.autresDemandeurs > 1 ? 's' : ''} à cette propriété.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Avertissement si dernier demandeur */}
                    {willRemoveProperty && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Attention :</strong> Ce demandeur est le seul associé à cette propriété. 
                                La dissociation rendra la propriété disponible pour d'autres liaisons.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Info réversibilité */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            Cette action peut être inversée en reliant à nouveau le demandeur à la propriété.
                        </AlertDescription>
                    </Alert>

                    {/* Conséquences */}
                    <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">Conséquences :</p>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• L'association sera supprimée immédiatement</li>
                            <li>• Le demandeur ne pourra plus générer de documents pour cette propriété</li>
                            {willRemoveProperty && (
                                <li className="text-orange-600 dark:text-orange-400">
                                    • La propriété sera marquée comme "Sans demandeur"
                                </li>
                            )}
                            <li>• L'historique de cette action sera enregistré</li>
                        </ul>
                    </div>
                </div>

                <AlertDialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {isProcessing ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Dissociation...
                            </>
                        ) : (
                            <>
                                <Unlink className="mr-2 h-4 w-4" />
                                Confirmer la dissociation
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}