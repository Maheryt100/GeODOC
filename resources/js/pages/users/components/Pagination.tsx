// users/components/Pagination.tsx
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
    itemName?: string; // Ex: "utilisateur", "dossier"
}

export const Pagination = ({
    currentPage,
    lastPage,
    total,
    perPage,
    onPageChange,
    itemName = 'élément',
}: PaginationProps) => {
    if (lastPage <= 1) return null;

    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, total);
    const itemNamePlural = total > 1 ? `${itemName}s` : itemName;

    /**
     * Génère les numéros de page à afficher
     */
    const getPageNumbers = (): (number | 'ellipsis')[] => {
        const pages: (number | 'ellipsis')[] = [];
        const delta = 2; // Nombre de pages à afficher de chaque côté

        // Toujours afficher la première page
        pages.push(1);

        // Pages autour de la page actuelle
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(lastPage - 1, currentPage + delta); i++) {
            // Ajouter ellipsis si nécessaire avant
            if (i === currentPage - delta && i > 2) {
                pages.push('ellipsis');
            }

            pages.push(i);

            // Ajouter ellipsis si nécessaire après
            if (i === currentPage + delta && i < lastPage - 1) {
                pages.push('ellipsis');
            }
        }

        // Toujours afficher la dernière page
        if (lastPage > 1) {
            pages.push(lastPage);
        }

        // Supprimer les doublons d'ellipsis
        return pages.filter((page, index, arr) => {
            if (page === 'ellipsis' && arr[index - 1] === 'ellipsis') {
                return false;
            }
            return true;
        });
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-between pt-4 border-t">
            {/* Info */}
            <div className="text-sm text-muted-foreground">
                Affichage de <span className="font-medium">{startItem}</span> à{' '}
                <span className="font-medium">{endItem}</span> sur{' '}
                <span className="font-medium">{total}</span> {itemNamePlural}
            </div>

            {/* Contrôles */}
            <div className="flex items-center gap-2">
                {/* Première page */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="Première page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Page précédente */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Page précédente"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Numéros de page */}
                <div className="hidden md:flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                                    ...
                                </span>
                            );
                        }

                        const isActive = page === currentPage;
                        return (
                            <Button
                                key={page}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onPageChange(page)}
                                className={isActive ? 'pointer-events-none' : ''}
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                {/* Info page mobile */}
                <div className="md:hidden px-3 py-1.5 text-sm font-medium bg-muted rounded-md">
                    {currentPage} / {lastPage}
                </div>

                {/* Page suivante */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    title="Page suivante"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Dernière page */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(lastPage)}
                    disabled={currentPage === lastPage}
                    title="Dernière page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};