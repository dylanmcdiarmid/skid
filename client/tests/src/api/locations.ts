import { fromJson } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { api } from "@/api/connect";
import type {
  GetLocationLatestMetricsRequestBase,
  GetLocationRequestBase,
  GetLocationSeriesRequestBase,
  ListLocationsRequestBase,
} from "@/gen/locations/v1/locations_pb";

export const locationsApi = {
  list(params?: { query?: string; limit?: number; offset?: number }) {
    const req: ListLocationsRequestBase = {
      limit: params?.limit ?? 10,
      offset: params?.offset ?? 0,
    };
    if (params?.query) {
      req.query = params.query;
    }
    return api.locations.listLocations(req);
  },
  get(id: string) {
    const req: GetLocationRequestBase = { id };
    return api.locations.getLocation(req);
  },
  latest(id: string) {
    const req: GetLocationLatestMetricsRequestBase = { id };
    return api.locations.getLocationLatestMetrics(req);
  },
  series(id: string, metricKey: string, start?: string, end?: string) {
    const req: GetLocationSeriesRequestBase = {
      id,
      metricKey,
    };
    if (start) {
      req.start = fromJson(TimestampSchema, start);
    }
    if (end) {
      req.end = fromJson(TimestampSchema, end);
    }
    return api.locations.getLocationSeries(req);
  },
} as const;

Object.freeze(locationsApi);
