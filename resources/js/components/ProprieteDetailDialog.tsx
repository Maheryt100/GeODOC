// components/ProprieteDetailDialog.tsx
// Modal de détails complets d'une propriété avec ses demandeurs associés

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from '@inertiajs/react';
import { 
    Home, MapPin, FileText, Calendar, 
    Ruler, Users, Pencil, Archive, AlertCircle
} from 'lucide-react';
import type { Propriete, Demandeur } from '@/types';

interface ProprieteDetailDialogProps {
    propriete: Propriete | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectDemandeur?: (demandeur: Demandeur) => void;
    dossierClosed?: boolean;
    onEdit?: (propriete: Propriete) => void;
}

export default function ProprieteDetailDialog({
    propriete,
    open,
    onOpenChange,
    onSelectDemandeur,
    dossierClosed = false
}: ProprieteDetailDialogProps) {
    if (!propriete) return null;

    const isArchived = propriete.is_archived === true;
    const demandeurs = propriete.demandeurs || [];

    const demandeursActifs = demandeurs.filter(d => 
        !propriete.demandes?.some(dem => 
            dem.id_demandeur === d.id && dem.status === 'archive'
        )
    );

    const demandeursArchives = demandeurs.filter(d => 
        propriete.demandes?.some(dem => 
            dem.id_demandeur === d.id && dem.status === 'archive'
        )
    );

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

    function onEdit(propriete: Propriete) {
        throw new Error('Function not implemented.');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                                <Badge variant={isArchived ? "outline" : "default"}>
                                    {propriete.nature}
                                </Badge>
                                <Badge variant="secondary">
                                    {propriete.vocation}
                                </Badge>
                                {isArchived && (
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
                                value={propriete.contenance ? `${propriete.contenance} m²` : '-'}
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

                    {/* Demandeurs associés */}
                    {demandeurs.length > 0 && (
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
                                            <button
                                                key={demandeur.id}
                                                onClick={() => {
                                                    onOpenChange(false);
                                                    onSelectDemandeur?.(demandeur);
                                                }}
                                                className="w-full p-4 border rounded-lg hover:bg-muted/50 transition text-left"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">
                                                            {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
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
                                                    <Badge variant="default">Actif</Badge>
                                                </div>
                                            </button>
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
                                                onClick={() => {
                                                    onOpenChange(false);
                                                    onSelectDemandeur?.(demandeur);
                                                }}
                                                className="w-full p-4 border rounded-lg hover:bg-muted/50 transition text-left bg-green-50/50"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">
                                                            {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
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
                    )}

                    {demandeurs.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Aucun demandeur associé</p>
                        </div>
                    )}
                </div>
                {!dossierClosed && !isArchived && (
                    <Button 
                        onClick={() => {
                            onOpenChange(false);
                            // Petit délai pour laisser le modal se fermer
                            setTimeout(() => {
                                window.location.href = route('proprietes.edit', propriete.id);
                            }, 100);
                        }} 
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