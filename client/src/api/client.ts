import { locationsApi } from "./locations";
import { measurementsApi } from "./measurements";
import { metricsApi } from "./metrics";

export const api = {
  locations: locationsApi,
  metrics: metricsApi,
  measurements: measurementsApi,
} as const;

Object.freeze(api);
