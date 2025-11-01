import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LandPlot, Pencil, Trash, Ellipsis, List, UserPlus, Link2, AlertCircle, Eye, MapPin, Calendar, Building2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Dossier, Demandeur, Propriete, SharedData, BreadcrumbItem } from '@/types';

interface DemandeurWithProperty extends Demandeur {
    hasProperty: boolean;
}

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
    const [selectedDemandeur, setSelectedDemandeur] = useState<DemandeurWithProperty | null>(null);
    const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null);

    useEffect(() => {
        if (flash?.message) {
            toast.info(flash.message);
        }
    }, [flash?.message]);

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

    // Récupérer tous les demandeurs uniques (associés et non associés)
    const getAllDemandeurs = (): DemandeurWithProperty[] => {
        const demandeursMap = new Map<number, DemandeurWithProperty>();
        
        // Demandeurs de la relation contenir (non associés aux propriétés)
        if (dossier.demandeurs) {
            dossier.demandeurs.forEach((d: Demandeur) => {
                if (!demandeursMap.has(d.id)) {
                    demandeursMap.set(d.id, { ...d, hasProperty: false });
                }
            });
        }
        
        // Demandeurs associés aux propriétés
        if (dossier.proprietes) {
            dossier.proprietes.forEach((prop: Propriete) => {
                if (prop.demandeurs) {
                    prop.demandeurs.forEach((d: Demandeur) => {
                        if (!demandeursMap.has(d.id)) {
                            demandeursMap.set(d.id, { ...d, hasProperty: true });
                        } else {
                            const existing = demandeursMap.get(d.id);
                            if (existing) {
                                demandeursMap.set(d.id, { ...existing, hasProperty: true });
                            }
                        }
                    });
                }
            });
        }
        
        return Array.from(demandeursMap.values());
    };

    const allDemandeurs = getAllDemandeurs();
    const proprietes = dossier.proprietes || [];

    const isPropertyIncomplete = (prop: Propriete): boolean => {
        return !prop.titre || !prop.contenance || !prop.proprietaire || !prop.nature;
    };

    const isDemandeurIncomplete = (dem: Demandeur): boolean => {
        return !dem.date_naissance || !dem.lieu_naissance || !dem.date_delivrance || !dem.domiciliation;
    };

    const hasLinkedDemandeurs = (prop: Propriete): boolean => {
        return prop.demandeurs !== undefined && prop.demandeurs.length > 0;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Dossier ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 p-6">
                {/* Section Informations du Dossier - Améliorée */}
                <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-3xl font-bold text-blue-900 dark:text-blue-100">{dossier.nom_dossier}</CardTitle>
                                <CardDescription className="text-base mt-1">Dossier {dossier.type}</CardDescription>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('dossiers.edit', dossier.id)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                                <Button asChild variant="default" size="sm">
                                    <Link href={route('nouveau-lot.create', dossier.id)}>
                                        <LandPlot className="mr-2 h-4 w-4" />
                                        Nouveau Lot
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('dossiers.list', dossier.id)}>
                                        <List className="mr-2 h-4 w-4" />
                                        Liste
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Circonscription</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{dossier.circonscription}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Commune</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{dossier.type_commune} {dossier.commune}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fokontany</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{dossier.fokontany}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2 lg:col-span-3">
                                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Période de descente</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                        Du {new Date(dossier.date_descente_debut).toLocaleDateString('fr-FR')} au {new Date(dossier.date_descente_fin).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6 pt-4 border-t">
                            <Badge variant="secondary" className="text-sm">
                                {allDemandeurs.length} Demandeur{allDemandeurs.length > 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                                {proprietes.length} Propriété{proprietes.length > 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Section Demandeurs */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Demandeurs</CardTitle>
                                <CardDescription>
                                    Liste des demandeurs du dossier ({allDemandeurs.length})
                                    <span className="ml-2 text-xs">
                                        <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded mr-1"></span>
                                        Non associé à une propriété
                                        <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded ml-3 mr-1"></span>
                                        Informations incomplètes
                                    </span>
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('demandeurs.create', dossier.id)}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Nouveau
                                    </Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={route('ajouter-demandeur.create', dossier.id)}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Ajouter à un lot
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
                                        <th className="px-4 py-3 text-left text-sm font-medium">Nom complet</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">CIN</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Domiciliation</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Situation</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Téléphone</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                                        <th className="px-4 py-3 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allDemandeurs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center text-muted-foreground py-8">
                                                Aucun demandeur enregistré
                                            </td>
                                        </tr>
                                    ) : (
                                        allDemandeurs.map((demandeur) => {
                                            const isIncomplete = isDemandeurIncomplete(demandeur);
                                            const rowClass = isIncomplete 
                                                ? 'border-b hover:bg-red-50 dark:hover:bg-red-950/30 bg-red-50/50 dark:bg-red-950/20 cursor-pointer' 
                                                : demandeur.hasProperty
                                                    ? 'border-b hover:bg-muted/50 cursor-pointer'
                                                    : 'border-b hover:bg-amber-50 dark:hover:bg-amber-950/30 bg-amber-50/30 dark:bg-amber-950/20 cursor-pointer';
                                            
                                            return (
                                                <tr key={demandeur.id} className={rowClass} onClick={() => setSelectedDemandeur(demandeur)}>
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                                                            {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-mono">{demandeur.cin}</td>
                                                    <td className="px-4 py-3 text-sm">{demandeur.domiciliation || '-'}</td>
                                                    <td className="px-4 py-3 text-sm">{demandeur.situation_familiale || '-'}</td>
                                                    <td className="px-4 py-3 text-sm">{demandeur.telephone || '-'}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <Badge variant={demandeur.hasProperty ? "default" : "secondary"} className="text-xs">
                                                            {demandeur.hasProperty ? "Avec propriété" : "Sans propriété"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Ellipsis className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setSelectedDemandeur(demandeur)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Voir détails
                                                                </DropdownMenuItem>
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
                                            );
                                        })
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
                                <CardDescription>
                                    Liste des propriétés du dossier ({proprietes.length})
                                    <span className="ml-2 text-xs">
                                        <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded mr-1"></span>
                                        Sans demandeur
                                        <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded ml-3 mr-1"></span>
                                        Informations incomplètes
                                    </span>
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('proprietes.create', dossier.id)}>
                                        <LandPlot className="mr-2 h-4 w-4" />
                                        Nouvelle
                                    </Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={route('lier-demandeur.create', dossier.id)}>
                                        <Link2 className="mr-2 h-4 w-4" />
                                        Lier Demandeur
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
                                        <th className="px-4 py-3 text-left text-sm font-medium">Lot</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Titre</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Contenance</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Propriétaire</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Nature</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                                        <th className="px-4 py-3 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proprietes.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center text-muted-foreground py-8">
                                                Aucune propriété enregistrée
                                            </td>
                                        </tr>
                                    ) : (
                                        proprietes.map((propriete) => {
                                            const isIncomplete = isPropertyIncomplete(propriete);
                                            const hasDemandeurs = hasLinkedDemandeurs(propriete);
                                            const rowClass = isIncomplete 
                                                ? 'border-b hover:bg-red-50 dark:hover:bg-red-950/30 bg-red-50/50 dark:bg-red-950/20 cursor-pointer'
                                                : hasDemandeurs
                                                    ? 'border-b hover:bg-muted/50 cursor-pointer'
                                                    : 'border-b hover:bg-amber-50 dark:hover:bg-amber-950/30 bg-amber-50/30 dark:bg-amber-950/20 cursor-pointer';
                                            
                                            return (
                                                <tr key={propriete.id} className={rowClass} onClick={() => setSelectedPropriete(propriete)}>
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {propriete.lot}
                                                            {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{propriete.titre ? `TNº${propriete.titre}` : '-'}</td>
                                                    <td className="px-4 py-3 text-sm">{propriete.contenance ? `${propriete.contenance} m²` : '-'}</td>
                                                    <td className="px-4 py-3 text-sm">{propriete.proprietaire || '-'}</td>
                                                    <td className="px-4 py-3 text-sm capitalize">{propriete.nature || '-'}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <Badge variant={hasDemandeurs ? "default" : "secondary"} className="text-xs">
                                                            {hasDemandeurs ? "Avec demandeur" : "Sans demandeur"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Ellipsis className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setSelectedPropriete(propriete)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Voir détails
                                                                </DropdownMenuItem>
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
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Demandeur */}
            <Dialog open={!!selectedDemandeur} onOpenChange={() => setSelectedDemandeur(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Détails du demandeur
                        </DialogTitle>
                    </DialogHeader>
                    {selectedDemandeur && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                    {selectedDemandeur.titre_demandeur} {selectedDemandeur.nom_demandeur} {selectedDemandeur.prenom_demandeur}
                                </h3>
                                <Badge variant={selectedDemandeur.hasProperty ? "default" : "secondary"} className="mt-2">
                                    {selectedDemandeur.hasProperty ? "Associé à une propriété" : "Non associé"}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">CIN</p>
                                    <p className="font-medium font-mono">{selectedDemandeur.cin}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Sexe</p>
                                    <p className="font-medium">{selectedDemandeur.sexe}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Date de naissance</p>
                                    <p className="font-medium">{selectedDemandeur.date_naissance ? new Date(selectedDemandeur.date_naissance).toLocaleDateString('fr-FR') : '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Lieu de naissance</p>
                                    <p className="font-medium">{selectedDemandeur.lieu_naissance || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Nationalité</p>
                                    <p className="font-medium">{selectedDemandeur.nationalite || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Occupation</p>
                                    <p className="font-medium">{selectedDemandeur.occupation || '-'}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Informations CIN</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Date de délivrance</p>
                                        <p className="font-medium">{selectedDemandeur.date_delivrance ? new Date(selectedDemandeur.date_delivrance).toLocaleDateString('fr-FR') : '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Lieu de délivrance</p>
                                        <p className="font-medium">{selectedDemandeur.lieu_delivrance || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Informations familiales</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Nom du père</p>
                                        <p className="font-medium">{selectedDemandeur.nom_pere || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Nom de la mère</p>
                                        <p className="font-medium">{selectedDemandeur.nom_mere || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Situation familiale</p>
                                        <p className="font-medium">{selectedDemandeur.situation_familiale || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Régime matrimonial</p>
                                        <p className="font-medium">{selectedDemandeur.regime_matrimoniale || '-'}</p>
                                    </div>
                                    {selectedDemandeur.marie_a && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Marié(e) à</p>
                                            <p className="font-medium">{selectedDemandeur.marie_a}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Contact</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Domiciliation</p>
                                        <p className="font-medium">{selectedDemandeur.domiciliation || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Téléphone</p>
                                        <p className="font-medium">{selectedDemandeur.telephone || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button asChild variant="outline">
                                    <Link href={route('demandeurs.edit', { dossier: dossier.id, demandeur: selectedDemandeur.id })}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedDemandeur(null)}>
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog Propriété */}
            <Dialog open={!!selectedPropriete} onOpenChange={() => setSelectedPropriete(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Détails de la propriété
                        </DialogTitle>
                    </DialogHeader>
                    {selectedPropriete && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg">
                                <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                                    Lot {selectedPropriete.lot}
                                </h3>
                                {selectedPropriete.titre && (
                                    <p className="text-green-700 dark:text-green-300 mt-1">Titre Nº{selectedPropriete.titre}</p>
                                )}
                                <Badge variant="outline" className="mt-2">
                                    {selectedPropriete.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Propriétaire</p>
                                    <p className="font-medium">{selectedPropriete.proprietaire || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Contenance</p>
                                    <p className="font-medium">{selectedPropriete.contenance ? `${selectedPropriete.contenance} m²` : '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Nature</p>
                                    <p className="font-medium capitalize">{selectedPropriete.nature || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Vocation</p>
                                    <p className="font-medium">{selectedPropriete.vocation || '-'}</p>
                                </div>
                            </div>

                            {selectedPropriete.type_operation === 'morcellement' && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Informations du morcellement</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Propriété mère</p>
                                            <p className="font-medium">{selectedPropriete.propriete_mere || '-'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Titre mère</p>
                                            <p className="font-medium">{selectedPropriete.titre_mere || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Informations cadastrales</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Numéro FN</p>
                                        <p className="font-medium font-mono">{selectedPropriete.numero_FN || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Dep/Vol</p>
                                        <p className="font-medium">{selectedPropriete.dep_vol || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Réquisition</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Numéro de réquisition</p>
                                        <p className="font-medium font-mono">{selectedPropriete.numero_requisition || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Date de réquisition</p>
                                        <p className="font-medium">{selectedPropriete.date_requisition ? new Date(selectedPropriete.date_requisition).toLocaleDateString('fr-FR') : '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Date d'inscription</p>
                                        <p className="font-medium">{selectedPropriete.date_inscription ? new Date(selectedPropriete.date_inscription).toLocaleDateString('fr-FR') : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Autres informations</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Situation</p>
                                        <p className="font-medium">{selectedPropriete.situation || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Charge</p>
                                        <p className="font-medium">{selectedPropriete.charge || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedPropriete.demandeurs && selectedPropriete.demandeurs.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Demandeurs associés ({selectedPropriete.demandeurs.length})</h4>
                                    <div className="space-y-2">
                                        {selectedPropriete.demandeurs.map((dem) => (
                                            <div key={dem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{dem.titre_demandeur} {dem.nom_demandeur} {dem.prenom_demandeur}</p>
                                                    <p className="text-sm text-muted-foreground">CIN: {dem.cin}</p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedPropriete(null);
                                                        setSelectedDemandeur({ ...dem, hasProperty: true });
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button asChild variant="outline">
                                    <Link href={route('proprietes.edit', selectedPropriete.id)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedPropriete(null)}>
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}