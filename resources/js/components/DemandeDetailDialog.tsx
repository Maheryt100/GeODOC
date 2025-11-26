// components/DemandeDetailDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
    MapPin, FileText, Users, AlertCircle, 
    DollarSign, ArrowRight, X, Download, FileSpreadsheet
} from 'lucide-react';
import type { Demandeur, Propriete } from '@/types';

interface DemandeData {
    id: number;
    id_demandeur: number;
    id_propriete: number;
    total_prix: number;
    status: 'active' | 'archive';
    status_consort: boolean;
    motif_archive?: string | null;
    demandeur?: Demandeur;
    propriete?: Propriete;
    demandeurs?: Array<{
        id: number;
        id_demandeur: number;
        demandeur: Demandeur;
        total_prix: number;
        status_consort: boolean;
        status: string;
    }>;
    nombre_demandeurs?: number;
    created_at?: string;
    updated_at?: string;
}

interface DemandeDetailDialogProps {
    demande: DemandeData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectDemandeur?: (demandeur: Demandeur) => void;
    onSelectPropriete?: (propriete: Propriete) => void;
}

export default function DemandeDetailDialog({
    demande,
    open,
    onOpenChange,
    onSelectDemandeur,
    onSelectPropriete
}: DemandeDetailDialogProps) {
    if (!demande) return null;

    const propriete = demande.propriete;
    const demandeur = demande.demandeur;
    
    // ✅ Utiliser la liste complète des demandeurs si disponible
    const allDemandeurs = demande.demandeurs || (demandeur ? [{
        id: demande.id,
        id_demandeur: demande.id_demandeur,
        demandeur: demandeur,
        total_prix: demande.total_prix,
        status_consort: demande.status_consort,
        status: demande.status
    }] : []);

    const hasValidData = propriete && allDemandeurs.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    {/* ✅ UN SEUL bouton fermer */}
                    <div className="flex items-center justify-between pr-6">
                        <DialogTitle className="flex items-center gap-2 flex-wrap">
                            <FileText className="h-5 w-5" />
                            Détails de la demande
                            <Badge variant={demande.status === 'active' ? 'default' : 'secondary'}>
                                {demande.status === 'active' ? 'Active' : 'Archivée'}
                            </Badge>
                            {allDemandeurs.length > 1 && (
                                <Badge variant="outline">
                                    <Users className="mr-1 h-3 w-3" />
                                    {allDemandeurs.length} demandeur(s)
                                </Badge>
                            )}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {!hasValidData ? (
                    <div className="py-12 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
                        <div>
                            <p className="text-lg font-semibold">Données incomplètes</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Les informations de cette demande sont manquantes
                            </p>
                        </div>
                        <div className="bg-muted p-4 rounded-lg text-left max-w-md mx-auto space-y-2">
                            <p className="text-xs font-medium">État des données :</p>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                    {allDemandeurs.length > 0 ? '✅' : '❌'}
                                    <span>Demandeur(s) {allDemandeurs.length > 0 ? 'trouvé(s)' : 'non trouvé(s)'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {propriete ? '✅' : '❌'}
                                    <span>Propriété {propriete ? 'trouvée' : 'non trouvée'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* ✅ TOUS LES DEMANDEURS */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Demandeur{allDemandeurs.length > 1 ? 's' : ''} ({allDemandeurs.length})
                            </h3>
                            <div className="space-y-3">
                                {allDemandeurs.map((dem, index) => (
                                    <div 
                                        key={dem.id}
                                        className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition group"
                                        onClick={() => onSelectDemandeur?.(dem.demandeur)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">
                                                    {index === 0 ? 'Demandeur principal' : `Consort ${index}`}
                                                </p>
                                                {index > 0 && <Badge variant="secondary" className="text-xs">Consort</Badge>}
                                            </div>
                                            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Nom complet</p>
                                                <p className="text-sm font-medium">
                                                    {[
                                                        dem.demandeur.titre_demandeur,
                                                        dem.demandeur.nom_demandeur,
                                                        dem.demandeur.prenom_demandeur
                                                    ].filter(Boolean).join(' ')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">CIN</p>
                                                <p className="text-sm font-mono">{dem.demandeur.cin}</p>
                                            </div>
                                            {dem.demandeur.domiciliation && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Domiciliation</p>
                                                    <p className="text-sm">{dem.demandeur.domiciliation}</p>
                                                </div>
                                            )}
                                            {dem.demandeur.telephone && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Téléphone</p>
                                                    <p className="text-sm">{dem.demandeur.telephone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Propriété */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Propriété
                            </h3>
                            <div 
                                className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition group"
                                onClick={() => propriete && onSelectPropriete?.(propriete)}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Lot</p>
                                        <p className="font-medium text-lg flex items-center gap-2">
                                            {propriete.lot}
                                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Titre</p>
                                        <p className="font-mono">
                                            {propriete.titre ? `TNº${propriete.titre}` : <span className="text-muted-foreground italic">Non attribué</span>}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Contenance</p>
                                        <p>
                                            {propriete.contenance 
                                                ? `${new Intl.NumberFormat('fr-FR').format(propriete.contenance)} m²`
                                                : <span className="text-muted-foreground italic">Non définie</span>
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nature / Vocation</p>
                                        <p>{propriete.nature || '-'} / {propriete.vocation || '-'}</p>
                                    </div>
                                    
                                    {propriete.proprietaire && (
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">Propriétaire</p>
                                            <p className="text-sm">{propriete.proprietaire}</p>
                                        </div>
                                    )}
                                    
                                    {propriete.situation && (
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">Situation</p>
                                            <p className="text-sm">{propriete.situation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Détails financiers */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Détails financiers
                            </h3>
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Prix total</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {demande.total_prix 
                                            ? new Intl.NumberFormat('fr-FR').format(demande.total_prix)
                                            : '0'
                                        } Ar
                                    </p>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-sm text-muted-foreground mb-2">Type de demande</p>
                                    <Badge variant="outline" className="w-fit">
                                        {allDemandeurs.length > 1 ? '👥 Avec consorts' : '👤 Individuel'}
                                    </Badge>
                                </div>
                            </div>
                            
                            {propriete.contenance && demande.total_prix > 0 && (
                                <div className="mt-3 text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded">
                                    <p className="font-medium mb-1">Détail du calcul :</p>
                                    <p>• Prix au m² : {new Intl.NumberFormat('fr-FR').format(Math.round(demande.total_prix / propriete.contenance))} Ar</p>
                                    <p>• Contenance : {new Intl.NumberFormat('fr-FR').format(propriete.contenance)} m²</p>
                                    <p>• Vocation : {propriete.vocation}</p>
                                </div>
                            )}
                        </div>

                        {/* ✅ BOUTON TÉLÉCHARGER L'ACTE DE VENTE */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <a 
                                    href={route('demandes.download', demande.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Télécharger l'acte de vente
                                </a>
                            </Button>
                        </div>

                        {demande.status === 'archive' && (
                            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                        Demande archivée
                                    </p>
                                    {demande.motif_archive && (
                                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                            {demande.motif_archive}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}