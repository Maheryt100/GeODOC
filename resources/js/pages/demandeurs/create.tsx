import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Trash2, Search, AlertCircle, CheckCircle2, User, CreditCard, Calendar, Home, Phone, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    
   
    const [localTitre, setLocalTitre] = useState(data.titre_demandeur);
    const [cinSearchStatus, setCinSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle');
    const [searchMessage, setSearchMessage] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    


    useEffect(() => {
        setLocalTitre(data.titre_demandeur);
    }, [data.titre_demandeur]);

    
    const handleTitreChange = (value: string) => {
        onChange('titre_demandeur', value);
        
        const sexe = value === 'Monsieur' ? 'Homme' : 
                     value === 'Madame' || value === 'Mademoiselle' ? 'Femme' : '';
        onChange('sexe', sexe);
    };

    const handleCinChange = async (value: string) => {
        onChange('cin', value);
        
        if (value.length === 12 && /^\d{12}$/.test(value)) {
            await searchDemandeurByCin(value);
        } else if (value.length < 12) {
            setCinSearchStatus('idle');
            setSearchMessage('');
        }
    };

    const searchDemandeurByCin = async (cin: string) => {
        if (isSearching) return;
        
        setIsSearching(true);
        setCinSearchStatus('searching');
        setSearchMessage('Recherche en cours...');

        try {
            const response = await fetch(window.route('api.demandeur.search-by-cin', { cin }), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (result.found) {
                setCinSearchStatus('found');
                setSearchMessage(result.message);
                
                const demandeur = result.demandeur;
                Object.keys(demandeur).forEach((key) => {
                    if (key !== 'cin') {
                        onChange(key as keyof DemandeurFormData, demandeur[key] || '');
                    }
                });
                
                if (demandeur.titre_demandeur) {
                    setLocalTitre(demandeur.titre_demandeur);
                }
            } else {
                setCinSearchStatus('not-found');
                setSearchMessage(result.message || 'Nouveau demandeur - Remplissez les informations');
            }
        } catch (error) {
            console.error('Erreur recherche CIN:', error);
            setCinSearchStatus('idle');
            setSearchMessage('Erreur lors de la recherche');
        } finally {
            setIsSearching(false);
        }
    };

    const handleManualSearch = () => {
        if (data.cin.length === 12) {
            searchDemandeurByCin(data.cin);
        }
    };

     
   

    return (
        <div className="border-0 rounded-lg shadow-lg p-6 space-y-8 bg-card">
            {showRemoveButton && onRemove && (
                <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="text-xl font-semibold text-foreground">
                        Demandeur {typeof index !== 'undefined' ? index + 1 : ''}
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

            {/* Section CIN */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 pb-3 border-b-2 border-purple-100 dark:border-purple-900">
                    <CreditCard className="h-4 w-4" />
                    <span>Identification</span>
                </div>

                <div className="w-full max-w-md">
                    <Label className="text-sm font-medium text-red-600">CIN (12 chiffres) *</Label>
                    <div className="flex gap-2 items-start mt-2">
                        <div className="flex-1">
                            <InputOTP
                                maxLength={12}
                                value={data.cin}
                                onChange={handleCinChange}
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
                        
                        {data.cin.length === 12 && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleManualSearch}
                                disabled={isSearching}
                                className="h-11"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {cinSearchStatus !== 'idle' && searchMessage && (
                    <Alert variant={cinSearchStatus === 'found' ? 'default' : 'destructive'} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                        {cinSearchStatus === 'found' ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="ml-2">
                                    <strong className="block mb-1">Demandeur existant trouvé</strong>
                                    <p className="text-sm">
                                        Les informations ont été chargées automatiquement.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        • Vous pouvez modifier les informations si nécessaire<br/>
                                        • Les modifications seront sauvegardées
                                    </p>
                                </AlertDescription>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="ml-2">
                                    {searchMessage}
                                </AlertDescription>
                            </>
                        )}
                    </Alert>
                )}
            </div>

            {/* Section Identité */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 pb-3 border-b-2 border-blue-100 dark:border-blue-900">
                    <User className="h-4 w-4" />
                    <span>Identité</span>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Titre de civilité *</Label>
                        <Select
                            value={localTitre || ''}
                            onValueChange={handleTitreChange}
                        >
                            <SelectTrigger className={`h-11 ${!localTitre ? 'text-muted-foreground' : ''}`}>
                                <SelectValue placeholder="Sélectionner un titre" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Monsieur">Monsieur</SelectItem>
                                <SelectItem value="Madame">Madame</SelectItem>
                                <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Nom *</Label>
                        <Input
                            type="text"
                            value={data.nom_demandeur}
                            onChange={(e) => onChange('nom_demandeur', e.target.value.toUpperCase())}
                            placeholder="RAKOTO"
                            className="uppercase h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Prénom *</Label>
                        <Input
                            type="text"
                            value={data.prenom_demandeur}
                            onChange={(e) => onChange('prenom_demandeur', e.target.value)}
                            placeholder="Jean"
                            className="h-11"
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Date de naissance *</Label>
                        <Input
                            type="date"
                            value={data.date_naissance}
                            onChange={(e) => onChange('date_naissance', e.target.value)}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Lieu de naissance</Label>
                        <Input
                            type="text"
                            value={data.lieu_naissance}
                            onChange={(e) => onChange('lieu_naissance', e.target.value)}
                            placeholder="Antananarivo"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Nom complet Père</Label>
                        <Input
                            type="text"
                            value={data.nom_pere}
                            onChange={(e) => onChange('nom_pere', e.target.value)}
                            placeholder="RANDRIA Jean"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Nom complet Mère</Label>
                        <Input
                            type="text"
                            value={data.nom_mere}
                            onChange={(e) => onChange('nom_mere', e.target.value)}
                            placeholder="RABE Marie"
                            className="h-11"
                        />
                    </div>
                </div>
            </div>

            {/* Section Délivrance CIN */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 pb-3 border-b-2 border-indigo-100 dark:border-indigo-900">
                    <Calendar className="h-4 w-4" />
                    <span>Délivrance CIN</span>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Date Délivrance CIN</Label>
                        <Input
                            type="date"
                            value={data.date_delivrance}
                            onChange={(e) => onChange('date_delivrance', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Lieu Délivrance</Label>
                        <Input
                            type="text"
                            value={data.lieu_delivrance}
                            onChange={(e) => onChange('lieu_delivrance', e.target.value)}
                            placeholder="Antananarivo"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Date Duplicata</Label>
                        <Input
                            type="date"
                            value={data.date_delivrance_duplicata}
                            onChange={(e) => onChange('date_delivrance_duplicata', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Lieu Duplicata</Label>
                        <Input
                            type="text"
                            value={data.lieu_delivrance_duplicata}
                            onChange={(e) => onChange('lieu_delivrance_duplicata', e.target.value)}
                            placeholder="Toliara"
                            className="h-11"
                        />
                    </div>
                </div>
            </div>

            {/* Section Contact & Résidence */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 pb-3 border-b-2 border-green-100 dark:border-green-900">
                    <Home className="h-4 w-4" />
                    <span>Contact & Résidence</span>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Occupation</Label>
                        <Input
                            type="text"
                            value={data.occupation}
                            onChange={(e) => onChange('occupation', e.target.value)}
                            placeholder="Agriculteur"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Domiciliation</Label>
                        <Input
                            type="text"
                            value={data.domiciliation}
                            onChange={(e) => onChange('domiciliation', e.target.value)}
                            placeholder="Antananarivo"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            <Phone className="inline h-3 w-3 mr-1" />
                            Téléphone
                        </Label>
                        <Input
                            type="tel"
                            value={data.telephone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                onChange('telephone', value);
                            }}
                            placeholder="0340000000"
                            maxLength={10}
                            className="h-11"
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Situation Familiale</Label>
                        <Select
                            value={data.situation_familiale}
                            onValueChange={(value) => onChange('situation_familiale', value)}
                        >
                            <SelectTrigger className="h-11">
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
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Régime matrimonial</Label>
                        <Select
                            value={data.regime_matrimoniale}
                            onValueChange={(value) => onChange('regime_matrimoniale', value)}
                        >
                            <SelectTrigger className="h-11">
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
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Nationalité</Label>
                        <Input
                            type="text"
                            value={data.nationalite}
                            onChange={(e) => onChange('nationalite', e.target.value)}
                            placeholder="Malagasy"
                            className="h-11"
                        />
                    </div>
                </div>
            </div>

            {/* Infos mariage */}
            {data.situation_familiale === 'Marié(e)' && (
                <div className="space-y-4 p-6 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-lg border border-pink-100 dark:border-pink-900">
                    <h4 className="font-semibold text-pink-700 dark:text-pink-400">Informations de Mariage</h4>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Marié(e) à</Label>
                            <Input
                                type="text"
                                value={data.marie_a}
                                onChange={(e) => onChange('marie_a', e.target.value)}
                                placeholder="Nom du conjoint"
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Date de Mariage</Label>
                            <Input
                                type="date"
                                value={data.date_mariage}
                                onChange={(e) => onChange('date_mariage', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Lieu de Mariage</Label>
                            <Input
                                type="text"
                                value={data.lieu_mariage}
                                onChange={(e) => onChange('lieu_mariage', e.target.value)}
                                placeholder="Antananarivo"
                                className="h-11"
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Info pièces jointes */}
            {index === 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Documents justificatifs
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                Les pièces jointes (CIN, actes, etc.) pourront être ajoutées après création
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}