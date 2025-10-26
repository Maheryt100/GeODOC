"use client"

import { TrendingUpDown } from 'lucide-react';
import { RadialBar, RadialBarChart } from "recharts"

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

export const description = "A radial chart"

const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    chrome: {
        label: "Chrome",
        color: "var(--chart-1)",
    },
    safari: {
        label: "Safari",
        color: "var(--chart-2)",
    },
    firefox: {
        label: "Firefox",
        color: "var(--chart-3)",
    },
    edge: {
        label: "Edge",
        color: "var(--chart-4)",
    },
    other: {
        label: "Other",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

type Props = {
    chartRadialData:  { nom_dossier: string; demandeurs_sans_propriete: number; }[];
}
export function ChartRadial({chartRadialData}: Props ) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Radial Chart</CardTitle>
                <CardDescription>6 derniers dossiers</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <RadialBarChart data={chartRadialData} innerRadius={30} outerRadius={110}>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel nameKey="nom_dossier" />}
                        />
                        <RadialBar dataKey="demandeurs_sans_propriete" background />
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                    total des demandeurs n'ayant pas de propriétés mais inséré <TrendingUpDown className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    survoler le graphique pour voir plus de détail sur le nombre par dossier
                </div>
            </CardFooter>
        </Card>
    )
}
