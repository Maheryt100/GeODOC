// pages/proprietes/update.tsx
// Page de modification de propriété - Réutilise ProprieteCreate.tsx

import { useState } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast, Toaster } from 'sonner';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { BreadcrumbItem, Dossier, Propriete } from '@/types';

import ProprieteCreate, { ProprieteFormData } from '@/pages/proprietes/create';

interface PageProps {
    propriete: Propriete;
    dossier: Dossier;
    [key: string]: any;
}

export default function ProprieteUpdate() {
    const { propriete, dossier } = usePage<PageProps>().props;
    const [processing, setProcessing] = useState(false);
    const [selectedCharges, setSelectedCharges] = useState<string[]>(
        propriete?.charge ? propriete.charge.split(', ').map(c => c.trim()) : []
    );

    const { data, setData, put, errors } = useForm<ProprieteFormData>({
        lot: propriete?.lot || '',
        type_operation: propriete?.type_operation || 'immatriculation',
        nature: propriete?.nature || '',
        vocation: propriete?.vocation || '',
        proprietaire: propriete?.proprietaire || '',
        situation: propriete?.situation || '',
        propriete_mere: propriete?.propriete_mere || '',
        titre_mere: propriete?.titre_mere || '',
        titre: propriete?.titre || '',
        contenance: propriete?.contenance?.toString() || '',
        charge: propriete?.charge || '',
        numero_FN: propriete?.numero_FN || '',
        numero_requisition: propriete?.numero_requisition || '',
        date_requisition: propriete?.date_requisition || '',
        date_inscription: propriete?.date_inscription || '',
        dep_vol: propriete?.dep_vol || '',
        numero_dep_vol: propriete?.numero_dep_vol || '',
        id_dossier: dossier?.id || 0,
        
    });

    const isArchived = propriete?.is_archived === true;
    const isClosed = dossier?.is_closed === true;
    const isDisabled = isArchived || isClosed;

    const handleChargeChange = (charge: string, checked: boolean) => {
        let newCharges: string[];
        
        if (checked) {
            if (charge === "Aucune") {
                newCharges = ["Aucune"];
            } else {
                newCharges = selectedCharges.filter(c => c !== "Aucune");
                newCharges = [...newCharges, charge];
            }
        } else {
            newCharges = selectedCharges.filter(c => c !== charge);
        }
        
        setSelectedCharges(newCharges);
        setData('charge', newCharges.join(', '));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation de base
        if (!data.lot?.trim()) {
            toast.error('Le lot est obligatoire');
            return;
        }
        if (!data.type_operation) {
            toast.error('Le type d\'opération est obligatoire');
            return;
        }
        if (!data.nature) {
            toast.error('La nature est obligatoire');
            return;
        }
        if (!data.vocation) {
            toast.error('La vocation est obligatoire');
            return;
        }

        setProcessing(true);

        put(route('proprietes.update', propriete.id), {
            onError: (errors) => {
                console.error('Erreurs de validation:', errors);
                const errorMessages = Object.entries(errors)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join('\n');
                toast.error('Erreur de validation', { description: errorMessages });
                setProcessing(false);
            },
            onSuccess: () => {
                toast.success('Propriété modifiée avec succès !');
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: `Modifier Lot ${propriete.lot}`, href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier Lot ${propriete.lot}`} />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <Button asChild variant="ghost" size="sm" className="mb-4">
                        <Link href={route('dossiers.show', dossier.id)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour au dossier
                        </Link>
                    </Button>
                    
                    <h1 className="text-3xl font-bold">Modifier Lot {propriete.lot}</h1>
                    <p className="text-muted-foreground mt-2">
                        Dossier: {dossier.nom_dossier}
                    </p>
                </div>

                {/* Alertes */}
                {isDisabled && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            {isClosed && 'Ce dossier est fermé. Aucune modification n\'est possible.'}
                            {isArchived && 'Cette propriété est archivée (acquise). Aucune modification n\'est possible.'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Formulaire */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de la propriété</CardTitle>
                        <CardDescription>
                            Modifiez les informations ci-dessous et cliquez sur "Enregistrer les modifications"
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <ProprieteCreate
                                data={data}
                                onChange={(field, value) => setData(field, value)}
                                index={0}
                                showRemoveButton={false}
                                selectedCharges={selectedCharges}
                                onChargeChange={handleChargeChange}
                            />

                            {/* Messages d'erreur globaux */}
                            {Object.keys(errors).length > 0 && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        Veuillez corriger les erreurs ci-dessus
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4 justify-end pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    disabled={processing}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || isDisabled}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}