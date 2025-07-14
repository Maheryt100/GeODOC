import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';


export default function Create(){
    const [step, setStep] = useState(1);

    const{processing} = useForm({
        'titre': '',

    });
    const handleSubmit = ()=>{
        console.log('hei');
    }


    return (
        <AppLayout>
            <Toaster/>
            <Head title={'Insertion Demandeur'}/>
            <div className="mt-2">
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
            <div className="relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                <form onSubmit={handleSubmit} >
                    {/* stepper */}
                    <ol className="flex items-center justify-center mb-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <li className={`flex items-center ${step === 1 ? 'text-blue-600' : ''}`}>
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 border rounded-full flex items-center justify-center">1</span>
                            <span className="hidden sm:inline">Identité</span>
                          </span>
                        </li>
                        <li className="mx-4 border-t-2 w-10 sm:w-20 border-gray-300 dark:border-gray-600"></li>
                        <li className={`flex items-center ${step === 2 ? 'text-blue-600' : ''}`}>
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 border rounded-full flex items-center justify-center">2</span>
                            <span className="hidden sm:inline">Famille & Contact</span>
                          </span>
                        </li>
                    </ol>

                    {step === 1 && (
                        <div>
                            <div className="text-right">
                                <Button type="button" onClick={() => setStep(2)}>Suivant</Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div className="flex justify-between mt-4">
                                <Button type="button" onClick={() => setStep(1)}>Précédent</Button>
                                <Button type="submit" disabled={processing}>{processing ? 'Envoi...' : 'Valider'}</Button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}
