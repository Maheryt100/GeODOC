import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
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


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Prix du terrain',
        href: '/prix/terrain',
    },

];
export default function Index({districts: district}: any){
    const districts = district;
    const {flash} = usePage<SharedData>().props;
    const {data, setData, post} = useForm({
        id:'',
       edilitaire: '',
       agricole: '',
    });
    const [search, setSearch] = useState("");
    const handleChangePrice = (e: React.FormEvent) => {
        e.preventDefault();
        //console.log(data);
        post(route('terrain.update'));
    }
    useEffect(() => {
        if (flash.message){
            toast.warning(flash.message);
        }
    }, [flash]);

    const filterDistrict = districts.filter(d=>
        d.nom_district.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster position={'top-right'}/>
            <div className={'flex w-1/2 mt-6 mx-5'}>
                <Input type={'search'}
                       placeholder={'Recherche...'}
                       className={'w-1/2'}
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className={'flex border rounded-md mt-6 mx-5'}>
                <Table>
                    <TableCaption>Liste des prix par terrain</TableCaption>
                    <TableHeader className={'w-[100px]'}>
                        <TableRow>
                            <TableHead className={'text-center'}>Nom</TableHead>
                            <TableHead className={'text-center'}>Edilitaire</TableHead>
                            <TableHead className={'text-center'}>Agricole</TableHead>
                            <TableHead className={'text-center'}>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filterDistrict.map((district: any) => (
                            <TableRow key={district.id}>
                                <TableCell className={'text-center'}>{district.nom_district} {district.prenom_district}</TableCell>
                                <TableCell className={'text-center'}>{district.edilitaire ? district.edilitaire : 0} Ar</TableCell>
                                <TableCell className={'text-center'}>{district.agricole ? district.agricole : 0} Ar</TableCell>
                                <TableCell className={'text-center'}>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost"
                                                    onClick={()=> {
                                                        setData('id', district.id);
                                                        setData('edilitaire', district.edilitaire);
                                                        setData('agricole', district.agricole);
                                                    }}
                                                    className={'hover:cursor-pointer hover:underline hover:bg-gray-300'}>
                                                <Pen/>
                                                Modifier
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <form onSubmit={handleChangePrice}>
                                                <DialogHeader>
                                                    <DialogTitle>Changer le prix</DialogTitle>
                                                    <DialogDescription>
                                                        Cliquer sur le bouton Changer pour sauvegarder les modifications
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4">
                                                    <Input type="hidden" name="district_id" value={district.id} />
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="edilitaire">Édilitaire</Label>
                                                        <Input id="edilitaire"
                                                               name="edilitaire"
                                                               type={'number'}
                                                               min={1}
                                                               defaultValue={district.edilitaire}
                                                                onChange={(e) => setData ('edilitaire', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="agricole">Agricole</Label>
                                                        <Input
                                                            id="agricole"
                                                            name="agricole"
                                                            type={'number'}
                                                            min={1}
                                                            defaultValue={district.agricole}
                                                            onChange={(e) => setData('agricole', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter className={'mt-6'}>
                                                    <DialogClose asChild>
                                                        <Button type="submit">Changer</Button>
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
