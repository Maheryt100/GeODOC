import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    FileText, Download, AlertCircle, Users, CheckCircle2, 
    Lock, Receipt, Clock, Eye, Loader2, Crown, FileCheck
} from 'lucide-react';
import { Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs, DocumentGenere } from '../types';
import { 
    isProprieteComplete, 
    isDemandeurComplete, 
    getValidationMessage,
    getDemandeurPrincipal,
    getConsorts
} from '../validation';

interface ActeVenteTabProps {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: Demandeur[];
    dossier: Dossier;
}

export default function ActeVenteTab({ proprietes, demandeurs, dossier }: ActeVenteTabProps) {
    const [selectedPropriete, setSelectedPropriete] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const selectedProprieteData = proprietes.find(p => p.id === Number(selectedPropriete));

    // ✅ Récupérer automatiquement le demandeur principal
    const demandeurPrincipal = useMemo(() => {
        if (!selectedProprieteData?.demandeurs_lies) return null;
        return getDemandeurPrincipal(selectedProprieteData.demandeurs_lies);
    }, [selectedProprieteData]);

    // ✅ Récupérer les consorts
    const consorts = useMemo(() => {
        if (!selectedProprieteData?.demandeurs_lies) return [];
        return getConsorts(selectedProprieteData.demandeurs_lies);
    }, [selectedProprieteData]);

    // ✅ Vérifier si le principal est complet
    const isPrincipalComplete = useMemo(() => {
        if (!demandeurPrincipal) return false;
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        return demandeurData ? isDemandeurComplete(demandeurData) : false;
    }, [demandeurPrincipal, demandeurs]);

    // ✅ NOUVEAU : Vérifier l'existence des documents
    const documentRecu = selectedProprieteData?.document_recu;
    const documentAdv = selectedProprieteData?.document_adv;
    const hasRecu = !!documentRecu;
    const hasAdv = !!documentAdv;

    const canGenerateRecu = () => {
        if (!selectedPropriete || !demandeurPrincipal || hasRecu) return false;
        const prop = selectedProprieteData;
        if (!prop) return false;
        return isProprieteComplete(prop) && isPrincipalComplete;
    };

    const canGenerateActeVente = () => {
        if (!selectedPropriete || !demandeurPrincipal || hasAdv) return false;
        const prop = selectedProprieteData;
        if (!prop) return false;
        return isProprieteComplete(prop) && isPrincipalComplete && hasRecu;
    };

    const validationMessage = getValidationMessage(
        selectedProprieteData || null,
        demandeurs,
        'acte_vente'
    );

    // ✅ NOUVEAU : Télécharger un document existant
    const handleDownloadExisting = async (document: DocumentGenere, typeName: string) => {
        if (isGenerating) return;
        
        setIsGenerating(true);
        try {
            const url = route('documents.recu.download', document.id);
            window.location.href = url;
            
            toast.success(`Téléchargement du ${typeName} en cours...`);
            
            // Rafraîchir pour mettre à jour le compteur
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveScroll: true,
                    onFinish: () => setIsGenerating(false)
                });
            }, 1000);
            
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            toast.error('Erreur lors du téléchargement');
            setIsGenerating(false);
        }
    };

    // ✅ NOUVEAU : Générer un nouveau document
    const handleGenerate = async (type: 'recu' | 'acte_vente') => {
        if (!selectedPropriete || !demandeurPrincipal) {
            toast.warning('Sélection incomplète');
            return;
        }

        if (isGenerating) {
            toast.warning('Génération en cours, veuillez patienter...');
            return;
        }

        setIsGenerating(true);

        try {
            const params = new URLSearchParams({
                id_propriete: selectedPropriete,
                id_demandeur: String(demandeurPrincipal.id),
            });

            const baseUrl = type === 'recu' 
                ? route('documents.recu')
                : route('documents.acte-vente');
            
            const url = `${baseUrl}?${params.toString()}`;
            
            const messages = {
                recu: 'Génération du reçu en cours...',
                acte_vente: consorts.length > 0
                    ? `Génération ADV avec ${consorts.length + 1} demandeurs`
                    : 'Génération de l\'acte de vente...',
            };
            
            toast.success(messages[type]);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.href = url;
            
            // Rafraîchir après génération
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success(`${type === 'recu' ? 'Reçu' : 'Acte de vente'} généré avec succès !`);
                        setIsGenerating(false);
                    },
                    onError: () => {
                        toast.error('Erreur lors de la mise à jour');
                        setIsGenerating(false);
                    }
                });
            }, 2000);
            
        } catch (error) {
            console.error('Erreur génération:', error);
            toast.error('Erreur lors de la préparation du téléchargement');
            setIsGenerating(false);
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
                    Le demandeur principal (ordre = 1) sera automatiquement utilisé
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label>Propriété</Label>
                    <Select 
                        value={selectedPropriete} 
                        onValueChange={setSelectedPropriete}
                        disabled={isGenerating}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                            {proprietes.map((prop) => {
                                const isComplete = isProprieteComplete(prop);
                                const principal = getDemandeurPrincipal(prop.demandeurs_lies || []);
                                const consortsList = getConsorts(prop.demandeurs_lies || []);
                                
                                return (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Lot {prop.lot} - TN°{prop.titre}</span>
                                                {prop.document_recu && (
                                                    <Badge variant="default" className="bg-green-500">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Reçu
                                                    </Badge>
                                                )}
                                                {prop.document_adv && (
                                                    <Badge variant="default" className="bg-blue-500">
                                                        <FileCheck className="h-3 w-3 mr-1" />
                                                        ADV
                                                    </Badge>
                                                )}
                                                {!isComplete && (
                                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                                )}
                                            </div>
                                            {principal && (
                                                <div className="text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Crown className="h-3 w-3" />
                                                        Principal: {principal.nom} {principal.prenom}
                                                    </div>
                                                    {consortsList.length > 0 && (
                                                        <div className="ml-4">
                                                            Consorts: {consortsList.map(c => `${c.nom} ${c.prenom}`).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
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
                        {/* Affichage de la hiérarchie */}
                        {demandeurPrincipal && (
                            <Alert className="bg-blue-500/10 border-blue-500/50">
                                <Crown className="h-4 w-4 text-blue-500" />
                                <AlertDescription className="text-blue-700 dark:text-blue-300">
                                    <div className="space-y-2">
                                        <div className="font-semibold">
                                            Demandeur principal : {demandeurPrincipal.nom} {demandeurPrincipal.prenom}
                                        </div>
                                        {consorts.length > 0 && (
                                            <div className="text-sm">
                                                <div className="font-medium mb-1">Consorts ({consorts.length}) :</div>
                                                <ul className="list-disc list-inside">
                                                    {consorts.map((c, idx) => (
                                                        <li key={idx}>
                                                            {c.nom} {c.prenom} (ordre {c.ordre})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="text-xs opacity-75">
                                            Le document sera généré automatiquement avec cette hiérarchie
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Statut du reçu */}
                        {!hasRecu ? (
                            <Alert className="bg-amber-500/10 border-amber-500/50">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <AlertDescription className="text-amber-700 dark:text-amber-300">
                                    <strong>Étape obligatoire :</strong> Générer d'abord le reçu de paiement
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-green-500/10 border-green-500/50">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-700 dark:text-green-300">
                                    <div className="space-y-1">
                                        <div className="font-medium">
                                            Reçu N°{documentRecu?.numero_document} confirmé
                                        </div>
                                        <div className="text-xs opacity-75 flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            Généré le {documentRecu?.generated_at}
                                        </div>
                                        <div className="text-xs opacity-75 flex items-center gap-2">
                                            <Eye className="h-3 w-3" />
                                            Téléchargé {documentRecu?.download_count || 0} fois
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Statut ADV */}
                        {hasAdv && (
                            <Alert className="bg-blue-500/10 border-blue-500/50">
                                <FileCheck className="h-4 w-4 text-blue-500" />
                                <AlertDescription className="text-blue-700 dark:text-blue-300">
                                    <div className="space-y-1">
                                        <div className="font-medium">
                                            Acte de vente déjà généré
                                        </div>
                                        <div className="text-xs opacity-75 flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            Généré le {documentAdv?.generated_at}
                                        </div>
                                        <div className="text-xs opacity-75 flex items-center gap-2">
                                            <Eye className="h-3 w-3" />
                                            Téléchargé {documentAdv?.download_count || 0} fois
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                )}

                <Separator />

                {/* Messages de validation */}
                {validationMessage && !hasRecu && !hasAdv && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Indicateur de génération */}
                {isGenerating && (
                    <Alert className="bg-blue-500/10 border-blue-500/50">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                            {hasRecu || hasAdv ? 'Téléchargement en cours...' : 'Génération en cours...'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Boutons d'action */}
                {selectedPropriete && demandeurPrincipal && (
                    <div className="space-y-3">
                        {/* Bouton Reçu */}
                        {hasRecu ? (
                            <Button
                                onClick={() => handleDownloadExisting(documentRecu!, 'reçu')}
                                className="w-full"
                                size="lg"
                                variant="outline"
                                disabled={isGenerating}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger le Reçu
                                <Badge variant="secondary" className="ml-2">
                                    <Eye className="h-3 w-3 mr-1" />
                                    {documentRecu?.download_count || 0}
                                </Badge>
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleGenerate('recu')}
                                className="w-full"
                                size="lg"
                                variant="outline"
                                disabled={!canGenerateRecu() || isGenerating}
                            >
                                <Receipt className="h-4 w-4 mr-2" />
                                Générer le Reçu de Paiement
                            </Button>
                        )}

                        {/* Bouton ADV */}
                        {hasAdv ? (
                            <Button
                                onClick={() => handleDownloadExisting(documentAdv!, 'acte de vente')}
                                className="w-full"
                                size="lg"
                                disabled={isGenerating}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger l'Acte de Vente
                                <Badge variant="secondary" className="ml-2">
                                    <Eye className="h-3 w-3 mr-1" />
                                    {documentAdv?.download_count || 0}
                                </Badge>
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleGenerate('acte_vente')}
                                disabled={!canGenerateActeVente() || isGenerating}
                                className="w-full"
                                size="lg"
                            >
                                {!hasRecu ? (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Reçu requis pour continuer
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Générer l'Acte de Vente
                                        {consorts.length > 0 && ` (${consorts.length + 1} demandeurs)`}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}