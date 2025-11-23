import { api } from "@/api/connect";
import type {
  GetMetricRequestBase,
  ListMetricsRequestBase,
} from "@/gen/metrics/v1/metrics_pb";

export const metricsApi = {
  list(params?: { limit?: number; offset?: number }) {
    const req: ListMetricsRequestBase = {
      limit: params?.limit ?? 10,
      offset: params?.offset ?? 0,
    };
    return api.metrics.listMetrics(req);
  },
  get(key: string) {
    const req: GetMetricRequestBase = { key };
    return api.metrics.getMetric(req);
  },
} as const;

Object.freeze(metricsApi);
