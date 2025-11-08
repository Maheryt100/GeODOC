import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
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
    Info
} from 'lucide-react';
import { BreadcrumbItem, Demandeur, Dossier, Propriete } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ProprieteWithDemandeurs extends Propriete {
    demandeurs_lies: Array<{
        id: number;
        id_demande: number;
        nom: string;
        prenom: string;
        cin: string;
        status_consort: boolean;
    }>;
}

interface GenerateProps {
    dossier: Dossier;
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: Demandeur[];
}

export default function Generate({ dossier, proprietes, demandeurs }: GenerateProps) {
    const [activeTab, setActiveTab] = useState<'acte_vente' | 'csf' | 'requisition'>('acte_vente');

    const [selectedPropriete, setSelectedPropriete] = useState<string>('');
    const [selectedDemandeur, setSelectedDemandeur] = useState<string>('');
    const [csfPropriete, setCsfPropriete] = useState<string>('');
    const [csfDemandeur, setCsfDemandeur] = useState<string>('');
    const [reqPropriete, setReqPropriete] = useState<string>('');

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
            return isProprieteComplete(prop) && isDemandeurComplete(dem);
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
     * Construire l'URL de téléchargement avec les paramètres
     */
    const buildDownloadUrl = (type: 'acte_vente' | 'csf' | 'requisition') => {
        const baseUrl = route(`documents.generate.${type === 'acte_vente' ? 'acte' : type}`);
        const params = new URLSearchParams();

        if (type === 'acte_vente') {
            params.append('id_propriete', selectedPropriete);
            params.append('id_demandeur', selectedDemandeur);
        } else if (type === 'csf') {
            params.append('id_propriete', csfPropriete);
            params.append('id_demandeur', csfDemandeur);
        } else if (type === 'requisition') {
            params.append('id_propriete', reqPropriete);
        }

        return `${baseUrl}?${params.toString()}`;
    };

    /**
     * Télécharger le document
     */
    const handleDownload = (type: 'acte_vente' | 'csf' | 'requisition') => {
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

        const url = buildDownloadUrl(type);
        
        // Ouvrir dans une nouvelle fenêtre pour télécharger
        window.location.href = url;
        
        // Message de confirmation
        const messages = {
            acte_vente: hasConsorts(selectedPropriete) 
                ? `Téléchargement en cours (${getDemandeursForPropriete(selectedPropriete).length} demandeurs)`
                : 'Téléchargement de l\'acte de vente en cours',
            csf: 'Téléchargement du CSF en cours',
            requisition: 'Téléchargement de la réquisition en cours'
        };
        
        toast.success(messages[type]);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Accueil", href: "/" },
        { title: "Dossiers", href: `/dossiers/${dossier.id}` },
        { title: "Génération de documents", href: `/dossiers/${dossier.id}/documents/generate` },
    ];

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

                {/* Info sur le téléchargement */}
                <Alert className="mb-6 bg-blue-500/10 border-blue-500/50">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                        <strong>Information :</strong> Les documents seront téléchargés automatiquement dans votre dossier "Téléchargements".
                        <br />
                        <span className="text-xs mt-1 block">
                            💡 Astuce : Pour choisir l'emplacement à chaque fois, configurez votre navigateur : 
                            Paramètres → Téléchargements → "Demander où enregistrer chaque fichier"
                        </span>
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
                                    Sélectionnez la propriété et le demandeur pour générer l'acte de vente
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
                                                            {nbDemandeurs > 1 && (
                                                                <Badge variant="outline" className="ml-2">
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
                                        {hasConsorts(selectedPropriete) && (
                                            <Alert className="bg-blue-500/10 border-blue-500/50">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                <AlertDescription className="text-blue-700 dark:text-blue-300">
                                                    Cette propriété a {getDemandeursForPropriete(selectedPropriete).length} demandeurs.
                                                    Le document généré inclura automatiquement tous les demandeurs (avec consorts).
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

                                <Button
                                    onClick={() => handleDownload('acte_vente')}
                                    disabled={!canGenerate('acte_vente')}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger l'Acte de Vente
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