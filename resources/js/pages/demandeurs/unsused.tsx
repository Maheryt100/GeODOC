import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useForm, usePage } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

interface Region {
    id: number;
    nom_region: string;
    id_province: number;
}

interface Province {
    id: number;
    nom_province: string;
}

interface District {
    id: number;
    nom_district: string;
    id_region: number;
}

interface PageProps {
    province: Province[];
    region: Region[];
    district: District[];
}

export default function Create() {
    const { province: provinces, region: regions, district: districts } = usePage<PageProps>().props;

    const [province, setProvince] = useState<number | null>(null);
    const [region, setRegion] = useState<number | null>(null);
    const [district, setDistrict] = useState<number | null>(null);
    const [step, setStep] = useState(1);
    const [visiblePieces, setVisiblePieces] = useState([true, false, false]);


    const { data, setData, post, processing, errors } = useForm({
        titre_demandeur: '',
        sexe: '',
        nom_demandeur: '',
        prenom_demandeur: '',
        date_naissance: '',
        lieu_naissance: '',
        cin: '',
        date_delivrance: '',
        lieu_delivrance: '',
        date_delivrance_duplicata: '',
        lieu_delivrance_duplicata: '',
        situation_familiale: '',
        occupation: '',
        domiciliation: '',
        nationalite: '',
        id_district: '',

        nom_pere: '',
        nom_mere: '',
        date_mariage: '',
        lieu_mariage: '',
        marie_a: '',
        regime_matrimoniale: '',
        contact: '',
        pieces: [null, null, null] as (File | null)[],
    });

    const filteredRegions = province
        ? regions.filter((r) => r.id_province === province)
        : [];

    const filteredDistricts = region
        ? districts.filter((d) => d.id_region === region)
        : [];

    const handleTitreChange = (value: string) => {
        setData('titre_demandeur', value);
        setData('sexe', value === 'Monsieur' ? 'Homme' : 'Femme');
    };
    const validateForm = (): boolean => {
        const requiredFields = {
            titre_demandeur: 'Titre',
            nom_demandeur: 'Nom',
            date_naissance: 'Date de naissance',
            lieu_naissance: 'Lieu de naissance',
            cin: 'CIN',
            date_delivrance: 'Date CIN',
            lieu_delivrance: 'Lieu CIN',
            situation_familiale: 'Situation familiale',
            occupation: 'Profession',
            domiciliation: 'Domiciliation',
            nationalite: 'Nationalité',
            nom_mere: 'Nom de la mère',
            regime_matrimoniale: 'Régime matrimonial',
            contact: 'Contact',
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([key]) => !data[key as keyof typeof data]?.toString().trim())
            .map(([, label]) => `• ${label}`);

        if (!district) {
            missingFields.push('• District');
        }

        if (missingFields.length > 0) {
            toast.error('Veuillez remplir les champs obligatoires :', {
                description: missingFields.join('\n'),
            });
            return false;
        }

        return true;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        post(route('demandeurs.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation', {
                    description: messages.join('\n'),
                });
            },
            onSuccess: () => {
                toast.success('Formulaire envoyé avec succès !');
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Formulaire Demandeurs',
                    href: '/demandeurs/create',
                },
            ]}
        >
            <div className="mt-2">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/demandeurs">Demandeur</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Insertion</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="flex gap-5 mt-5">
                <Select
                    onValueChange={(value) => {
                        const found = provinces.find((p) => p.nom_province === value);
                        setProvince(found?.id || null);
                        setRegion(null);
                        setDistrict(null);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Province" />
                    </SelectTrigger>
                    <SelectContent>
                        {provinces.map((p) => (
                            <SelectItem key={p.id} value={p.nom_province}>
                                {p.nom_province}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    onValueChange={(value) => {
                        const found = regions.find((r) => r.nom_region === value);
                        setRegion(found?.id || null);
                        setDistrict(null);
                    }}
                    disabled={!province}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Région" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredRegions.map((r) => (
                            <SelectItem key={r.id} value={r.nom_region}>
                                {r.nom_region}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    onValueChange={(value) => {
                        const found = districts.find((d) => d.nom_district === value);
                        setDistrict(found?.id || null);
                        setData('id_district', found?.id || '');
                    }}
                    disabled={!region}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="District" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredDistricts.map((d) => (
                            <SelectItem key={d.id} value={d.nom_district}>
                                {d.nom_district}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Formulaire */}
            <div className="relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />

                <form onSubmit={handleSubmit} encType="multipart/form-data" className="relative z-10 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
                    {/* Stepper */}
                    <ol className="flex items-center justify-center mb-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <li className={`flex items-center ${step === 1 ? 'text-blue-600' : ''}`}>
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 border rounded-full flex items-center justify-center">1</span>
                            <span className="hidden sm:inline">Identité</span>
                          </span>
                                    </li>
                                    <li className="mx-4 border-t-2 w-10 sm:w-20 border-gray-300 dark:border-gray-600"></li>
                                    <li className={`flex items-center ${step === 2 ? 'text-blue-600' : ''}`}>
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 border rounded-full flex items-center justify-center">2</span>
                            <span className="hidden sm:inline">Famille & Contact</span>
                          </span>
                        </li>
                    </ol>

                    {step === 1 && (
                        <div className="grid gap-4">
                            <div>
                                <label>Titre</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={data.titre_demandeur}
                                    onChange={(e) => handleTitreChange(e.target.value)}
                                >
                                    <option value="">-- Sélectionner --</option>
                                    <option value="Monsieur">Monsieur</option>
                                    <option value="Madame">Madame</option>
                                    <option value="Mademoiselle">Mademoiselle</option>
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label>Nom</label>
                                    <input type="text"
                                           className="w-full border p-2 rounded"
                                           value={data.nom_demandeur} onChange={(e) => setData('nom_demandeur', e.target.value)}
                                           required
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label>Prénom</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.prenom_demandeur} onChange={(e) => setData('prenom_demandeur', e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label>Date de naissance</label>
                                    <input type="date" className="w-full border p-2 rounded" value={data.date_naissance} onChange={(e) => setData('date_naissance', e.target.value)} />
                                </div>
                                <div className="w-1/2">
                                    <label>Lieu de naissance</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.lieu_naissance} onChange={(e) => setData('lieu_naissance', e.target.value)} />
                                </div>
                            </div>
                            <input type="hidden" value={data.sexe} />
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label>CIN</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.cin} onChange={(e) => setData('cin', e.target.value)} />
                                </div>
                                <div className="w-1/2">
                                    <label>Date CIN</label>
                                    <input type="date" className="w-full border p-2 rounded" value={data.date_delivrance} onChange={(e) => setData('date_delivrance', e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label>Lieu CIN</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.lieu_delivrance} onChange={(e) => setData('lieu_delivrance', e.target.value)} />
                                </div>
                                <div className="w-1/2">
                                    <label>Date duplicata</label>
                                    <input type="date" className="w-full border p-2 rounded" value={data.date_delivrance_duplicata} onChange={(e) => setData('date_delivrance_duplicata', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label>Lieu duplicata</label>
                                <input type="text" className="w-full border p-2 rounded" value={data.lieu_delivrance_duplicata} onChange={(e) => setData('lieu_delivrance_duplicata', e.target.value)} />
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2 mt-6">
                                    <Select
                                        value={data.situation_familiale}
                                        onValueChange={(value) => {
                                            setData('situation_familiale', value);

                                            if (value !== 'Marié(e)') {
                                                setData('date_mariage', '');
                                                setData('lieu_mariage', '');
                                                setData('marie_a', '');
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full border p-2 rounded p-5">
                                            <SelectValue placeholder="Situation familiale" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Célibataire">Célibataire</SelectItem>
                                            <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                                            <SelectItem value="Veuf/Veuve">Veuf/Veuve</SelectItem>
                                            <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-1/2">
                                    <label>Profession</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.occupation} onChange={(e) => setData('occupation', e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label>Domiciliation</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.domiciliation} onChange={(e) => setData('domiciliation', e.target.value)} />
                                </div>
                                <div className="w-1/2">
                                    <label>Nationalité</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.nationalite} onChange={(e) => setData('nationalite', e.target.value)} />
                                </div>
                            </div>
                            <div className="text-right">
                                <Button type="button" onClick={() => setStep(2)}>Suivant</Button>
                            </div>
                        </div>
                    )}

                    {/* Étape 2 */}
                    {step === 2 && (
                        <div className="grid gap-4">
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label>Nom du père</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.nom_pere} onChange={(e) => setData('nom_pere', e.target.value)} />
                                </div>
                                <div className="w-1/2">
                                    <label>Nom de la mère</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.nom_mere} onChange={(e) => setData('nom_mere', e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label>Date mariage</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={data.date_mariage}
                                        onChange={(e) => setData('date_mariage', e.target.value)}
                                        disabled={data.situation_familiale !== 'Marié(e)'}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label>Lieu mariage</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={data.lieu_mariage}
                                        onChange={(e) => setData('lieu_mariage', e.target.value)}
                                        disabled={data.situation_familiale !== 'Marié(e)'}
                                    />
                                </div>
                            </div>
                            <div>
                                <label>Marié(e) à</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={data.marie_a}
                                    onChange={(e) => setData('marie_a', e.target.value)}
                                    disabled={data.situation_familiale !== 'Marié(e)'}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className={'w-1/2 mt-6'}>
                                    <Select
                                        value={data.regime_matrimoniale}
                                        onValueChange={(value) => {
                                            setData('regime_matrimoniale', value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full border p-2 rounded p-5">
                                            <SelectValue placeholder="Regime Matrimonial" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Séparation des biens">Séparation des biens</SelectItem>
                                            <SelectItem value="kitay telo an-dalana">kitay telo an-dalana</SelectItem>
                                            <SelectItem value="Zara mira">Zara-mira</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={'w-1/2'}>
                                    <label>Contact</label>
                                    <input type="text" className="w-full border p-2 rounded" value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
                                </div>
                            </div>

                            {visiblePieces.map((visible, index) =>
                                visible ? (
                                    <div key={index}>
                                        <label>Pièce jointe {index + 1}</label>
                                        <input
                                            type="file"
                                            className="w-full border p-2 rounded"
                                            onChange={(e) => {
                                                const updated = [...data.pieces];
                                                updated[index] = e.target.files?.[0] || null;
                                                setData('pieces', updated);
                                            }}
                                        />
                                    </div>
                                ) : null
                            )}
                            <div className="mt-2 space-y-2">
                                {[1, 2].map((i) => (
                                    <div key={i}>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={visiblePieces[i]}
                                                onChange={(e) => {
                                                    const updated = [...visiblePieces];
                                                    updated[i] = e.target.checked;
                                                    setVisiblePieces(updated);

                                                    // Réinitialise la pièce si décochée
                                                    if (!e.target.checked) {
                                                        const updatedPieces = [...data.pieces];
                                                        updatedPieces[i] = null;
                                                        setData('pieces', updatedPieces);
                                                    }
                                                }}
                                            />
                                             {i + 1}ᵉ pièce jointe
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {data.pieces.length < 3 && (
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={() => setData('pieces', [...data.pieces, null])}
                                >
                                    + Ajouter une autre pièce
                                </Button>
                            )}

                            <div className="flex justify-between mt-4">
                                <Button type="button" onClick={() => setStep(1)}>Précédent</Button>
                                <Button type="submit" disabled={processing}>{processing ? 'Envoi...' : 'Valider'}</Button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
            <Toaster />
        </AppLayout>
    );
}
