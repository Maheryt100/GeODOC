// this is demandeurs/create.tsx
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface DemandeurFormData {
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur: string;
    date_naissance: string;
    lieu_naissance: string;
    sexe: string;
    occupation: string;
    nom_pere: string;
    nom_mere: string;
    cin: string;
    date_delivrance: string;
    lieu_delivrance: string;
    date_delivrance_duplicata: string;
    lieu_delivrance_duplicata: string;
    domiciliation: string;
    nationalite: string;
    situation_familiale: string;
    regime_matrimoniale: string;
    date_mariage: string;
    lieu_mariage: string;
    marie_a: string;
    telephone: string;
    [key: string]: any;
}

export interface DemandeurFormProps {
    data: DemandeurFormData;
    onChange: (field: keyof DemandeurFormData, value: string) => void;
    onRemove?: () => void;
    index?: number;
    showRemoveButton?: boolean;
}

export const emptyDemandeur: DemandeurFormData = {
    titre_demandeur: '',
    nom_demandeur: '',
    prenom_demandeur: '',
    date_naissance: '',
    lieu_naissance: '',
    sexe: '',
    occupation: '',
    nom_pere: '',
    nom_mere: '',
    cin: '',
    date_delivrance: '',
    lieu_delivrance: '',
    date_delivrance_duplicata: '',
    lieu_delivrance_duplicata: '',
    domiciliation: '',
    nationalite: 'Malagasy',
    situation_familiale: 'Non spécifiée',
    regime_matrimoniale: 'Non spécifié',
    date_mariage: '',
    lieu_mariage: '',
    marie_a: '',
    telephone: ''
};

export default function DemandeurCreate({
    data,
    onChange,
    onRemove,
    index = 0,
    showRemoveButton = false
}: DemandeurFormProps) {
    
    // ✅ État local pour synchroniser le Select avec le state parent
    const [localTitre, setLocalTitre] = useState(data.titre_demandeur);
    
    // ✅ Synchroniser l'état local avec les props
    useEffect(() => {
        setLocalTitre(data.titre_demandeur);
    }, [data.titre_demandeur]);
    
   // ✅ Handler amélioré avec logs détaillés
    const handleTitreChange = (value: string) => {
        console.log('🔧 [DemandeurCreate] Changement de titre détecté', {
            index,
            nouveauTitre: value,
            ancienTitre: data.titre_demandeur
        });
        
        // ✅ Mise à jour immédiate du parent (PRIORITAIRE)
        onChange('titre_demandeur', value);
        
        // ✅ Mise à jour automatique du sexe
        const sexe = value === 'Monsieur' ? 'Homme' : 
                     value === 'Madame' || value === 'Mademoiselle' ? 'Femme' : '';
        onChange('sexe', sexe);
        
        console.log('✅ [DemandeurCreate] Mise à jour envoyée au parent', {
            index,
            titre: value,
            sexe
        });
    };

    return (
        <div className="border rounded-lg p-6 space-y-6 relative bg-card">
            {showRemoveButton && onRemove && (
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        Demandeur {typeof index !== 'undefined' ? index + 1 : ''}
                    </h3>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onRemove}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Retirer
                    </Button>
                </div>
            )}

            {/* Ligne 1: Titre, Nom, Prénom */}
            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label className="text-red-500">Titre de civilité *</Label>
                    {/* ✅ FIX FINAL : Utiliser l'état local pour le contrôle du Select */}
                    <Select
                        value={localTitre || ''}
                        onValueChange={handleTitreChange}
                    >
                        <SelectTrigger className={!localTitre ? 'text-muted-foreground' : ''}>
                            <SelectValue placeholder="Sélectionner un titre" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Monsieur">Monsieur</SelectItem>
                            <SelectItem value="Madame">Madame</SelectItem>
                            <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* ✅ Indicateur visuel de sélection */}
                    {localTitre && (
                        <p className="text-xs text-green-600 mt-1">
                            ✓ {localTitre}
                        </p>
                    )}
                </div>
                <div>
                    <Label className="text-red-500">Nom *</Label>
                    <Input
                        type="text"
                        value={data.nom_demandeur}
                        onChange={(e) => onChange('nom_demandeur', e.target.value.toUpperCase())}
                        placeholder="RAKOTO"
                        className="uppercase"
                    />
                </div>
                <div>
                    <Label className="text-red-500">Prénom *</Label>
                    <Input
                        type="text"
                        value={data.prenom_demandeur}
                        onChange={(e) => onChange('prenom_demandeur', e.target.value)}
                        placeholder="Jean"
                    />
                </div>
            </div>

            {/* Ligne 2: Date naissance, Lieu, Père, Mère */}
            <div className="grid gap-4 md:grid-cols-4">
                <div>
                    <Label className="text-red-500">Date de naissance *</Label>
                    <Input
                        type="date"
                        value={data.date_naissance}
                        onChange={(e) => onChange('date_naissance', e.target.value)}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    />
                </div>
                <div>
                    <Label>Lieu de naissance</Label>
                    <Input
                        type="text"
                        value={data.lieu_naissance}
                        onChange={(e) => onChange('lieu_naissance', e.target.value)}
                        placeholder="Antananarivo"
                    />
                </div>
                <div>
                    <Label>Nom complet Père</Label>
                    <Input
                        type="text"
                        value={data.nom_pere}
                        onChange={(e) => onChange('nom_pere', e.target.value)}
                        placeholder="RANDRIA Jean"
                    />
                </div>
                <div>
                    <Label>Nom complet Mère</Label>
                    <Input
                        type="text"
                        value={data.nom_mere}
                        onChange={(e) => onChange('nom_mere', e.target.value)}
                        placeholder="RABE Marie"
                    />
                </div>
            </div>

            {/* CIN */}
            <div className="w-full max-w-md">
                <Label className="text-red-500">CIN (12 chiffres) *</Label>
                <InputOTP
                    maxLength={12}
                    value={data.cin}
                    onChange={(value) => onChange('cin', value)}
                    pattern="[0-9]*"
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                        <InputOTPSlot index={8} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                        <InputOTPSlot index={9} />
                        <InputOTPSlot index={10} />
                        <InputOTPSlot index={11} />
                    </InputOTPGroup>
                </InputOTP>
                {data.cin && data.cin.length < 12 && (
                    <p className="text-xs text-red-500 mt-1">
                        {12 - data.cin.length} chiffre(s) manquant(s)
                    </p>
                )}
            </div>

            {/* Délivrance */}
            <div className="grid gap-4 md:grid-cols-4">
                <div>
                    <Label>Date Délivrance CIN</Label>
                    <Input
                        type="date"
                        value={data.date_delivrance}
                        onChange={(e) => onChange('date_delivrance', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <div>
                    <Label>Lieu Délivrance</Label>
                    <Input
                        type="text"
                        value={data.lieu_delivrance}
                        onChange={(e) => onChange('lieu_delivrance', e.target.value)}
                        placeholder="Antananarivo"
                    />
                </div>
                <div>
                    <Label>Date Duplicata</Label>
                    <Input
                        type="date"
                        value={data.date_delivrance_duplicata}
                        onChange={(e) => onChange('date_delivrance_duplicata', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <div>
                    <Label>Lieu Duplicata</Label>
                    <Input
                        type="text"
                        value={data.lieu_delivrance_duplicata}
                        onChange={(e) => onChange('lieu_delivrance_duplicata', e.target.value)}
                        placeholder="Toliara"
                    />
                </div>
            </div>

            {/* Occupation, Domiciliation, Téléphone */}
            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label>Occupation</Label>
                    <Input
                        type="text"
                        value={data.occupation}
                        onChange={(e) => onChange('occupation', e.target.value)}
                        placeholder="Agriculteur"
                    />
                </div>
                <div>
                    <Label>Domiciliation</Label>
                    <Input
                        type="text"
                        value={data.domiciliation}
                        onChange={(e) => onChange('domiciliation', e.target.value)}
                        placeholder="Antananarivo"
                    />
                </div>
                <div>
                    <Label>Téléphone</Label>
                    <Input
                        type="tel"
                        value={data.telephone}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            onChange('telephone', value);
                        }}
                        placeholder="0340000000"
                        maxLength={10}
                    />
                </div>
            </div>

            {/* Situation familiale, Régime, Nationalité */}
            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label>Situation Familiale</Label>
                    <Select
                        value={data.situation_familiale}
                        onValueChange={(value) => onChange('situation_familiale', value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Non spécifiée">Non spécifiée</SelectItem>
                            <SelectItem value="Célibataire">Célibataire</SelectItem>
                            <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                            <SelectItem value="Veuf/Veuve">Veuf/Veuve</SelectItem>
                            <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Régime matrimonial</Label>
                    <Select
                        value={data.regime_matrimoniale}
                        onValueChange={(value) => onChange('regime_matrimoniale', value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Non spécifié">Non spécifié</SelectItem>
                            <SelectItem value="zara-mira">Zara-Mira</SelectItem>
                            <SelectItem value="kitay telo an-dalana">Kitay telo an-dalana</SelectItem>
                            <SelectItem value="Séparations des biens">Séparations des biens</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Nationalité</Label>
                    <Input
                        type="text"
                        value={data.nationalite}
                        onChange={(e) => onChange('nationalite', e.target.value)}
                        placeholder="Malagasy"
                    />
                </div>
            </div>

            {/* Infos mariage */}
            {data.situation_familiale === 'Marié(e)' && (
                <div className="grid gap-4 md:grid-cols-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div>
                        <Label>Marié(e) à</Label>
                        <Input
                            type="text"
                            value={data.marie_a}
                            onChange={(e) => onChange('marie_a', e.target.value)}
                            placeholder="Nom du conjoint"
                        />
                    </div>
                    <div>
                        <Label>Date de Mariage</Label>
                        <Input
                            type="date"
                            value={data.date_mariage}
                            onChange={(e) => onChange('date_mariage', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <Label>Lieu de Mariage</Label>
                        <Input
                            type="text"
                            value={data.lieu_mariage}
                            onChange={(e) => onChange('lieu_mariage', e.target.value)}
                            placeholder="Antananarivo"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}