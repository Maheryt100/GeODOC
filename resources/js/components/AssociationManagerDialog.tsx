import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Unlink, AlertCircle, Archive, MapPin, FileText, User } from 'lucide-react';
import type { Demandeur, Propriete } from '@/types';

interface AssociationData {
    demandeur?: {
        id: number;
        nom_complet: string;
        cin: string;
    };
    propriete?: {
        id: number;
        lot: string;
        titre: string;
        contenance: number;
        status: boolean;
    };
    proprietes?: Array<{
        id: number;
        lot: string;
        titre: string;
        contenance: number;
        nature: string;
        vocation: string;
        situation: string;
        status: boolean;
        dossier_nom: string;
        pivot_id: number;
        pivot_status: string;
        is_archived: boolean;
    }>;
    demandeurs?: Array<{
        id: number;
        titre: string;
        nom: string;
        prenom: string;
        cin: string;
        occupation: string;
        telephone: string;
        pivot_id: number;
        pivot_status: string;
        is_archived: boolean;
    }>;
}

interface AssociationManagerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'demandeur' | 'propriete';
    itemId: number;
}

export default function AssociationManagerDialog({
    open,
    onOpenChange,
    type,
    itemId
}: AssociationManagerDialogProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AssociationData | null>(null);
    const [dissociating, setDissociating] = useState<number | null>(null);

    useEffect(() => {
        if (open && itemId) {
            fetchAssociations();
        }
    }, [open, itemId]);

    const fetchAssociations = async () => {
        setLoading(true);
        try {
            const endpoint = type === 'demandeur'
                ? route('associations.demandeur.proprietes', itemId)
                : route('associations.propriete.demandeurs', itemId);

            const response = await fetch(endpoint);
            const result = await response.json();

            if (result.success) {
                setData(result);
            } else {
                toast.error('Erreur lors du chargement');
            }
        } catch (error) {
            console.error('Erreur fetch:', error);
            toast.error('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleDissociate = async (targetId: number) => {
        if (!confirm('Confirmer la dissociation ?')) return;

        setDissociating(targetId);
        try {
            const payload = type === 'demandeur'
                ? { id_demandeur: itemId, id_propriete: targetId }
                : { id_demandeur: targetId, id_propriete: itemId };

            const response = await fetch(route('associations.dissociate'), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                fetchAssociations(); // Recharger
                router.reload({ only: ['dossier'] }); // Rafraîchir la page parent
            } else {
                toast.error(result.message || 'Erreur lors de la dissociation');
            }
        } catch (error) {
            console.error('Erreur dissociation:', error);
            toast.error('Erreur de connexion');
        } finally {
            setDissociating(null);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (!data) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Erreur de chargement des données</AlertDescription>
                </Alert>
            );
        }

        if (type === 'demandeur' && data.proprietes) {
            const activeCount = data.proprietes.filter(p => !p.is_archived).length;
            const archivedCount = data.proprietes.filter(p => p.is_archived).length;

            return (
                <>
                    {/* En-tête Demandeur */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h3 className="font-bold text-blue-900 dark:text-blue-100">
                                    {data.demandeur?.nom_complet}
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    CIN: {data.demandeur?.cin}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Badge variant="default">{activeCount} active{activeCount > 1 ? 's' : ''}</Badge>
                            {archivedCount > 0 && (
                                <Badge variant="secondary">{archivedCount} acquise{archivedCount > 1 ? 's' : ''}</Badge>
                            )}
                        </div>
                    </div>

                    {/* Liste des propriétés */}
                    {data.proprietes.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Aucune propriété associée</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            {data.proprietes.map((prop) => (
                                <Card
                                    key={prop.id}
                                    className={`transition-all ${
                                        prop.is_archived
                                            ? 'bg-gray-100 dark:bg-gray-800 opacity-75 border-gray-300'
                                            : 'hover:shadow-md'
                                    }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-green-600" />
                                                    <span className="font-semibold">
                                                        Lot {prop.lot} {prop.titre && `- TN°${prop.titre}`}
                                                    </span>
                                                    {prop.is_archived && (
                                                        <Badge variant="secondary" className="ml-2">
                                                            <Archive className="h-3 w-3 mr-1" />
                                                            Acquise
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    <div>Dossier: {prop.dossier_nom}</div>
                                                    <div>Nature: {prop.nature}</div>
                                                    <div>Vocation: {prop.vocation}</div>
                                                    <div>Superficie: {prop.contenance} m²</div>
                                                    <div className="col-span-2 text-xs mt-1">
                                                        Situation: {prop.situation}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDissociate(prop.id)}
                                                    disabled={dissociating === prop.id || prop.is_archived}
                                                    className={prop.is_archived ? 'cursor-not-allowed' : ''}
                                                >
                                                    {dissociating === prop.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Unlink className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        {prop.is_archived && (
                                            <Alert variant="default" className="mt-3 bg-amber-50 border-amber-200">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-xs">
                                                    Cette propriété a été acquise et ne peut plus être dissociée
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            );
        }

        if (type === 'propriete' && data.demandeurs) {
            const activeCount = data.demandeurs.filter(d => !d.is_archived).length;
            const archivedCount = data.demandeurs.filter(d => d.is_archived).length;

            return (
                <>
                    {/* En-tête Propriété */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                            <div>
                                <h3 className="font-bold text-green-900 dark:text-green-100">
                                    Lot {data.propriete?.lot} {data.propriete?.titre && `- TN°${data.propriete.titre}`}
                                </h3>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {data.propriete?.contenance} m²
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Badge variant="default">{activeCount} demandeur{activeCount > 1 ? 's' : ''}</Badge>
                            {archivedCount > 0 && (
                                <Badge variant="secondary">{archivedCount} acquis</Badge>
                            )}
                        </div>
                    </div>

                    {/* Liste des demandeurs */}
                    {data.demandeurs.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Aucun demandeur associé</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            {data.demandeurs.map((dem) => (
                                <Card
                                    key={dem.id}
                                    className={`transition-all ${
                                        dem.is_archived
                                            ? 'bg-gray-100 dark:bg-gray-800 opacity-75 border-gray-300'
                                            : 'hover:shadow-md'
                                    }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                    <span className="font-semibold">
                                                        {dem.titre} {dem.nom} {dem.prenom}
                                                    </span>
                                                    {dem.is_archived && (
                                                        <Badge variant="secondary" className="ml-2">
                                                            <Archive className="h-3 w-3 mr-1" />
                                                            Acquis
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    <div>CIN: {dem.cin}</div>
                                                    <div>Occupation: {dem.occupation}</div>
                                                    {dem.telephone && (
                                                        <div className="col-span-2">Tél: {dem.telephone}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDissociate(dem.id)}
                                                    disabled={dissociating === dem.id || dem.is_archived}
                                                    className={dem.is_archived ? 'cursor-not-allowed' : ''}
                                                >
                                                    {dissociating === dem.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Unlink className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        {dem.is_archived && (
                                            <Alert variant="default" className="mt-3 bg-amber-50 border-amber-200">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-xs">
                                                    Ce demandeur a acquis cette propriété
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            );
        }

        return null;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Unlink className="h-5 w-5" />
                        Gérer les associations
                    </DialogTitle>
                    <DialogDescription>
                        {type === 'demandeur' 
                            ? 'Propriétés associées à ce demandeur'
                            : 'Demandeurs associés à cette propriété'
                        }
                    </DialogDescription>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}