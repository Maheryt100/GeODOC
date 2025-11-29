// documents/tabs/RequisitionTab.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileOutput, Download, AlertCircle } from 'lucide-react';
import { Dossier } from '@/types';
import { ProprieteWithDemandeurs } from '../types';
import { canGenerateRequisition, getMissingProprieteFields } from '../validation';

interface RequisitionTabProps {
    proprietes: ProprieteWithDemandeurs[];
    dossier: Dossier;
}

export default function RequisitionTab({ proprietes, dossier }: RequisitionTabProps) {
    const [reqPropriete, setReqPropriete] = useState<string>('');

    const selectedProprieteData = proprietes.find(p => p.id === Number(reqPropriete));

    const canGenerate = () => {
        if (!reqPropriete) return false;
        const prop = selectedProprieteData;
        if (!prop) return false;
        return canGenerateRequisition(prop);
    };

    const getValidationMessage = (): string | null => {
        if (!reqPropriete) return null;
        
        const prop = selectedProprieteData;
        if (!prop) return null;

        if (!canGenerateRequisition(prop)) {
            const missingFields = getMissingProprieteFields(prop);
            return `Données manquantes : ${missingFields.join(', ')}`;
        }

        return null;
    };

    const validationMessage = getValidationMessage();

    const handleDownload = () => {
        if (!reqPropriete) {
            toast.warning('Veuillez sélectionner une propriété');
            return;
        }

        try {
            const params = new URLSearchParams({
                id_propriete: reqPropriete,
            });

            const url = `${route('documents.requisition')}?${params.toString()}`;
            window.location.href = url;
            
            toast.success('Téléchargement de la réquisition en cours...');
        } catch (error) {
            console.error('Erreur lors de la génération de l\'URL:', error);
            toast.error('Erreur lors de la préparation du téléchargement');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileOutput className="h-5 w-5" />
                    Réquisition
                </CardTitle>
                <CardDescription>
                    Sélectionnez la propriété pour générer la réquisition (pas de demandeur requis)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label>Propriété</Label>
                    <Select value={reqPropriete} onValueChange={setReqPropriete}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                            {proprietes.map((prop) => {
                                const isComplete = canGenerateRequisition(prop);
                                const nbDemandeurs = prop.demandeurs_lies?.length || 0;
                                return (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span>Lot {prop.lot} - TN°{prop.titre}</span>
                                                {!isComplete && (
                                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                                )}
                                                <Badge variant="outline" className="ml-2">
                                                    {prop.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                                                </Badge>
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

                {/* Affichage du type d'opération */}
                {reqPropriete && selectedProprieteData && (
                    <Alert className="bg-blue-500/10 border-blue-500/50">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                            <div className="space-y-1">
                                <div>
                                    <strong>Type :</strong>{' '}
                                    {selectedProprieteData.type_operation === 'morcellement'
                                        ? 'Morcellement'
                                        : 'Immatriculation'}
                                </div>
                                <div className="text-xs opacity-75">
                                    La réquisition sera générée automatiquement selon le type d'opération
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
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
                    <FileOutput className="h-4 w-4" />
                    <AlertDescription>
                        La réquisition demande au Conservateur de la Propriété Foncière de procéder à
                        l'immatriculation ou au morcellement d'un terrain. Ce document ne nécessite pas
                        de sélectionner un demandeur spécifique.
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
                    Télécharger la Réquisition
                </Button>
            </CardContent>
        </Card>
    );
}