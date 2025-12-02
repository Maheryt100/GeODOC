// resources/js/pages/dossiers/components/DossierCard.tsx 
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { 
    ChevronDown, ChevronUp, Eye, Pencil, EllipsisVertical, 
    LandPlot, UserPlus, Link2, Archive, Lock, LockOpen, 
    Calendar, Hash, MapPin, Building2, AlertCircle 
} from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { Dossier } from '@/types';

interface DossierCardProps {
    dossier: Dossier & {
        can_modify?: boolean;
        can_close?: boolean;
    };
}

export function DossierCard({ dossier }: DossierCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasArchivedProperties = dossier.proprietes?.some((p) => p.is_archived === true);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
                {/* En-tête compact */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-7 w-7 shrink-0"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    <div
                        className="flex-1 cursor-pointer flex items-center gap-3 text-base"
                        onClick={() => router.visit(route('dossiers.show', dossier.id))}
                    >
                        {/* Nom du dossier */}
                        <h3 className="font-semibold text-base truncate max-w-[220px]">
                            {dossier.nom_dossier}
                        </h3>

                        {/* Numéro d'ouverture */}
                        {dossier.numero_ouverture && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 font-mono">
                                <Hash className="h-3 w-3 mr-1" />
                                {dossier.numero_ouverture}
                            </Badge>
                        )}

                        {/* Badge de statut */}
                        {dossier.is_closed ? (
                            <Badge variant="outline" className="text-xs flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-300">
                                <Lock className="h-3 w-3" />
                                Fermé
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-100 text-green-700 border-green-300">
                                <LockOpen className="h-3 w-3" />
                                Ouvert
                            </Badge>
                        )}

                        {/* Badge propriétés acquises */}
                        {hasArchivedProperties && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Archive className="h-3 w-3" />
                                Propriétés acquises
                            </Badge>
                        )}

                        <span className="text-muted-foreground">•</span>

                        {/* Commune */}
                        <span className="text-muted-foreground truncate max-w-[180px] text-sm">
                            {dossier.commune}
                        </span>

                        <span className="text-muted-foreground">•</span>

                        {/* Compteurs */}
                        <span className="text-muted-foreground whitespace-nowrap text-sm">
                            {dossier.demandeurs_count} demandeur(s), {dossier.proprietes_count} propriété(s)
                        </span>
                    </div>

                    {/* Menu actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <EllipsisVertical className="h-4 w-4" />
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
                            
                            {dossier.can_modify && (
                                <DropdownMenuItem asChild>
                                    <Link href={route("dossiers.edit", dossier.id)} className="flex items-center">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Ajouter</DropdownMenuLabel>
                            
                            {!dossier.is_closed && (
                                <DropdownMenuItem asChild>
                                    <Link href={route("nouveau-lot.create", dossier.id)} className="flex items-center">
                                        <LandPlot className="mr-2 h-4 w-4" />
                                        Nouveau Lot
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem asChild>
                                <Link href={route("ajouter-demandeur.create", dossier.id)} className="flex items-center">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Ajouter Demandeur
                                </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild>
                                <Link href={route("lier-demandeur.create", dossier.id)} className="flex items-center">
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Lier Existant
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Section étendue */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t ml-9 space-y-4">
                        {/* Informations principales */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    <span>Type Commune</span>
                                </div>
                                <p className="font-medium text-sm">{dossier.type_commune}</p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>Circonscription</span>
                                </div>
                                <p className="font-medium text-sm">{dossier.circonscription}</p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>Fokontany</span>
                                </div>
                                <p className="font-medium text-sm">{dossier.fokontany}</p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>Date descente</span>
                                </div>
                                <p className="font-medium text-xs">
                                    {new Date(dossier.date_descente_debut).toLocaleDateString('fr-FR')} – 
                                    {new Date(dossier.date_descente_fin).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        </div>

                        {/* Dates d'ouverture/fermeture */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>Date d'ouverture</span>
                                </div>
                                <p className="font-medium text-sm">
                                    {new Date(dossier.date_ouverture).toLocaleDateString('fr-FR')}
                                </p>
                            </div>

                            {dossier.is_closed && dossier.date_fermeture && (
                                <>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-xs text-orange-600">
                                            <Lock className="h-3 w-3" />
                                            <span>Date de fermeture</span>
                                        </div>
                                        <p className="font-medium text-sm text-orange-700">
                                            {new Date(dossier.date_fermeture).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>

                                    {dossier.closedBy && (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span>Fermé par</span>
                                            </div>
                                            <p className="font-medium text-sm">{dossier.closedBy.name}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Alerte si incomplet */}
                        {(!dossier.demandeurs_count || !dossier.proprietes_count) && (
                            <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div className="text-xs text-amber-800 dark:text-amber-200">
                                    <strong>Dossier incomplet:</strong>
                                    {!dossier.demandeurs_count && ' Aucun demandeur.'}
                                    {!dossier.proprietes_count && ' Aucune propriété.'}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}