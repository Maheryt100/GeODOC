// pages/demandes/components/DossierStats.tsx
import { Card, CardContent } from '@/components/ui/card';
import { FileText, LockOpen, Lock, MapPin } from 'lucide-react';

interface DossierStatsProps {
    totalDemandes: number;
    activeCount: number;
    archivedCount: number;
    proprietesCount: number;
}

export default function DossierStats({
    totalDemandes,
    activeCount,
    archivedCount,
    proprietesCount
}: DossierStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Total demandes</p>
                            <p className="text-2xl font-bold text-blue-600">{totalDemandes}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <LockOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Actives</p>
                            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Archivées</p>
                            <p className="text-2xl font-bold text-orange-600">{archivedCount}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Propriétés</p>
                            <p className="text-2xl font-bold text-purple-600">{proprietesCount}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}