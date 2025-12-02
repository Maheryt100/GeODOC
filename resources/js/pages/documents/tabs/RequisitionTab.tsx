// documents/tabs/RequisitionTab.tsx
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileOutput, Download, AlertCircle, Info, Loader2, Eye, FileCheck } from 'lucide-react';
import { Dossier } from '@/types';
import { ProprieteWithDemandeurs, DocumentGenere } from '../types';
import { canGenerateRequisition, getMissingProprieteFields } from '../validation';

interface RequisitionTabProps {
    proprietes: ProprieteWithDemandeurs[];
    dossier: Dossier;
}

export default function RequisitionTab({ proprietes, dossier }: RequisitionTabProps) {
    const [reqPropriete, setReqPropriete] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const selectedProprieteData = proprietes.find(p => p.id === Number(reqPropriete));
    
    const documentRequisition = selectedProprieteData?.document_requisition;
    const hasRequisition = !!documentRequisition;

    const canGenerate = () => {
        if (!reqPropriete || hasRequisition) return false;
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

    // ✅ CORRIGÉ : preserveUrl au lieu de preserveScroll
    const handleDownloadExisting = async (document: DocumentGenere) => {
        if (isGenerating) return;
        
        setIsGenerating(true);
        try {
            const url = route('documents.recu.download', document.id);
            window.location.href = url;
            
            toast.success('Téléchargement de la réquisition en cours...');
            
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveUrl: true, // ✅ CORRIGÉ
                    onFinish: () => setIsGenerating(false)
                });
            }, 1000);
            
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            toast.error('Erreur lors du téléchargement');
            setIsGenerating(false);
        }
    };

    // ✅ CORRIGÉ : preserveUrl au lieu de preserveScroll
    const handleGenerate = () => {
        if (!reqPropriete) {
            toast.warning('Veuillez sélectionner une propriété');
            return;
        }

        if (isGenerating) {
            toast.warning('Génération en cours...');
            return;
        }

        setIsGenerating(true);

        try {
            const params = new URLSearchParams({
                id_propriete: reqPropriete,
            });

            const url = `${route('documents.requisition')}?${params.toString()}`;
            window.location.href = url;
            
            toast.success('Génération de la réquisition en cours...');
            
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveUrl: true, // ✅ CORRIGÉ
                    onSuccess: () => {
                        toast.success('Réquisition générée avec succès !');
                        setIsGenerating(false);
                    },
                    onError: () => {
                        toast.error('Erreur lors de la mise à jour');
                        setIsGenerating(false);
                    }
                });
            }, 2000);
            
        } catch (error) {
            console.error('Erreur génération réquisition:', error);
            toast.error('Erreur lors de la préparation du téléchargement');
            setIsGenerating(false);
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
                    Sélectionnez la propriété pour générer la réquisition (aucun demandeur requis)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label>Propriété</Label>
                    <Select 
                        value={reqPropriete} 
                        onValueChange={setReqPropriete}
                        disabled={isGenerating}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                            {proprietes.map((prop) => {
                                const isComplete = canGenerateRequisition(prop);
                                const hasDoc = !!prop.document_requisition;
                                
                                return (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Lot {prop.lot} - TN°{prop.titre}</span>
                                                {hasDoc && (
                                                    <Badge variant="default" className="bg-green-500">
                                                        <FileCheck className="h-3 w-3 mr-1" />
                                                        Généré
                                                    </Badge>
                                                )}
                                                {!isComplete && (
                                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                                )}
                                                <Badge variant="outline" className="ml-2">
                                                    {prop.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {prop.proprietaire} - {prop.dossier?.commune || 'Commune N/A'}
                                            </div>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* ✅ Affichage amélioré de la propriété sélectionnée */}
                {reqPropriete && selectedProprieteData && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="font-mono">
                                        Lot {selectedProprieteData.lot}
                                    </Badge>
                                    <Badge variant="outline">
                                        TN°{selectedProprieteData.titre}
                                    </Badge>
                                    <Badge variant={selectedProprieteData.type_operation === 'morcellement' ? 'default' : 'secondary'}>
                                        {selectedProprieteData.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                                    </Badge>
                                </div>
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <div><strong>Propriétaire :</strong> {selectedProprieteData.proprietaire}</div>
                                    <div><strong>Situation :</strong> {selectedProprieteData.situation}</div>
                                    <div className="text-xs mt-1 opacity-75">
                                        La réquisition sera générée automatiquement selon le type d'opération
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statut du document */}
                {reqPropriete && hasRequisition && (
                    <Alert className="bg-green-500/10 border-green-500/50">
                        <FileCheck className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-700 dark:text-green-300">
                            <div className="space-y-1">
                                <div className="font-medium">
                                    Réquisition déjà générée
                                </div>
                                <div className="text-xs opacity-75">
                                    Généré le {documentRequisition?.generated_at}
                                </div>
                                <div className="text-xs opacity-75 flex items-center gap-2">
                                    <Eye className="h-3 w-3" />
                                    Téléchargé {documentRequisition?.download_count || 0} fois
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <Separator />

                {/* Message de validation */}
                {validationMessage && !hasRequisition && (
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

                {/* Indicateur de génération */}
                {isGenerating && (
                    <Alert className="bg-blue-500/10 border-blue-500/50">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                            {hasRequisition ? 'Téléchargement en cours...' : 'Génération en cours...'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Bouton de téléchargement/génération */}
                {reqPropriete && (
                    hasRequisition ? (
                        <Button
                            onClick={() => handleDownloadExisting(documentRequisition!)}
                            className="w-full"
                            size="lg"
                            disabled={isGenerating}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger la Réquisition
                            <Badge variant="secondary" className="ml-2">
                                <Eye className="h-3 w-3 mr-1" />
                                {documentRequisition?.download_count || 0}
                            </Badge>
                        </Button>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={!canGenerate() || isGenerating}
                            className="w-full"
                            size="lg"
                        >
                            <FileOutput className="h-4 w-4 mr-2" />
                            Générer la Réquisition
                        </Button>
                    )
                )}
            </CardContent>
        </Card>
    );
}