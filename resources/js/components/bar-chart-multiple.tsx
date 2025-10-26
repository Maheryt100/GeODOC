"use client"

import { TrendingUpDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    desktop: {
        label: "Demandeurs",
        color: "var(--chart-1)",
    },
    mobile: {
        label: "Proprietes",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

type Props = {
    barChartData: { nom_dossier: string; demandeurs: number; proprietes: number; }[]
}

export function BarChartMultiple({ barChartData }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bar Chart - Multiple</CardTitle>
                <CardDescription>6 derniers dossiers</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={barChartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="nom_dossier"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <Bar dataKey="demandeurs" fill="var(--color-desktop)" radius={4} />
                        <Bar dataKey="proprietes" fill="var(--color-mobile)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Afficher le total des demandeurs et des propriétés pour les 6 derniers dossiers <TrendingUpDown className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    survoler le graphique pour voir plus de détail sur le nombre par dossier
                </div>
            </CardFooter>
        </Card>
    )
}
