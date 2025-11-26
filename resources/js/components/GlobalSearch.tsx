// this is GlobalSearch.tsx
import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Search, Loader2, Folder, MapPin, Users, 
    LandPlot, FileText, X, ArrowRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
    type: 'dossier' | 'propriete' | 'demandeur' | 'commune';
    id: number;
    title: string;
    subtitle: string;
    metadata: string[];
    route: string;
    icon: any;
}

interface GlobalSearchProps {
    className?: string;
}

export default function GlobalSearch({ className }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchQuery: string) => {
        try {
            const response = await fetch(route('api.global-search', { q: searchQuery }));
            const data = await response.json();
            
            const formattedResults: SearchResult[] = [];

            // Dossiers
            data.dossiers?.forEach((d: any) => {
                formattedResults.push({
                    type: 'dossier',
                    id: d.id,
                    title: d.nom_dossier,
                    subtitle: `${d.type_commune} ${d.commune}`,
                    metadata: [
                        `Nº ${d.numero_ouverture || 'N/A'}`,
                        `${d.demandeurs_count} demandeurs`,
                        `${d.proprietes_count} propriétés`,
                        d.is_closed ? '🔒 Fermé' : '🟢 Ouvert'
                    ],
                    route: route('dossiers.show', d.id),
                    icon: Folder
                });
            });

            // Propriétés
            data.proprietes?.forEach((p: any) => {
                formattedResults.push({
                    type: 'propriete',
                    id: p.id,
                    title: `Lot ${p.lot}`,
                    subtitle: p.titre ? `TNº${p.titre}` : 'Sans titre',
                    metadata: [
                        p.dossier?.nom_dossier || 'Dossier inconnu',
                        `${p.contenance || 0} m²`,
                        p.nature,
                        p.is_archived ? '📦 Acquise' : '📋 Active'
                    ],
                    route: route('dossiers.show', p.id_dossier) + `#propriete-${p.id}`,
                    icon: LandPlot
                });
            });

            // Demandeurs
            data.demandeurs?.forEach((d: any) => {
                formattedResults.push({
                    type: 'demandeur',
                    id: d.id,
                    title: `${d.titre_demandeur} ${d.nom_demandeur} ${d.prenom_demandeur || ''}`,
                    subtitle: `CIN: ${d.cin}`,
                    metadata: [
                        d.occupation || 'Occupation N/A',
                        d.telephone || 'Tél N/A',
                        `${d.proprietes_count || 0} propriété(s)`,
                        d.dossiers_count ? `${d.dossiers_count} dossier(s)` : ''
                    ].filter(Boolean),
                    route: route('dossiers.show', d.dossiers?.[0]?.id || 0) + `#demandeur-${d.id}`,
                    icon: Users
                });
            });

            // Communes
            data.communes?.forEach((c: any) => {
                formattedResults.push({
                    type: 'commune',
                    id: c.id,
                    title: `${c.type_commune} ${c.commune}`,
                    subtitle: `Fokontany: ${c.fokontany}`,
                    metadata: [
                        `${c.dossiers_count} dossier(s)`,
                        c.circonscription
                    ],
                    route: route('dossiers', { search: c.commune }),
                    icon: MapPin
                });
            });

            setResults(formattedResults);
            setIsOpen(formattedResults.length > 0);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = (result: SearchResult) => {
        router.visit(result.route);
        setIsOpen(false);
        setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'dossier': return <Folder className="h-4 w-4" />;
            case 'propriete': return <LandPlot className="h-4 w-4" />;
            case 'demandeur': return <Users className="h-4 w-4" />;
            case 'commune': return <MapPin className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeBadge = (type: string) => {
        const colors = {
            dossier: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            propriete: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            demandeur: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
            commune: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
        };

        return (
            <Badge variant="secondary" className={cn('text-xs', colors[type as keyof typeof colors])}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
        );
    };

    return (
        <div className={cn("relative w-full", className)}>
            {/* Input de recherche */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Rechercher dossier, propriété, demandeur, CIN, lot, titre..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10 h-12 text-base"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {query && !isSearching && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                        onClick={() => {
                            setQuery('');
                            setIsOpen(false);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Résultats */}
            {isOpen && results.length > 0 && (
                <Card className="absolute top-14 z-50 w-full max-h-[70vh] overflow-hidden shadow-2xl border-2">
                    <CardContent className="p-0">
                        <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ↑↓ pour naviguer • ↵ pour ouvrir • Esc pour fermer
                            </span>
                        </div>
                        
                        <div className="overflow-y-auto max-h-[60vh]">
                            {results.map((result, index) => (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    className={cn(
                                        "p-4 border-b last:border-b-0 cursor-pointer transition-colors",
                                        "hover:bg-accent",
                                        selectedIndex === index && "bg-accent"
                                    )}
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            {/* Icône */}
                                            <div className="mt-1">
                                                {getTypeIcon(result.type)}
                                            </div>

                                            {/* Contenu */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-sm truncate">
                                                        {result.title}
                                                    </h4>
                                                    {getTypeBadge(result.type)}
                                                </div>
                                                
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {result.subtitle}
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {result.metadata.map((meta, i) => (
                                                        <span 
                                                            key={i} 
                                                            className="text-xs px-2 py-0.5 bg-muted rounded-md"
                                                        >
                                                            {meta}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Flèche */}
                                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-2 bg-muted/50 border-t text-center">
                            <span className="text-xs text-muted-foreground">
                                💡 Astuce : Recherchez par CIN (12 chiffres), lot, titre, nom, commune...
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Message si aucun résultat */}
            {isOpen && results.length === 0 && !isSearching && query.length >= 2 && (
                <Card className="absolute top-14 z-50 w-full shadow-lg">
                    <CardContent className="p-6 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Aucun résultat pour <strong>"{query}"</strong>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Essayez avec un CIN, un numéro de lot, un titre ou un nom
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}