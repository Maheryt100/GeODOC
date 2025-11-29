// resources/js/pages/dossiers/update.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Toaster } from 'sonner';
import type { BreadcrumbItem, District, Dossier } from '@/types';
import DossierForm from '@/pages/dossiers/components/DossierForm';

interface PageProps {
    districts: District[];
    dossier: Dossier;
    [key: string]: unknown;
}

export default function Update() {
    const { districts, dossier } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Modifier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier - ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Modifier le Dossier
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {dossier.nom_dossier} - {dossier.numero_ouverture}
                    </p>
                </div>

                <DossierForm
                    districts={districts}
                    dossier={dossier}
                    mode="edit"
                />
            </div>
        </AppLayout>
    );
}