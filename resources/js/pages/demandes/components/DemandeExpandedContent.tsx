// pages/demandes/components/DemandeExpandedContent.tsx - VERSION CORRIGÉE
import { Badge } from '@/components/ui/badge';
import { Home, Users, AlertCircle } from 'lucide-react';

interface DemandeExpandedContentProps {
    doc: {
        propriete: any;
        demandeurs: any[];
        nombre_demandeurs: number;
    };
    formatNomComplet: (demandeur: any) => string;
    isDemandeurIncomplete: (demandeur: any) => boolean;
}

export default function DemandeExpandedContent({
    doc,
    formatNomComplet,
    isDemandeurIncomplete
}: DemandeExpandedContentProps) {
    // ✅ CORRECTION : Vérifier que demandeurs existe ET n'est pas vide
    const hasValidDemandeurs = doc.demandeurs && Array.isArray(doc.demandeurs) && doc.demandeurs.length > 0;

    return (
        <div className="mt-4 pt-4 border-t space-y-4">
            {/* Info Propriété détaillée */}
            <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Home className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-900 dark:text-green-100">
                        Détails de la propriété
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                        <span className="font-medium text-muted-foreground">Contenance:</span>
                        <p className="font-semibold">
                            {doc.propriete?.contenance 
                                ? `${new Intl.NumberFormat('fr-FR').format(doc.propriete.contenance)} m²` 
                                : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">Nature:</span>
                        <p className="font-semibold">{doc.propriete?.nature || '-'}</p>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">Vocation:</span>
                        <p className="font-semibold">{doc.propriete?.vocation || '-'}</p>
                    </div>
                    {doc.propriete?.proprietaire && (
                        <div className="col-span-2 md:col-span-3">
                            <span className="font-medium text-muted-foreground">Propriétaire:</span>
                            <p className="font-semibold">{doc.propriete.proprietaire}</p>
                        </div>
                    )}
                    {doc.propriete?.situation && (
                        <div className="col-span-2 md:col-span-3">
                            <span className="font-medium text-muted-foreground">Situation:</span>
                            <p className="font-semibold">{doc.propriete.situation}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ CORRECTION : Afficher TOUJOURS la liste si demandeurs existe */}
            {hasValidDemandeurs ? (
                <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5 text-blue-600" />
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                            {doc.nombre_demandeurs > 1 
                                ? `Liste complète des demandeurs (${doc.nombre_demandeurs})`
                                : 'Informations du demandeur'
                            }
                        </p>
                    </div>
                    <div className="space-y-2">
                        {doc.demandeurs.map((dem: any, idx: number) => {
                            // ✅ Vérifier que dem.demandeur existe
                            if (!dem?.demandeur) {
                                console.warn('Demandeur manquant pour:', dem);
                                return null;
                            }

                            return (
                                <div 
                                    key={dem.id || idx}
                                    className="flex items-center justify-between p-3 bg-background rounded-lg text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {formatNomComplet(dem.demandeur)}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                CIN: {dem.demandeur?.cin || 'N/A'}
                                            </p>
                                            {dem.demandeur?.domiciliation && (
                                                <p className="text-xs text-muted-foreground">
                                                    {dem.demandeur.domiciliation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {isDemandeurIncomplete(dem.demandeur) && (
                                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-300">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Incomplet
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                // ✅ Message si pas de demandeurs
                <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <p className="font-semibold text-orange-900 dark:text-orange-100">
                            Aucun demandeur associé
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Cette propriété n'a pas encore de demandeur lié.
                    </p>
                </div>
            )}
        </div>
    );
}