// components/ProprieteDetailDialog.tsx - VERSION CORRIGÉE FERMETURE
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    Home, MapPin, FileText, Calendar, 
    Ruler, Users, Pencil, Archive, AlertCircle, Unlink
} from 'lucide-react';
import type { Propriete, Demandeur } from '@/types';

interface ProprieteDetailDialogProps {
    propriete: Propriete | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectDemandeur?: (demandeur: Demandeur) => void;
    dossierClosed?: boolean;
    onDissociate?: (
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => void;
}

export default function ProprieteDetailDialog({
    propriete,
    open,
    onOpenChange,
    onSelectDemandeur,
    dossierClosed = false,
    onDissociate
}: ProprieteDetailDialogProps) {
    if (!propriete) return null;

    // Récupérer demandeurs via demandes avec vérification stricte
    const demandeurs = propriete.demandes
        ?.map(d => d.demandeur)
        .filter((demandeur): demandeur is Demandeur => {
            return demandeur !== null && demandeur !== undefined && typeof demandeur === 'object';
        }) || [];

    const demandeursActifs = demandeurs.filter((d, index) => {
        if (!propriete.demandes || !propriete.demandes[index]) return false;
        return propriete.demandes[index].status === 'active';
    });

    const demandeursArchives = demandeurs.filter((d, index) => {
        if (!propriete.demandes || !propriete.demandes[index]) return false;
        return propriete.demandes[index].status === 'archive';
    });

    const formatNomComplet = (demandeur: Demandeur): string => {
        return [
            demandeur.titre_demandeur,
            demandeur.nom_demandeur,
            demandeur.prenom_demandeur
        ].filter(Boolean).join(' ');
    };

    // ✅ Handler de dissociation avec fermeture du dialogue parent
    const handleDissociate = (demandeur: Demandeur, e: React.MouseEvent) => {
        e.stopPropagation();
        
        console.log('🔗 Dissociation demandée (depuis propriété):', {
            demandeur_id: demandeur.id,
            demandeur_nom: formatNomComplet(demandeur),
            propriete_id: propriete.id,
            propriete_lot: propriete.lot,
        });
        
        if (!onDissociate || dossierClosed || propriete.is_archived) {
            console.warn('⚠️ Dissociation bloquée');
            return;
        }
        
        if (!canDissociate(demandeur)) {
            console.warn('⚠️ Ne peut pas dissocier ce demandeur');
            return;
        }
        
        // ✅ FERMER CE DIALOGUE AVANT D'OUVRIR LE DIALOGUE DE DISSOCIATION
        onOpenChange(false);
        
        // ✅ DÉLAI POUR ÉVITER LES CONFLITS
        setTimeout(() => {
            onDissociate(
                demandeur.id,
                propriete.id,
                formatNomComplet(demandeur),
                propriete.lot,
                'from-propriete'
            );
        }, 100);
    };

    // Vérification améliorée
    const canDissociate = (demandeur: Demandeur): boolean => {
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

    // ✅ Handler pour sélection de demandeur
    const handleSelectDemandeur = (demandeur: Demandeur) => {
        if (onSelectDemandeur) {
            // ✅ Fermer ce dialogue
            onOpenChange(false);
            // ✅ Ouvrir le dialogue du demandeur après un délai
            setTimeout(() => {
                onSelectDemandeur(demandeur);
            }, 100);
        }
    };

    // ✅ Handler pour le bouton Modifier
    const handleModifier = () => {
        onOpenChange(false);
        setTimeout(() => {
            window.location.href = route('proprietes.edit', propriete.id);
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
                                <Home className="h-6 w-6" />
                                Lot {propriete.lot}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {propriete.titre && (
                                    <Badge variant="outline">TNº{propriete.titre}</Badge>
                                )}
                                <Badge variant="default">
                                    {propriete.nature}
                                </Badge>
                                <Badge variant="secondary">
                                    {propriete.vocation}
                                </Badge>
                                {demandeursArchives.length > 0 && demandeursActifs.length === 0 && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                        <Archive className="mr-1 h-3 w-3" />
                                        Acquise
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Informations principales */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Informations principales
                        </h3>
                        <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                            <InfoRow 
                                icon={FileText} 
                                label="Type d'opération" 
                                value={propriete.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                                highlight
                            />
                            <InfoRow 
                                icon={Home} 
                                label="Lot" 
                                value={propriete.lot}
                                highlight 
                            />
                            <InfoRow icon={FileText} label="Titre" value={propriete.titre ? `TNº${propriete.titre}` : '-'} />
                            <InfoRow icon={FileText} label="Nature" value={propriete.nature} />
                            <InfoRow icon={FileText} label="Vocation" value={propriete.vocation} />
                            <InfoRow 
                                icon={Ruler} 
                                label="Contenance" 
                                value={propriete.contenance ? `${new Intl.NumberFormat('fr-FR').format(propriete.contenance)} m²` : '-'}
                            />
                        </div>
                    </section>

                    {/* Morcellement */}
                    {propriete.type_operation === 'morcellement' && (propriete.propriete_mere || propriete.titre_mere) && (
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Morcellement
                            </h3>
                            <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                                <InfoRow icon={Home} label="Propriété mère" value={propriete.propriete_mere} />
                                <InfoRow icon={FileText} label="Titre mère" value={propriete.titre_mere} />
                            </div>
                        </section>
                    )}

                    {/* Localisation */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Localisation et situation
                        </h3>
                        <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                            <InfoRow icon={MapPin} label="Situation (sise à)" value={propriete.situation} />
                            <InfoRow icon={FileText} label="Nom propriété / Propriétaire" value={propriete.proprietaire} />
                            <InfoRow icon={FileText} label="Charge" value={propriete.charge} />
                        </div>
                    </section>

                    {/* Informations administratives */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Informations administratives
                        </h3>
                        <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                            <InfoRow 
                                icon={FileText} 
                                label="Dep/Vol" 
                                value={propriete.dep_vol_complet || propriete.dep_vol}
                            />
                            <InfoRow icon={FileText} label="Numéro FNº" value={propriete.numero_FN} />
                            {propriete.type_operation === 'immatriculation' && (
                                <InfoRow icon={FileText} label="Nº Réquisition" value={propriete.numero_requisition} />
                            )}
                            <InfoRow 
                                icon={Calendar} 
                                label="Date de réquisition" 
                                value={propriete.date_requisition ? new Date(propriete.date_requisition).toLocaleDateString('fr-FR') : '-'}
                            />
                            <InfoRow 
                                icon={Calendar} 
                                label="Date d'inscription" 
                                value={propriete.date_inscription ? new Date(propriete.date_inscription).toLocaleDateString('fr-FR') : '-'}
                            />
                        </div>
                    </section>

                    {/* Demandeurs associés avec bouton dissocier */}
                    {demandeurs.length > 0 ? (
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Demandeurs associés ({demandeurs.length})
                            </h3>
                            <div className="space-y-2">
                                {demandeursActifs.length > 0 && (
                                    <>
                                        <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                                        {demandeursActifs.map((demandeur) => (
                                            <div
                                                key={demandeur.id}
                                                className="p-4 border rounded-lg hover:bg-muted/50 transition"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <button
                                                        onClick={() => handleSelectDemandeur(demandeur)}
                                                        className="flex-1 text-left hover:text-primary transition-colors"
                                                    >
                                                        <p className="font-medium">
                                                            {formatNomComplet(demandeur)}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground font-mono">
                                                            CIN: {demandeur.cin}
                                                        </p>
                                                        {demandeur.domiciliation && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {demandeur.domiciliation}
                                                            </p>
                                                        )}
                                                    </button>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="default">Actif</Badge>
                                                        {!dossierClosed && canDissociate(demandeur) && onDissociate && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => handleDissociate(demandeur, e)}
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
                                
                                {demandeursArchives.length > 0 && (
                                    <>
                                        {demandeursActifs.length > 0 && <Separator className="my-3" />}
                                        <p className="text-sm font-medium text-muted-foreground">Ayant acquis</p>
                                        {demandeursArchives.map((demandeur) => (
                                            <button
                                                key={demandeur.id}
                                                onClick={() => handleSelectDemandeur(demandeur)}
                                                className="w-full p-4 border rounded-lg hover:bg-muted/50 transition text-left bg-green-50/50"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">
                                                            {formatNomComplet(demandeur)}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground font-mono">
                                                            CIN: {demandeur.cin}
                                                        </p>
                                                        {demandeur.domiciliation && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {demandeur.domiciliation}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                                        <Archive className="mr-1 h-3 w-3" />
                                                        Acquis
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
                            <p>Aucun demandeur associé</p>
                        </div>
                    )}
                </div>

                {!dossierClosed && demandeursActifs.length > 0 && (
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