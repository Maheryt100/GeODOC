// resources/js/pages/dossiers/index.tsx
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Dossier, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderPlus, Search, Calendar, SlidersHorizontal, Eye, Pencil, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, LockOpen, Lock as LockIcon, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { LandPlot, UserPlus, Link2, List, EllipsisVertical, Archive } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dossiers', href: '/dossiers' },
];

const ITEMS_PER_PAGE = 10;

export default function Index() {
    const { dossiers = [] } = usePage<{ dossiers: Dossier[] }>().props;
    const { flash } = usePage<SharedData>().props;

    const [search, setSearch] = useState('');
    const [filteredDossiers, setFilteredDossiers] = useState<Dossier[]>(dossiers);
    const [sortBy, setSortBy] = useState<'date' | 'nom'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all'); // ✅ AJOUTÉ

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    useEffect(() => {
        if (flash.message != null) {
            toast.info(flash.message);
        }
    }, [flash]);

    // Fonction de filtrage et tri
    useEffect(() => {
        let result = [...dossiers];

        // Filtrer par recherche
        if (search) {
            result = result.filter(d =>
                d.nom_dossier.toLowerCase().includes(search.toLowerCase()) ||
                d.commune.toLowerCase().includes(search.toLowerCase()) ||
                d.circonscription.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filtrer par dates
        if (dateDebut) {
            result = result.filter(d => new Date(d.date_descente_debut) >= new Date(dateDebut));
        }
        if (dateFin) {
            result = result.filter(d => new Date(d.date_descente_fin) <= new Date(dateFin));
        }

        // Filtrer par lettre
        if (selectedLetter) {
            result = result.filter(d =>
                d.nom_dossier.toUpperCase().startsWith(selectedLetter)
            );
        }

        // ✅ Filtre par statut
        if (statusFilter === 'open') {
            result = result.filter(d => !d.is_closed);
        } else if (statusFilter === 'closed') {
            result = result.filter(d => d.is_closed);
        }

        // Trier
        result.sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.date_descente_debut).getTime();
                const dateB = new Date(b.date_descente_debut).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            } else {
                return sortOrder === 'asc'
                    ? a.nom_dossier.localeCompare(b.nom_dossier)
                    : b.nom_dossier.localeCompare(a.nom_dossier);
            }
        });

        setFilteredDossiers(result);
        setCurrentPage(1);
    }, [dossiers, search, dateDebut, dateFin, selectedLetter, sortBy, sortOrder, statusFilter]);

    const clearFilters = () => {
        setSearch('');
        setDateDebut('');
        setDateFin('');
        setSelectedLetter(null);
        setSortBy('date');
        setSortOrder('desc');
        setStatusFilter('all'); // ✅ AJOUTÉ
    };

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const hasActiveFilters = search || dateDebut || dateFin || selectedLetter || statusFilter !== 'all'; // ✅ MODIFIÉ
    const showAlphabet = sortBy === 'nom';

    // Pagination
    const totalPages = Math.ceil(filteredDossiers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentDossiers = filteredDossiers.slice(startIndex, endIndex);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dossiers" />
            <Toaster position="top-right" />

            {/* En-tête fixe - Version compacte */}
            <div className="sticky top-0 z-10 bg-background border-b">
                <div className="container mx-auto p-3">
                    {/* Titre, recherche et actions sur une ligne */}
                    <div className="flex items-center gap-3">
                        {/* Titre et compteur */}
                        <div className="shrink-0">
                            <h1 className="text-xl font-bold">Dossiers</h1>
                            <p className="text-xs text-muted-foreground">
                                {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Barre de recherche */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Rechercher..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-8 text-sm"
                            />
                        </div>

                        {/* Boutons filtres et créer */}
                        <Popover open={showFilters} onOpenChange={setShowFilters}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="relative h-8">
                                    <SlidersHorizontal className="mr-1 h-3 w-3" />
                                    Filtres
                                    {hasActiveFilters && (
                                        <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]" variant="destructive">
                                            !
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-3">Filtres avancés</h4>
                                    </div>

                                    {/* Filtre par statut */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Statut du dossier</Label>
                                        <Select value={statusFilter} onValueChange={(value: 'all' | 'open' | 'closed') => setStatusFilter(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tous les dossiers</SelectItem>
                                                <SelectItem value="open">Dossiers ouverts</SelectItem>
                                                <SelectItem value="closed">Dossiers fermés</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Filtres par date */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Période de descente</Label>
                                        <div className="grid gap-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="date"
                                                    value={dateDebut}
                                                    onChange={(e) => setDateDebut(e.target.value)}
                                                    placeholder="Date début"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="date"
                                                    value={dateFin}
                                                    onChange={(e) => setDateFin(e.target.value)}
                                                    placeholder="Date fin"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tri */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Trier par</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Select value={sortBy} onValueChange={(value: 'date' | 'nom') => setSortBy(value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="date">Date</SelectItem>
                                                    <SelectItem value="nom">Nom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="asc">↑ A-Z / Ancien</SelectItem>
                                                    <SelectItem value="desc">↓ Z-A / Récent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {hasActiveFilters && (
                                        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                                            <X className="mr-2 h-4 w-4" />
                                            Réinitialiser les filtres
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button size="sm" asChild className="h-8 shrink-0">
                            <Link href={route('dossiers.create')}>
                                <FolderPlus className="mr-1 h-3 w-3" />
                                Créer un dossier
                            </Link>
                        </Button>
                    </div>

                    {/* Filtres actifs */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {search && (
                                <Badge variant="secondary" className="gap-1 h-5 text-[10px]">
                                    Recherche: {search}
                                    <X className="h-2 w-2 cursor-pointer" onClick={() => setSearch('')} />
                                </Badge>
                            )}
                            {dateDebut && (
                                <Badge variant="secondary" className="gap-1 h-5 text-[10px]">
                                    Début: {dateDebut}
                                    <X className="h-2 w-2 cursor-pointer" onClick={() => setDateDebut('')} />
                                </Badge>
                            )}
                            {dateFin && (
                                <Badge variant="secondary" className="gap-1 h-5 text-[10px]">
                                    Fin: {dateFin}
                                    <X className="h-2 w-2 cursor-pointer" onClick={() => setDateFin('')} />
                                </Badge>
                            )}
                            {selectedLetter && (
                                <Badge variant="secondary" className="gap-1 h-5 text-[10px]">
                                    Lettre: {selectedLetter}
                                    <X className="h-2 w-2 cursor-pointer" onClick={() => setSelectedLetter(null)} />
                                </Badge>
                            )}
                            {statusFilter !== 'all' && (
                                <Badge variant="secondary" className="gap-1 h-5 text-[10px]">
                                    Statut: {statusFilter === 'open' ? 'Ouvert' : 'Fermé'}
                                    <X className="h-2 w-2 cursor-pointer" onClick={() => setStatusFilter('all')} />
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-3 pb-3 pt-2">
                <div className="flex gap-3">
                    {/* Liste des dossiers */}
                    <div className="flex-1 space-y-1">
                        {currentDossiers.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        {hasActiveFilters
                                            ? 'Aucun dossier ne correspond à vos critères'
                                            : 'Aucun dossier enregistré'}
                                    </p>
                                    {hasActiveFilters && (
                                        <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                                            Réinitialiser les filtres
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {currentDossiers.map((dossier) => {
                                    const isExpanded = expandedRows.has(dossier.id);
                                    return (
                                        <Card key={dossier.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-2">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleExpand(dossier.id)}
                                                        className="h-6 w-6 shrink-0"
                                                    >
                                                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                    </Button>

                                                    <div
                                                        className="flex-1 cursor-pointer flex items-center gap-3 text-base"
                                                        onClick={() => router.visit(route('dossiers.show', dossier.id))}
                                                    >
                                                        <h3 className="font-semibold text-[16px] truncate max-w-[220px]">
                                                            {dossier.nom_dossier}
                                                        </h3>

                                                        {/* Badge de statut */}
                                                        {dossier.is_closed ? (
                                                            <Badge variant="outline" className="text-xs flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-300">
                                                                <LockIcon className="h-3 w-3" />
                                                                Fermé
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-100 text-green-700 border-green-300">
                                                                <LockOpen className="h-3 w-3" />
                                                                Ouvert
                                                            </Badge>
                                                        )}

                                                        {dossier.proprietes?.some((p) => p.is_archived === true) && (
                                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                                <Archive className="h-3 w-3" />
                                                                Propriétés acquises
                                                            </Badge>
                                                        )}

                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground truncate max-w-[180px] text-[15px]">
                                                            {dossier.commune}
                                                        </span>

                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground whitespace-nowrap text-[15px]">
                                                            {dossier.demandeurs_count} demandeur(s), {dossier.proprietes_count} propriété(s)
                                                        </span>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                                                <EllipsisVertical className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route("dossiers.show", dossier.id)} className="flex items-center">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Voir Détails
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                asChild={dossier.can_modify}
                                                                disabled={!dossier.can_modify}
                                                            >
                                                                <Link href={route("dossiers.edit", dossier.id)} className="flex items-center">
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Modifier
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel>Ajouter</DropdownMenuLabel>
                                                            
                                                            <DropdownMenuItem 
                                                                asChild={!dossier.is_closed}
                                                                disabled={dossier.is_closed}
                                                            >
                                                                <Link href={route("nouveau-lot.create", dossier.id)} className="flex items-center">
                                                                    <LandPlot className="mr-2 h-4 w-4" />
                                                                    Nouvelle entrées
                                                                </Link>
                                                            </DropdownMenuItem>                                                                                                      
                                                            
                                                            <DropdownMenuSeparator />
                                                            
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('demandes.resume', dossier.id)}>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Résumé des demandes
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {isExpanded && (
                                                    <div className="mt-3 pt-3 border-t ml-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-base">
                                                        <div className="space-y-2">
                                                            <p className="text-muted-foreground text-[14px]">Type Commune</p>
                                                            <p className="font-medium text-[15px]">{dossier.type_commune}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-muted-foreground text-[14px]">Circonscription</p>
                                                            <p className="font-medium text-[15px]">{dossier.circonscription}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-muted-foreground text-[14px]">Fokontany</p>
                                                            <p className="font-medium text-[15px]">{dossier.fokontany}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-muted-foreground text-[14px]">Date descente</p>
                                                            <p className="font-medium text-[14px]">
                                                                {new Date(dossier.date_descente_debut).toLocaleDateString('fr-FR')} – 
                                                                {new Date(dossier.date_descente_fin).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-muted-foreground text-[14px]">Date d'ouverture</p>
                                                            <p className="font-medium text-[15px]">
                                                                {new Date(dossier.date_ouverture).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                        
                                                        {dossier.is_closed && dossier.date_fermeture && (
                                                            <div className="space-y-2">
                                                                <p className="text-muted-foreground text-[14px]">Date de fermeture</p>
                                                                <p className="font-medium text-[15px] text-orange-700">
                                                                    {new Date(dossier.date_fermeture).toLocaleDateString('fr-FR')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                if (
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <Button
                                                            key={page}
                                                            variant={currentPage === page ? 'default' : 'outline'}
                                                            size="sm"
                                                            className="h-7 w-7 text-xs"
                                                            onClick={() => setCurrentPage(page)}
                                                        >
                                                            {page}
                                                        </Button>
                                                    );
                                                } else if (
                                                    page === currentPage - 2 ||
                                                    page === currentPage + 2
                                                ) {
                                                    return <span key={page} className="px-1 text-xs">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Navigation alphabétique */}
                    {showAlphabet && (
                        <div className="hidden lg:block">
                            <div className="sticky top-20">
                                <Card className="w-10">
                                    <CardContent className="p-1">
                                        <div className="flex flex-col items-center gap-0.5">
                                            {alphabet.map((letter) => {
                                                const hasResults = dossiers.some(d =>
                                                    d.nom_dossier.toUpperCase().startsWith(letter)
                                                );
                                                return (
                                                    <button
                                                        key={letter}
                                                        onClick={() =>
                                                            setSelectedLetter(selectedLetter === letter ? null : letter)
                                                        }
                                                        className={`
                                                            w-7 h-7 rounded text-[10px] font-medium transition-colors
                                                            ${selectedLetter === letter
                                                                ? 'bg-primary text-primary-foreground'
                                                                : hasResults
                                                                ? 'hover:bg-muted text-foreground'
                                                                : 'text-muted-foreground/30 cursor-default'
                                                            }
                                                        `}
                                                        disabled={!hasResults}
                                                    >
                                                        {letter}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}