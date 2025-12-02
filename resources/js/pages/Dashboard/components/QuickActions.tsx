// Dashboard/components/QuickActions.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Folder, FolderOpen, TrendingUp, Calendar } from 'lucide-react';

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>Accès directs aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Button asChild variant="outline" className="h-auto py-4">
                        <Link href={route('dossiers.create')}>
                            <div className="flex flex-col items-center gap-2">
                                <Folder className="h-6 w-6" />
                                <span>Nouveau dossier</span>
                            </div>
                        </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto py-4">
                        <Link href={route('dossiers')}>
                            <div className="flex flex-col items-center gap-2">
                                <FolderOpen className="h-6 w-6" />
                                <span>Voir dossiers</span>
                            </div>
                        </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto py-4">
                        <Link href={route('statistiques.index')}>
                            <div className="flex flex-col items-center gap-2">
                                <TrendingUp className="h-6 w-6" />
                                <span>Statistiques</span>
                            </div>
                        </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto py-4">
                        <Link href={route('admin.activity-logs.index')}>
                            <div className="flex flex-col items-center gap-2">
                                <Calendar className="h-6 w-6" />
                                <span>Logs d'activité</span>
                            </div>
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}