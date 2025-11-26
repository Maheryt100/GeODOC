// this is Dashboard/Index.tsx
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    TrendingUp, TrendingDown, Folder, FolderOpen, 
    LandPlot, Users, DollarSign, AlertTriangle,
    Info, Calendar, ArrowRight, CheckCircle2
} from 'lucide-react';
import GlobalSearch from '@/components/GlobalSearch';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

interface KPI {
    dossiers_ouverts: number;
    dossiers_fermes: number;
    proprietes_acquises: number;
    proprietes_disponibles: number;
    taux_completion: number;
    demandeurs_actifs: number;
    revenus_potentiels: number;
    nouveaux_dossiers: number;
}

interface Alert {
    type: 'warning' | 'info' | 'error';
    title: string;
    message: string;
    action?: string;
}

interface Activity {
    id: number;
    type: string;
    description: string;
    time: string;
    user: string;
}

interface DashboardProps {
    kpis: KPI;
    charts: {
        dossiers_timeline: any[];
        proprietes_status: any[];
        top_communes: any[];
    };
    alerts: Alert[];
    recentActivity: Activity[];
}

export default function DashboardIndex({ kpis, charts, alerts, recentActivity }: DashboardProps) {
    // Calcul des variations (exemple avec des données fictives - à remplacer par des vraies données)
    const variations = {
        dossiers: '+12%',
        proprietes: '+8%',
        demandeurs: '+15%',
        revenus: '+25%'
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                {/* Recherche Globale */}
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
                    <p className="text-muted-foreground mb-4">
                        Vue d'ensemble de vos activités et statistiques
                    </p>
                    <GlobalSearch className="w-full" />
                </div>

                {/* Alertes */}
                {alerts && alerts.length > 0 && (
                    <div className="grid gap-3">
                        {alerts.slice(0, 3).map((alert, index) => (
                            <Alert 
                                key={index}
                                variant={alert.type === 'error' ? 'destructive' : 'default'}
                                className={cn(
                                    alert.type === 'warning' && 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
                                    alert.type === 'info' && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                )}
                            >
                                {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                                {alert.type === 'info' && <Info className="h-4 w-4" />}
                                <AlertTitle>{alert.title}</AlertTitle>
                                <AlertDescription className="flex items-center justify-between">
                                    <span>{alert.message}</span>
                                    {alert.action && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={alert.action}>
                                                Voir <ArrowRight className="ml-2 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ))}
                    </div>
                )}

                {/* KPIs - 6 indicateurs essentiels */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Dossiers */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dossiers</CardTitle>
                            <Folder className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold">{kpis.dossiers_ouverts}</div>
                                <Badge variant="secondary" className="text-xs">
                                    <FolderOpen className="h-3 w-3 mr-1" />
                                    Ouvertséé
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {kpis.dossiers_fermes} fermés • {kpis.nouveaux_dossiers} nouveau(x) ce mois
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">{variations.dossiers}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Propriétés */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
                            <LandPlot className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold">{kpis.proprietes_disponibles}</div>
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    Disponibles
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {kpis.proprietes_acquises} acquises
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">{variations.proprietes}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Taux de complétion */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.taux_completion}%</div>
                            <div className="w-full bg-muted rounded-full h-2 mt-3">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${kpis.taux_completion}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Dossiers complets (demandeurs + propriétés)
                            </p>
                        </CardContent>
                    </Card>

                    {/* Demandeurs actifs */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Demandeurs actifs</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.demandeurs_actifs}</div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Demandeurs avec propriété(s)
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">{variations.demandeurs}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenus potentiels */}
                    <Card className="hover:shadow-lg transition-shadow lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenus potentiels</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('fr-FR').format(kpis.revenus_potentiels)} Ar
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Total des demandes actives non archivées
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">{variations.revenus}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Section graphiques et activités */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Top communes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Top 5 Communes
                            </CardTitle>
                            <CardDescription>
                                Communes avec le plus de dossiers
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {charts.top_communes && charts.top_communes.length > 0 ? (
                                <div className="space-y-3">
                                    {charts.top_communes.map((commune: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                                                    {index + 1}
                                                </Badge>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{commune.commune}</p>
                                                    <p className="text-xs text-muted-foreground">{commune.fokontany}</p>
                                                </div>
                                            </div>
                                            <Badge>{commune.count} dossiers</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Aucune donnée disponible
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Activité récente */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Activité récente
                            </CardTitle>
                            <CardDescription>
                                Dernières actions sur la plateforme
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentActivity && recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivity.slice(0, 5).map((activity: Activity) => (
                                        <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {activity.user} • {activity.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Aucune activité récente
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Actions rapides */}
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
            </div>
        </AppLayout>
    );
}