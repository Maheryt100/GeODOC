// users/components/ConfirmationDialogs.tsx
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User } from '../types';
import { AlertTriangle } from 'lucide-react';

interface ToggleStatusDialogProps {
    user: User | null;
    onClose: () => void;
    onConfirm: (user: User) => void;
}

export const ToggleStatusDialog = ({ user, onClose, onConfirm }: ToggleStatusDialogProps) => {
    if (!user) return null;

    return (
        <AlertDialog open={!!user} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {user.status ? 'Désactiver' : 'Activer'} l'utilisateur
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <div className="space-y-3">
                            <p>
                                Voulez-vous vraiment {user.status ? 'désactiver' : 'activer'} l'utilisateur{' '}
                                <strong className="text-foreground">{user.name}</strong> ?
                            </p>
                            {user.status && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-800 dark:text-amber-200">
                                        <p className="font-medium">Attention</p>
                                        <p className="mt-1">
                                            L'utilisateur ne pourra plus se connecter ni accéder aux dossiers.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onConfirm(user)}
                        className={user.status ? 'bg-amber-600 hover:bg-amber-700' : ''}
                    >
                        Confirmer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

interface DeleteUserDialogProps {
    user: User | null;
    onClose: () => void;
    onConfirm: (user: User) => void;
}

export const DeleteUserDialog = ({ user, onClose, onConfirm }: DeleteUserDialogProps) => {
    if (!user) return null;

    return (
        <AlertDialog open={!!user} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Supprimer l'utilisateur
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <div className="space-y-3">
                            <p>
                                Voulez-vous vraiment supprimer l'utilisateur{' '}
                                <strong className="text-foreground">{user.name}</strong> ?
                            </p>
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                <p className="text-sm font-medium text-destructive">
                                    ⚠️ Cette action est irréversible
                                </p>
                                <ul className="text-sm text-destructive/80 mt-2 space-y-1 list-disc list-inside">
                                    <li>Toutes les données de l'utilisateur seront supprimées</li>
                                    <li>L'accès aux dossiers sera révoqué</li>
                                    <li>Cette opération ne peut pas être annulée</li>
                                </ul>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onConfirm(user)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Supprimer définitivement
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};