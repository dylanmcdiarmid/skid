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
import type { SeriesPointBase } from "@/gen/locations/v1/locations_pb";
import { grpcTsToDateFallback } from "@/lib/utils";
import {
  CHART_GRID_DASH_ARRAY,
  CHART_PRIMARY_COLOR_HEX,
  CHART_Y_AXIS_WIDTH,
  GRADIENT_END_OFFSET_PERCENT,
  GRADIENT_END_OPACITY,
  GRADIENT_START_OFFSET_PERCENT,
  GRADIENT_START_OPACITY,
} from "./constants";

export function AQITrendCard({ series }: { series: SeriesPointBase[] }) {
  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="font-semibold text-gray-900 text-lg">
          AQI Trend
        </CardTitle>
        <div className="text-gray-500 text-sm">
          Measured AQI over selected range
        </div>
      </CardHeader>
      <CardContent>
        {series.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            No AQI data available for the selected range.
          </div>
        ) : (
          <ResponsiveContainer height={280} width="100%">
            <AreaChart
              data={series.map((p) => ({
                name: grpcTsToDateFallback(p.recordedAt).toLocaleDateString(),
                value: p.value,
              }))}
              margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="aqiGradientInspector"
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
              <Tooltip cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }} />
              <Area
                dataKey="value"
                fill="url(#aqiGradientInspector)"
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
}

export default AQITrendCard;
