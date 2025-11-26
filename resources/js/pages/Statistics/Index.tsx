// this is Statistics/Index.tsx
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
    Download, TrendingUp, Users, LandPlot, 
    DollarSign, MapPin, Calendar, PieChart,
    BarChart3, Activity, Filter, FileDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsProps {
    stats: {
        overview: any;
        dossiers: any;
        proprietes: any;
        demandeurs: any;
        demographics: any;
        financials: any;
        geographic: any;
        performance: any;
    };
    charts: {
        evolution_mensuelle: any[];
        repartition_nature: any[];
        repartition_vocation: any[];
        top_districts: any[];
        age_pyramid: any[];
        completion_rate: any[];
    };
    filters: {
        period: string;
        date_from: string | null;
        date_to: string | null;
        district_id: number | null;
    };
    districts: any[];
}

export default function StatisticsIndex({ stats, charts, filters, districts }: StatisticsProps) {
    const [period, setPeriod] = useState(filters.period);
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [districtId, setDistrictId] = useState(filters.district_id?.toString() || 'all');
    const [isExporting, setIsExporting] = useState(false);

    const handleFilterChange = () => {
        router.get(route('statistiques.index'), {
            period,
            date_from: period === 'custom' ? dateFrom : null,
            date_to: period === 'custom' ? dateTo : null,
            district_id: districtId !== 'all' ? districtId : null,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExportPDF = () => {
        setIsExporting(true);
        window.location.href = route('statistiques.export-pdf', {
            period,
            date_from: period === 'custom' ? dateFrom : null,
            date_to: period === 'custom' ? dateTo : null,
            district_id: districtId !== 'all' ? districtId : null,
        });
        setTimeout(() => setIsExporting(false), 2000);
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = 'blue' }: any) => (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "p-3 rounded-lg",
                        color === 'blue' && "bg-blue-100 dark:bg-blue-900",
                        color === 'green' && "bg-green-100 dark:bg-green-900",
                        color === 'purple' && "bg-purple-100 dark:bg-purple-900",
                        color === 'orange' && "bg-orange-100 dark:bg-orange-900"
                    )}>
                        <Icon className={cn(
                            "h-6 w-6",
                            color === 'blue' && "text-blue-600 dark:text-blue-400",
                            color === 'green' && "text-green-600 dark:text-green-400",
                            color === 'purple' && "text-purple-600 dark:text-purple-400",
                            color === 'orange' && "text-orange-600 dark:text-orange-400"
                        )} />
                    </div>
                    {trend && (
                        <Badge variant={trend > 0 ? "default" : "secondary"} className="text-xs">
                            {trend > 0 ? '+' : ''}{trend}%
                        </Badge>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Statistiques', href: '#' }
        ]}>
            <Head title="Statistiques" />

            <div className="flex flex-col gap-6 p-6">
                {/* En-tête */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Statistiques</h1>
                        <p className="text-muted-foreground mt-1">
                            Analyse détaillée de vos données
                        </p>
                    </div>
                    <Button 
                        onClick={handleExportPDF} 
                        disabled={isExporting}
                        className="gap-2"
                    >
                        {isExporting ? (
                            <>
                                <Activity className="h-4 w-4 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                <FileDown className="h-4 w-4" />
                                Exporter PDF
                            </>
                        )}
                    </Button>
                </div>

                {/* Filtres */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtres
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Période */}
                            <div className="space-y-2">
                                <Label>Période</Label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Aujourd'hui</SelectItem>
                                        <SelectItem value="week">Cette semaine</SelectItem>
                                        <SelectItem value="month">Ce mois</SelectItem>
                                        <SelectItem value="year">Cette année</SelectItem>
                                        <SelectItem value="custom">Personnalisé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date début (si personnalisé) */}
                            {period === 'custom' && (
                                <div className="space-y-2">
                                    <Label>Date début</Label>
                                    <Input 
                                        type="date" 
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Date fin (si personnalisé) */}
                            {period === 'custom' && (
                                <div className="space-y-2">
                                    <Label>Date fin</Label>
                                    <Input 
                                        type="date" 
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* District */}
                            <div className="space-y-2">
                                <Label>District</Label>
                                <Select value={districtId} onValueChange={setDistrictId}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les districts</SelectItem>
                                        {districts.map((d: any) => (
                                            <SelectItem key={d.id} value={d.id.toString()}>
                                                {d.nom_district}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bouton Appliquer */}
                            <div className="flex items-end">
                                <Button onClick={handleFilterChange} className="w-full">
                                    Appliquer
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs pour les différentes catégories */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-8">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="dossiers">Dossiers</TabsTrigger>
                        <TabsTrigger value="proprietes">Propriétés</TabsTrigger>
                        <TabsTrigger value="demandeurs">Demandeurs</TabsTrigger>
                        <TabsTrigger value="demographics">Démographie</TabsTrigger>
                        <TabsTrigger value="financials">Finances</TabsTrigger>
                        <TabsTrigger value="geographic">Géographie</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>

                    {/* Vue d'ensemble */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard 
                                icon={Activity}
                                title="Total dossiers"
                                value="156"
                                subtitle="128 ouverts, 28 fermés"
                                trend={12}
                                color="blue"
                            />
                            <StatCard 
                                icon={LandPlot}
                                title="Propriétés"
                                value="342"
                                subtitle="285 disponibles"
                                trend={8}
                                color="green"
                            />
                            <StatCard 
                                icon={Users}
                                title="Demandeurs"
                                value="289"
                                subtitle="245 actifs"
                                trend={15}
                                color="purple"
                            />
                            <StatCard 
                                icon={DollarSign}
                                title="Revenus"
                                value="45.2M Ar"
                                subtitle="Potentiel total"
                                trend={25}
                                color="orange"
                            />
                        </div>

                        {/* Graphique d'évolution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Évolution mensuelle</CardTitle>
                                <CardDescription>Activité sur les 12 derniers mois</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Graphique d'évolution (à implémenter avec Recharts)
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Onglet Démographie */}
                    <TabsContent value="demographics" className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Répartition par genre */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Répartition par genre</CardTitle>
                                    <CardDescription>Demandeurs avec propriété</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {stats.demographics && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                        <span className="text-xl">👨</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Hommes</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {stats.demographics.hommes_avec_propriete} avec propriété
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold">{stats.demographics.total_hommes}</p>
                                                    <Badge variant="secondary">
                                                        {stats.demographics.pourcentage_hommes}%
                                                    </Badge>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                                                        <span className="text-xl">👩</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Femmes</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {stats.demographics.femmes_avec_propriete} avec propriété
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold">{stats.demographics.total_femmes}</p>
                                                    <Badge variant="secondary">
                                                        {stats.demographics.pourcentage_femmes}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tranches d'âge */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Répartition par âge</CardTitle>
                                    <CardDescription>
                                        Âge moyen: {stats.demographics?.age_moyen || 0} ans
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {stats.demographics?.tranches_age && (
                                        <div className="space-y-3">
                                            {Object.entries(stats.demographics.tranches_age).map(([tranche, count]: [string, any]) => (
                                                <div key={tranche}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium">{tranche} ans</span>
                                                        <span className="text-sm text-muted-foreground">{count} personnes</span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-2">
                                                        <div 
                                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                                            style={{ 
                                                                width: `${(count / stats.demographics.total_hommes + stats.demographics.total_femmes) * 100}%` 
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Onglet Finances */}
                    <TabsContent value="financials" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-muted-foreground">Total</div>
                                    <div className="text-2xl font-bold mt-2">
                                        {stats.financials?.total_revenus_potentiels 
                                            ? new Intl.NumberFormat('fr-FR').format(stats.financials.total_revenus_potentiels)
                                            : '0'
                                        } Ar
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-muted-foreground">Moyenne</div>
                                    <div className="text-2xl font-bold mt-2">
                                        {stats.financials?.revenu_moyen 
                                            ? new Intl.NumberFormat('fr-FR').format(stats.financials.revenu_moyen)
                                            : '0'
                                        } Ar
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-muted-foreground">Maximum</div>
                                    <div className="text-2xl font-bold mt-2">
                                        {stats.financials?.revenu_max 
                                            ? new Intl.NumberFormat('fr-FR').format(stats.financials.revenu_max)
                                            : '0'
                                        } Ar
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-muted-foreground">Minimum</div>
                                    <div className="text-2xl font-bold mt-2">
                                        {stats.financials?.revenu_min 
                                            ? new Intl.NumberFormat('fr-FR').format(stats.financials.revenu_min)
                                            : '0'
                                        } Ar
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Par vocation */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenus par vocation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {stats.financials?.par_vocation && (
                                    <div className="space-y-3">
                                        {Object.entries(stats.financials.par_vocation).map(([vocation, montant]: [string, any]) => (
                                            <div key={vocation} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                <span className="font-medium capitalize">{vocation}</span>
                                                <span className="text-lg font-bold">
                                                    {new Intl.NumberFormat('fr-FR').format(montant)} Ar
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Autres onglets à implémenter de manière similaire */}
                    <TabsContent value="dossiers">
                        <Card>
                            <CardHeader>
                                <CardTitle>Statistiques des dossiers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Contenu à implémenter...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="proprietes">
                        <Card>
                            <CardHeader>
                                <CardTitle>Statistiques des propriétés</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Contenu à implémenter...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="demandeurs">
                        <Card>
                            <CardHeader>
                                <CardTitle>Statistiques des demandeurs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Contenu à implémenter...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="geographic">
                        <Card>
                            <CardHeader>
                                <CardTitle>Répartition géographique</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Contenu à implémenter...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="performance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Contenu à implémenter...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}