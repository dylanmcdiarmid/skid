import { create } from "@bufbuild/protobuf";
import { createClient, createRouterTransport } from "@connectrpc/connect";
import QUnit from "qunit";
import {
  GetMetricResponseSchema,
  ListMetricsResponseSchema,
  MetricItemSchema,
  MetricsService,
} from "@/gen/metrics/v1/metrics_pb";

const { module, test } = QUnit;

// Helper to create a metrics API client with a mock transport
function createMockMetricsApi(
  mockTransport: ReturnType<typeof createRouterTransport>
) {
  const client = createClient(MetricsService, mockTransport);
  return {
    list: (params?: { limit?: number; offset?: number }) => {
      const req = {
        limit: params?.limit ?? 10,
        offset: params?.offset ?? 0,
      };
      return client.listMetrics(req);
    },
    get: (key: string) => client.getMetric({ key }),
  };
}

module("Metrics API", () => {
  module("metricsApi.list", () => {
    test("returns a list of metrics with default pagination", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(MetricsService, {
          listMetrics(request) {
            assert.equal(request.limit, 10, "default limit is 10");
            assert.equal(request.offset, 0, "default offset is 0");

            return create(ListMetricsResponseSchema, {
              metrics: [
                create(MetricItemSchema, {
                  id: "metric1",
                  key: "pm2.5",
                  displayName: "PM2.5",
                  unit: "µg/m³",
                  description: "Fine particulate matter",
                  validMin: 0,
                  validMax: 500,
                }),
                create(MetricItemSchema, {
                  id: "metric2",
                  key: "temperature",
                  displayName: "Temperature",
                  unit: "°C",
                  description: "Ambient temperature",
                }),
              ],
            });
          },
        });
      });

      const api = createMockMetricsApi(mockTransport);
      const response = await api.list();

      assert.equal(response.metrics.length, 2, "returns 2 metrics");
      assert.equal(
        response.metrics[0].key,
        "pm2.5",
        "first metric key matches"
      );
      assert.equal(
        response.metrics[0].displayName,
        "PM2.5",
        "first metric display name matches"
      );
      assert.equal(
        response.metrics[0].unit,
        "µg/m³",
        "first metric unit matches"
      );
      assert.equal(
        response.metrics[1].key,
        "temperature",
        "second metric key matches"
      );
    });

    test("accepts custom pagination parameters", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(MetricsService, {
          listMetrics(request) {
            assert.equal(request.limit, 25, "custom limit is passed");
            assert.equal(request.offset, 50, "custom offset is passed");

            return create(ListMetricsResponseSchema, {
              metrics: [],
            });
          },
        });
      });

      const api = createMockMetricsApi(mockTransport);
      await api.list({ limit: 25, offset: 50 });

      assert.ok(true, "custom pagination parameters were validated");
    });

    test("handles empty results", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(MetricsService, {
          listMetrics() {
            return create(ListMetricsResponseSchema, {
              metrics: [],
            });
          },
        });
      });

      const api = createMockMetricsApi(mockTransport);
      const response = await api.list();

      assert.equal(response.metrics.length, 0, "returns empty array");
    });
  });

  module("metricsApi.get", () => {
    test("successfully retrieves a metric by key", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(MetricsService, {
          getMetric(request) {
            assert.equal(request.key, "pm10", "request contains correct key");

            return create(GetMetricResponseSchema, {
              metric: create(MetricItemSchema, {
                id: "metric3",
                key: "pm10",
                displayName: "PM10",
                unit: "µg/m³",
                description: "Particulate matter 10µm",
                validMin: 0,
                validMax: 300,
              }),
            });
          },
        });
      });

      const api = createMockMetricsApi(mockTransport);
      const response = await api.get("pm10");

      assert.ok(response.metric, "response contains metric");
      assert.equal(response.metric?.key, "pm10", "metric key matches");
      assert.equal(
        response.metric?.displayName,
        "PM10",
        "metric display name matches"
      );
      assert.equal(response.metric?.validMin, 0, "metric validMin matches");
      assert.equal(response.metric?.validMax, 300, "metric validMax matches");
    });

    test("handles missing metric", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(MetricsService, {
          getMetric() {
            return create(GetMetricResponseSchema, {});
          },
        });
      });

      const api = createMockMetricsApi(mockTransport);
      const response = await api.get("missing");

      assert.equal(
        response.metric,
        undefined,
        "metric is undefined when not found"
      );
    });
  });
});
