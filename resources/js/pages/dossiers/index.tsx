import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Dossier, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EllipsisVertical, FolderPlus, List, Pencil, Eye, LandPlot, UserPlus, Link2 } from 'lucide-react';

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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dossiers',
        href: '/dossiers',
    },
];

export default function Index(){
    const [search, setSearch] = useState("");
    const { dossiers = [] } = usePage<{ dossiers: Dossier[] }>().props;
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
                 {dossiers?.map((dossier: Dossier)=>(
                     <Card 
                         key={dossier.id} 
                         className="w-full flex justify-self-center max-w-sm cursor-pointer hover:shadow-lg transition-shadow"
                         onClick={() => router.visit(route('dossiers.show', dossier.id))}
                     >
                         <CardHeader>
                             <CardTitle>{dossier.circonscription}</CardTitle>
                             <CardDescription><strong>Dossier:</strong> {dossier.nom_dossier}</CardDescription>
                             <CardAction onClick={(e) => e.stopPropagation()}>
                                 <DropdownMenu>
                                     <DropdownMenuTrigger>
                                         <EllipsisVertical/>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent>
                                         <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                         <DropdownMenuItem asChild>
                                             <Link href={route("dossiers.show", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <Eye className="h-4 w-4" />
                                                 Voir Détails
                                             </Link>
                                         </DropdownMenuItem>
                                         <DropdownMenuItem asChild>
                                             <Link href={route("dossiers.edit", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <Pencil className="h-4 w-4"/>
                                                 Modifier
                                             </Link>
                                         </DropdownMenuItem>
                                         
                                         <DropdownMenuSeparator />
                                         <DropdownMenuLabel>Ajouter</DropdownMenuLabel>
                                         
                                         <DropdownMenuItem asChild>
                                             <Link href={route("nouveau-lot.create", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <LandPlot className="h-4 w-4"/>
                                                 Nouveau Lot
                                             </Link>
                                         </DropdownMenuItem>
                                         <DropdownMenuItem asChild>
                                             <Link href={route("ajouter-demandeur.create", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <UserPlus className="h-4 w-4"/>
                                                 Ajouter Demandeur à un lot
                                             </Link>
                                         </DropdownMenuItem>
                                         <DropdownMenuItem asChild>
                                             <Link href={route("lier-demandeur.create", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <Link2 className="h-4 w-4"/>
                                                 Lier Demandeur existant
                                             </Link>
                                         </DropdownMenuItem>
                                         
                                         <DropdownMenuSeparator />
                                         
                                         <DropdownMenuItem asChild>
                                             <Link href={route("dossiers.list", dossier.id)} className={'w-full flex gap-2 items-center'}>
                                                 <List className="h-4 w-4"/>
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