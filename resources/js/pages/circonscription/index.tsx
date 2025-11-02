import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, District, SharedData } from '@/types';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Pen } from 'lucide-react';
import { useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

interface PrixFormData {
    id: string;
    edilitaire: string;
    agricole: string;
    forestiere: string;
    touristique: string;
   
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Prix du terrain',
        href: '/prix/terrain',
    },
];

export default function Index({ districts }: { districts: District[] }) {
    const { flash } = usePage<SharedData>().props;
    const { data, setData, post } = useForm<PrixFormData>({
        id: '',
        edilitaire: '',
        agricole: '',
        forestiere: '',
        touristique: '',
    });
    
    const [search, setSearch] = useState("");

    const handleChangePrice = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('terrain.update'));
    }

    useEffect(() => {
        if (flash.message) {
            toast.warning(flash.message);
        }
    }, [flash]);

    const filterDistrict = districts.filter(d =>
        d.nom_district.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster position={'top-right'} />
            <div className={'flex w-1/2 mt-6 mx-5'}>
                <Input
                    type={'search'}
                    placeholder={'Recherche...'}
                    className={'w-1/2'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className={'flex border rounded-md mt-6 mx-5'}>
                <Table>
                    <TableCaption>Liste des prix par vocation de terrain</TableCaption>
                    <TableHeader className={'w-[100px]'}>
                        <TableRow>
                            <TableHead className={'text-center'}>District</TableHead>
                            <TableHead className={'text-center'}>Edilitaire</TableHead>
                            <TableHead className={'text-center'}>Agricole</TableHead>
                            <TableHead className={'text-center'}>Forestière</TableHead>
                            <TableHead className={'text-center'}>Touristique</TableHead>
                            <TableHead className={'text-center'}>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filterDistrict.map((district: District) => (
                            <TableRow key={district.id}>
                                <TableCell className={'text-center font-medium'}>
                                    {district.nom_district}
                                </TableCell>
                                <TableCell className={'text-center'}>
                                    {district.edilitaire ? district.edilitaire.toLocaleString() : 0} Ar
                                </TableCell>
                                <TableCell className={'text-center'}>
                                    {district.agricole ? district.agricole.toLocaleString() : 0} Ar
                                </TableCell>
                                <TableCell className={'text-center'}>
                                    {district.forestiere ? district.forestiere.toLocaleString() : 0} Ar
                                </TableCell>
                                <TableCell className={'text-center'}>
                                    {district.touristique ? district.touristique.toLocaleString() : 0} Ar
                                </TableCell>
                                <TableCell className={'text-center'}>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setData({
                                                        id: String(district.id),
                                                        edilitaire: String(district.edilitaire || 0),
                                                        agricole: String(district.agricole || 0),
                                                        forestiere: String(district.forestiere || 0),
                                                        touristique: String(district.touristique || 0),
                                                    });
                                                }}
                                                className={'hover:cursor-pointer hover:underline hover:bg-gray-300'}
                                            >
                                                <Pen className="mr-2" />
                                                Modifier
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <form onSubmit={handleChangePrice}>
                                                <DialogHeader>
                                                    <DialogTitle>Changer les prix - {district.nom_district}</DialogTitle>
                                                    <DialogDescription>
                                                        Définir le prix au m² pour chaque vocation de terrain
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <Input type="hidden" name="id" value={district.id} />
                                                    
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="edilitaire" className="flex items-center">
                                                            <span className="font-semibold">Édilitaire</span>
                                                            <span className="ml-2 text-xs text-muted-foreground">(Construction/Habitation)</span>
                                                        </Label>
                                                        <Input
                                                            id="edilitaire"
                                                            name="edilitaire"
                                                            type={'number'}
                                                            min={0}
                                                            placeholder="Prix en Ariary/m²"
                                                            value={data.edilitaire}
                                                            onChange={(e) => setData('edilitaire', e.target.value)}
                                                        />
                                                    </div>
                                                    
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="agricole" className="flex items-center">
                                                            <span className="font-semibold">Agricole</span>
                                                            <span className="ml-2 text-xs text-muted-foreground">(Culture/Agriculture)</span>
                                                        </Label>
                                                        <Input
                                                            id="agricole"
                                                            name="agricole"
                                                            type={'number'}
                                                            min={0}
                                                            placeholder="Prix en Ariary/m²"
                                                            value={data.agricole}
                                                            onChange={(e) => setData('agricole', e.target.value)}
                                                        />
                                                    </div>
                                                    
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="forestiere" className="flex items-center">
                                                            <span className="font-semibold">Forestière</span>
                                                            <span className="ml-2 text-xs text-muted-foreground">(Forêt/Boisement)</span>
                                                        </Label>
                                                        <Input
                                                            id="forestiere"
                                                            name="forestiere"
                                                            type={'number'}
                                                            min={0}
                                                            placeholder="Prix en Ariary/m²"
                                                            value={data.forestiere}
                                                            onChange={(e) => setData('forestiere', e.target.value)}
                                                        />
                                                    </div>
                                                    
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="touristique" className="flex items-center">
                                                            <span className="font-semibold">Touristique</span>
                                                            <span className="ml-2 text-xs text-muted-foreground">(Hôtellerie/Tourisme)</span>
                                                        </Label>
                                                        <Input
                                                            id="touristique"
                                                            name="touristique"
                                                            type={'number'}
                                                            min={0}
                                                            placeholder="Prix en Ariary/m²"
                                                            value={data.touristique}
                                                            onChange={(e) => setData('touristique', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter className={'mt-6'}>
                                                    <DialogClose asChild>
                                                        <Button type="submit">Enregistrer les prix</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}