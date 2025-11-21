// pages/proprietes/create.tsx
// Composant de formulaire de création/édition de propriété

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, MapPin, Calendar, Layers, Shield } from 'lucide-react';
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
        <div className="border-0 rounded-lg shadow-lg p-6 space-y-8 bg-card">
            {showRemoveButton && onRemove && (
                <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="text-xl font-semibold text-foreground">
                        Propriété {typeof index !== 'undefined' ? index + 1 : ''}
                    </h3>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onRemove}
                        className="h-9"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Retirer
                    </Button>
                </div>
            )}

            {/* Section Type d'opération */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 pb-3 border-b-2 border-blue-100 dark:border-blue-900">
                    <FileText className="h-4 w-4" />
                    <span>Type d'opération</span>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-red-600">Type d'opération *</Label>
                    <Select
                        value={data.type_operation}
                        onValueChange={(value) => onChange('type_operation', value as TypeOperation)}
                    >
                        <SelectTrigger className="w-full md:w-[280px] h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="morcellement">Morcellement</SelectItem>
                            <SelectItem value="immatriculation">Immatriculation</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Section Identification du lot */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 pb-3 border-b-2 border-green-100 dark:border-green-900">
                    <Layers className="h-4 w-4" />
                    <span>Identification du lot</span>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Lot *</Label>
                        <Input
                            value={data.lot}
                            onChange={(e) => onChange('lot', e.target.value)}
                            placeholder="T 45"
                            required
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Nature *</Label>
                        <Select value={data.nature} onValueChange={(e) => onChange('nature', e)}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Urbaine">Urbaine</SelectItem>
                                <SelectItem value="Suburbaine">Suburbaine</SelectItem>
                                <SelectItem value="Rurale">Rurale</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Vocation *</Label>
                        <Select value={data.vocation} onValueChange={(e) => onChange('vocation', e)}>
                            <SelectTrigger className="h-11">
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
            </div>

            {/* Section Propriétaire & Titres */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 pb-3 border-b-2 border-purple-100 dark:border-purple-900">
                    <Shield className="h-4 w-4" />
                    <span>Propriétaire & Titres</span>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {data.type_operation === 'morcellement' && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Propriété mère</Label>
                                <Input
                                    value={data.propriete_mere}
                                    onChange={(e) => onChange('propriete_mere', e.target.value)}
                                    placeholder="Nom de la propriété mère"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Titre mère</Label>
                                <Input
                                    value={data.titre_mere}
                                    onChange={(e) => onChange('titre_mere', e.target.value)}
                                    placeholder="Numéro du titre mère"
                                    className="h-11"
                                />
                            </div>
                        </>
                    )}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Titre</Label>
                        <Input
                            value={data.titre}
                            onChange={(e) => onChange('titre', e.target.value)}
                            placeholder="Numéro du titre"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Nom Propriété / Propriétaire</Label>
                        <Input
                            value={data.proprietaire}
                            onChange={(e) => onChange('proprietaire', e.target.value)}
                            placeholder="RAKOTO Jean"
                            className="h-11"
                        />
                    </div>
                </div>
            </div>

            {/* Section Détails & Références */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 pb-3 border-b-2 border-indigo-100 dark:border-indigo-900">
                    <FileText className="h-4 w-4" />
                    <span>Détails & Références</span>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Contenance (m²)</Label>
                        <Input
                            type="number"
                            min={1}
                            value={data.contenance}
                            onChange={(e) => onChange('contenance', e.target.value)}
                            placeholder="1500"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Numero FNº</Label>
                        <Input
                            value={data.numero_FN}
                            onChange={(e) => onChange('numero_FN', e.target.value)}
                            placeholder="FN-123"
                            className="h-11"
                        />
                    </div>
                    {data.type_operation === 'immatriculation' && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Nº Requisition</Label>
                            <Input
                                value={data.numero_requisition}
                                onChange={(e) => onChange('numero_requisition', e.target.value)}
                                placeholder="REQ-456"
                                className="h-11"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Charges</Label>
                        <div className="space-y-2 mt-2 p-3 border rounded-md bg-muted/30">
                            {chargeOptions.map((charge) => (
                                <div key={charge} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`charge-${charge}-${index || 0}`}
                                        checked={selectedCharges.includes(charge)}
                                        onCheckedChange={(checked) => 
                                            onChargeChange && onChargeChange(charge, checked as boolean)
                                        }
                                    />
                                    <label 
                                        htmlFor={`charge-${charge}-${index || 0}`} 
                                        className="text-sm cursor-pointer"
                                    >
                                        {charge}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Localisation & Dates */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 pb-3 border-b-2 border-orange-100 dark:border-orange-900">
                    <MapPin className="h-4 w-4" />
                    <span>Localisation & Dates</span>
                </div>

                <div className="grid gap-6 md:grid-cols-5">
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium">Situation (sise à)</Label>
                        <Input
                            value={data.situation}
                            onChange={(e) => onChange('situation', e.target.value)}
                            placeholder="Ambohimanarina, Antananarivo"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Date inscription
                        </Label>
                        <Input
                            type="date"
                            value={data.date_inscription}
                            onChange={(e) => onChange('date_inscription', e.target.value)}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Date requisition
                        </Label>
                        <Input
                            type="date"
                            value={data.date_requisition}
                            onChange={(e) => onChange('date_requisition', e.target.value)}
                            className="h-11"
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Dep Vol</Label>
                        <Input
                            value={data.dep_vol}
                            onChange={(e) => onChange('dep_vol', e.target.value)}
                            placeholder="299"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Numéro Dep Vol</Label>
                        <Input
                            value={data.numero_dep_vol}
                            onChange={(e) => onChange('numero_dep_vol', e.target.value)}
                            placeholder="041"
                            className="h-11"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}