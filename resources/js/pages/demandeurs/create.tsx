import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

// @ts-ignore
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Formulaire Demandeurs',
        href: '/demandeurs/create',
    },
];

export default function Create() {
    const [showBackdrop, setShowBackdrop] = useState(true);

    useEffect(() => {
        toast.custom((t) => (
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-xl w-96 text-center z-50 relative">
                <p className="text-lg font-semibold mb-4">Veuillez valider l'emplacement</p>
                <button
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                    onClick={() => {
                        toast.dismiss(t);
                        setShowBackdrop(false);
                    }}
                >
                    Fermer
                </button>
            </div>
        ), {
            duration: Infinity,
        });
    }, []);

    return (
        <>

            {showBackdrop && (
                <div className="fixed inset-0 bg-black/40 z-40" />
            )}


            <Toaster
                position="top-center"
                toastOptions={{
                    classNames: {
                        toast: "my-50 z-50 flex justify-center items-center",
                    },
                }}
            />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/demandeurs">Demandeur</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Insertion</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </AppLayout>
        </>
    );
}
