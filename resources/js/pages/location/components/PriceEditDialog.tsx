// resources/js/pages/location/components/PriceEditDialog.tsx

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { District } from '@/types';

interface PriceFormData {
    id: number;
    edilitaire: number;
    agricole: number;
    forestiere: number;
    touristique: number;
}

interface PriceEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    district: District | null;
    viewMode: 'edit' | 'view';
    data: PriceFormData;
    processing: boolean;
    onDataChange: (field: keyof PriceFormData, value: number) => void;
    onSubmit: (e: React.FormEvent) => void;
}

const priceFields = [
    { 
        id: 'edilitaire', 
        label: 'Édilitaire', 
        description: 'Construction/Habitation' 
    },
    { 
        id: 'agricole', 
        label: 'Agricole', 
        description: 'Culture/Agriculture' 
    },
    { 
        id: 'forestiere', 
        label: 'Forestière', 
        description: 'Forêt/Boisement' 
    },
    { 
        id: 'touristique', 
        label: 'Touristique', 
        description: 'Hôtellerie/Tourisme' 
    },
] as const;

export default function PriceEditDialog({
    open,
    onOpenChange,
    district,
    viewMode,
    data,
    processing,
    onDataChange,
    onSubmit
}: PriceEditDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {viewMode === 'edit' ? '✏️ Modifier les prix' : '👁️ Détails des prix'} - {district?.nom_district}
                        </DialogTitle>
                        <DialogDescription>
                            {viewMode === 'edit' 
                                ? 'Définir le prix au m² pour chaque vocation de terrain. Les valeurs sont en Ariary (Ar).'
                                : 'Visualisation des prix au m² pour chaque vocation de terrain.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-5 py-6">
                        {priceFields.map((field) => (
                            <div key={field.id} className="grid gap-2">
                                <Label htmlFor={field.id} className="flex items-center gap-2">
                                    <span className="font-semibold">{field.label}</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        ({field.description})
                                    </span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id={field.id}
                                        type="number"
                                        min={0}
                                        step={1}
                                        placeholder="0"
                                        value={data[field.id as keyof PriceFormData]}
                                        onChange={(e) => onDataChange(
                                            field.id as keyof PriceFormData, 
                                            Number(e.target.value)
                                        )}
                                        className="pr-12"
                                        disabled={viewMode === 'view'}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                                        Ar/m²
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button 
                                type="button" 
                                variant="outline"
                                disabled={processing}
                            >
                                {viewMode === 'edit' ? 'Annuler' : 'Fermer'}
                            </Button>
                        </DialogClose>
                        {viewMode === 'edit' && (
                            <Button 
                                type="submit"
                                disabled={processing}
                            >
                                {processing ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}