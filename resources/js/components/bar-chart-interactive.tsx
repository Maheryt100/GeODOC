"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive bar chart"

const chartConfig = {
    prix: {
        label: "Total Prix",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

type Props = {
    barChartInteractiveData: { nom_dossier: string; prix: number | null; }[];
}

export function BarChartInteractive({ barChartInteractiveData }: Props) {

    const chartData = React.useMemo(() =>
            barChartInteractiveData.map(item => ({
                nom_dossier: item.nom_dossier,
                prix: item.prix ?? 0,
            })),
        [barChartInteractiveData]
    );

    const total = React.useMemo(
        () => chartData.reduce((acc, curr) => acc + curr.prix, 0),
        [chartData]
    );

    return (
        <Card className="py-0">
            <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
                    <CardTitle>Bar Chart - Prix par Dossier</CardTitle>
                    <CardDescription>
                        Affichage des totaux prix pour les dossiers
                    </CardDescription>
                </div>
                <div className="flex flex-1 justify-end px-6 pt-4 pb-3 sm:!py-0">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-muted-foreground text-xs">Total Global</span>
                        <span className="text-lg leading-none font-bold sm:text-3xl">
                            {total.toLocaleString()} Ar
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="nom_dossier"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value: string) => value.slice(0, 10) + "..."}  // Typé pour string
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[150px]"
                                    nameKey="prix"
                                    labelFormatter={(value: string) => value}
                                    formatter={(value) => `${value.toLocaleString()} Ar`}
                                />
                            }
                        />
                        <Bar dataKey="prix" fill="var(--color-prix)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
