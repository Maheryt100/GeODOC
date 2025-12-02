// documents/tabs/ActeVenteTab.tsx
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
    Lock, Receipt, Clock, Eye, Loader2, Crown, FileCheck, MapPin, Coins
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

    // Récupérer automatiquement le demandeur principal
    const demandeurPrincipal = useMemo(() => {
        if (!selectedProprieteData?.demandeurs_lies) return null;
        return getDemandeurPrincipal(selectedProprieteData.demandeurs_lies);
    }, [selectedProprieteData]);

    const consorts = useMemo(() => {
        if (!selectedProprieteData?.demandeurs_lies) return [];
        return getConsorts(selectedProprieteData.demandeurs_lies);
    }, [selectedProprieteData]);

    const isPrincipalComplete = useMemo(() => {
        if (!demandeurPrincipal) return false;
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        return demandeurData ? isDemandeurComplete(demandeurData) : false;
    }, [demandeurPrincipal, demandeurs]);

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

    // ✅ Formater la contenance
    const formatContenance = (contenance: number): string => {
        const hectares = Math.floor(contenance / 10000);
        const reste = contenance % 10000;
        const ares = Math.floor(reste / 100);
        const centiares = reste % 100;
        
        const parts = [];
        if (hectares > 0) parts.push(`${hectares}Ha`);
        if (ares > 0) parts.push(`${ares}A`);
        parts.push(`${centiares}Ca`);
        
        return parts.join(' ');
    };

    // ✅ CORRIGÉ : preserveUrl
    const handleDownloadExisting = async (document: DocumentGenere, typeName: string) => {
        if (isGenerating) return;
        
        setIsGenerating(true);
        try {
            const url = route('documents.recu.download', document.id);
            window.location.href = url;
            
            toast.success(`Téléchargement du ${typeName} en cours...`);
            
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

    // ✅ CORRIGÉ : preserveUrl
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
            
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveUrl: true, // ✅ CORRIGÉ
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
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    Acte de Vente
                </CardTitle>
                <CardDescription>
                    Le demandeur principal (ordre = 1) sera automatiquement utilisé
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Propriété</Label>
                    <Select 
                        value={selectedPropriete} 
                        onValueChange={setSelectedPropriete}
                        disabled={isGenerating}
                    >
                        <SelectTrigger className="h-auto min-h-[60px]">
                            <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                            {proprietes.map((prop) => {
                                const isComplete = isProprieteComplete(prop);
                                const principal = getDemandeurPrincipal(prop.demandeurs_lies || []);
                                const consortsList = getConsorts(prop.demandeurs_lies || []);
                                
                                return (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        <div className="flex flex-col gap-2 py-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline" className="font-mono">
                                                    Lot {prop.lot}
                                                </Badge>
                                                <Badge variant="outline">
                                                    TN°{prop.titre}
                                                </Badge>
                                                {prop.document_recu && (
                                                    <Badge variant="default" className="bg-green-500 text-xs">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Reçu
                                                    </Badge>
                                                )}
                                                {prop.document_adv && (
                                                    <Badge variant="default" className="bg-blue-500 text-xs">
                                                        <FileCheck className="h-3 w-3 mr-1" />
                                                        ADV
                                                    </Badge>
                                                )}
                                                {!isComplete && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        Incomplet
                                                    </Badge>
                                                )}
                                            </div>
                                            {principal && (
                                                <div className="text-xs text-muted-foreground space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <Crown className="h-3 w-3 text-yellow-500" />
                                                        <span className="font-medium">Principal:</span> {principal.nom} {principal.prenom}
                                                    </div>
                                                    {consortsList.length > 0 && (
                                                        <div className="flex items-center gap-1 ml-4">
                                                            <Users className="h-3 w-3" />
                                                            <span>+ {consortsList.length} consort{consortsList.length > 1 ? 's' : ''}</span>
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

                {/* ✅ Affichage amélioré de la propriété sélectionnée */}
                {selectedPropriete && selectedProprieteData && (
                    <Card className="border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
                        <CardContent className="p-4 space-y-4">
                            {/* Infos propriété */}
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-1" />
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-violet-600 text-white">
                                            Lot {selectedProprieteData.lot}
                                        </Badge>
                                        <Badge variant="outline">
                                            TN°{selectedProprieteData.titre}
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Contenance:</span>
                                            <div className="font-semibold">
                                                {formatContenance(selectedProprieteData.contenance)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Nature:</span>
                                            <div className="font-semibold capitalize">
                                                {selectedProprieteData.nature}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Propriétaire:</span>
                                        <div className="font-medium">{selectedProprieteData.proprietaire}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Hiérarchie des demandeurs */}
                            {demandeurPrincipal && (
                                <div className="pt-3 border-t border-violet-200 dark:border-violet-800">
                                    <div className="flex items-start gap-3">
                                        <Users className="h-5 w-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-1" />
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge className="bg-yellow-500 text-white">
                                                    <Crown className="h-3 w-3 mr-1" />
                                                    Principal
                                                </Badge>
                                                <span className="font-semibold">
                                                    {demandeurPrincipal.nom} {demandeurPrincipal.prenom}
                                                </span>
                                            </div>
                                            
                                            {consorts.length > 0 && (
                                                <div className="text-sm space-y-1 ml-4">
                                                    <div className="font-medium text-muted-foreground">
                                                        Consorts ({consorts.length}) :
                                                    </div>
                                                    <ul className="space-y-1">
                                                        {consorts.map((c, idx) => (
                                                            <li key={idx} className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {c.ordre}
                                                                </Badge>
                                                                <span>{c.nom} {c.prenom}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="text-xs text-muted-foreground">
                                                {consorts.length > 0 
                                                    ? `Document généré avec ${consorts.length + 1} demandeurs`
                                                    : 'Document généré avec un seul demandeur'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Prix total si disponible */}
                            {selectedProprieteData.demandeurs_lies && selectedProprieteData.demandeurs_lies.length > 0 && (
                                <div className="pt-3 border-t border-violet-200 dark:border-violet-800">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Coins className="h-4 w-4 text-violet-600" />
                                        <span className="text-muted-foreground">Prix total:</span>
                                        <span className="font-semibold">
                                            {new Intl.NumberFormat('fr-FR').format(
                                                selectedProprieteData.demandeurs_lies[0]?.total_prix || 0
                                            )} Ar
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {selectedPropriete && (
                    <>
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