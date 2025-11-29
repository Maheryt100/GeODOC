// documents/Generate.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ArrowLeft } from 'lucide-react';
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Génération de documents" />
            <Toaster position="top-right" />

            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
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
                        <TabsTrigger value="acte_vente">Acte de Vente</TabsTrigger>
                        <TabsTrigger value="csf">CSF</TabsTrigger>
                        <TabsTrigger value="requisition">Réquisition</TabsTrigger>
                    </TabsList>

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
                </Tabs>
            </div>
        </AppLayout>
    );
}