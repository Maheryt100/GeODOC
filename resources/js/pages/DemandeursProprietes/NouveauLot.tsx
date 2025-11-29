// pages/DemandeursProprietes/NouveauLot.tsx

import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import { Save, Plus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem, Dossier } from '@/types';

import ProprieteCreate, { 
    ProprieteFormData, 
    emptyPropriete 
} from '@/pages/proprietes/create';

import DemandeurCreate, { 
    DemandeurFormData, 
    emptyDemandeur 
} from '@/pages/demandeurs/create';

type CreationMode = 'lot-demandeur' | 'lots-only' | 'demandeurs-only';

export default function NouveauLot() {
    const { dossier } = usePage<{ dossier: Dossier }>().props;
    const [creationMode, setCreationMode] = useState<CreationMode>('lot-demandeur');
    const [processing, setProcessing] = useState(false);
    
    const [proprietes, setProprietes] = useState<ProprieteFormData[]>([{ ...emptyPropriete }]);
    const [demandeurs, setDemandeurs] = useState<DemandeurFormData[]>([{ ...emptyDemandeur }]);
    const [selectedChargesByPropriete, setSelectedChargesByPropriete] = useState<Record<number, string[]>>({ 0: [] });

    // ========== GESTION DES PROPRIÉTÉS ==========
    const addPropriete = () => {
        setProprietes([...proprietes, { ...emptyPropriete }]);
        setSelectedChargesByPropriete({
            ...selectedChargesByPropriete,
            [proprietes.length]: []
        });
    };

    const removePropriete = (index: number) => {
        if (proprietes.length === 1) {
            toast.error('Au moins une propriété est requise');
            return;
        }
        const newProprietes = proprietes.filter((_, i) => i !== index);
        setProprietes(newProprietes);
        
        const newCharges = { ...selectedChargesByPropriete };
        delete newCharges[index];
        setSelectedChargesByPropriete(newCharges);
    };

    const updatePropriete = (index: number, field: keyof ProprieteFormData, value: string) => {
        const newProprietes = [...proprietes];
        newProprietes[index] = { ...newProprietes[index], [field]: value };
        setProprietes(newProprietes);
    };

    const handleChargeChange = (proprieteIndex: number, charge: string, checked: boolean) => {
        let newCharges: string[];
        const currentCharges = selectedChargesByPropriete[proprieteIndex] || [];
        
        if (checked) {
            if (charge === "Aucune") {
                newCharges = ["Aucune"];
            } else {
                newCharges = currentCharges.filter(c => c !== "Aucune");
                newCharges = [...newCharges, charge];
            }
        } else {
            newCharges = currentCharges.filter(c => c !== charge);
        }
        
        setSelectedChargesByPropriete({
            ...selectedChargesByPropriete,
            [proprieteIndex]: newCharges
        });
        
        updatePropriete(proprieteIndex, 'charge', newCharges.join(', '));
    };

    // ========== GESTION DES DEMANDEURS ==========

    
    const addDemandeur = () => {
        setDemandeurs([...demandeurs, { ...emptyDemandeur }]);
    };

    const removeDemandeur = (index: number) => {
        if (demandeurs.length === 1) {
            toast.error('Au moins un demandeur est requis');
            return;
        }
        const newDemandeurs = demandeurs.filter((_, i) => i !== index);
        setDemandeurs(newDemandeurs);
    };

    const updateDemandeur = (index: number, field: keyof DemandeurFormData, value: string) => {
        // ✅ FIX : Créer une nouvelle copie profonde
        setDemandeurs(prev => {
            const newDemandeurs = prev.map((d, i) => {
                if (i === index) {
                    return { ...d, [field]: value };
                }
                return d;
            });
            return newDemandeurs;
        });
    };
    // ========== VALIDATION AMÉLIORÉE ==========
    const validateProprietes = (): boolean => {
        for (let i = 0; i < proprietes.length; i++) {
            const p = proprietes[i];
            
            if (!p.lot?.trim()) {
                toast.error(`Propriété ${i + 1}: Le lot est obligatoire`);
                return false;
            }
            if (!p.type_operation) {
                toast.error(`Propriété ${i + 1}: Le type d'opération est obligatoire`);
                return false;
            }
            if (!p.nature) {
                toast.error(`Propriété ${i + 1}: La nature est obligatoire`);
                return false;
            }
            if (!p.vocation) {
                toast.error(`Propriété ${i + 1}: La vocation est obligatoire`);
                return false;
            }
        }
        return true;
    };

    const validateDemandeurs = (): boolean => {
        for (let i = 0; i < demandeurs.length; i++) {
            const d = demandeurs[i];
            
            // ✅ Validation stricte avec trim() pour éviter les espaces
            if (!d.titre_demandeur?.trim()) {
                toast.error(`Demandeur ${i + 1}: Le titre de civilité est obligatoire`);
                return false;
            }
            if (!d.nom_demandeur?.trim()) {
                toast.error(`Demandeur ${i + 1}: Le nom est obligatoire`);
                return false;
            }
            if (!d.prenom_demandeur?.trim()) {
                toast.error(`Demandeur ${i + 1}: Le prénom est obligatoire`);
                return false;
            }
            if (!d.date_naissance) {
                toast.error(`Demandeur ${i + 1}: La date de naissance est obligatoire`);
                return false;
            }
            
            // ✅ Validation CIN améliorée
            if (!d.cin) {
                toast.error(`Demandeur ${i + 1}: Le CIN est obligatoire`);
                return false;
            }
            if (!/^\d{12}$/.test(d.cin)) {
                toast.error(`Demandeur ${i + 1}: Le CIN doit contenir exactement 12 chiffres (actuellement: ${d.cin.length} caractères)`);
                return false;
            }
            
            // ✅ Vérifier les doublons de CIN
            const cinDuplicates = demandeurs.filter((dem, idx) => idx !== i && dem.cin === d.cin);
            if (cinDuplicates.length > 0) {
                toast.error(`Demandeur ${i + 1}: Ce CIN est utilisé plusieurs fois`);
                return false;
            }
        }
        return true;
    };

    // ========== SOUMISSION ==========
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation selon le mode
        if (creationMode === 'lots-only' || creationMode === 'lot-demandeur') {
            if (!validateProprietes()) return;
        }

        if (creationMode === 'demandeurs-only' || creationMode === 'lot-demandeur') {
            if (!validateDemandeurs()) return;
        }

        setProcessing(true);

        // Soumission selon le mode
        if (creationMode === 'lot-demandeur') {
            router.post(route('nouveau-lot.store'), {
                id_dossier: dossier.id,
                ...proprietes[0],
                demandeurs_json: JSON.stringify(demandeurs)
            }, {
                onError: (errors) => {
                    console.error('Erreurs de validation:', errors);
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                        .join('\n');
                    
                    toast.error('Erreur de validation', {
                        description: errorMessages
                    });
                    setProcessing(false);
                },
                onSuccess: () => {
                    toast.success('Lot et demandeur(s) créés avec succès !');
                }
            });
        } else if (creationMode === 'lots-only') {
            router.post(route('proprietes.store-multiple'), {
                id_dossier: dossier.id,
                proprietes: JSON.stringify(proprietes)
            }, {
                onError: (errors) => {
                    console.error('Erreurs de validation:', errors);
                    const errorMessages = Object.values(errors).flat().join('\n');
                    toast.error('Erreur de validation', { description: errorMessages });
                    setProcessing(false);
                },
                onSuccess: () => {
                    toast.success(`${proprietes.length} propriété(s) créée(s) avec succès !`);
                }
            });
        } else if (creationMode === 'demandeurs-only') {
            router.post(route('demandeurs.store-multiple'), {
                id_dossier: dossier.id,
                demandeurs: JSON.stringify(demandeurs)
            }, {
                onError: (errors) => {
                    console.error('Erreurs de validation:', errors);
                    const errorMessages = Object.values(errors).flat().join('\n');
                    toast.error('Erreur de validation', { description: errorMessages });
                    setProcessing(false);
                },
                onSuccess: () => {
                    toast.success(`${demandeurs.length} demandeur(s) créé(s) avec succès !`);
                }
            });
        }
    };

    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Nouvelle Entrée', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle Entrée" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nouvelle Entrée</h1>
                    <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                </div>

                <div className="space-y-6">
                    {/* MODE DE CRÉATION */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Choisir le type de création</CardTitle>
                            <CardDescription>Sélectionnez ce que vous souhaitez créer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={creationMode} onValueChange={(value) => setCreationMode(value as CreationMode)}>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                                        creationMode === 'lot-demandeur' ? 'border-primary bg-primary/5' : 'border-border'
                                    }`} onClick={() => setCreationMode('lot-demandeur')}>
                                        <RadioGroupItem value="lot-demandeur" id="lot-demandeur" />
                                        <div className="flex-1">
                                            <Label htmlFor="lot-demandeur" className="font-semibold cursor-pointer">
                                                Lot + Demandeur(s)
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Créer une propriété avec un ou plusieurs demandeurs
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                                        creationMode === 'lots-only' ? 'border-primary bg-primary/5' : 'border-border'
                                    }`} onClick={() => setCreationMode('lots-only')}>
                                        <RadioGroupItem value="lots-only" id="lots-only" />
                                        <div className="flex-1">
                                            <Label htmlFor="lots-only" className="font-semibold cursor-pointer">
                                                Lot(s) seulement
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                 Créer un ou plusieurs propriétés en une fois
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                                        creationMode === 'demandeurs-only' ? 'border-primary bg-primary/5' : 'border-border'
                                    }`} onClick={() => setCreationMode('demandeurs-only')}>
                                        <RadioGroupItem value="demandeurs-only" id="demandeurs-only" />
                                        <div className="flex-1">
                                            <Label htmlFor="demandeurs-only" className="font-semibold cursor-pointer">
                                                Demandeur(s) seulement
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                 Créer un ou plusieurs demandeurs en une fois
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    {/* SECTION PROPRIÉTÉS */}
                    {(creationMode === 'lots-only' || creationMode === 'lot-demandeur') && (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>
                                            {creationMode === 'lot-demandeur' ? '1. ' : ''}
                                            Propriété{proprietes.length > 1 ? 's' : ''} ({proprietes.length})
                                        </CardTitle>
                                        <CardDescription>
                                            Champs obligatoires: Lot, Type d'opération, Nature, Vocation
                                        </CardDescription>
                                    </div>
                                    {creationMode === 'lots-only' && (
                                        <Button type="button" onClick={addPropriete} size="sm">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Ajouter un lot
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {proprietes.map((propriete, index) => (
                                    <ProprieteCreate
                                        key={index}
                                        data={propriete}
                                        onChange={(field, value) => updatePropriete(index, field, value)}
                                        onRemove={creationMode === 'lots-only' ? () => removePropriete(index) : undefined}
                                        index={index}
                                        showRemoveButton={creationMode === 'lots-only' && proprietes.length > 1}
                                        selectedCharges={selectedChargesByPropriete[index] || []}
                                        onChargeChange={(charge, checked) => handleChargeChange(index, charge, checked)}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* SECTION DEMANDEURS */}
                    {(creationMode === 'demandeurs-only' || creationMode === 'lot-demandeur') && (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>
                                            {creationMode === 'lot-demandeur' ? '2. ' : ''}
                                            Demandeurs ({demandeurs.length})
                                        </CardTitle>
                                        <CardDescription>
                                            Champs obligatoires: Titre, Nom, Prénom, Date de naissance, CIN (12 chiffres)
                                        </CardDescription>
                                    </div>
                                    <Button type="button" onClick={addDemandeur} size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter un demandeur
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {demandeurs.map((demandeur, index) => (
                                <DemandeurCreate
                                    key={index} // ✅ IMPORTANT : ajouter une key stable
                                    data={demandeur}
                                    onChange={(field, value) => updateDemandeur(index, field, value)}
                                    onRemove={demandeurs.length > 1 ? () => removeDemandeur(index) : undefined}
                                    index={index} // ✅ IMPORTANT : passer l'index
                                    showRemoveButton={demandeurs.length > 1}
                                />
                            ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* BOUTONS DE SOUMISSION */}
                    <div className="flex gap-4 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('dossiers.show', dossier.id))}
                            disabled={processing}
                        >
                            Annuler
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Enregistrement...' : 
                                creationMode === 'lot-demandeur' ? 'Créer le lot et demandeur(s)' :
                                creationMode === 'lots-only' ? `Créer ${proprietes.length} propriété(s)` :
                                `Créer ${demandeurs.length} demandeur(s)`
                            }
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}