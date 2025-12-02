// Dashboard/components/ChartsSection.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { 
    LineChart as RechartsLine, 
    Line, 
    BarChart, 
    Bar,
    PieChart as RechartsPie,
    Pie,
    Cell,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import type { Charts } from '../types';

interface Props {
    charts: Charts;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ChartsSection({ charts }: Props) {
    // Préparer les données pour le graphique de statut des propriétés
    const proprietesData = [
        { name: 'Disponibles', value: charts.proprietes_status?.disponibles || 0, color: '#10b981' },
        { name: 'Acquises', value: charts.proprietes_status?.acquises || 0, color: '#3b82f6' },
    ].filter(item => item.value > 0);

    // Préparer les données d'évolution
    const evolutionData = (charts.evolution_mensuelle && charts.evolution_mensuelle.length > 0)
        ? charts.evolution_mensuelle 
        : charts.dossiers_timeline ?? [];

    const revenuData = charts.revenus_par_vocation ?? [];
    
    // ✅ Données de performance trimestrielle
    const performanceData = charts.performance_trimestrielle ?? [];

    // Formattage du montant pour le tooltip
    const formatMontant = (value: number) => {
        return `${value.toLocaleString('fr-FR')} Ar`;
    };

    // ✅ Custom Tooltip pour le graphique de performance
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-sm mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div 
                                className="w-3 h-3 rounded" 
                                style={{ backgroundColor: entry.color }}
                            />
                            <span>{entry.name}: </span>
                            <span className="font-semibold">{entry.value}</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold">
                            Total: {payload.reduce((sum: number, p: any) => sum + p.value, 0)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="evolution" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="evolution" className="gap-2">
                        <LineChart className="h-4 w-4" />
                        Évolution
                    </TabsTrigger>
                    <TabsTrigger value="repartition" className="gap-2">
                        <PieChart className="h-4 w-4" />
                        Répartition
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Performance
                    </TabsTrigger>
                </TabsList>

                {/* Onglet Évolution */}
                <TabsContent value="evolution" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Évolution mensuelle
                            </CardTitle>
                            <CardDescription>
                                Activité sur les 12 derniers mois
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {evolutionData && evolutionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsLine data={evolutionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="month" 
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            name="Dossiers"
                                        />
                                    </RechartsLine>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Aucune donnée disponible
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Répartition */}
                <TabsContent value="repartition" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Statut des propriétés */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Statut des propriétés</CardTitle>
                                <CardDescription>
                                    Répartition disponibles vs acquises
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {proprietesData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <RechartsPie>
                                                <Pie
                                                    data={proprietesData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => 
                                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                                    }
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {proprietesData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </RechartsPie>
                                        </ResponsiveContainer>
                                        <div className="flex justify-center gap-4 mt-4">
                                            {proprietesData.map((item, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="text-sm">
                                                        {item.name}: <strong>{item.value}</strong>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        Aucune donnée disponible
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Revenus par vocation */}
                        {revenuData.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenus par vocation</CardTitle>
                                    <CardDescription>
                                        Distribution des revenus potentiels (demandes actives)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={revenuData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="vocation" 
                                                tick={{ fontSize: 11 }}
                                                angle={-15}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis 
                                                tickFormatter={(value) => 
                                                    `${(value / 1000000).toFixed(1)}M`
                                                }
                                            />
                                            <Tooltip 
                                                formatter={(value: number) => formatMontant(value)}
                                                contentStyle={{ fontSize: 12 }}
                                            />
                                            <Bar 
                                                dataKey="montant" 
                                                fill="#3b82f6"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* ✅ Onglet Performance - IMPLÉMENTÉ */}
                <TabsContent value="performance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Statut des dossiers</CardTitle>
                                    <CardDescription>
                                        Évolution trimestrielle (4 derniers trimestres)
                                    </CardDescription>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-blue-500" />
                                        <span className="text-xs">Ouverts</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-green-500" />
                                        <span className="text-xs">Fermés</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {performanceData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart 
                                            data={performanceData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="quarter" 
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend 
                                                wrapperStyle={{ fontSize: '12px' }}
                                            />
                                            <Bar 
                                                dataKey="ouverts" 
                                                stackId="a" 
                                                fill="#3b82f6"
                                                name="Dossiers ouverts"
                                                radius={[0, 0, 0, 0]}
                                            />
                                            <Bar 
                                                dataKey="fermes" 
                                                stackId="a" 
                                                fill="#10b981"
                                                name="Dossiers fermés"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    
                                    {/* Statistiques résumées */}
                                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {performanceData.reduce((sum, q) => sum + q.ouverts, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Total dossiers ouverts
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {performanceData.reduce((sum, q) => sum + q.fermes, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Total dossiers fermés
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-gray-900">
                                                {performanceData.reduce((sum, q) => sum + q.total, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Total général
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
                                    <p className="text-sm">Aucune donnée de performance disponible</p>
                                    <p className="text-xs mt-2">Les données s'afficheront dès qu'il y aura des dossiers</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}