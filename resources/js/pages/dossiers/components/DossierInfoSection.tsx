// resources/js/pages/dossiers/components/DossierInfoSection.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Lock, LockOpen, Pencil, LandPlot, FileOutput, FileText,
    MapPin, Calendar, Building2, Hash, User, Clock, AlertCircle
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface DossierInfoSectionProps {
    dossier: {
        id: number;
        nom_dossier: string;
        numero_ouverture?: string;
        numero_ouverture_display?: string;
        circonscription: string;
        type_commune: string;
        commune: string;
        fokontany: string;
        date_descente_debut: string;
        date_descente_fin: string;
        date_ouverture: string;
        date_fermeture?: string | null;
        motif_fermeture?: string | null;
        is_closed: boolean;
        can_close?: boolean;
        can_modify?: boolean;
        closedBy?: {
            name: string;
        };
    };
    demandeursCount: number;
    proprietesCount: number;
    onCloseToggle: () => void;
}

export default function DossierInfoSection({ 
    dossier, 
    demandeursCount, 
    proprietesCount,
    onCloseToggle 
}: DossierInfoSectionProps) {
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const getDurationInDays = () => {
        const start = new Date(dossier.date_descente_debut);
        const end = new Date(dossier.date_descente_fin);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getDaysSinceOpening = () => {
        const opening = new Date(dossier.date_ouverture);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - opening.getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const duration = getDurationInDays();
    const daysSinceOpening = getDaysSinceOpening();

    // ✅ DEBUG : Afficher la valeur de can_close
    console.log('🔍 DossierInfoSection - Permissions:', {
        can_close: dossier.can_close,
        can_modify: dossier.can_modify,
        is_closed: dossier.is_closed
    });

    return (
        <div className="space-y-6">
            {/* ✅ Alerte si dossier fermé - AVEC BOUTON ROUVRIR */}
            {dossier.is_closed && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                                        Dossier fermé
                                    </h4>
                                    <p className="text-sm text-orange-800 dark:text-orange-300">
                                        Fermé le <strong>{formatDate(dossier.date_fermeture!)}</strong>
                                        {dossier.closedBy && <> par <strong>{dossier.closedBy.name}</strong></>}
                                    </p>
                                    {dossier.motif_fermeture && (
                                        <p className="text-sm text-orange-700 dark:text-orange-400 mt-2 italic">
                                            Motif : {dossier.motif_fermeture}
                                        </p>
                                    )}
                                    <p className="text-sm text-orange-600 dark:text-orange-500 mt-2">
                                        Aucune modification possible. Seuls les administrateurs peuvent rouvrir ce dossier.
                                    </p>
                                </div>
                                
                                {/* ✅ BOUTON ROUVRIR dans l'alerte - TOUJOURS VISIBLE si permission */}
                                {dossier.can_close === true && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={onCloseToggle}
                                        className="bg-green-600 hover:bg-green-700 shrink-0"
                                    >
                                        <LockOpen className="mr-2 h-4 w-4" />
                                        Rouvrir
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Card className="border-0 shadow-lg">
                {/* Header avec gradient et boutons d'action */}
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 border-b">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Titre et informations */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {dossier.nom_dossier}
                                </h1>
                                {dossier.is_closed ? (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400">
                                        <Lock className="mr-1 h-3 w-3" />
                                        Fermé
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400">
                                        <LockOpen className="mr-1 h-3 w-3" />
                                        Ouvert
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Hash className="h-4 w-4" />
                                <span className="font-mono text-sm">
                                    {dossier.numero_ouverture_display || dossier.numero_ouverture || 'Non assigné'}
                                </span>
                            </div>
                        </div>

                        {/* ✅ Boutons d'action - AVEC BOUTON FERMER/ROUVRIR PRINCIPAL */}
                        <div className="flex flex-wrap gap-2">
                            {/* ✅ BOUTON FERMER/ROUVRIR - VISIBLE SI PERMISSION */}
                            {dossier.can_close === true && (
                                <Button
                                    variant={dossier.is_closed ? "default" : "destructive"}
                                    size="sm"
                                    onClick={onCloseToggle}
                                    className={dossier.is_closed 
                                        ? "bg-green-600 hover:bg-green-700" 
                                        : "bg-orange-600 hover:bg-orange-700"
                                    }
                                >
                                    {dossier.is_closed ? (
                                        <>
                                            <LockOpen className="mr-2 h-4 w-4" />
                                            Rouvrir le dossier
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Fermer le dossier
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* Nouvelle entrée - seulement si ouvert */}
                            {!dossier.is_closed && (
                                <Button asChild size="sm">
                                    <Link href={`/nouveau-lot/${dossier.id}`}>
                                        <LandPlot className="mr-2 h-4 w-4" />
                                        Nouvelle entrée
                                    </Link>
                                </Button>
                            )}

                            {/* Modifier - désactivé si fermé sans permission */}
                            {dossier.can_modify && (
                                <Button 
                                    asChild 
                                    variant="outline" 
                                    size="sm"
                                    disabled={dossier.is_closed && !dossier.can_close}
                                >
                                    <Link href={`/dossiers/${dossier.id}/edit`}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                            )}
                            
                            {/* Documents - toujours accessible */}
                            <Button asChild size="sm" variant="outline">
                                <Link href={`/documents/generate/${dossier.id}`}>
                                    <FileOutput className="mr-2 h-4 w-4" />
                                    Documents
                                </Link>
                            </Button>
                            
                            {/* Résumé - toujours accessible */}
                            <Button asChild size="sm" variant="outline">
                                <Link href={`/demandes/resume/${dossier.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Résumé
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-8">
                    {/* Section Localisation */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 pb-3 border-b">
                            <MapPin className="h-4 w-4" />
                            <span>Localisation</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                            Circonscription
                                        </p>
                                        <p className="text-base font-semibold truncate">
                                            {dossier.circonscription}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                            Commune
                                        </p>
                                        <p className="text-base font-semibold">
                                            {dossier.type_commune}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {dossier.commune}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                            Fokontany
                                        </p>
                                        <p className="text-base font-semibold truncate">
                                            {dossier.fokontany}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Dates */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 pb-3 border-b">
                            <Calendar className="h-4 w-4" />
                            <span>Dates</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                            Période de descente
                                        </p>
                                        <div className="space-y-1">
                                            <p className="text-sm">
                                                <span className="font-medium">Du :</span> {formatDate(dossier.date_descente_debut)}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">Au :</span> {formatDate(dossier.date_descente_fin)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Durée : {duration} jour{duration > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900">
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                            Date d'ouverture
                                        </p>
                                        <p className="text-base font-semibold">
                                            {formatDate(dossier.date_ouverture)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Il y a {daysSinceOpening} jour{daysSinceOpening > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                        <Badge variant="secondary" className="px-4 py-2 text-sm">
                            <User className="mr-2 h-4 w-4" />
                            {demandeursCount} Demandeur{demandeursCount > 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary" className="px-4 py-2 text-sm">
                            <LandPlot className="mr-2 h-4 w-4" />
                            {proprietesCount} Propriété{proprietesCount > 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline" className="px-4 py-2 text-sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            Ouvert le {formatDate(dossier.date_ouverture)}
                        </Badge>
                        {dossier.is_closed && dossier.date_fermeture && (
                            <Badge variant="outline" className="px-4 py-2 text-sm bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400">
                                <Lock className="mr-2 h-4 w-4" />
                                Fermé le {formatDate(dossier.date_fermeture)}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}