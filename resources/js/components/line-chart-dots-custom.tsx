"use client"

import { GitCommitVertical, TrendingUpDown } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

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
} from "@/components/ui/chart"

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
    mobile: {
        label: "Mobile",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

type Props = {
    lineChartData: { nom_dossier: string; demandes_count: number; }[]
}
export function LineChartDotsCustom({ lineChartData } : Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Line Chart - Custom Dots</CardTitle>
                <CardDescription>6 derniers dossiers</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={lineChartData.reverse()}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 10,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="nom_dossier"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length > 0) {
                                    const data = payload[0].payload
                                    return (
                                        <div className="rounded-md bg-background p-2 shadow-md text-sm">
                                            <div className="font-medium">
                                                <h6 className="text-xs font-bold">{data.nom_dossier}:</h6>
                                                {data.demandes_count}
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Line
                            dataKey="demandes_count"
                            type="natural"
                            stroke="var(--color-desktop)"
                            strokeWidth={2}
                            dot={({ cx, cy, payload }) => {
                                const r = 24
                                return (
                                    <GitCommitVertical
                                        key={payload.nom_dossier}
                                        x={cx - r / 2}
                                        y={cy - r / 2}
                                        width={r}
                                        height={r}
                                        fill="hsl(var(--background))"
                                        stroke="var(--color-desktop)"
                                    />
                                )
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Affiche l'evolution des totals des demandes pour les 6 derniers dossiers <TrendingUpDown className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    survoler le graphique pour voir plus de détail sur le nombre par dossier
                </div>
            </CardFooter>
        </Card>
    )
}
