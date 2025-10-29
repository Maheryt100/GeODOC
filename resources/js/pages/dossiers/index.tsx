import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Dossier, SharedData } from '@/types'; // ✅ Changé
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EllipsisVertical, FolderPlus, LandPlot, List, Pencil, User, Eye } from 'lucide-react'; // ✅ Ajouté Eye
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dossiers',
        href: '/dossiers',
    },
];

export default function Index(){
    const [search, setSearch] = useState("");

    const { dossiers = [] } = usePage<{ dossiers: Dossier[] }>().props; // ✅ Changé

    const { flash } = usePage<SharedData>().props;

    useEffect(() =>{
        if (flash.message != null){
            toast.info(flash.message);
        }
    },[flash]);
    
    const handleSearch = (e: React.FormEvent) =>{
        e.preventDefault();

        router.post(route("dossiers.search"),{
            search: search
        },{
            onError: (error) => {
                console.log(error);
            }
        });
    }

    return (
     <AppLayout breadcrumbs={breadcrumbs}>
         <Head title={'Dossiers'}/>
         <Toaster position={'top-right'}/>
         <div>
             <div className="w-full flex justify-between mt-6 px-5">
                 <form className="flex gap-4" onSubmit={handleSearch}>
                     <Input type={'search'}
                            placeholder={'Rechercher....'}
                            onChange={(e) => setSearch(e.target.value)}
                            minLength={5}
                     />
                     <Button type={'submit'} disabled={search === ""}>
                         Rechercher
                     </Button>
                 </form>
                 <Button asChild>
                     <Link href={route('dossiers.create')}>
                         <FolderPlus/>
                         Créer un dossier
                     </Link>
                 </Button>
             </div>
             <div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-5 mt-6"}>
                 {dossiers?.map((dossier: Dossier)=>( // ✅ Ajouté le type
                     <Card key={dossier.id} className="w-full flex justify-self-center max-w-sm">
                         <CardHeader>
                             <CardTitle>{dossier.circonscription}</CardTitle>
                             <CardDescription><strong>Dossier:</strong> {dossier.nom_dossier}</CardDescription>
                             <CardAction>
                                 <DropdownMenu>
                                     <DropdownMenuTrigger>
                                         <EllipsisVertical/>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent>            
                                        <DropdownMenuItem asChild>
                                            <Link href={route("dossiers.show", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                <Eye />
                                                Voir Détails
                                            </Link>
                                        </DropdownMenuItem>
                                         <DropdownMenuItem asChild>
                                             <Link href={route("dossiers.edit", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <Pencil/>
                                                 Modifier
                                             </Link>
                                         </DropdownMenuItem>
                                         <DropdownMenuItem asChild>
                                             <Link href={route("dossiers.demandeurs", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <User/>
                                                 Demandeurs
                                             </Link>
                                         </DropdownMenuItem>
                                         <DropdownMenuItem asChild>
                                             <Link href={route("dossiers.proprietes", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <LandPlot/>
                                                 Propriétés
                                             </Link>
                                         </DropdownMenuItem>
                                         <DropdownMenuItem asChild>
                                             <Link href={route("dossiers.list", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <List/>
                                                 Liste
                                             </Link>
                                         </DropdownMenuItem>
                                     </DropdownMenuContent>
                                 </DropdownMenu>
                             </CardAction>
                         </CardHeader>
                         <CardContent>
                             <div>
                                 <div className={"flex flex-col gap-2"}>
                                     <div>
                                         <strong>Commune:</strong> {dossier.type_commune} {dossier.commune}
                                     </div>
                                     <div>
                                         <strong>Fokontany:</strong> {dossier.fokontany}
                                     </div>
                                 </div>
                             </div>
                         </CardContent>
                         <CardFooter className="flex-row justify-between">
                             <div>
                                 <h6 className={"text-xs"}>Demandeur(s): {dossier.demandeurs_count}</h6>
                             </div>
                             <div>
                                 <h6 className={"text-xs"}>Propriété(s): {dossier.proprietes_count}</h6>
                             </div>
                         </CardFooter>
                     </Card>
                 ))}
             </div>
         </div>
     </AppLayout>
    )
}