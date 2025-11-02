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
    Eye,
    Loader2,
    CheckCircle2,
    AlertCircle
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
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    // États pour Acte de Vente
    const [selectedPropriete, setSelectedPropriete] = useState<string>('');
    const [selectedDemandeur, setSelectedDemandeur] = useState<string>('');
    const [selectedDemande, setSelectedDemande] = useState<number | null>(null);

    // États pour CSF
    const [csfPropriete, setCsfPropriete] = useState<string>('');
    const [csfDemandeur, setCsfDemandeur] = useState<string>('');

    // États pour Réquisition
    const [reqPropriete, setReqPropriete] = useState<string>('');

    // Vérifier si les données sont complètes
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

    // Filtrer les demandeurs liés à la propriété sélectionnée
    const getDemandeursForPropriete = (idPropriete: string) => {
        const prop = proprietes.find(p => p.id === Number(idPropriete));
        return prop?.demandeurs_lies || [];
    };

    const handlePreview = async (type: string) => {
        let data: any = { type };

        if (type === 'acte_vente') {
            if (!selectedPropriete || !selectedDemandeur) {
                toast.warning('Veuillez sélectionner une propriété et un demandeur');
                return;
            }
            data.id_propriete = selectedPropriete;
            data.id_demandeur = selectedDemandeur;
        } else if (type === 'csf') {
            if (!csfPropriete || !csfDemandeur) {
                toast.warning('Veuillez sélectionner une propriété et un demandeur');
                return;
            }
            data.id_propriete = csfPropriete;
            data.id_demandeur = csfDemandeur;
        } else if (type === 'requisition') {
            if (!reqPropriete) {
                toast.warning('Veuillez sélectionner une propriété');
                return;
            }
            data.id_propriete = reqPropriete;
        }

        setLoading(true);
        try {
            // ✅ Utiliser fetch au lieu d'axios
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch(route('documents.preview'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                setPreviewData(result);
                toast.success('Prévisualisation chargée');
            } else {
                const error = await response.json();
                console.error('Erreur serveur:', error);
                toast.error(error.error || 'Erreur lors de la prévisualisation');
            }
        } catch (error) {
            console.error('Erreur fetch:', error);
            toast.error('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = (type: string) => {
        if (type === 'acte_vente') {
            if (!selectedPropriete || !selectedDemandeur) {
                toast.warning('Veuillez sélectionner une propriété et un demandeur');
                return;
            }
            setLoading(true);
            router.post(
                route('documents.generate.acte'),
                { 
                    id_propriete: selectedPropriete,
                    id_demandeur: selectedDemandeur 
                },
                {
                    onSuccess: () => {
                        toast.success('Acte de vente généré avec succès');
                        setLoading(false);
                    },
                    onError: (errors) => {
                        toast.error('Erreur lors de la génération');
                        console.error(errors);
                        setLoading(false);
                    },
                }
            );
        } else if (type === 'csf') {
            if (!csfPropriete || !csfDemandeur) {
                toast.warning('Veuillez sélectionner une propriété et un demandeur');
                return;
            }
            setLoading(true);
            router.post(
                route('documents.generate.csf'),
                { id_propriete: csfPropriete, id_demandeur: csfDemandeur },
                {
                    onSuccess: () => {
                        toast.success('CSF généré avec succès');
                        setLoading(false);
                    },
                    onError: (errors) => {
                        toast.error('Erreur lors de la génération');
                        console.error(errors);
                        setLoading(false);
                    },
                }
            );
        } else if (type === 'requisition') {
            if (!reqPropriete) {
                toast.warning('Veuillez sélectionner une propriété');
                return;
            }
            setLoading(true);
            router.post(
                route('documents.generate.requisition'),
                { id_propriete: reqPropriete },
                {
                    onSuccess: () => {
                        toast.success('Réquisition générée avec succès');
                        setLoading(false);
                    },
                    onError: (errors) => {
                        toast.error('Erreur lors de la génération');
                        console.error(errors);
                        setLoading(false);
                    },
                }
            );
        }
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
                    <h1 className="text-3xl font-bold text-foreground">
                        Génération de documents
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Dossier: {dossier.nom_dossier} - {dossier.commune}
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="acte_vente" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Acte de Vente
                        </TabsTrigger>
                        <TabsTrigger value="csf" className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4" />
                            Certificat Situation Financière
                        </TabsTrigger>
                        <TabsTrigger value="requisition" className="flex items-center gap-2">
                            <FileOutput className="h-4 w-4" />
                            Réquisition
                        </TabsTrigger>
                    </TabsList>

                    {/* ACTE DE VENTE */}
                    <TabsContent value="acte_vente">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle>Sélection</CardTitle>
                                    <CardDescription>
                                        Choisissez la propriété et le demandeur pour générer l'acte de vente
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Propriété</Label>
                                        <Select
                                            value={selectedPropriete}
                                            onValueChange={(value) => {
                                                setSelectedPropriete(value);
                                                setSelectedDemandeur('');
                                                setSelectedDemande(null);
                                                setPreviewData(null);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner une propriété" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {proprietes.map((prop) => {
                                                    const isComplete = isProprieteComplete(prop);
                                                    return (
                                                        <SelectItem key={prop.id} value={String(prop.id)}>
                                                            <div className="flex items-center gap-2">
                                                                <span>Lot {prop.lot} - TN°{prop.titre} ({prop.type_operation})</span>
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
                                        <div className="space-y-2">
                                            <Label>Demandeur</Label>
                                            <Select
                                                value={selectedDemandeur}
                                                onValueChange={(value) => {
                                                    setSelectedDemandeur(value);
                                                    const demandeurs = getDemandeursForPropriete(selectedPropriete);
                                                    const dem = demandeurs.find(d => d.id === Number(value));
                                                    setSelectedDemande(dem?.id_demande || null);
                                                    setPreviewData(null);
                                                }}
                                            >
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
                                                                    {dem.status_consort && (
                                                                        <Badge variant="secondary" className="ml-2">
                                                                            Avec consort
                                                                        </Badge>
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

                                    {getWarningMessage('acte_vente') && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {getWarningMessage('acte_vente')}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handlePreview('acte_vente')}
                                            disabled={!selectedPropriete || !selectedDemandeur || loading}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Eye className="h-4 w-4 mr-2" />
                                            )}
                                            Prévisualiser
                                        </Button>
                                        <Button
                                            onClick={() => handleGenerate('acte_vente')}
                                            disabled={!canGenerate('acte_vente') || loading}
                                            className="flex-1"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Download className="h-4 w-4 mr-2" />
                                            )}
                                            Générer
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle>Prévisualisation</CardTitle>
                                    <CardDescription>
                                        Vérifiez les informations avant de générer le document
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {previewData ? (
                                        <div className="space-y-4 text-sm">
                                            <Alert className="bg-green-500/10 border-green-500/50">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                <AlertDescription className="text-green-700 dark:text-green-300">
                                                    Données prêtes pour la génération
                                                </AlertDescription>
                                            </Alert>

                                            <div className="space-y-3">
                                                <div>
                                                    <p className="font-semibold text-foreground">Demandeur</p>
                                                    <p className="text-muted-foreground">
                                                        {previewData.demandeur.titre_demandeur} {previewData.demandeur.nom_demandeur}{' '}
                                                        {previewData.demandeur.prenom_demandeur}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        CIN: {previewData.demandeur.cin}
                                                    </p>
                                                </div>

                                                <Separator />

                                                <div>
                                                    <p className="font-semibold text-foreground">Propriété</p>
                                                    <p className="text-muted-foreground">
                                                        {previewData.propriete.proprietaire} - TN°{previewData.propriete.titre}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Type: {previewData.propriete.type_operation}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Superficie: {previewData.propriete.contenance} m²
                                                    </p>
                                                </div>

                                                <Separator />

                                                <div>
                                                    <p className="font-semibold text-foreground">Prix</p>
                                                    <p className="text-lg font-bold text-primary">
                                                        {previewData.prix_total?.toLocaleString()} Ar
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {previewData.prix?.toLocaleString()} Ar/m²
                                                    </p>
                                                </div>

                                                {previewData.status_consort && (
                                                    <Alert>
                                                        <AlertDescription>
                                                            Ce document inclura les consorts
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                            <p>Sélectionnez une propriété et un demandeur</p>
                                            <p className="text-sm">puis cliquez sur "Prévisualiser"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* CSF */}
                    <TabsContent value="csf">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-border">
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

                                    <Button
                                        onClick={() => handleGenerate('csf')}
                                        disabled={!csfPropriete || !csfDemandeur || loading}
                                        className="w-full"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Générer le CSF
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle>Informations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Alert>
                                        <FileCheck className="h-4 w-4" />
                                        <AlertDescription>
                                            Le Certificat de Situation Financière certifie que le demandeur n'est redevable
                                            d'aucune somme et a versé le cautionnement réglementaire.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* REQUISITION */}
                    <TabsContent value="requisition">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-border">
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
                                            <AlertDescription>
                                                Type:{' '}
                                                {proprietes.find(p => p.id === Number(reqPropriete))?.type_operation ===
                                                'morcellement'
                                                    ? 'Morcellement'
                                                    : 'Immatriculation'}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Separator />

                                    <Button
                                        onClick={() => handleGenerate('requisition')}
                                        disabled={!reqPropriete || loading}
                                        className="w-full"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Générer la Réquisition
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle>Informations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Alert>
                                        <FileOutput className="h-4 w-4" />
                                        <AlertDescription>
                                            La réquisition demande au Conservateur de la Propriété Foncière de procéder à
                                            l'immatriculation ou au morcellement d'un terrain.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}