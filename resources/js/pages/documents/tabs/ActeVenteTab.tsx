// documents/tabs/ActeVenteTabs.tsx
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
// axios sera utilisé via window.axios disponible globalement dans Laravel
import {
    FileText, Download, AlertCircle, Users, CheckCircle2, 
    Lock, Receipt, History, RotateCcw, Clock, Eye
} from 'lucide-react';
import { Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs, RecuHistoryItem } from '../types';
import { 
    isProprieteComplete, 
    isDemandeurComplete, 
    getValidationMessage 
} from '../validation';

interface ActeVenteTabProps {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: Demandeur[];
    dossier: Dossier;
}

export default function ActeVenteTab({ proprietes, demandeurs, dossier }: ActeVenteTabProps) {
    const [selectedPropriete, setSelectedPropriete] = useState<string>('');
    const [selectedDemandeur, setSelectedDemandeur] = useState<string>('');
    const [showHistoryPopover, setShowHistoryPopover] = useState(false);
    const [recuHistory, setRecuHistory] = useState<RecuHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const selectedProprieteData = proprietes.find(p => p.id === Number(selectedPropriete));
    const selectedDemandeurData = demandeurs.find(d => d.id === Number(selectedDemandeur));

    const getDemandeursForPropriete = (idPropriete: string) => {
        const prop = proprietes.find(p => p.id === Number(idPropriete));
        return prop?.demandeurs_lies || [];
    };

    const hasConsorts = (idPropriete: string) => {
        return getDemandeursForPropriete(idPropriete).length > 1;
    };

    const canGenerateRecu = () => {
        if (!selectedPropriete || !selectedDemandeur) return false;
        const prop = selectedProprieteData;
        const dem = selectedDemandeurData;
        if (!prop || !dem) return false;
        return isProprieteComplete(prop) && isDemandeurComplete(dem);
    };

    const canGenerateActeVente = () => {
        if (!selectedPropriete || !selectedDemandeur) return false;
        const prop = selectedProprieteData;
        const dem = selectedDemandeurData;
        if (!prop || !dem) return false;
        return isProprieteComplete(prop) && isDemandeurComplete(dem) && prop.has_recu;
    };

    const validationMessage = getValidationMessage(
        selectedProprieteData || null,
        selectedDemandeurData || null,
        'acte_vente'
    );

    const loadRecuHistory = async (idPropriete: string) => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch(route('documents.recu.history', idPropriete));
            const data = await response.json();
            if (data.success) {
                setRecuHistory(data.recus);
                setShowHistoryPopover(true);
            }
        } catch (error: any) {
            console.error('Erreur chargement historique:', error);
            toast.error('Erreur lors du chargement de l\'historique');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleDownloadExistingRecu = (recuId: number) => {
        try {
            const url = route('documents.recu.download', recuId);
            window.location.href = url;
            toast.success('Téléchargement du reçu en cours...');
        } catch (error) {
            console.error('Erreur téléchargement reçu:', error);
            toast.error('Erreur lors du téléchargement du reçu');
        }
    };

    const handleDownload = (type: 'recu' | 'acte_vente') => {
        if (!selectedPropriete || !selectedDemandeur) {
            toast.warning('Veuillez sélectionner une propriété et un demandeur');
            return;
        }

        try {
            const params = new URLSearchParams({
                id_propriete: selectedPropriete,
                id_demandeur: selectedDemandeur,
            });

            const baseUrl = type === 'recu' 
                ? route('documents.recu')
                : route('documents.acte-vente');
            
            const url = `${baseUrl}?${params.toString()}`;
            window.location.href = url;
            
            const messages = {
                recu: 'Téléchargement du reçu en cours...',
                acte_vente: hasConsorts(selectedPropriete) 
                    ? `Téléchargement en cours (${getDemandeursForPropriete(selectedPropriete).length} demandeurs)`
                    : 'Téléchargement de l\'acte de vente...',
            };
            
            toast.success(messages[type]);
            
            if (type === 'recu') {
                setTimeout(() => {
                    router.reload({ only: ['proprietes'] });
                }, 1500);
            }
        } catch (error) {
            console.error('Erreur lors de la génération de l\'URL:', error);
            toast.error('Erreur lors de la préparation du téléchargement');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Acte de Vente
                </CardTitle>
                <CardDescription>
                    Sélectionnez la propriété et le demandeur
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label>Propriété</Label>
                    <Select value={selectedPropriete} onValueChange={(value) => {
                        setSelectedPropriete(value);
                        setSelectedDemandeur('');
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                            {proprietes.map((prop) => {
                                const isComplete = isProprieteComplete(prop);
                                const nbDemandeurs = prop.demandeurs_lies?.length || 0;
                                return (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        <div className="flex items-center gap-2">
                                            <span>Lot {prop.lot} - TN°{prop.titre} ({prop.type_operation})</span>
                                            {prop.has_recu && (
                                                <Badge variant="default" className="bg-green-500">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Reçu OK
                                                </Badge>
                                            )}
                                            {nbDemandeurs > 1 && (
                                                <Badge variant="outline">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {nbDemandeurs}
                                                </Badge>
                                            )}
                                            {!isComplete && (
                                                <AlertCircle className="h-3 w-3 text-red-500" />
                                            )}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {selectedPropriete && (
                    <>
                        {/* Statut du reçu */}
                        {!selectedProprieteData?.has_recu ? (
                            <Alert className="bg-amber-500/10 border-amber-500/50">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <AlertDescription className="text-amber-700 dark:text-amber-300">
                                    <strong>Étape obligatoire :</strong> Générer d'abord le reçu de paiement
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-green-500/10 border-green-500/50">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <AlertDescription className="text-green-700 dark:text-green-300">
                                            <div className="flex flex-col gap-1">
                                                <div>
                                                    Reçu N°{selectedProprieteData.dernier_recu?.numero_recu} confirmé
                                                </div>
                                                <div className="text-xs opacity-75 flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    Généré par {selectedProprieteData.dernier_recu?.generated_by} 
                                                    le {selectedProprieteData.dernier_recu?.generated_at}
                                                </div>
                                                <div className="text-xs opacity-75 flex items-center gap-2">
                                                    <Eye className="h-3 w-3" />
                                                    Téléchargé {selectedProprieteData.dernier_recu?.download_count} fois
                                                </div>
                                            </div>
                                        </AlertDescription>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {selectedProprieteData.dernier_recu && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownloadExistingRecu(selectedProprieteData.dernier_recu!.id)}
                                                className="h-8"
                                            >
                                                <Download className="h-3 w-3 mr-1" />
                                                Retélécharger
                                            </Button>
                                        )}
                                        
                                        <Popover open={showHistoryPopover} onOpenChange={setShowHistoryPopover}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => loadRecuHistory(selectedPropriete)}
                                                    disabled={isLoadingHistory}
                                                    className="h-8"
                                                >
                                                    <History className="h-3 w-3 mr-1" />
                                                    Historique
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[500px]" align="end">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-semibold flex items-center gap-2">
                                                            <History className="h-4 w-4" />
                                                            Historique des reçus
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Tous les reçus générés pour cette propriété
                                                        </p>
                                                    </div>
                                                    
                                                    <Separator />
                                                    
                                                    <ScrollArea className="h-[300px] pr-4">
                                                        {isLoadingHistory ? (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                Chargement...
                                                            </div>
                                                        ) : recuHistory.length === 0 ? (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                Aucun historique
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {recuHistory.map((recu) => (
                                                                    <Card key={recu.id} className="p-3">
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-start justify-between">
                                                                                <div>
                                                                                    <div className="font-semibold text-sm">
                                                                                        Reçu N° {recu.numero_recu}
                                                                                    </div>
                                                                                    <div className="text-xs text-muted-foreground">
                                                                                        {recu.demandeur}
                                                                                    </div>
                                                                                </div>
                                                                                <Badge variant="default">
                                                                                    {recu.status}
                                                                                </Badge>
                                                                            </div>
                                                                            
                                                                            <div className="text-sm space-y-1">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Montant:</span>
                                                                                    <span className="font-semibold">{recu.montant} Ar</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Date:</span>
                                                                                    <span>{recu.date_recu}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Créé par:</span>
                                                                                    <span>{recu.cree_par}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Téléchargements:</span>
                                                                                    <Badge variant="secondary">
                                                                                        <Eye className="h-3 w-3 mr-1" />
                                                                                        {recu.download_count}
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="pt-2 flex items-center gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="flex-1"
                                                                                    onClick={() => handleDownloadExistingRecu(recu.id)}
                                                                                >
                                                                                    {recu.file_exists ? (
                                                                                        <>
                                                                                            <Download className="h-3 w-3 mr-1" />
                                                                                            Télécharger
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <RotateCcw className="h-3 w-3 mr-1" />
                                                                                            Régénérer
                                                                                        </>
                                                                                    )}
                                                                                </Button>
                                                                                
                                                                                {!recu.file_exists && (
                                                                                    <div className="text-xs text-amber-600 flex items-center gap-1">
                                                                                        <AlertCircle className="h-3 w-3" />
                                                                                        Fichier perdu
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </ScrollArea>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </Alert>
                        )}

                        {hasConsorts(selectedPropriete) && (
                            <Alert className="bg-blue-500/10 border-blue-500/50">
                                <Users className="h-4 w-4 text-blue-500" />
                                <AlertDescription className="text-blue-700 dark:text-blue-300">
                                    Cette propriété a {getDemandeursForPropriete(selectedPropriete).length} demandeurs.
                                    Le document inclura automatiquement tous les demandeurs.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Sélection Demandeur */}
                        <div className="space-y-2">
                            <Label>Demandeur {hasConsorts(selectedPropriete) && "(principal)"}</Label>
                            <Select value={selectedDemandeur} onValueChange={setSelectedDemandeur}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un demandeur" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getDemandeursForPropriete(selectedPropriete).map((dem) => {
                                        const demandeurFull = demandeurs.find(d => d.id === dem.id);
                                        const isComplete = demandeurFull ? isDemandeurComplete(demandeurFull) : false;
                                        return (
                                            <SelectItem key={dem.id} value={String(dem.id)}>
                                                <div className="flex items-center gap-2">
                                                    <span>{dem.nom} {dem.prenom}</span>
                                                    {!isComplete && (
                                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}

                <Separator />

                {/* Messages de validation */}
                {validationMessage && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Boutons d'action */}
                {selectedPropriete && selectedDemandeur && !selectedProprieteData?.has_recu && (
                    <Button
                        onClick={() => handleDownload('recu')}
                        className="w-full"
                        size="lg"
                        variant="outline"
                        disabled={!canGenerateRecu()}
                    >
                        <Receipt className="h-4 w-4 mr-2" />
                        Générer le Reçu de Paiement
                    </Button>
                )}

                <Button
                    onClick={() => handleDownload('acte_vente')}
                    disabled={!canGenerateActeVente()}
                    className="w-full"
                    size="lg"
                >
                    {!selectedProprieteData?.has_recu ? (
                        <>
                            <Lock className="h-4 w-4 mr-2" />
                            Reçu requis pour continuer
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Obtenir l'Acte de Vente
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}