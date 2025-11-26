import {
  ArrowTrendingUpIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { locationsApi } from "@/api/locations";
import type { LocationItem } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  init as sseInit,
  onTopic as sseOnTopic,
  subscribe as sseSubscribe,
  unsubscribe as sseUnsubscribe,
} from "@/sse/client";
import type { MeasurementUpdatePayload } from "@/sse/types";

const API_BASE = "http://localhost:3000";

const AQI_GOOD_THRESHOLD = 50;
const AQI_MODERATE_THRESHOLD = 100;
const AQI_UNHEALTHY_SENSITIVE_THRESHOLD = 150;
const NEW_INDICATOR_TIMEOUT_MS = 300;
const ZERO_DECIMALS = 0;
const TWO_DECIMALS = 2;

type MeasurementDisplay = {
  metric: string;
  value: number;
  unit: string;
  recordedAt: string;
  isNew: boolean;
};

type LocationMeasurements = {
  locationId: string;
  locationName: string;
  measurements: Map<string, MeasurementDisplay>;
  updateCount: number;
  lastUpdate: Date | null;
};

export default function StreamingDemo() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [locationData, setLocationData] = useState<
    Map<string, LocationMeasurements>
  >(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const [totalUpdates, setTotalUpdates] = useState(0);

  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  const timerIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    sseInit();

    let cancelled = false;
    locationsApi.list({ limit: 10 }).then((r) => {
      if (!cancelled) {
        setLocations(r.items);
      }
    });

    return () => {
      cancelled = true;

      for (const cleanup of cleanupFunctionsRef.current) {
        cleanup();
      }
      cleanupFunctionsRef.current = [];

      for (const timerId of timerIdsRef.current) {
        clearTimeout(timerId);
      }
      timerIdsRef.current.clear();
    };
  }, []);

  const startStreaming = async () => {
    setIsStreaming(true);

    for (const location of locations) {
      const topic = `measurements:location:${location.id}` as const;
      sseSubscribe(topic);

      const unsubscribe = sseOnTopic(
        topic,
        (data: MeasurementUpdatePayload) => {
          setLocationData((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(location.id) || {
              locationId: location.id,
              locationName: location.name,
              measurements: new Map(),
              updateCount: 0,
              lastUpdate: null,
            };

            existing.measurements.set(data.metric, {
              metric: data.metric,
              value: data.value,
              unit: data.unit,
              recordedAt: data.recorded_at,
              isNew: true,
            });
            existing.updateCount += 1;
            existing.lastUpdate = new Date();

            newMap.set(location.id, existing);
            return newMap;
          });

          setTotalUpdates((count) => count + 1);

          const timerId = setTimeout(() => {
            setLocationData((prev) => {
              const updatedMap = new Map(prev);
              const loc = updatedMap.get(location.id);
              if (loc) {
                const measurement = loc.measurements.get(data.metric);
                if (measurement) {
                  loc.measurements.set(data.metric, {
                    ...measurement,
                    isNew: false,
                  });
                }
                updatedMap.set(location.id, loc);
              }
              return updatedMap;
            });
            timerIdsRef.current.delete(timerId);
          }, NEW_INDICATOR_TIMEOUT_MS);

          timerIdsRef.current.add(timerId);
        }
      );

      cleanupFunctionsRef.current.push(unsubscribe);
    }

    try {
      const response = await fetch(`${API_BASE}/api/demo/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to start demo stream");
      }
    } catch {
      // Failed to start demo
    }
  };

  const stopStreaming = async () => {
    setIsStreaming(false);

    for (const location of locations) {
      const topic = `measurements:location:${location.id}` as const;
      sseUnsubscribe(topic);
    }

    for (const cleanup of cleanupFunctionsRef.current) {
      cleanup();
    }
    cleanupFunctionsRef.current = [];

    for (const timerId of timerIdsRef.current) {
      clearTimeout(timerId);
    }
    timerIdsRef.current.clear();

    try {
      const response = await fetch(`${API_BASE}/api/demo/stop`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to stop demo stream");
      }
    } catch {
      // Failed to stop demo
    }
  };

  const getAqiColor = (value: number): string => {
    if (value <= AQI_GOOD_THRESHOLD) {
      return "text-accent-success";
    }
    if (value <= AQI_MODERATE_THRESHOLD) {
      return "text-accent-yellow-foreground";
    }
    if (value <= AQI_UNHEALTHY_SENSITIVE_THRESHOLD) {
      return "text-accent-orange-foreground";
    }
    return "text-state-error-foreground";
  };

  const getAqiColorFg = (value: number): string => {
    if (value <= AQI_GOOD_THRESHOLD) {
      return "text-text-secondary";
    }
    return "text-text-primary";
  };

  const getAqiColorBg = (value: number): string => {
    if (value <= AQI_GOOD_THRESHOLD) {
      return "bg-card-green";
    }
    if (value <= AQI_MODERATE_THRESHOLD) {
      return "bg-card-yellow";
    }
    if (value <= AQI_UNHEALTHY_SENSITIVE_THRESHOLD) {
      return "bg-accent-orange";
    }
    return "bg-card-red";
  };

  const getAqiStatus = (value: number): string => {
    if (value <= AQI_GOOD_THRESHOLD) {
      return "Good";
    }
    if (value <= AQI_MODERATE_THRESHOLD) {
      return "Moderate";
    }
    if (value <= AQI_UNHEALTHY_SENSITIVE_THRESHOLD) {
      return "Unhealthy for Sensitive";
    }
    return "Unhealthy";
  };

  const locationDataArray = Array.from(locationData.values());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Streaming Control</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                Click Start to begin generating and receiving live measurements
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isStreaming ? (
                <Button onClick={stopStreaming} size="lg" variant="destructive">
                  <StopIcon className="mr-2 size-4" />
                  Stop Streaming
                </Button>
              ) : (
                <Button onClick={startStreaming} size="lg">
                  <PlayIcon className="mr-2 size-4" />
                  Start Streaming
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-card-yellow p-4">
              <div className="flex items-center gap-2 text-state-active">
                <BoltIcon className="size-5 text-accent-yellow-foreground" />
                <span className="font-medium text-accent-yellow-foreground text-sm">
                  Status
                </span>
              </div>
              <p className="mt-2 font-semibold text-2xl text-text-primary">
                {isStreaming ? "Streaming" : "Stopped"}
              </p>
            </div>
            <div className="rounded-lg bg-card-green p-4">
              <div className="flex items-center gap-2 text-brand-green">
                <ArrowTrendingUpIcon className="size-5" />
                <span className="font-medium text-sm">Total Updates</span>
              </div>
              <p className="mt-2 font-semibold text-2xl text-text-primary">
                {totalUpdates}
              </p>
            </div>
            <div className="rounded-lg bg-card-purple p-4">
              <div className="flex items-center gap-2 text-accent-info">
                <BoltIcon className="size-5" />
                <span className="font-medium text-sm">Locations</span>
              </div>
              <p className="mt-2 font-semibold text-2xl text-text-primary">
                {locations.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isStreaming && locationDataArray.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BoltIcon className="mx-auto size-12 text-text-disabled" />
            <h3 className="mt-4 font-semibold text-lg text-text-primary">
              Ready to stream
            </h3>
            <p className="mt-2 text-text-secondary">
              Click "Start Streaming" to begin receiving real-time measurements
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {locationDataArray.map((locData) => {
          const measurementsArray = Array.from(locData.measurements.values());
          const aqiMeasurement = locData.measurements.get("aqi");

          return (
            <Card className="relative overflow-hidden" key={locData.locationId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-semibold text-lg">
                    {locData.locationName}
                  </CardTitle>
                  <div className="flex items-center gap-1 rounded-full bg-card-green px-2 py-1 font-medium text-brand-green text-xs">
                    <ArrowTrendingUpIcon className="size-3" />
                    <span>{locData.updateCount}</span>
                  </div>
                </div>
                {locData.lastUpdate && (
                  <p className="text-text-secondary text-xs">
                    Last update: {locData.lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {aqiMeasurement && (
                  <div
                    className={`rounded-lg p-4 ${getAqiColorBg(aqiMeasurement.value)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`font-medium text-sm ${getAqiColorFg(aqiMeasurement.value)}`}
                        >
                          AQI
                        </p>
                        <p
                          className={`font-bold text-3xl ${getAqiColor(aqiMeasurement.value)}`}
                        >
                          {aqiMeasurement.value.toFixed(ZERO_DECIMALS)}
                        </p>
                        <p className={"mt-1 text-text-disabled text-xs"}>
                          {getAqiStatus(aqiMeasurement.value)}
                        </p>
                      </div>
                      {aqiMeasurement.value > AQI_MODERATE_THRESHOLD && (
                        <ExclamationTriangleIcon
                          className={`size-8 text-accent-warning ${getAqiColorBg(aqiMeasurement.value)}`}
                        />
                      )}
                    </div>
                    {aqiMeasurement.isNew && (
                      <div className="mt-2 animate-pulse rounded bg-card-green px-2 py-1 text-brand-green text-xs">
                        Just updated
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-text-primary">
                    All Measurements
                  </h3>
                  {measurementsArray.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      Waiting for measurements...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {measurementsArray.map((m) => (
                        <div
                          className={`flex items-center justify-between rounded-lg border p-2 transition-colors ${
                            m.isNew
                              ? "border-brand-green bg-card-green"
                              : "border-border-default bg-bg-surface"
                          }`}
                          key={m.metric}
                        >
                          <div>
                            <p className="font-medium text-text-secondary text-xs uppercase">
                              {m.metric}
                            </p>
                            <p className="text-sm text-text-disabled">
                              {new Date(m.recordedAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg text-text-primary">
                              {m.value.toFixed(TWO_DECIMALS)}
                            </p>
                            <p className="text-text-disabled text-xs">
                              {m.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
