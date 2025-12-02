// ✅ EXEMPLE : Page de génération de documents avec aperçu des demandeurs
// documents/DocumentGenerationPreview.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import DemandeursListWithOrder from '@/pages/demandeurs/components/DemandeursListWithOrder';
import type { Propriete } from '@/types';

interface DocumentGenerationPreviewProps {
    propriete: Propriete;
    documentType: 'RECU' | 'ADV' | 'CSF' | 'REQ';
    onGenerate: () => void;
}

export default function DocumentGenerationPreview({
    propriete,
    documentType,
    onGenerate
}: DocumentGenerationPreviewProps) {
    
    // ✅ Préparer les demandeurs avec ordre
    const demandeursWithOrder = propriete.demandes
        ?.filter(d => d.status === 'active')
        .map(demande => ({
            demandeur: demande.demandeur,
            ordre: demande.ordre || 1,
            status: demande.status as 'active' | 'archive',
            total_prix: demande.total_prix || 0,
        })) || [];

    const principal = demandeursWithOrder.find(d => d.ordre === 1);
    const consorts = demandeursWithOrder.filter(d => d.ordre > 1);

    return (
        <div className="space-y-6">
            {/* Informations propriété */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Aperçu du Document
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Lot</p>
                            <p className="font-semibold">{propriete.lot}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Titre</p>
                            <p className="font-semibold">TNº{propriete.titre}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Contenance</p>
                            <p className="font-semibold">
                                {new Intl.NumberFormat('fr-FR').format(propriete.contenance || 0)} m²
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Nature / Vocation</p>
                            <p className="font-semibold">{propriete.nature} / {propriete.vocation}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ✅ Demandeurs avec hiérarchie claire */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {documentType === 'ADV' && consorts.length > 0 ? (
                            <>Demandeur Principal et Consorts</>
                        ) : (
                            <>Demandeur{demandeursWithOrder.length > 1 ? 's' : ''}</>
                        )}
                    </CardTitle>
                    {documentType === 'ADV' && consorts.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Document avec consorts : {principal?.demandeur.nom_complet} et {consorts.length} consort(s)
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    {/* ✅ UTILISER DemandeursListWithOrder */}
                    <DemandeursListWithOrder
                        demandeurs={demandeursWithOrder}
                        canDissociate={false} // Pas de dissociation ici
                        showPrices={true}
                    />
                </CardContent>
            </Card>

            {/* Bouton génération */}
            <div className="flex justify-end">
                <Button onClick={onGenerate} size="lg" className="gap-2">
                    <Download className="h-5 w-5" />
                    Générer le Document
                </Button>
            </div>
        </div>
    );
}