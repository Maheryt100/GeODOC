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
    id: number;
    edilitaire: number;
    agricole: number;
    forestiere: number;
    touristique: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Prix du terrain',
        href: '/prix/terrain',
    },
];

export default function Index({ districts }: { districts: District[] }) {
    const { flash } = usePage<SharedData>().props;
    const { data, setData, post, reset, processing } = useForm<PrixFormData>({
        id: 0,
        edilitaire: 0,
        agricole: 0,
        forestiere: 0,
        touristique: 0,
    });
    
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleChangePrice = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('terrain.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsOpen(false);
                reset();
                toast.success('Prix mis à jour avec succès');
            },
            onError: (errors) => {
                console.error('Erreurs:', errors);
                toast.error('Erreur lors de la mise à jour des prix');
            }
        });
    };

    useEffect(() => {
        if (flash.message) {
            toast.success(flash.message);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const filterDistrict = districts.filter(d =>
        d.nom_district.toLowerCase().includes(search.toLowerCase())
    );

    // Fonction pour formater les prix
    const formatPrice = (price: number | null | undefined): string => {
        if (price === null || price === undefined || price === 0) {
            return '0';
        }
        return price.toLocaleString('fr-FR');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster position={'top-right'} richColors />
            
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">Gestion des Prix du Terrain</h1>
                    <p className="text-muted-foreground">
                        Définir les prix au m² pour chaque vocation de terrain par district
                    </p>
                </div>

                <div className="flex w-full md:w-1/2 mb-6">
                    <Input
                        type="search"
                        placeholder="Rechercher un district..."
                        className="w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableCaption>
                            {filterDistrict.length} district(s) trouvé(s)
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center font-semibold">District</TableHead>
                                <TableHead className="text-center font-semibold">
                                    Édilitaire
                                    <span className="block text-xs font-normal text-muted-foreground">
                                        (Ar/m²)
                                    </span>
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Agricole
                                    <span className="block text-xs font-normal text-muted-foreground">
                                        (Ar/m²)
                                    </span>
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Forestière
                                    <span className="block text-xs font-normal text-muted-foreground">
                                        (Ar/m²)
                                    </span>
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Touristique
                                    <span className="block text-xs font-normal text-muted-foreground">
                                        (Ar/m²)
                                    </span>
                                </TableHead>
                                <TableHead className="text-center font-semibold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filterDistrict.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Aucun district trouvé
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filterDistrict.map((district: District) => (
                                    <TableRow key={district.id}>
                                        <TableCell className="text-center font-medium">
                                            {district.nom_district}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono">
                                                {formatPrice(district.edilitaire)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono">
                                                {formatPrice(district.agricole)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono">
                                                {formatPrice(district.forestiere)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono">
                                                {formatPrice(district.touristique)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Dialog open={isOpen && data.id === district.id} onOpenChange={(open) => {
                                                setIsOpen(open);
                                                if (!open) reset();
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setData({
                                                                id: district.id,
                                                                edilitaire: district.edilitaire || 0,
                                                                agricole: district.agricole || 0,
                                                                forestiere: district.forestiere || 0,
                                                                touristique: district.touristique || 0,
                                                            });
                                                            setIsOpen(true);
                                                        }}
                                                        className="hover:bg-primary/10"
                                                    >
                                                        <Pen className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[550px]">
                                                    <form onSubmit={handleChangePrice}>
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Modifier les prix - {district.nom_district}
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Définir le prix au m² pour chaque vocation de terrain.
                                                                Les valeurs sont en Ariary (Ar).
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        
                                                        <div className="grid gap-6 py-6">
                                                            <div className="grid gap-3">
                                                                <Label htmlFor="edilitaire" className="flex items-center">
                                                                    <span className="font-semibold">Édilitaire</span>
                                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                                        (Construction/Habitation)
                                                                    </span>
                                                                </Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        id="edilitaire"
                                                                        type="number"
                                                                        min={0}
                                                                        step={1}
                                                                        placeholder="0"
                                                                        value={data.edilitaire}
                                                                        onChange={(e) => setData('edilitaire', Number(e.target.value))}
                                                                        className="pr-12"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                                        Ar/m²
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="grid gap-3">
                                                                <Label htmlFor="agricole" className="flex items-center">
                                                                    <span className="font-semibold">Agricole</span>
                                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                                        (Culture/Agriculture)
                                                                    </span>
                                                                </Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        id="agricole"
                                                                        type="number"
                                                                        min={0}
                                                                        step={1}
                                                                        placeholder="0"
                                                                        value={data.agricole}
                                                                        onChange={(e) => setData('agricole', Number(e.target.value))}
                                                                        className="pr-12"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                                        Ar/m²
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="grid gap-3">
                                                                <Label htmlFor="forestiere" className="flex items-center">
                                                                    <span className="font-semibold">Forestière</span>
                                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                                        (Forêt/Boisement)
                                                                    </span>
                                                                </Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        id="forestiere"
                                                                        type="number"
                                                                        min={0}
                                                                        step={1}
                                                                        placeholder="0"
                                                                        value={data.forestiere}
                                                                        onChange={(e) => setData('forestiere', Number(e.target.value))}
                                                                        className="pr-12"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                                        Ar/m²
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="grid gap-3">
                                                                <Label htmlFor="touristique" className="flex items-center">
                                                                    <span className="font-semibold">Touristique</span>
                                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                                        (Hôtellerie/Tourisme)
                                                                    </span>
                                                                </Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        id="touristique"
                                                                        type="number"
                                                                        min={0}
                                                                        step={1}
                                                                        placeholder="0"
                                                                        value={data.touristique}
                                                                        onChange={(e) => setData('touristique', Number(e.target.value))}
                                                                        className="pr-12"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                                        Ar/m²
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <DialogFooter className="gap-2">
                                                            <DialogClose asChild>
                                                                <Button 
                                                                    type="button" 
                                                                    variant="outline"
                                                                    disabled={processing}
                                                                >
                                                                    Annuler
                                                                </Button>
                                                            </DialogClose>
                                                            <Button 
                                                                type="submit"
                                                                disabled={processing}
                                                            >
                                                                {processing ? 'Enregistrement...' : 'Enregistrer'}
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}