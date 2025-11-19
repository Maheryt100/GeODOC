// pages/proprietes/create.tsx
// Composant de formulaire de création/édition de propriété
// Utilisé par : NouveauLot.tsx, update.tsx

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Nature, Vocation, TypeOperation } from '@/types';

export interface ProprieteFormData {
    lot: string;
    type_operation: TypeOperation;
    nature: Nature | '';
    vocation: Vocation | '';
    proprietaire: string;
    situation: string;
    propriete_mere: string;
    titre_mere: string;
    titre: string;
    contenance: string;
    charge: string;
    numero_FN: string;
    numero_requisition: string;
    date_requisition: string;
    date_inscription: string;
    dep_vol: string;
    numero_dep_vol: string;
    [key: string]: any;
}

export interface ProprieteFormProps {
    data: ProprieteFormData;
    onChange: (field: keyof ProprieteFormData, value: string) => void;
    onRemove?: () => void;
    index?: number;
    showRemoveButton?: boolean;
    selectedCharges?: string[];
    onChargeChange?: (charge: string, checked: boolean) => void;
}

const chargeOptions = [
    "Voie(s) publique(s)",
    "Voie(s) d'accès",
    "Servitude(s)",
    "Aucune"
];

export const emptyPropriete: ProprieteFormData = {
    lot: '',
    type_operation: 'immatriculation',
    nature: '',
    vocation: '',
    proprietaire: '',
    situation: '',
    propriete_mere: '',
    titre_mere: '',
    titre: '',
    contenance: '',
    charge: '',
    numero_FN: '',
    numero_requisition: '',
    date_requisition: '',
    date_inscription: '',
    dep_vol: '',
    numero_dep_vol: ''
};

export default function ProprieteCreate({
    data,
    onChange,
    onRemove,
    index,
    showRemoveButton = false,
    selectedCharges = [],
    onChargeChange
}: ProprieteFormProps) {
    return (
        <div className="border rounded-lg p-6 space-y-6 relative bg-card">
            {showRemoveButton && onRemove && (
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        Propriété {typeof index !== 'undefined' ? index + 1 : ''}
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

            {/* Type d'opération */}
            <div>
                <Label className="text-red-500">Type d'opération *</Label>
                <Select
                    value={data.type_operation}
                    onValueChange={(value) => onChange('type_operation', value as TypeOperation)}
                >
                    <SelectTrigger className="w-[220px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="morcellement">Morcellement</SelectItem>
                        <SelectItem value="immatriculation">Immatriculation</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Ligne 1: Lot, Nature, Vocation */}
            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label className="text-red-500">Lot *</Label>
                    <Input
                        value={data.lot}
                        onChange={(e) => onChange('lot', e.target.value)}
                        placeholder="T 45"
                        required
                    />
                </div>
                <div>
                    <Label className="text-red-500">Nature *</Label>
                    <Select value={data.nature} onValueChange={(e) => onChange('nature', e)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Urbaine">Urbaine</SelectItem>
                            <SelectItem value="Suburbaine">Suburbaine</SelectItem>
                            <SelectItem value="Rurale">Rurale</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-red-500">Vocation *</Label>
                    <Select value={data.vocation} onValueChange={(e) => onChange('vocation', e)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Edilitaire">Edilitaire</SelectItem>
                            <SelectItem value="Agricole">Agricole</SelectItem>
                            <SelectItem value="Forestière">Forestière</SelectItem>
                            <SelectItem value="Touristique">Touristique</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Ligne 2 */}
            <div className="grid gap-4 md:grid-cols-2">
                {data.type_operation === 'morcellement' && (
                    <>
                        <div>
                            <Label>Propriété mère</Label>
                            <Input
                                value={data.propriete_mere}
                                onChange={(e) => onChange('propriete_mere', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Titre mère</Label>
                            <Input
                                value={data.titre_mere}
                                onChange={(e) => onChange('titre_mere', e.target.value)}
                            />
                        </div>
                    </>
                )}
                <div>
                    <Label>Titre</Label>
                    <Input
                        value={data.titre}
                        onChange={(e) => onChange('titre', e.target.value)}
                    />
                </div>
                <div>
                    <Label>Nom Propriété / Propriétaire</Label>
                    <Input
                        value={data.proprietaire}
                        onChange={(e) => onChange('proprietaire', e.target.value)}
                    />
                </div>
            </div>

            {/* Ligne 3 */}
            <div className="grid gap-4 md:grid-cols-4">
                <div>
                    <Label>Contenance (m²)</Label>
                    <Input
                        type="number"
                        min={1}
                        value={data.contenance}
                        onChange={(e) => onChange('contenance', e.target.value)}
                    />
                </div>
                <div>
                    <Label>Numero FNº</Label>
                    <Input
                        value={data.numero_FN}
                        onChange={(e) => onChange('numero_FN', e.target.value)}
                    />
                </div>
                {data.type_operation === 'immatriculation' && (
                    <div>
                        <Label>Nº Requisition</Label>
                        <Input
                            value={data.numero_requisition}
                            onChange={(e) => onChange('numero_requisition', e.target.value)}
                        />
                    </div>
                )}
                <div>
                    <Label>Charge</Label>
                    <div className="space-y-2 mt-2">
                        {chargeOptions.map((charge) => (
                            <div key={charge} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`charge-${charge}-${index || 0}`}
                                    checked={selectedCharges.includes(charge)}
                                    onCheckedChange={(checked) => 
                                        onChargeChange && onChargeChange(charge, checked as boolean)
                                    }
                                />
                                <label htmlFor={`charge-${charge}-${index || 0}`} className="text-sm">
                                    {charge}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ligne 4 */}
            <div className="grid gap-4 md:grid-cols-5">
                <div>
                    <Label>Situation (sise à)</Label>
                    <Input
                        value={data.situation}
                        onChange={(e) => onChange('situation', e.target.value)}
                    />
                </div>
                <div>
                    <Label>Date inscription</Label>
                    <Input
                        type="date"
                        value={data.date_inscription}
                        onChange={(e) => onChange('date_inscription', e.target.value)}
                    />
                </div>
                <div>
                    <Label>Date requisition</Label>
                    <Input
                        type="date"
                        value={data.date_requisition}
                        onChange={(e) => onChange('date_requisition', e.target.value)}
                    />
                </div>
                <div>
                    <Label>Dep Vol</Label>
                    <Input
                        value={data.dep_vol}
                        onChange={(e) => onChange('dep_vol', e.target.value)}
                        placeholder="299"
                    />
                </div>
                <div>
                    <Label>Numéro Dep Vol</Label>
                    <Input
                        value={data.numero_dep_vol}
                        onChange={(e) => onChange('numero_dep_vol', e.target.value)}
                        placeholder="041"
                    />
                </div>
            </div>
        </div>
    );
}