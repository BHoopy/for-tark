
"use client";
import * as React from "react";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/charts/chart";
import { useWindowSize } from "@/hooks/use-window-size";
import {
  ChartProps,
  createChartConfig,
  createChartData,
} from "@/components/charts/utils";

export default function PieChartComponent({ tournament, teams }: ChartProps) {
  const size = useWindowSize();
  const chartData = createChartData({ tournament, teams });
  const chartConfig = createChartConfig({ tournament, teams });

  return (
    <Card className="flex h-full w-full flex-col justify-center p-1 sm:p-4">
      <ResponsiveContainer className="flex md:h-full md:w-full">
        <ChartContainer
          config={chartConfig}
          className="flex h-[96%] w-[96%] max-w-xs aspect-square pb-0 [&_.recharts-pie-label-text]:fill-foreground md:max-w-lg justify-center"
        >
          <PieChart className="h-[96%] w-[96%] sm:p-0 md:p-4">
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="teamPoints"
              label
              nameKey="teamName"
              innerRadius={size.width <= 425 ? 55 : 70}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="teamName" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </ResponsiveContainer>
    </Card>
  );
}
