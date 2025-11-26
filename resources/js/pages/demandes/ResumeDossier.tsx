// pages/demandes/ResumeDossier.tsx
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    FileText, Download, Archive, Eye, Search, 
    Users, MapPin, DollarSign, Filter 
} from 'lucide-react';
import type { Dossier, Demander, BreadcrumbItem } from '@/types';
import DemandeDetailDialog from '@/components/DemandeDetailDialog';
import DemandeurDetailDialog from '@/components/DemandeurDetailDialog';
import ProprieteDetailDialog from '@/components/ProprieteDetailDialog';

interface ResumeDossierProps {
    dossier: Dossier;
    documents: {
        data: Array<{
            id: number;
            id_propriete: number;
            propriete: any;
            demandeurs: any[];
            total_prix: number;
            status: string;
            status_consort: boolean;
            nombre_demandeurs: number;
        }>;
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function ResumeDossier({ dossier, documents }: ResumeDossierProps) {
    const [search, setSearch] = useState('');
    const [selectedDemande, setSelectedDemande] = useState<any>(null);
    const [showDemandeDetail, setShowDemandeDetail] = useState(false);
    const [selectedDemandeur, setSelectedDemandeur] = useState<any>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);
    const [selectedPropriete, setSelectedPropriete] = useState<any>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archive'>('all');

    // Handlers pour navigation entre modals
    const handleSelectDemande = (doc: any) => {
        // Construire l'objet complet avec propriété
        const demandeData = {
            ...doc.demandeurs[0], // Contient id, id_demandeur, demandeur, total_prix, status, status_consort
            propriete: doc.propriete, // Ajouter la propriété depuis doc
            nombre_demandeurs: doc.nombre_demandeurs //  Info bonus
        };
        
        
        setSelectedDemande(demandeData);
        setShowDemandeDetail(true);
    };

    const handleSelectDemandeurFromDemande = (demandeur: any) => {
        setSelectedDemandeur(demandeur);
        setShowDemandeurDetail(true);
    };

    const handleSelectProprieteFromDemande = (propriete: any) => {
        setSelectedPropriete(propriete);
        setShowProprieteDetail(true);
    };

    // Filtrage
    const filteredDocuments = documents.data.filter(doc => {
        const matchesSearch = search === '' || 
            doc.propriete.lot.toLowerCase().includes(search.toLowerCase()) ||
            doc.demandeurs.some(d => 
                d.demandeur.nom_demandeur.toLowerCase().includes(search.toLowerCase()) ||
                d.demandeur.cin.includes(search)
            );
        
        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Résumé des demandes', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Résumé - ${dossier.nom_dossier}`} />

            <div className="container mx-auto p-6 space-y-6">
                {/* En-tête avec statistiques */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Résumé des demandes - {dossier.nom_dossier}
                        </CardTitle>
                        <CardDescription>
                            {documents.total} demande(s) enregistrée(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total demandes</p>
                                    <p className="text-2xl font-bold">{documents.total}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <Users className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Actives</p>
                                    <p className="text-2xl font-bold">
                                        {documents.data.filter(d => d.status === 'active').length}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                <Archive className="h-8 w-8 text-orange-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Archivées</p>
                                    <p className="text-2xl font-bold">
                                        {documents.data.filter(d => d.status === 'archive').length}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                <MapPin className="h-8 w-8 text-purple-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Propriétés</p>
                                    <p className="text-2xl font-bold">{dossier.proprietes_count}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Filtres et recherche */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher par lot, nom ou CIN..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('all')}
                                >
                                    Toutes
                                </Button>
                                <Button
                                    variant={filterStatus === 'active' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('active')}
                                >
                                    Actives
                                </Button>
                                <Button
                                    variant={filterStatus === 'archive' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('archive')}
                                >
                                    Archivées
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Liste des demandes */}
                <div className="space-y-3">
                    {filteredDocuments.map((doc) => (
                        <Card 
                            key={doc.id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleSelectDemande(doc)} // ✅ Passer doc complet
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* Propriété */}
                                        <div>
                                            <p className="text-sm text-muted-foreground">Lot</p>
                                            <p className="font-bold text-lg">{doc.propriete?.lot || 'N/A'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {doc.propriete?.titre ? `TNº${doc.propriete.titre}` : 'Sans titre'}
                                            </p>
                                        </div>

                                        {/* Demandeur(s) */}
                                        <div>
                                            <p className="text-sm text-muted-foreground">Demandeur(s)</p>
                                            <p className="font-medium">
                                                {doc.demandeurs[0]?.demandeur?.nom_demandeur || 'N/A'} {doc.demandeurs[0]?.demandeur?.prenom_demandeur || ''}
                                            </p>
                                            {doc.nombre_demandeurs > 1 && (
                                                <Badge variant="secondary" className="text-xs mt-1">
                                                    +{doc.nombre_demandeurs - 1} consort(s)
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Prix */}
                                        <div>
                                            <p className="text-sm text-muted-foreground">Prix total</p>
                                            <p className="font-bold text-primary">
                                                {doc.total_prix 
                                                    ? new Intl.NumberFormat('fr-FR').format(doc.total_prix) 
                                                    : '0'
                                                } Ar
                                            </p>
                                        </div>

                                        {/* Statut */}
                                        <div className="flex items-center gap-2">
                                            <Badge 
                                                variant={doc.status === 'active' ? 'default' : 'secondary'}
                                                className="h-fit"
                                            >
                                                {doc.status === 'active' ? 'Active' : 'Archivée'}
                                            </Badge>
                                            {doc.status_consort && (
                                                <Badge variant="outline" className="h-fit">
                                                    Consorts
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleSelectDemande(doc)}
                                            title="Voir détails"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            title="Télécharger"
                                        >
                                            <a href={route('demandes.download', doc.id)}>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredDocuments.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    {search || filterStatus !== 'all' 
                                        ? 'Aucune demande ne correspond aux filtres'
                                        : 'Aucune demande enregistrée'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Modals */}
            <DemandeDetailDialog
                demande={selectedDemande}
                open={showDemandeDetail}
                onOpenChange={setShowDemandeDetail}
                onSelectDemandeur={handleSelectDemandeurFromDemande}
                onSelectPropriete={handleSelectProprieteFromDemande}
            />

            <DemandeurDetailDialog
                demandeur={selectedDemandeur}
                open={showDemandeurDetail}
                onOpenChange={setShowDemandeurDetail}
                proprietes={dossier.proprietes || []}
                onSelectPropriete={handleSelectProprieteFromDemande}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
            />

            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={setShowProprieteDetail}
                onSelectDemandeur={handleSelectDemandeurFromDemande}
                dossierClosed={dossier.is_closed}
            />
        </AppLayout>
    );
}