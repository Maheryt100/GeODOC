// resources/js/pages/location/components/LocationSearchBar.tsx

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye } from 'lucide-react';

interface LocationSearchBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    isSuperAdmin: boolean;
}

export default function LocationSearchBar({ search, onSearchChange, isSuperAdmin }: LocationSearchBarProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Rechercher une province, région ou district..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            {!isSuperAdmin && (
                <Badge variant="outline" className="ml-auto bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                    <Eye className="mr-1 h-3 w-3" />
                    Mode lecture seule
                </Badge>
            )}
        </div>
    );
}