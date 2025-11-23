import {
  ArrowTrendingUpIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { locationsApi } from "@/api/locations";
import type { LocationItem } from "@/api/types";
import {
  ALERT_AQI_THRESHOLD,
  AQI_GOOD_THRESHOLD,
  AQI_MODERATE_THRESHOLD,
  AQI_UNHEALTHY_SENSITIVE_THRESHOLD,
} from "@/components/locationInspector/constants";
import Sparkline from "@/components/sparkline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GetLocationLatestMetricsResponse } from "@/gen/locations/v1/locations_pb";
import {
  type PaginatedDataFetchFns,
  usePaginatedFetcher,
} from "@/hooks/use-paginated-fetcher";
import type { PagArgs } from "@/lib/utils";
import { pushNotificationAtom } from "@/state/notifications";

const DEFAULT_LOCATIONS_LIMIT = 6;
const SPARKLINE_WEIGHT_1 = 0.7;
const SPARKLINE_WEIGHT_2 = 0.8;
const SPARKLINE_WEIGHT_3 = 0.9;
const SPARKLINE_WEIGHT_4 = 1.0;
const SPARKLINE_WIDTH = 96;
const SPARKLINE_HEIGHT = 24;

// Toolbar & chart constants
type FilterKey = "all" | "good" | "moderate" | "sensitive" | "unhealthy";
type DateRange = "7d" | "30d" | "90d";

const FILTERS: readonly { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "good", label: "Good" },
  { key: "moderate", label: "Moderate" },
  { key: "sensitive", label: "Sensitive" },
  { key: "unhealthy", label: "Unhealthy" },
] as const;

const DATE_RANGE_OPTIONS: readonly DateRange[] = ["7d", "30d", "90d"] as const;

const CHART_HEIGHT = 240;
const CHART_GRID_DASH_ARRAY = "3 3";
const CHART_MARGIN_TOP = 10;
const CHART_MARGIN_RIGHT = 10;
const CHART_MARGIN_BOTTOM = 0;
const CHART_MARGIN_LEFT = 0;
const CHART_Y_AXIS_WIDTH = 32;
const CHART_PRIMARY_COLOR_HEX = "#2563eb";
const GRADIENT_START_OFFSET_PERCENT = 5;
const GRADIENT_END_OFFSET_PERCENT = 95;
const GRADIENT_START_OPACITY = 0.35;
const GRADIENT_END_OPACITY = 0.02;
const CHART_BASE_FALLBACK = 75;
const CHART_MIN_AQI = 0;
const CHART_MAX_AQI = 200;
const TWO_PI = Math.PI * 2;
const CHART_TREND_AMPLITUDE = 0.12;
const CHART_TREND_SUBWAVE_FACTOR = 0.5;
const CHART_TREND_SUBWAVE_OFFSET = 0.25;

const CHART_POINTS_7D = 7;
const CHART_POINTS_30D = 30;
const CHART_POINTS_90D = 90;

const generateTrendMultipliers = (length: number): number[] => {
  const values: number[] = [];
  for (let index = 0; index < length; index += 1) {
    const t = length > 1 ? index / (length - 1) : 0;
    const wave = CHART_TREND_AMPLITUDE * Math.sin(TWO_PI * t);
    const subwave =
      CHART_TREND_AMPLITUDE *
      CHART_TREND_SUBWAVE_FACTOR *
      Math.cos(TWO_PI * (t + CHART_TREND_SUBWAVE_OFFSET));
    const multiplier = 1 + wave + subwave;
    values.push(multiplier);
  }
  return values;
};

// Skeleton Components
function SummaryCardSkeleton() {
  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-4 w-32 bg-transparent" />
            <Skeleton className="mb-2 h-8 w-20 bg-transparent" />
            <Skeleton className="h-3 w-24 bg-transparent" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg bg-transparent" />
        </div>
      </CardContent>
    </Card>
  );
}

function LocationCardSkeleton() {
  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="mb-1 h-5 w-48 bg-transparent" />
            <Skeleton className="h-4 w-64 bg-transparent" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full bg-transparent" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-8 w-16 bg-transparent" />
            <Skeleton className="h-4 w-12 bg-transparent" />
          </div>
          <Skeleton className="h-6 w-32 bg-transparent" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-24 bg-transparent" />
            <Skeleton className="h-4 w-8 bg-transparent" />
          </div>
          <Skeleton className="h-2 w-full bg-transparent" />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCardsSkeleton() {
  const summaryKeys = ["summary-1", "summary-2", "summary-3", "summary-4"];
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {summaryKeys.map((key) => (
        <SummaryCardSkeleton key={key} />
      ))}
    </div>
  );
}

function LocationCardsSkeleton() {
  const locationKeys = ["location-1", "location-2", "location-3"];
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {locationKeys.map((key) => (
        <LocationCardSkeleton key={key} />
      ))}
    </div>
  );
}

const fetcher = (
  paginationArgs: PagArgs
): PaginatedDataFetchFns<LocationItem> => {
  return {
    abort: () => {
      return true;
    },
    response: async () => {
      const response = await locationsApi.list({
        limit: paginationArgs.pageSize,
        offset: paginationArgs.page,
      });
      // TODO: need this info from API
      return {
        items: response.items,
        totalItems: response.items.length,
        pageSize: paginationArgs.pageSize,
        currentPage: paginationArgs.page,
        totalPages: paginationArgs.page,
      };
    },
  };
};

export default function Dashboard() {
  const [latestMap, setLatestMap] = useState<
    Record<string, GetLocationLatestMetricsResponse>
  >({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const { state, loadPage } = usePaginatedFetcher({
    fetcher,
    cacheKey: "locations-list",
  });
  const locationsPaginated = useAtomValue(state.data);
  const locations = locationsPaginated.items;
  const isLoadingLocations = useAtomValue(state.isLoading);
  const wasMounted = useRef(false);

  if (wasMounted.current === false) {
    wasMounted.current = true;
    loadPage({ page: 1, pageSize: DEFAULT_LOCATIONS_LIMIT });
  }

  useEffect(() => {
    if (locations.length === 0) {
      return;
    }
    setIsLoadingMetrics(true);
    const promises = locations.map((loc) =>
      locationsApi.latest(loc.id).then((m) => [loc.id, m] as const)
    );
    Promise.all(promises)
      .then((results) => {
        const newMap = Object.fromEntries(results);
        setLatestMap(newMap);
      })
      .finally(() => setIsLoadingMetrics(false));
  }, [locations]);

  const getAQIStatus = (aqi: number) => {
    if (aqi <= AQI_GOOD_THRESHOLD) {
      return "Good";
    }
    if (aqi <= AQI_MODERATE_THRESHOLD) {
      return "Moderate";
    }
    if (aqi <= AQI_UNHEALTHY_SENSITIVE_THRESHOLD) {
      return "Unhealthy for Sensitive";
    }
    return "Unhealthy";
  };

  const getAQIBadgeClasses = (aqi: number) => {
    if (aqi <= AQI_GOOD_THRESHOLD) {
      return "bg-card-green text-brand-green";
    }
    if (aqi <= AQI_MODERATE_THRESHOLD) {
      return "bg-card-yellow text-accent-yellow-foreground";
    }
    if (aqi <= AQI_UNHEALTHY_SENSITIVE_THRESHOLD) {
      return "bg-accent-orange text-accent-orange-foreground";
    }
    return "bg-card-red text-state-error-foreground";
  };

  const totalLocations = locations.length;
  const averageAQI =
    locations.length > 0
      ? Math.round(
          locations.reduce((sum, loc) => {
            const latest = latestMap[loc.id]?.metrics || [];
            const aqi = latest.find((m) => m.metric === "aqi");
            return sum + (aqi ? aqi.value : 0);
          }, 0) / locations.length
        )
      : 0;

  const filteredLocations = useMemo(
    () =>
      locations.filter((loc) => {
        const latest = latestMap[loc.id]?.metrics || [];
        const aqi = latest.find((m) => m.metric === "aqi");
        const value = aqi ? aqi.value : 0;
        switch (activeFilter) {
          case "good":
            return value <= AQI_GOOD_THRESHOLD;
          case "moderate":
            return (
              value > AQI_GOOD_THRESHOLD && value <= AQI_MODERATE_THRESHOLD
            );
          case "sensitive":
            return (
              value > AQI_MODERATE_THRESHOLD &&
              value <= AQI_UNHEALTHY_SENSITIVE_THRESHOLD
            );
          case "unhealthy":
            return value > AQI_UNHEALTHY_SENSITIVE_THRESHOLD;
          default:
            return true;
        }
      }),
    [locations, latestMap, activeFilter]
  );

  const getChartLength = useMemo(() => {
    if (dateRange === "30d") {
      return CHART_POINTS_30D;
    }
    if (dateRange === "90d") {
      return CHART_POINTS_90D;
    }
    return CHART_POINTS_7D;
  }, [dateRange]);

  const chartBase = averageAQI || CHART_BASE_FALLBACK;
  const chartMultipliers = useMemo(
    () => generateTrendMultipliers(getChartLength),
    [getChartLength]
  );
  const trendData = useMemo(
    () =>
      chartMultipliers.map((multiplier, index) => ({
        name: `${index + 1}`,
        aqi: Math.max(
          CHART_MIN_AQI,
          Math.min(CHART_MAX_AQI, Math.round(chartBase * multiplier))
        ),
      })),
    [chartMultipliers, chartBase]
  );

  const isLoading = isLoadingLocations || isLoadingMetrics;

  const pushNotification = useSetAtom(pushNotificationAtom);
  const loadToastShownRef = useRef(false);

  useEffect(() => {
    if (isLoading || loadToastShownRef.current) {
      return;
    }
    pushNotification({
      kind: "success",
      message: "Dashboard data loaded",
    });
    loadToastShownRef.current = true;
  }, [isLoading, pushNotification]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <Button
              aria-pressed={activeFilter === f.key}
              className={activeFilter === f.key ? "" : "bg-bg-surface"}
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              variant={activeFilter === f.key ? "default" : "outline"}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {DATE_RANGE_OPTIONS.map((r) => (
            <Button
              aria-pressed={dateRange === r}
              className={dateRange === r ? "" : "bg-bg-surface"}
              key={r}
              onClick={() => setDateRange(r)}
              variant={dateRange === r ? "default" : "outline"}
            >
              {r.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <SummaryCardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-bg-surface shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-md text-text-secondary">
                    Total Locations
                  </p>
                  <p className="mt-1 font-bold text-3xl text-text-primary">
                    {totalLocations}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                    <ArrowTrendingUpIcon className="h-3 w-3 text-accent-success" />
                    +2 this week
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card-green">
                  <MapPinIcon className="h-6 w-6 text-brand-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-bg-surface shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-md text-text-secondary">
                    Average AQI
                  </p>
                  <p className={"mt-1 font-bold text-3xl"}>{averageAQI}</p>
                  <p className={"mt-2 text-sm text-text-secondary"}>
                    {getAQIStatus(averageAQI)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card-green">
                  <CloudIcon className="h-6 w-6 text-brand-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-bg-surface shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-md text-text-secondary">
                    Monitored Today
                  </p>
                  <p className="mt-1 font-bold text-3xl text-text-primary">
                    {totalLocations * 24}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                    <ArrowTrendingUpIcon className="h-3 w-3 text-accent-success" />
                    100% uptime
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card-purple">
                  <EyeIcon className="h-6 w-6 text-accent-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-bg-surface shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-md text-text-secondary">
                    Alerts
                  </p>
                  <p className="mt-1 font-bold text-3xl">
                    {
                      locations.filter((loc) => {
                        const latest = latestMap[loc.id]?.metrics || [];
                        const aqi = latest.find((m) => m.metric === "aqi");
                        return aqi && aqi.value > ALERT_AQI_THRESHOLD;
                      }).length
                    }
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    High AQI levels
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-yellow">
                  <ExclamationTriangleIcon className="h-6 w-6 text-accent-yellow-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AQI Trend Chart */}
      <Card className="border-0 bg-bg-surface shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="font-semibold text-lg text-text-primary">
            AQI Trend
          </CardTitle>
          <div className="text-sm text-text-secondary">
            Average AQI over selected range
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer height={CHART_HEIGHT} width="100%">
            <AreaChart
              data={trendData}
              margin={{
                top: CHART_MARGIN_TOP,
                right: CHART_MARGIN_RIGHT,
                left: CHART_MARGIN_LEFT,
                bottom: CHART_MARGIN_BOTTOM,
              }}
            >
              <defs>
                <linearGradient id="aqiGradient" x1="0" x2="0" y1="0" y2="1">
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
                dataKey="aqi"
                fill="url(#aqiGradient)"
                fillOpacity={1}
                stroke={CHART_PRIMARY_COLOR_HEX}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Location Cards */}
      <div>
        <h2 className="mb-4 font-semibold text-text-primary text-xl">
          Location Overview
        </h2>
        {isLoading ? (
          <LocationCardsSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((loc) => {
              const latest = latestMap[loc.id] || [];
              const aqi = latest.metrics.find((m) => m.metric === "aqi");
              const aqiVal = aqi ? aqi.value : 0;
              return (
                <Card
                  className="border-0 bg-bg-surface shadow-lg transition-shadow hover:shadow-xl"
                  key={loc.id}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-semibold text-lg text-text-primary">
                          {loc.name}
                        </CardTitle>
                        <div className="mt-1 text-sm text-text-secondary">
                          {[loc.city, loc.region, loc.country]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-2 py-1 font-medium text-xs ${getAQIBadgeClasses(
                          aqiVal
                        )}`}
                      >
                        {getAQIStatus(aqiVal)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <div className={"font-bold text-3xl text-text-primary"}>
                          {Math.round(aqiVal)}
                        </div>
                        <div className="text-sm text-text-primary">AQI</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkline
                          height={SPARKLINE_HEIGHT}
                          values={[
                            aqiVal * SPARKLINE_WEIGHT_1,
                            aqiVal * SPARKLINE_WEIGHT_2,
                            aqiVal * SPARKLINE_WEIGHT_3,
                            aqiVal * SPARKLINE_WEIGHT_4,
                          ]}
                          width={SPARKLINE_WIDTH}
                        />
                        <div className="ml-2 text-accent-success">
                          <ArrowTrendingUpIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
