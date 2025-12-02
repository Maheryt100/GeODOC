// Statistics/components/FinancialsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinancialsStats } from '../types';

interface Props {
    financials: FinancialsStats;
}

export function FinancialsTab({ financials }: Props) {
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('fr-FR').format(num);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="text-2xl font-bold mt-2">
                            {formatNumber(financials.total_revenus_potentiels)} Ar
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Moyenne</div>
                        <div className="text-2xl font-bold mt-2">
                            {formatNumber(financials.revenu_moyen)} Ar
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Maximum</div>
                        <div className="text-2xl font-bold mt-2">
                            {formatNumber(financials.revenu_max)} Ar
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Minimum</div>
                        <div className="text-2xl font-bold mt-2">
                            {formatNumber(financials.revenu_min)} Ar
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Revenus par vocation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(financials.par_vocation).map(([vocation, montant]) => (
                            <div 
                                key={vocation} 
                                className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                            >
                                <span className="font-medium capitalize">{vocation}</span>
                                <span className="text-lg font-bold">
                                    {formatNumber(montant)} Ar
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}