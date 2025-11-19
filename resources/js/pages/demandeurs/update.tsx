// pages/demandeurs/update.tsx
// Page de modification de demandeur - Réutilise DemandeurCreate.tsx

import { useState } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast, Toaster } from 'sonner';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { BreadcrumbItem, Dossier, Demandeur } from '@/types';

import DemandeurCreate, { DemandeurFormData } from '@/pages/demandeurs/create';

interface PageProps {
    demandeur: Demandeur;
    dossier: Dossier;
    [key: string]: any;
}

export default function DemandeurUpdate() {
    const { demandeur, dossier } = usePage<PageProps>().props;
    const [processing, setProcessing] = useState(false);

     const { data, setData, put, errors } = useForm<DemandeurFormData>({
        titre_demandeur: demandeur?.titre_demandeur || '',
        nom_demandeur: demandeur?.nom_demandeur || '',
        prenom_demandeur: demandeur?.prenom_demandeur || '',
        date_naissance: demandeur?.date_naissance || '',
        lieu_naissance: demandeur?.lieu_naissance || '',
        sexe: demandeur?.sexe || '',
        occupation: demandeur?.occupation || '',
        nom_pere: demandeur?.nom_pere || '',
        nom_mere: demandeur?.nom_mere || '',
        cin: demandeur?.cin || '',
        date_delivrance: demandeur?.date_delivrance || '',
        lieu_delivrance: demandeur?.lieu_delivrance || '',
        date_delivrance_duplicata: demandeur?.date_delivrance_duplicata || '',
        lieu_delivrance_duplicata: demandeur?.lieu_delivrance_duplicata || '',
        domiciliation: demandeur?.domiciliation || '',
        situation_familiale: demandeur?.situation_familiale || '',
        regime_matrimoniale: demandeur?.regime_matrimoniale || '',
        date_mariage: demandeur?.date_mariage || '',
        lieu_mariage: demandeur?.lieu_mariage || '',
        marie_a: demandeur?.marie_a || '',
        telephone: demandeur?.telephone || '',
        nationalite: demandeur?.nationalite || 'Malagasy',
        id_dossier: dossier?.id || 0, // ✅ AJOUT : inclure l'ID du dossier
    });

    const isClosed = dossier?.is_closed === true;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation de base
        if (!data.titre_demandeur?.trim()) {
            toast.error('Le titre de civilité est obligatoire');
            return;
        }
        if (!data.nom_demandeur?.trim()) {
            toast.error('Le nom est obligatoire');
            return;
        }
        if (!data.prenom_demandeur?.trim()) {
            toast.error('Le prénom est obligatoire');
            return;
        }
        if (!data.date_naissance) {
            toast.error('La date de naissance est obligatoire');
            return;
        }
        if (!data.cin) {
            toast.error('Le CIN est obligatoire');
            return;
        }
        if (!/^\d{12}$/.test(data.cin)) {
            toast.error('Le CIN doit contenir exactement 12 chiffres');
            return;
        }

        setProcessing(true);

        put(route('demandeurs.update', demandeur.id), {
            onError: (errors) => {
                console.error('Erreurs de validation:', errors);
                const errorMessages = Object.entries(errors)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join('\n');
                toast.error('Erreur de validation', { description: errorMessages });
                setProcessing(false);
            },
            onSuccess: () => {
                toast.success('Demandeur modifié avec succès !');
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: `Modifier ${demandeur.titre_demandeur} ${demandeur.nom_demandeur}`, href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${demandeur.titre_demandeur} ${demandeur.nom_demandeur}`} />
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
                    
                    <h1 className="text-3xl font-bold">
                        Modifier {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Dossier: {dossier.nom_dossier}
                    </p>
                </div>

                {/* Alerte */}
                {isClosed && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Ce dossier est fermé. Aucune modification n'est possible.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Formulaire */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations du demandeur</CardTitle>
                        <CardDescription>
                            Modifiez les informations ci-dessous et cliquez sur "Enregistrer les modifications"
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <DemandeurCreate
                                data={data}
                                onChange={(field, value) => setData(field, value)}
                                index={0}
                                showRemoveButton={false}
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
                                    disabled={processing || isClosed}
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