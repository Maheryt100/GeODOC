// components/DemandeurDetailDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    User, Calendar, MapPin, Phone, FileText, 
    Heart, Briefcase, Users, Home, Pencil,
    Archive, AlertCircle, Unlink
} from 'lucide-react';
import type { Demandeur, Propriete } from '@/types';

interface DemandeurDetailDialogProps {
    demandeur: Demandeur | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proprietes?: Propriete[];
    onSelectPropriete?: (propriete: Propriete) => void;
    dossierId: number;
    dossierClosed?: boolean;
    onDissociate?: (
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => void;
}

export default function DemandeurDetailDialog({
    demandeur,
    open,
    onOpenChange,
    proprietes = [],
    onSelectPropriete,
    dossierId,
    dossierClosed = false,
    onDissociate
}: DemandeurDetailDialogProps) {
    if (!demandeur) return null;

    // Filtrer via demandes avec vérification stricte
    const proprietesAssociees = proprietes.filter(prop => {
        if (!prop.demandes || !Array.isArray(prop.demandes) || prop.demandes.length === 0) {
            return false;
        }
        
        return prop.demandes.some(d => {
            const demandeIdDemandeur = typeof d.id_demandeur === 'number' 
                ? d.id_demandeur 
                : parseInt(d.id_demandeur);
            const currentDemandeurId = typeof demandeur.id === 'number'
                ? demandeur.id
                : parseInt(demandeur.id);
                
            return demandeIdDemandeur === currentDemandeurId;
        });
    });

    // Séparer actives et acquises
    const proprietesActives = proprietesAssociees.filter(p => {
        if (!p.demandes) return false;
        
        return p.demandes.some(d => {
            const demandeIdDemandeur = typeof d.id_demandeur === 'number' 
                ? d.id_demandeur 
                : parseInt(d.id_demandeur);
            const currentDemandeurId = typeof demandeur.id === 'number'
                ? demandeur.id
                : parseInt(demandeur.id);
                
            return demandeIdDemandeur === currentDemandeurId && d.status === 'active';
        });
    });

    const proprietesAcquises = proprietesAssociees.filter(p => {
        if (!p.demandes) return false;
        
        return p.demandes.some(d => {
            const demandeIdDemandeur = typeof d.id_demandeur === 'number' 
                ? d.id_demandeur 
                : parseInt(d.id_demandeur);
            const currentDemandeurId = typeof demandeur.id === 'number'
                ? demandeur.id
                : parseInt(demandeur.id);
                
            return demandeIdDemandeur === currentDemandeurId && d.status === 'archive';
        });
    });

    const formatNomComplet = (): string => {
        return [
            demandeur.titre_demandeur,
            demandeur.nom_demandeur,
            demandeur.prenom_demandeur
        ].filter(Boolean).join(' ');
    };

    // ✅ Handler de dissociation avec fermeture du dialogue
    const handleDissociate = (propriete: Propriete, e: React.MouseEvent) => {
        e.stopPropagation();
        
        console.log('🔗 Dissociation demandée (depuis demandeur):', {
            demandeur_id: demandeur.id,
            propriete_id: propriete.id,
        });
        
        if (!onDissociate || dossierClosed) {
            console.warn('⚠️ Dissociation bloquée');
            return;
        }
        
        if (!canDissociate(propriete)) {
            console.warn('⚠️ Ne peut pas dissocier cette propriété');
            return;
        }
        
        // ✅ FERMER CE DIALOGUE AVANT D'OUVRIR LE DIALOGUE DE DISSOCIATION
        onOpenChange(false);
        
        // ✅ DÉLAI POUR ÉVITER LES CONFLITS
        setTimeout(() => {
            onDissociate(
                demandeur.id,
                propriete.id,
                formatNomComplet(),
                propriete.lot,
                'from-demandeur'
            );
        }, 100);
    };

    // Vérification améliorée
    const canDissociate = (propriete: Propriete): boolean => {
        if (dossierClosed || propriete.is_archived) {
            return false;
        }
        
        if (!propriete.demandes || !Array.isArray(propriete.demandes)) {
            return false;
        }
        
        const demande = propriete.demandes.find(d => {
            const demandeIdDemandeur = typeof d.id_demandeur === 'number' 
                ? d.id_demandeur 
                : parseInt(d.id_demandeur);
            const currentDemandeurId = typeof demandeur.id === 'number'
                ? demandeur.id
                : parseInt(demandeur.id);
                
            return demandeIdDemandeur === currentDemandeurId;
        });
        
        if (!demande) {
            return false;
        }
        
        return demande.status === 'active';
    };

    // ✅ Handler pour sélection de propriété
    const handleSelectPropriete = (propriete: Propriete) => {
        if (onSelectPropriete) {
            // ✅ Fermer ce dialogue
            onOpenChange(false);
            // ✅ Ouvrir le dialogue de la propriété après un délai
            setTimeout(() => {
                onSelectPropriete(propriete);
            }, 100);
        }
    };

    // ✅ Handler pour le bouton Modifier
    const handleModifier = () => {
        onOpenChange(false);
        setTimeout(() => {
            window.location.href = route('demandeurs.edit', { 
                id_dossier: dossierId, 
                id_demandeur: demandeur.id 
            });
        }, 100);
    };

    const InfoRow = ({ icon: Icon, label, value, highlight = false }: any) => {
        if (!value || value === '-') return null;
        return (
            <div className="flex items-start gap-3 py-2">
                <Icon className={`h-5 w-5 mt-0.5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className={`text-sm ${highlight ? 'font-semibold' : ''} break-words`}>{value}</p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="max-w-4xl max-h-[90vh] overflow-y-auto"
                // ✅ Permettre la fermeture normale
                onPointerDownOutside={(e) => {
                    // Permettre la fermeture en cliquant à l'extérieur
                }}
            >
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <User className="h-6 w-6" />
                                {formatNomComplet()}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className="font-mono">
                                    CIN: {demandeur.cin}
                                </Badge>
                                {proprietesActives.length > 0 && (
                                    <Badge variant="default">
                                        {proprietesActives.length} propriété(s) active(s)
                                    </Badge>
                                )}
                                {proprietesAcquises.length > 0 && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                        <Archive className="mr-1 h-3 w-3" />
                                        {proprietesAcquises.length} acquise(s)
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Informations personnelles */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informations personnelles
                        </h3>
                        <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                            <InfoRow 
                                icon={Calendar} 
                                label="Date de naissance" 
                                value={demandeur.date_naissance ? new Date(demandeur.date_naissance).toLocaleDateString('fr-FR') : '-'}
                                highlight
                            />
                            <InfoRow icon={MapPin} label="Lieu de naissance" value={demandeur.lieu_naissance} />
                            <InfoRow icon={User} label="Sexe" value={demandeur.sexe} />
                            <InfoRow icon={Briefcase} label="Occupation" value={demandeur.occupation} />
                            <InfoRow icon={Users} label="Nom du père" value={demandeur.nom_pere} />
                            <InfoRow icon={Users} label="Nom de la mère" value={demandeur.nom_mere} />
                        </div>
                    </section>

                    {/* CIN */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Carte d'identité nationale
                        </h3>
                        <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                            <InfoRow 
                                icon={FileText} 
                                label="Numéro CIN" 
                                value={demandeur.cin}
                                highlight 
                            />
                            <InfoRow 
                                icon={Calendar} 
                                label="Date de délivrance" 
                                value={demandeur.date_delivrance ? new Date(demandeur.date_delivrance).toLocaleDateString('fr-FR') : '-'}
                            />
                            <InfoRow icon={MapPin} label="Lieu de délivrance" value={demandeur.lieu_delivrance} />
                            {(demandeur.date_delivrance_duplicata || demandeur.lieu_delivrance_duplicata) && (
                                <>
                                    <Separator className="my-2" />
                                    <p className="text-sm font-medium text-muted-foreground">Duplicata</p>
                                    <InfoRow 
                                        icon={Calendar} 
                                        label="Date duplicata" 
                                        value={demandeur.date_delivrance_duplicata ? new Date(demandeur.date_delivrance_duplicata).toLocaleDateString('fr-FR') : '-'}
                                    />
                                    <InfoRow icon={MapPin} label="Lieu duplicata" value={demandeur.lieu_delivrance_duplicata} />
                                </>
                            )}
                        </div>
                    </section>

                    {/* Contact et domicile */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Contact et domiciliation
                        </h3>
                        <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                            <InfoRow icon={MapPin} label="Domiciliation" value={demandeur.domiciliation} highlight />
                            <InfoRow icon={Phone} label="Téléphone" value={demandeur.telephone} />
                            <InfoRow icon={FileText} label="Nationalité" value={demandeur.nationalite} />
                        </div>
                    </section>

                    {/* Situation familiale */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Situation familiale
                        </h3>
                        <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                            <InfoRow icon={Heart} label="Situation" value={demandeur.situation_familiale} />
                            <InfoRow icon={FileText} label="Régime matrimonial" value={demandeur.regime_matrimoniale} />
                            {demandeur.situation_familiale === 'Marié(e)' && (
                                <>
                                    <Separator className="my-2" />
                                    <InfoRow icon={Users} label="Marié(e) à" value={demandeur.marie_a} />
                                    <InfoRow 
                                        icon={Calendar} 
                                        label="Date de mariage" 
                                        value={demandeur.date_mariage ? new Date(demandeur.date_mariage).toLocaleDateString('fr-FR') : '-'}
                                    />
                                    <InfoRow icon={MapPin} label="Lieu de mariage" value={demandeur.lieu_mariage} />
                                </>
                            )}
                        </div>
                    </section>

                    {/* Propriétés associées avec bouton dissocier */}
                    {proprietesAssociees.length > 0 ? (
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                Propriétés associées ({proprietesAssociees.length})
                            </h3>
                            <div className="space-y-2">
                                {proprietesActives.length > 0 && (
                                    <>
                                        <p className="text-sm font-medium text-muted-foreground">Actives</p>
                                        {proprietesActives.map((prop) => (
                                            <div
                                                key={prop.id}
                                                className="p-4 border rounded-lg hover:bg-muted/50 transition"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <button
                                                        onClick={() => handleSelectPropriete(prop)}
                                                        className="flex-1 text-left hover:text-primary transition-colors"
                                                    >
                                                        <p className="font-medium">Lot {prop.lot}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {prop.titre && `TNº${prop.titre} • `}
                                                            {prop.nature} • {prop.vocation}
                                                            {prop.contenance && ` • ${new Intl.NumberFormat('fr-FR').format(prop.contenance)} m²`}
                                                        </p>
                                                    </button>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="default">Active</Badge>
                                                        {!dossierClosed && canDissociate(prop) && onDissociate && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => handleDissociate(prop, e)}
                                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                            >
                                                                <Unlink className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                
                                {proprietesAcquises.length > 0 && (
                                    <>
                                        {proprietesActives.length > 0 && <Separator className="my-3" />}
                                        <p className="text-sm font-medium text-muted-foreground">Acquises</p>
                                        {proprietesAcquises.map((prop) => (
                                            <button
                                                key={prop.id}
                                                onClick={() => handleSelectPropriete(prop)}
                                                className="w-full p-4 border rounded-lg hover:bg-muted/50 transition text-left bg-green-50/50"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">Lot {prop.lot}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {prop.titre && `TNº${prop.titre} • `}
                                                            {prop.nature} • {prop.vocation}
                                                            {prop.contenance && ` • ${new Intl.NumberFormat('fr-FR').format(prop.contenance)} m²`}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                                        <Archive className="mr-1 h-3 w-3" />
                                                        Acquise
                                                    </Badge>
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        </section>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Aucune propriété associée</p>
                        </div>
                    )}
                </div>

                {!dossierClosed && (
                    <Button 
                        onClick={handleModifier}
                        size="sm"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}