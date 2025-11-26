import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { locationsApi } from "@/api/locations";
import type { LocationItem } from "@/api/types";
import { AQITrendCard } from "@/components/locationInspector/aqi-trend-card";
import type { DateRange } from "@/components/locationInspector/constants";
import {
  RANGE_DAYS_7,
  RANGE_DAYS_30,
  RANGE_DAYS_90,
  RANGE_DAYS_365,
} from "@/components/locationInspector/constants";
import { LocationHeader } from "@/components/locationInspector/location-header";
import { MetricsGrid } from "@/components/locationInspector/metrics-grid";
import { Card, CardContent } from "@/components/ui/card";
import type {
  LatestMetricBase,
  SeriesPointBase,
} from "@/gen/locations/v1/locations_pb";

export default function LocationInspector() {
  const params = useParams({ strict: false }) as { locationId?: string };
  const [selected, setSelected] = useState<LocationItem | null>(null);
  const [series, setSeries] = useState<SeriesPointBase[]>([]);
  const [latest, setLatest] = useState<LatestMetricBase[]>([]);
  const [metricSeriesMap, setMetricSeriesMap] = useState<
    Record<string, SeriesPointBase[]>
  >({});

  const [dateRange, setDateRange] = useState<DateRange>("7d");

  useEffect(() => {
    const loadInitial = async () => {
      if (params.locationId) {
        try {
          const loc = await locationsApi.get(params.locationId);
          setSelected(loc.location || null);
          return;
        } catch {
          // fall through to list
        }
      }
      const r = await locationsApi.list({ limit: 50 });
      if (r.items.length > 0) {
        setSelected(r.items[0]);
      }
    };
    loadInitial().catch(() => {
      /* no-op */
    });
  }, [params.locationId]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    const load = async () => {
      const now = new Date();
      const start = new Date(now);
      if (dateRange === "30d") {
        start.setDate(now.getDate() - RANGE_DAYS_30);
      } else if (dateRange === "90d") {
        start.setDate(now.getDate() - RANGE_DAYS_90);
      } else {
        start.setDate(now.getDate() - RANGE_DAYS_7);
      }
      const startIso = start.toISOString();
      const endIso = now.toISOString();
      try {
        let dataResult = await locationsApi.series(
          selected.id,
          "aqi",
          startIso,
          endIso
        );
        let data = dataResult.points;
        if (data.length === 0) {
          dataResult = await locationsApi.series(selected.id, "aqi");
          data = dataResult.points;
        }
        if (data.length === 0) {
          const startYear = new Date(now);
          startYear.setDate(now.getDate() - RANGE_DAYS_365);
          dataResult = await locationsApi.series(
            selected.id,
            "aqi",
            startYear.toISOString(),
            endIso
          );
          data = dataResult.points;
        }
        setSeries(data);
      } catch {
        const fallbackResult = await locationsApi.series(selected.id, "aqi");
        const fallback = fallbackResult.points;

        setSeries(fallback);
      }
      const latestMetricsResult = await locationsApi.latest(selected.id);
      const latestMetrics = latestMetricsResult.metrics;
      setLatest(latestMetrics);
    };
    load().catch(() => {
      /* no-op */
    });
  }, [selected, dateRange]);

  useEffect(() => {
    if (!selected || latest.length === 0) {
      return;
    }
    const now = new Date();
    const start = new Date(now);
    if (dateRange === "30d") {
      start.setDate(now.getDate() - RANGE_DAYS_30);
    } else if (dateRange === "90d") {
      start.setDate(now.getDate() - RANGE_DAYS_90);
    } else {
      start.setDate(now.getDate() - RANGE_DAYS_7);
    }
    const startIso = start.toISOString();
    const endIso = now.toISOString();
    const metricKeys = Array.from(new Set(latest.map((m) => m.metric))).filter(
      (k) => k !== "aqi"
    );
    Promise.all(
      metricKeys.map(async (key) => {
        try {
          let rangedResult = await locationsApi.series(
            selected.id as string,
            key,
            startIso,
            endIso
          );
          let ranged: SeriesPointBase[] = rangedResult.points;
          if (ranged.length === 0) {
            rangedResult = await locationsApi.series(
              selected.id as string,
              key
            );
            ranged = rangedResult.points;
          }
          if (ranged.length === 0) {
            const startYear = new Date(now);
            startYear.setDate(now.getDate() - RANGE_DAYS_365);
            rangedResult = await locationsApi.series(
              selected.id as string,
              key,
              startYear.toISOString(),
              endIso
            );
            ranged = rangedResult.points;
          }
          return [key, ranged] as const;
        } catch {
          const fallback = await locationsApi.series(
            selected.id as string,
            key
          );
          return [key, fallback.points] as const;
        }
      })
    ).then((entries) => {
      const map: Record<string, SeriesPointBase[]> = {};
      for (const [k, data] of entries) {
        map[k] = data;
      }
      setMetricSeriesMap(map);
    });
  }, [selected, latest, dateRange]);

  const latestAQI = useMemo(() => {
    const aqi = latest.find((m) => m.metric === "aqi");
    return aqi ? aqi.value : 0;
  }, [latest]);

  return (
    <div className="space-y-6">
      {selected ? (
        <>
          <LocationHeader
            dateRange={dateRange}
            latestAQI={latestAQI}
            selected={selected}
            setDateRange={setDateRange}
          />

          <AQITrendCard series={series} />

          <MetricsGrid latest={latest} metricSeriesMap={metricSeriesMap} />
        </>
      ) : (
        <Card className="border-0 bg-bg-surface shadow-lg">
          <CardContent>
            <div className="py-6 text-text-secondary">
              Loading location data…
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
