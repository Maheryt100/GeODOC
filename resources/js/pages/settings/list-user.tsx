import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Liste des Utilisateurs',
        href: '/settings/ListUser',
    },
];
export default function ListUser(){
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />
            <Toaster position={'top-right'}/>
            <SettingsLayout>
                <div className="space-y-8">
                    <HeadingSmall title="Liste des utilisateur" description="Changer le mot de passe ou supprimer un utilisateur" />

                </div>
            </SettingsLayout>
        </AppLayout>
    )
}
