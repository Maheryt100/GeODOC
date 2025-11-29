// documents/tabs/CsfTab.tsx
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FileCheck, Download, AlertCircle, Info } from 'lucide-react';
import { Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs } from '../types';
import { 
    isProprieteComplete, 
    isDemandeurComplete, 
    getValidationMessage 
} from '../validation';

interface CsfTabProps {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: Demandeur[];
    dossier: Dossier;
}

export default function CsfTab({ proprietes, demandeurs, dossier }: CsfTabProps) {
    const [csfPropriete, setCsfPropriete] = useState<string>('');
    const [csfDemandeur, setCsfDemandeur] = useState<string>('');

    const selectedProprieteData = proprietes.find(p => p.id === Number(csfPropriete));
    const selectedDemandeurData = demandeurs.find(d => d.id === Number(csfDemandeur));

    // ✅ NOUVEAU : Filtrer les demandeurs selon la propriété sélectionnée
    const demandeursFiltered = useMemo(() => {
        if (!csfPropriete || !selectedProprieteData) {
            return [];
        }

        // Récupérer les IDs des demandeurs liés à cette propriété
        const demandeursLiesIds = selectedProprieteData.demandeurs_lies?.map(d => d.id) || [];
        
        // Filtrer les demandeurs complets
        return demandeurs.filter(d => demandeursLiesIds.includes(d.id));
    }, [csfPropriete, selectedProprieteData, demandeurs]);

    const canGenerate = () => {
        if (!csfPropriete || !csfDemandeur) return false;
        const prop = selectedProprieteData;
        const dem = selectedDemandeurData;
        if (!prop || !dem) return false;
        return isProprieteComplete(prop) && isDemandeurComplete(dem);
    };

    const validationMessage = getValidationMessage(
        selectedProprieteData || null,
        selectedDemandeurData || null,
        'csf'
    );

    const handleDownload = () => {
        if (!csfPropriete || !csfDemandeur) {
            toast.warning('Veuillez sélectionner une propriété et un demandeur');
            return;
        }

        try {
            const params = new URLSearchParams({
                id_propriete: csfPropriete,
                id_demandeur: csfDemandeur,
            });

            const url = `${route('documents.csf')}?${params.toString()}`;
            window.location.href = url;
            
            toast.success('Téléchargement du CSF en cours...');
        } catch (error) {
            console.error('Erreur lors de la génération de l\'URL:', error);
            toast.error('Erreur lors de la préparation du téléchargement');
        }
    };

    // ✅ Réinitialiser le demandeur quand la propriété change
    const handleProprieteChange = (value: string) => {
        setCsfPropriete(value);
        setCsfDemandeur(''); // Réinitialiser le demandeur
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Certificat de Situation Financière
                </CardTitle>
                <CardDescription>
                    Sélectionnez la propriété puis le demandeur associé
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label>Propriété</Label>
                    <Select value={csfPropriete} onValueChange={handleProprieteChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                            {proprietes.map((prop) => {
                                const isComplete = isProprieteComplete(prop);
                                const nbDemandeurs = prop.demandeurs_lies?.length || 0;
                                return (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span>Lot {prop.lot} - TN°{prop.titre}</span>
                                                {!isComplete && (
                                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                                )}
                                            </div>
                                            {nbDemandeurs > 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    {nbDemandeurs} demandeur{nbDemandeurs > 1 ? 's' : ''} associé{nbDemandeurs > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* ✅ Info sur le filtrage */}
                {csfPropriete && demandeursFiltered.length === 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Aucun demandeur associé à cette propriété. Veuillez d'abord associer un demandeur à cette propriété.
                        </AlertDescription>
                    </Alert>
                )}

                {csfPropriete && demandeursFiltered.length > 0 && (
                    <Alert className="bg-blue-500/10 border-blue-500/50">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                            {demandeursFiltered.length} demandeur{demandeursFiltered.length > 1 ? 's' : ''} associé{demandeursFiltered.length > 1 ? 's' : ''} à cette propriété
                        </AlertDescription>
                    </Alert>
                )}

                {/* Sélection Demandeur (uniquement si une propriété est sélectionnée) */}
                {csfPropriete && demandeursFiltered.length > 0 && (
                    <div className="space-y-2">
                        <Label>Demandeur</Label>
                        <Select value={csfDemandeur} onValueChange={setCsfDemandeur}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un demandeur" />
                            </SelectTrigger>
                            <SelectContent>
                                {demandeursFiltered.map((dem) => {
                                    const isComplete = isDemandeurComplete(dem);
                                    return (
                                        <SelectItem key={dem.id} value={String(dem.id)}>
                                            <div className="flex items-center gap-2">
                                                <span>{dem.nom_demandeur} {dem.prenom_demandeur}</span>
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
                )}

                <Separator />

                {/* Message de validation */}
                {validationMessage && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Explication */}
                <Alert>
                    <FileCheck className="h-4 w-4" />
                    <AlertDescription>
                        Le Certificat de Situation Financière certifie que le demandeur n'est redevable
                        d'aucune somme et a versé le cautionnement réglementaire.
                    </AlertDescription>
                </Alert>

                {/* Bouton de téléchargement */}
                <Button
                    onClick={handleDownload}
                    disabled={!canGenerate()}
                    className="w-full"
                    size="lg"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le CSF
                </Button>
            </CardContent>
        </Card>
    );
}