// documents/Generate.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { 
    FileText, 
    FileCheck, 
    FileOutput, 
    Download,
    AlertCircle,
    Users,
    Info,
    Receipt,
    CheckCircle2,
    Lock,
    History,
    RotateCcw,
    Clock,
    Eye
} from 'lucide-react';
import { BreadcrumbItem, Demandeur, Dossier, Propriete } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';

interface RecuHistoryItem {
    id: number;
    numero_recu: string;
    montant: string;
    date_recu: string;
    demandeur: string;
    cree_par: string;
    cree_le: string;
    status: string;
    download_count: number;
    file_exists: boolean;
}

interface RecuPaiement {
    id: number;
    numero_recu: string;
    montant: string;
    date_recu: string;
    status: string;
    generated_by: string;
    generated_at: string;
    download_count: number;
}

interface ProprieteWithDemandeurs extends Propriete {
    demandeurs_lies: Array<{
        id: number;
        id_demande: number;
        nom: string;
        prenom: string;
        cin: string;
        status_consort: boolean;
    }>;
    has_recu?: boolean;
    dernier_recu?: RecuPaiement | null;
}

interface GenerateProps {
    dossier: Dossier;
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: Demandeur[];
}

export default function Generate({ dossier, proprietes, demandeurs }: GenerateProps) {
    const [activeTab, setActiveTab] = useState<'acte_vente' | 'csf' | 'requisition'>('acte_vente');

    // États pour Acte de Vente
    const [selectedPropriete, setSelectedPropriete] = useState<string>('');
    const [selectedDemandeur, setSelectedDemandeur] = useState<string>('');
    
    // États pour CSF
    const [csfPropriete, setCsfPropriete] = useState<string>('');
    const [csfDemandeur, setCsfDemandeur] = useState<string>('');
    
    // États pour Réquisition
    const [reqPropriete, setReqPropriete] = useState<string>('');

    // États pour l'historique
    const [showHistoryPopover, setShowHistoryPopover] = useState(false);
    const [recuHistory, setRecuHistory] = useState<RecuHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Vérifications de complétude
    const isProprieteComplete = (prop: ProprieteWithDemandeurs) => {
        return !!(prop.titre && prop.contenance && prop.proprietaire && 
                  prop.nature && prop.vocation && prop.situation);
    };

    const isDemandeurComplete = (dem: Demandeur) => {
        return !!(dem.date_naissance && dem.lieu_naissance && dem.date_delivrance && 
                  dem.lieu_delivrance && dem.domiciliation && dem.occupation && dem.nom_mere);
    };

    const canGenerate = (type: string) => {
        if (type === 'acte_vente') {
            if (!selectedPropriete || !selectedDemandeur) return false;
            const prop = proprietes.find(p => p.id === Number(selectedPropriete));
            const dem = demandeurs.find(d => d.id === Number(selectedDemandeur));
            if (!prop || !dem) return false;
            return isProprieteComplete(prop) && isDemandeurComplete(dem) && prop.has_recu;
        }
        if (type === 'csf') {
            return !!(csfPropriete && csfDemandeur);
        }
        if (type === 'requisition') {
            return !!reqPropriete;
        }
        return true;
    };

    const getWarningMessage = (type: string) => {
        if (type === 'acte_vente' && selectedPropriete && selectedDemandeur) {
            const prop = proprietes.find(p => p.id === Number(selectedPropriete));
            const dem = demandeurs.find(d => d.id === Number(selectedDemandeur));
            const propComplete = prop ? isProprieteComplete(prop) : false;
            const demComplete = dem ? isDemandeurComplete(dem) : false;
            
            if (!prop?.has_recu) {
                return "⚠️ Vous devez d'abord générer le reçu de paiement";
            }
            if (!propComplete && !demComplete) {
                return "⚠️ La propriété et le demandeur ont des données incomplètes";
            } else if (!propComplete) {
                return "⚠️ La propriété a des données incomplètes";
            } else if (!demComplete) {
                return "⚠️ Le demandeur a des données incomplètes";
            }
        }
        return null;
    };

    const getDemandeursForPropriete = (idPropriete: string) => {
        const prop = proprietes.find(p => p.id === Number(idPropriete));
        return prop?.demandeurs_lies || [];
    };

    const hasConsorts = (idPropriete: string) => {
        return getDemandeursForPropriete(idPropriete).length > 1;
    };

    /**
     * Charger l'historique des reçus
     */
    const loadRecuHistory = async (idPropriete: string) => {
        setIsLoadingHistory(true);

        try {
            const response = await axios.get(route('documents.recu.history', idPropriete));

            if (response.data.success) {
                setRecuHistory(response.data.recus);
                setShowHistoryPopover(true);
            }
        } catch (error: any) {
            console.error('Erreur chargement historique:', error);
            toast.error('Erreur lors du chargement de l\'historique');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    /**
     * Télécharger un reçu existant
     */
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

    /**
     * Construire l'URL de téléchargement
     */
    const buildDownloadUrl = (type: 'acte_vente' | 'csf' | 'requisition' | 'recu') => {
        let baseUrl: string;
        const params = new URLSearchParams();

        if (type === 'recu') {
            baseUrl = route('documents.recu');
            params.append('id_propriete', selectedPropriete);
            params.append('id_demandeur', selectedDemandeur);
        } else if (type === 'acte_vente') {
            baseUrl = route('documents.acte-vente');
            params.append('id_propriete', selectedPropriete);
            params.append('id_demandeur', selectedDemandeur);
        } else if (type === 'csf') {
            baseUrl = route('documents.csf');
            params.append('id_propriete', csfPropriete);
            params.append('id_demandeur', csfDemandeur);
        } else {
            baseUrl = route('documents.requisition');
            params.append('id_propriete', reqPropriete);
        }

        return `${baseUrl}?${params.toString()}`;
    };

    /**
     * Télécharger/Générer le document
     */
    const handleDownload = (type: 'acte_vente' | 'csf' | 'requisition' | 'recu') => {
        if (type === 'recu' && (!selectedPropriete || !selectedDemandeur)) {
            toast.warning('Veuillez sélectionner une propriété et un demandeur');
            return;
        }
        if (type === 'acte_vente' && (!selectedPropriete || !selectedDemandeur)) {
            toast.warning('Veuillez sélectionner une propriété et un demandeur');
            return;
        }
        if (type === 'csf' && (!csfPropriete || !csfDemandeur)) {
            toast.warning('Veuillez sélectionner une propriété et un demandeur');
            return;
        }
        if (type === 'requisition' && !reqPropriete) {
            toast.warning('Veuillez sélectionner une propriété');
            return;
        }

        try {
            const url = buildDownloadUrl(type);
            window.location.href = url;
            
            const messages = {
                recu: 'Téléchargement du reçu en cours...',
                acte_vente: hasConsorts(selectedPropriete) 
                    ? `Téléchargement en cours (${getDemandeursForPropriete(selectedPropriete).length} demandeurs)`
                    : 'Téléchargement de l\'acte de vente...',
                csf: 'Téléchargement du CSF en cours...',
                requisition: 'Téléchargement de la réquisition en cours...'
            };
            
            toast.success(messages[type]);
            
            // Recharger après génération du reçu
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Accueil", href: "/" },
        { title: "Dossiers", href: `/dossiers/${dossier.id}` },
        { title: "Génération de documents", href: `/documents/generate/${dossier.id}` },
    ];

    const selectedProprieteData = proprietes.find(p => p.id === Number(selectedPropriete));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Génération de documents" />
            <Toaster position="top-right" />

            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Génération de documents</h1>
                    <p className="text-muted-foreground mt-2">
                        Dossier: {dossier.nom_dossier} - {dossier.commune}
                    </p>
                </div>

                <Alert className="mb-6 bg-blue-500/10 border-blue-500/50">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                        <strong>💡 Nouveau :</strong> Chaque document n'est généré qu'une seule fois. 
                        Si le document existe déjà, il sera automatiquement téléchargé depuis les archives.
                    </AlertDescription>
                </Alert>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="acte_vente" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Acte de Vente
                        </TabsTrigger>
                        <TabsTrigger value="csf" className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4" />
                            CSF
                        </TabsTrigger>
                        <TabsTrigger value="requisition" className="flex items-center gap-2">
                            <FileOutput className="h-4 w-4" />
                            Réquisition
                        </TabsTrigger>
                    </TabsList>

                    {/* ACTE DE VENTE */}
                    <TabsContent value="acte_vente">
                        <Card>
                            <CardHeader>
                                <CardTitle>Acte de Vente</CardTitle>
                                <CardDescription>
                                    Sélectionnez la propriété et le demandeur
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                        {/* Statut du reçu avec historique et compteur */}
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

                                {getWarningMessage('acte_vente') && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{getWarningMessage('acte_vente')}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Bouton reçu si nécessaire */}
                                {selectedPropriete && selectedDemandeur && !selectedProprieteData?.has_recu && (
                                    <Button
                                        onClick={() => handleDownload('recu')}
                                        className="w-full"
                                        size="lg"
                                        variant="outline"
                                    >
                                        <Receipt className="h-4 w-4 mr-2" />
                                        Générer le Reçu de Paiement
                                    </Button>
                                )}

                                {/* Bouton ADV */}
                                <Button
                                    onClick={() => handleDownload('acte_vente')}
                                    disabled={!canGenerate('acte_vente')}
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
                    </TabsContent>

                    {/* CSF */}
                    <TabsContent value="csf">
                        <Card>
                            <CardHeader>
                                <CardTitle>Certificat de Situation Financière</CardTitle>
                                <CardDescription>
                                    Sélectionnez la propriété et le demandeur
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Propriété</Label>
                                    <Select value={csfPropriete} onValueChange={setCsfPropriete}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une propriété" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {proprietes.map((prop) => (
                                                <SelectItem key={prop.id} value={String(prop.id)}>
                                                    Lot {prop.lot} - TN°{prop.titre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Demandeur</Label>
                                    <Select value={csfDemandeur} onValueChange={setCsfDemandeur}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un demandeur" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {demandeurs.map((dem) => (
                                                <SelectItem key={dem.id} value={String(dem.id)}>
                                                    {dem.nom_demandeur} {dem.prenom_demandeur}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <Alert>
                                    <FileCheck className="h-4 w-4" />
                                    <AlertDescription>
                                        Le Certificat de Situation Financière certifie que le demandeur n'est redevable
                                        d'aucune somme et a versé le cautionnement réglementaire.
                                    </AlertDescription>
                                </Alert>

                                <Button
                                    onClick={() => handleDownload('csf')}
                                    disabled={!canGenerate('csf')}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger le CSF
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* REQUISITION */}
                    <TabsContent value="requisition">
                        <Card>
                            <CardHeader>
                                <CardTitle>Réquisition</CardTitle>
                                <CardDescription>
                                    Sélectionnez la propriété pour générer la réquisition
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Propriété</Label>
                                    <Select value={reqPropriete} onValueChange={setReqPropriete}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une propriété" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {proprietes.map((prop) => (
                                                <SelectItem key={prop.id} value={String(prop.id)}>
                                                    <div className="flex flex-col">
                                                        <span>Lot {prop.lot} - TN°{prop.titre}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Type: {prop.type_operation}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {reqPropriete && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Type:{' '}
                                            {proprietes.find(p => p.id === Number(reqPropriete))?.type_operation === 'morcellement'
                                                ? 'Morcellement'
                                                : 'Immatriculation'}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Separator />

                                <Alert>
                                    <FileOutput className="h-4 w-4" />
                                    <AlertDescription>
                                        La réquisition demande au Conservateur de la Propriété Foncière de procéder à
                                        l'immatriculation ou au morcellement d'un terrain.
                                    </AlertDescription>
                                </Alert>

                                <Button
                                    onClick={() => handleDownload('requisition')}
                                    disabled={!canGenerate('requisition')}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger la Réquisition
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}