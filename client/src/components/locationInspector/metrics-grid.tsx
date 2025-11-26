import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  LatestMetricBase,
  SeriesPointBase,
} from "@/gen/locations/v1/locations_pb";
import { grpcTsToDate, grpcTsToDateFallback } from "@/lib/utils";
import {
  CHART_GRID_DASH_ARRAY,
  CHART_PRIMARY_COLOR_HEX,
  CHART_Y_AXIS_WIDTH,
  GRADIENT_END_OFFSET_PERCENT,
  GRADIENT_END_OPACITY,
  GRADIENT_START_OFFSET_PERCENT,
  GRADIENT_START_OPACITY,
} from "./constants";

export function MetricsGrid({
  latest,
  metricSeriesMap,
}: {
  latest: LatestMetricBase[];
  metricSeriesMap: Record<string, SeriesPointBase[]>;
}) {
  const nonAQIMetrics = latest.filter((m) => m.metric !== "aqi");
  if (nonAQIMetrics.length === 0) {
    return null;
  }
  return (
    <div>
      <h2 className="mb-4 font-semibold text-gray-900 text-xl">Metrics</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {nonAQIMetrics.map((m) => {
          const data = metricSeriesMap[m.metric] || [];
          return (
            <Card className="border-0 bg-white shadow-lg" key={`${m.metric}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-semibold text-gray-900 text-lg">
                    {m.metric}
                  </CardTitle>
                  <div className="font-bold text-gray-900">
                    {Math.round(m.value)} {m.unit}
                  </div>
                </div>
                <div className="text-gray-500 text-sm">
                  Last updated{" "}
                  {m.recordedAt
                    ? grpcTsToDate(m.recordedAt).toLocaleString()
                    : ""}
                </div>
              </CardHeader>
              <CardContent>
                {data.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 text-sm">
                    No data for this metric.
                  </div>
                ) : (
                  <ResponsiveContainer height={180} width="100%">
                    <AreaChart
                      data={data.map((p) => ({
                        name: grpcTsToDateFallback(
                          p.recordedAt
                        ).toLocaleDateString(),
                        value: p.value,
                      }))}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id={`metricGradient-${m.metric}`}
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset={`${GRADIENT_START_OFFSET_PERCENT}%`}
                            stopColor={CHART_PRIMARY_COLOR_HEX}
                            stopOpacity={GRADIENT_START_OPACITY}
                          />
                          <stop
                            offset={`${GRADIENT_END_OFFSET_PERCENT}%`}
                            stopColor={CHART_PRIMARY_COLOR_HEX}
                            stopOpacity={GRADIENT_END_OPACITY}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#e5e7eb"
                        strokeDasharray={CHART_GRID_DASH_ARRAY}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="name"
                        tick={{ fill: "#374151" }}
                        tickLine={false}
                      />
                      <YAxis
                        axisLine={false}
                        tick={{ fill: "#374151" }}
                        tickLine={false}
                        width={CHART_Y_AXIS_WIDTH}
                      />
                      <Tooltip
                        cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                      />
                      <Area
                        dataKey="value"
                        fill={`url(#metricGradient-${m.metric})`}
                        fillOpacity={1}
                        stroke={CHART_PRIMARY_COLOR_HEX}
                        type="monotone"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default MetricsGrid;
