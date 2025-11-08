// Exemple d'implémentation pour AjouterDemandeur.tsx
// À adapter pour tous les formulaires de création

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import proprietes from '@/pages/proprietes';
import { useForm } from '@inertiajs/react';

interface ConfirmationData {
    // Propriété
    propriete?: {
        lot: string;
        titre: string;
        contenance: string;
        nature: string;
        vocation: string;
    };
    // Demandeur
    demandeur?: {
        titre: string;
        nom: string;
        prenom: string;
        cin: string;
        date_naissance: string;
        occupation: string;
        domiciliation: string;
    };
    
    mode?: 'nouveau' | 'existant';
}
type ProprieteType = {
    id: number | string;
    lot: string;
    titre: string;
    contenance: string | number;
    nature: string;
    vocation: string;
};

export function ConfirmationModal({ 
    open, 
    onClose, 
    onConfirm, 
    data, 
    isSubmitting 
}: { 
    open: boolean; 
    onClose: () => void; 
    onConfirm: () => void; 
    data: ConfirmationData;
    isSubmitting: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Confirmer les informations
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Message d'introduction */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            Veuillez vérifier attentivement les informations ci-dessous avant de les enregistrer.
                        </p>
                    </div>

                    {/* Section Propriété */}
                    {data.propriete && (
                        <div className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Propriété sélectionnée</h3>
                                <Badge variant="outline">Lot</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Lot</p>
                                    <p className="font-medium">{data.propriete.lot}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Titre</p>
                                    <p className="font-medium">{data.propriete.titre || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Contenance</p>
                                    <p className="font-medium">{data.propriete.contenance} m²</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Nature</p>
                                    <p className="font-medium">{data.propriete.nature}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Vocation</p>
                                    <p className="font-medium">{data.propriete.vocation}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section Demandeur */}
                    {data.demandeur && (
                        <div className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    {data.mode === 'nouveau' ? 'Nouveau demandeur' : 'Demandeur existant'}
                                </h3>
                                <Badge variant={data.mode === 'nouveau' ? 'default' : 'secondary'}>
                                    {data.mode === 'nouveau' ? 'Création' : 'Existant'}
                                </Badge>
                            </div>

                            {/* Informations principales */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-3 rounded-lg">
                                <p className="font-semibold text-blue-900 dark:text-blue-100">
                                    {data.demandeur.titre} {data.demandeur.nom} {data.demandeur.prenom}
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300 font-mono mt-1">
                                    CIN: {data.demandeur.cin}
                                </p>
                            </div>

                            {/* Détails */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Date de naissance</p>
                                    <p className="font-medium">
                                        {new Date(data.demandeur.date_naissance).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Occupation</p>
                                    <p className="font-medium">{data.demandeur.occupation}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground">Domiciliation</p>
                                    <p className="font-medium">{data.demandeur.domiciliation}</p>
                                </div>
                            </div>

                            {/* Avertissement pour nouveau demandeur */}
                            {data.mode === 'nouveau' && (
                                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                            Attention
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            Un nouveau demandeur sera créé avec le CIN {data.demandeur.cin}.
                                            Assurez-vous qu'il n'existe pas déjà dans la base de données.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action récapitulative */}
                    <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            ✓ Action à effectuer
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {data.mode === 'nouveau' 
                                ? `Créer un nouveau demandeur et l'associer au lot ${data.propriete?.lot}`
                                : `Associer le demandeur existant au lot ${data.propriete?.lot}`
                            }
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Modifier
                    </Button>
                    <Button 
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmer et enregistrer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// UTILISATION dans le formulaire
// ============================================

export default function AjouterDemandeur() {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState<ConfirmationData>({});
    const { data, setData, post, processing } = useForm({id_propriete: '',
    titre_demandeur: '',
    nom_demandeur: '',
    prenom_demandeur: '',
    cin: '',
    date_naissance: '',
    occupation: '',
    domiciliation: ''});
    const [cinSearch, setCinSearch] = useState(''); // pour stocker le CIN recherché
    const [mode, setMode] = useState<'nouveau' | 'existant'>('nouveau'); // « nouveau » par défaut
    const [proprietes, setProprietes] = useState<ProprieteType[]>([]); // ou la façon d’obtenir la liste des propriétés

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation de base
        if (!data.id_propriete) {
            toast.error('Veuillez sélectionner une propriété');
            return;
        }

        // Préparer les données pour la confirmation
        const proprieteSelectionnee = proprietes.find((p: { id: { toString: () => any; }; }) => p.id.toString() === data.id_propriete);
        
        const confirmData: ConfirmationData = {
            propriete: proprieteSelectionnee ? {
                lot: proprieteSelectionnee.lot,
                titre: proprieteSelectionnee.titre || 'Sans titre',
                contenance: proprieteSelectionnee.contenance.toString(),
                nature: proprieteSelectionnee.nature,
                vocation: proprieteSelectionnee.vocation,
            } : undefined,
            demandeur: {
                titre: data.titre_demandeur,
                nom: data.nom_demandeur,
                prenom: data.prenom_demandeur || '',
                cin: mode === 'existant' ? cinSearch : data.cin,
                date_naissance: data.date_naissance,
                occupation: data.occupation,
                domiciliation: data.domiciliation,
            },
            mode: mode
        };

        setConfirmationData(confirmData);
        setShowConfirmation(true);
    };

    const confirmSubmit = () => {
        // Soumettre réellement le formulaire
        post(route('ajouter-demandeur.store'), {
            onSuccess: () => {
                toast.success('Demandeur ajouté avec succès !');
                setShowConfirmation(false);
            },
            onError: (errors: ArrayLike<unknown> | { [s: string]: unknown; }) => {
                toast.error('Erreur', { description: Object.values(errors).join('\n') });
                setShowConfirmation(false);
            }
        });
    };

    return (
        <>
            {/* Formulaire normal */}
            <form onSubmit={handleSubmit}>
                {/* ... champs du formulaire ... */}
                
                <Button type="submit" disabled={processing}>
                    Suivant : Vérifier les informations
                </Button>
            </form>

            {/* Modal de confirmation */}
            <ConfirmationModal
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={confirmSubmit}
                data={confirmationData}
                isSubmitting={processing}
            />
        </>
    );
}