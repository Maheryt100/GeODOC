"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, RadialBar, RadialBarChart } from "recharts"

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

export const description = "A radial chart with a label"


type Props = {
    chartRadialData:  { nom_dossier: string; demandeurs_sans_propriete: number; }[];
}
export function ChartRadialLabel({ chartRadialData }: Props) {
    const chartConfig = chartRadialData.reduce((acc, { nom_dossier }) => {
        const key = nom_dossier.slice(0, 3).toLowerCase();
        acc[key] = {
            label: nom_dossier,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        };
        return acc;
    }, {} as ChartConfig);
    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Radial Chart - Label</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <RadialBarChart
                        data={chartRadialData}
                        startAngle={-90}
                        endAngle={380}
                        innerRadius={30}
                        outerRadius={110}
                    >
                        <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length > 0) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="rounded-md bg-background p-2 shadow-md text-sm -mt-10"> {/* Offset CSS négatif pour monter */}
                                            <div className="font-medium">
                                                <h6 className="text-xs font-bold">{data.nom_dossier}:</h6>
                                                {data.total_demandes}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <RadialBar dataKey="demandeurs_sans_propriete" background>
                            <LabelList
                                position="insideEnd"
                                dataKey="nom_dossier"
                                className="fill-white dark:fill-black capitalize mix-blend-luminosity"
                                fontSize={11}
                            />
                        </RadialBar>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing total visitors for the last 6 months
                </div>
            </CardFooter>
        </Card>
    )
}
