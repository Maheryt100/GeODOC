import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, LandPlot, Pencil, Trash, UserRoundSearch, Ellipsis } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { BreadcrumbItem, Dossier, Demandeur, Propriete, SharedData } from '@/types';
import { useState, useEffect } from 'react';

interface PageProps {
    dossier: Dossier & {
        demandeurs: Demandeur[];
        proprietes: Propriete[];
    };
    [key: string]: unknown;
}


export default function Show() {
    const { dossier } = usePage<PageProps>().props;
    const { flash } = usePage<SharedData>().props;
    const { delete: destroy } = useForm();
    
    const [showDemandeurDialog, setShowDemandeurDialog] = useState(false);
    const [searchCin, setSearchCin] = useState('');

    // Afficher les messages flash
    useEffect(() => {
            if (flash.message) {
                toast.info(flash.message);
            }
        }, [flash.message]);

    const handleDeleteDemandeur = (id: number) => {
        if (confirm('Voulez-vous vraiment supprimer ce demandeur ?')) {
            destroy(route('demandeurs.destroy', { dossier: dossier.id, demandeur: id }), {
                preserveScroll: true,
                onSuccess: () => toast.success('Demandeur supprimé')
            });
        }
    };

    const handleDeletePropriete = (id: number) => {
        if (confirm('Voulez-vous vraiment supprimer cette propriété ?')) {
            destroy(route('proprietes.destroy', id), {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété supprimée')
            });
        }
    };

    const handleSearchCin = () => {
        const cinIsValid = /^\d{12}$/.test(searchCin);
        if (!cinIsValid) {
            toast.warning('CIN invalide, le CIN doit comporter 12 chiffres!');
            return;
        }
        router.post(route('demandeurs.searchCin'), {
            id_dossier: dossier.id,
            cin: searchCin
        });
        setShowDemandeurDialog(false);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: '#' }
    ];

    const demandeurs = dossier.demandeurs || [];
    const proprietes = dossier.proprietes || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Dossier ${dossier.nom_dossier}`} />
            <Toaster position="top-right" />

            <div className="flex flex-col gap-6 p-6">
                {/* Section Informations du Dossier */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{dossier.nom_dossier}</CardTitle>
                        <CardDescription>Informations du dossier</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Circonscription</p>
                                <p className="font-medium">{dossier.circonscription}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Commune</p>
                                <p className="font-medium">{dossier.type_commune} {dossier.commune}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Fokontany</p>
                                <p className="font-medium">{dossier.fokontany}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Type</p>
                                <p className="font-medium capitalize">{dossier.type}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">Date descente</p>
                                <p className="font-medium">
                                    Du {dossier.date_descente_debut} au {dossier.date_descente_fin}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section Demandeurs */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Demandeurs</CardTitle>
                                <CardDescription>Liste des demandeurs du dossier ({demandeurs.length})</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Dialog open={showDemandeurDialog} onOpenChange={setShowDemandeurDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <UserRoundSearch className="mr-2 h-4 w-4" />
                                            Existant
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Recherche par CIN</DialogTitle>
                                            <DialogDescription>
                                                Rechercher un demandeur dans un autre dossier
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="cin">CIN</Label>
                                                <Input
                                                    id="cin"
                                                    placeholder="123456789012"
                                                    minLength={12}
                                                    maxLength={12}
                                                    value={searchCin}
                                                    onChange={(e) => setSearchCin(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleSearchCin}>Rechercher</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button asChild size="sm">
                                    <Link href={route('demandeurs.create', dossier.id)}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Nouveau
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Titre</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">CIN</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Domiciliation</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Situation</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Téléphone</th>
                                        <th className="px-4 py-3 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {demandeurs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center text-muted-foreground py-8">
                                                Aucun demandeur enregistré
                                            </td>
                                        </tr>
                                    ) : (
                                        demandeurs.map((demandeur) => (
                                            <tr key={demandeur.id} className="border-b hover:bg-muted/50">
                                                <td className="px-4 py-3 text-sm">{demandeur.titre_demandeur}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{demandeur.cin}</td>
                                                <td className="px-4 py-3 text-sm">{demandeur.domiciliation}</td>
                                                <td className="px-4 py-3 text-sm">{demandeur.situation_familiale}</td>
                                                <td className="px-4 py-3 text-sm">{demandeur.telephone || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Ellipsis className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={route('demandeurs.edit', {
                                                                        dossier: dossier.id,
                                                                        demandeur: demandeur.id
                                                                    })}
                                                                    className="flex items-center"
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Modifier
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-500"
                                                                onClick={() => handleDeleteDemandeur(demandeur.id)}
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Section Propriétés */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Propriétés</CardTitle>
                                <CardDescription>Liste des propriétés du dossier ({proprietes.length})</CardDescription>
                            </div>
                            <Button asChild size="sm">
                                <Link href={route('proprietes.create', dossier.id)}>
                                    <LandPlot className="mr-2 h-4 w-4" />
                                    Nouvelle Propriété
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Lot</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Titre</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Contenance</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Propriétaire</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Nature</th>
                                        <th className="px-4 py-3 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proprietes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted-foreground py-8">
                                                Aucune propriété enregistrée
                                            </td>
                                        </tr>
                                    ) : (
                                        proprietes.map((propriete) => (
                                            <tr key={propriete.id} className="border-b hover:bg-muted/50">
                                                <td className="px-4 py-3 text-sm font-medium">{propriete.lot}</td>
                                                <td className="px-4 py-3 text-sm">TNº{propriete.titre}</td>
                                                <td className="px-4 py-3 text-sm">{propriete.contenance} m²</td>
                                                <td className="px-4 py-3 text-sm">{propriete.proprietaire}</td>
                                                <td className="px-4 py-3 text-sm capitalize">{propriete.nature}</td>
                                                <td className="px-4 py-3">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Ellipsis className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link 
                                                                    href={route('proprietes.edit', propriete.id)}
                                                                    className="flex items-center"
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Modifier
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-500"
                                                                onClick={() => handleDeletePropriete(propriete.id)}
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}