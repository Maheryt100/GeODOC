// documents/Generate.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, ArrowLeft, FileText, FileCheck, FileOutput, BarChart3, CheckCircle2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { BreadcrumbItem, Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs } from './types';
import ActeVenteTab from './tabs/ActeVenteTab';
import CsfTab from './tabs/CsfTab';
import RequisitionTab from './tabs/RequisitionTab';

interface GenerateProps {
    dossier: Dossier;
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: Demandeur[];
}

export default function Generate({ dossier, proprietes, demandeurs }: GenerateProps) {
    const [activeTab, setActiveTab] = useState<'acte_vente' | 'csf' | 'requisition'>('acte_vente');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Accueil", href: "/" },
        { title: "Dossiers", href: `/dossiers/${dossier.id}` },
        { title: "Génération de documents", href: `/documents/generate/${dossier.id}` },
    ];

    // ✅ Calculer les statistiques
    const stats = {
        totalProprietes: proprietes.length,
        proprietesAvecRecu: proprietes.filter(p => p.document_recu).length,
        proprietesAvecAdv: proprietes.filter(p => p.document_adv).length,
        totalDemandeurs: demandeurs.length,
        demandeursAvecCsf: demandeurs.filter(d => (d as any).document_csf).length,
        requisitionsGenerees: proprietes.filter(p => p.document_requisition).length,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Génération de documents" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-[1400px] space-y-6">
                {/* Header avec bouton retour */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                            >
                                <Link href={route('dossiers.show', dossier.id)}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Retour au dossier
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold">Génération de documents</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">{dossier.nom_dossier}</span>
                            <span>•</span>
                            <span>{dossier.commune}</span>
                        </div>
                    </div>
                </div>

                {/* ✅ Statistiques visuelles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-violet-200 dark:border-violet-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-violet-600" />
                                Actes de Vente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.proprietesAvecAdv}</div>
                            <p className="text-xs text-muted-foreground">
                                sur {stats.totalProprietes} propriétés
                            </p>
                            {stats.proprietesAvecAdv > 0 && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {Math.round((stats.proprietesAvecAdv / stats.totalProprietes) * 100)}%
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 dark:border-green-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-green-600" />
                                Reçus de Paiement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.proprietesAvecRecu}</div>
                            <p className="text-xs text-muted-foreground">
                                sur {stats.totalProprietes} propriétés
                            </p>
                            {stats.proprietesAvecRecu > 0 && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {Math.round((stats.proprietesAvecRecu / stats.totalProprietes) * 100)}%
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 dark:border-emerald-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-emerald-600" />
                                CSF
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.demandeursAvecCsf}</div>
                            <p className="text-xs text-muted-foreground">
                                sur {stats.totalDemandeurs} demandeurs
                            </p>
                            {stats.demandeursAvecCsf > 0 && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {Math.round((stats.demandeursAvecCsf / stats.totalDemandeurs) * 100)}%
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileOutput className="h-4 w-4 text-blue-600" />
                                Réquisitions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.requisitionsGenerees}</div>
                            <p className="text-xs text-muted-foreground">
                                sur {stats.totalProprietes} propriétés
                            </p>
                            {stats.requisitionsGenerees > 0 && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {Math.round((stats.requisitionsGenerees / stats.totalProprietes) * 100)}%
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Alerte informative */}
                <Alert className="bg-blue-500/10 border-blue-500/50">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                        <div className="space-y-1">
                            <p className="font-medium">💡 Système de génération unique</p>
                            <p className="text-sm">
                                Chaque document n'est généré qu'une seule fois. Si le document existe déjà, 
                                il sera automatiquement téléchargé depuis les archives avec un compteur de téléchargements.
                            </p>
                        </div>
                    </AlertDescription>
                </Alert>

                {/* Tabs pour les documents */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-auto">
                        <TabsTrigger value="acte_vente" className="flex flex-col gap-1 py-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>Acte de Vente</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {stats.proprietesAvecAdv}/{stats.totalProprietes}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="csf" className="flex flex-col gap-1 py-3">
                            <div className="flex items-center gap-2">
                                <FileCheck className="h-4 w-4" />
                                <span>CSF</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {stats.demandeursAvecCsf}/{stats.totalDemandeurs}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="requisition" className="flex flex-col gap-1 py-3">
                            <div className="flex items-center gap-2">
                                <FileOutput className="h-4 w-4" />
                                <span>Réquisition</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {stats.requisitionsGenerees}/{stats.totalProprietes}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="acte_vente">
                            <ActeVenteTab 
                                proprietes={proprietes}
                                demandeurs={demandeurs}
                                dossier={dossier}
                            />
                        </TabsContent>

                        <TabsContent value="csf">
                            <CsfTab 
                                proprietes={proprietes}
                                demandeurs={demandeurs}
                                dossier={dossier}
                            />
                        </TabsContent>

                        <TabsContent value="requisition">
                            <RequisitionTab 
                                proprietes={proprietes}
                                dossier={dossier}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </AppLayout>
    );
}