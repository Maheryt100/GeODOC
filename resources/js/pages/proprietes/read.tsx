import AppLayout from '@/layouts/app-layout';
import { Toaster } from '@/components/ui/sonner';


export default function Read(){
    return (
        <AppLayout breadcrumbs={[
            {
                title: 'Propriété',
                href: '/propriete/create',
            },
        ]}>
            <Toaster/>

        </AppLayout>
    );
}
