import { create } from "@bufbuild/protobuf";
import { createClient, createRouterTransport } from "@connectrpc/connect";
import QUnit from "qunit";
import {
  GetLocationLatestMetricsResponseSchema,
  GetLocationResponseSchema,
  GetLocationSeriesResponseSchema,
  LatestMetricSchema,
  ListLocationsResponseSchema,
  LocationItemSchema,
  LocationsService,
  SeriesPointSchema,
} from "@/gen/locations/v1/locations_pb";
import { stringToGrpcTs } from "@/lib/utils";

const { module, test } = QUnit;

// Helper to create a locations API client with a mock transport
function createMockLocationsApi(
  mockTransport: ReturnType<typeof createRouterTransport>
) {
  const client = createClient(LocationsService, mockTransport);
  return {
    list: (params?: { query?: string; limit?: number; offset?: number }) => {
      const req = {
        limit: params?.limit ?? 10,
        offset: params?.offset ?? 0,
        query: params?.query,
      };
      return client.listLocations(req);
    },
    get: (id: string) => client.getLocation({ id }),
    latest: (id: string) => client.getLocationLatestMetrics({ id }),
    series: (id: string, metricKey: string, start?: string, end?: string) => {
      const req: { id: string; metricKey: string; start?: any; end?: any } = {
        id,
        metricKey,
      };
      if (start) {
        req.start = stringToGrpcTs(start);
      }
      if (end) {
        req.end = stringToGrpcTs(end);
      }
      return client.getLocationSeries(req);
    },
  };
}

module("Locations API", () => {
  module("locationsApi.list", () => {
    test("returns a list of locations with default pagination", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          listLocations(request) {
            assert.equal(request.limit, 10, "default limit is 10");
            assert.equal(request.offset, 0, "default offset is 0");

            return create(ListLocationsResponseSchema, {
              items: [
                create(LocationItemSchema, {
                  id: "loc1",
                  name: "Test Location 1",
                  city: "Test City",
                  region: "Test Region",
                  country: "Test Country",
                  latitude: 40.7128,
                  longitude: -74.006,
                }),
                create(LocationItemSchema, {
                  id: "loc2",
                  name: "Test Location 2",
                  country: "Test Country 2",
                  latitude: 51.5074,
                  longitude: -0.1278,
                }),
              ],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.list();

      assert.equal(response.items.length, 2, "returns 2 locations");
      assert.equal(
        response.items[0].id,
        "loc1",
        "first location has correct id"
      );
      assert.equal(
        response.items[0].name,
        "Test Location 1",
        "first location has correct name"
      );
      assert.equal(
        response.items[1].id,
        "loc2",
        "second location has correct id"
      );
    });

    test("accepts custom pagination parameters", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          listLocations(request) {
            assert.equal(request.limit, 25, "custom limit is passed");
            assert.equal(request.offset, 50, "custom offset is passed");

            return create(ListLocationsResponseSchema, {
              items: [],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      await api.list({ limit: 25, offset: 50 });

      assert.ok(true, "custom pagination parameters were validated");
    });

    test("accepts optional query parameter for search", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          listLocations(request) {
            assert.equal(
              request.query,
              "New York",
              "query parameter is passed"
            );

            return create(ListLocationsResponseSchema, {
              items: [
                create(LocationItemSchema, {
                  id: "nyc1",
                  name: "New York Location",
                  city: "New York",
                  country: "USA",
                  latitude: 40.7128,
                  longitude: -74.006,
                }),
              ],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.list({ query: "New York" });

      assert.equal(response.items.length, 1, "returns filtered results");
      assert.equal(response.items[0].city, "New York", "result matches query");
    });

    test("handles empty results", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          listLocations() {
            return create(ListLocationsResponseSchema, {
              items: [],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.list();

      assert.equal(response.items.length, 0, "returns empty array");
    });
  });

  module("locationsApi.get", () => {
    test("successfully retrieves a location by id", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          getLocation(request) {
            assert.equal(request.id, "loc123", "request contains correct id");

            return create(GetLocationResponseSchema, {
              location: create(LocationItemSchema, {
                id: "loc123",
                name: "San Francisco",
                city: "San Francisco",
                region: "California",
                country: "USA",
                latitude: 37.7749,
                longitude: -122.4194,
              }),
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.get("loc123");

      assert.ok(response.location, "response contains location");
      assert.equal(response.location?.id, "loc123", "location has correct id");
      assert.equal(
        response.location?.name,
        "San Francisco",
        "location has correct name"
      );
      assert.equal(
        response.location?.latitude,
        37.7749,
        "location has correct latitude"
      );
      assert.equal(
        response.location?.longitude,
        -122.4194,
        "location has correct longitude"
      );
    });

    test("handles location with optional fields missing", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          getLocation() {
            return create(GetLocationResponseSchema, {
              location: create(LocationItemSchema, {
                id: "loc456",
                name: "Minimal Location",
                country: "Unknown",
                latitude: 0,
                longitude: 0,
              }),
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.get("loc456");

      assert.ok(response.location, "response contains location");
      assert.equal(response.location?.city, undefined, "city is undefined");
      assert.equal(response.location?.region, undefined, "region is undefined");
    });
  });

  module("locationsApi.latest", () => {
    test("retrieves latest metrics for a location", async (assert) => {
      const recordedAt = stringToGrpcTs("2025-10-20T12:00:00Z");

      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          getLocationLatestMetrics(request) {
            assert.equal(request.id, "loc789", "request contains correct id");

            return create(GetLocationLatestMetricsResponseSchema, {
              metrics: [
                create(LatestMetricSchema, {
                  metric: "pm2.5",
                  value: 45.3,
                  unit: "µg/m³",
                  recordedAt,
                }),
                create(LatestMetricSchema, {
                  metric: "temperature",
                  value: 22.5,
                  unit: "°C",
                  recordedAt,
                }),
                create(LatestMetricSchema, {
                  metric: "humidity",
                  value: 65.0,
                  unit: "%",
                  recordedAt,
                }),
              ],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.latest("loc789");

      assert.equal(response.metrics.length, 3, "returns 3 metrics");
      assert.equal(
        response.metrics[0].metric,
        "pm2.5",
        "first metric is pm2.5"
      );
      assert.equal(
        response.metrics[0].value,
        45.3,
        "first metric has correct value"
      );
      assert.equal(
        response.metrics[0].unit,
        "µg/m³",
        "first metric has correct unit"
      );
      assert.ok(response.metrics[0].recordedAt, "first metric has timestamp");
      assert.equal(
        response.metrics[1].metric,
        "temperature",
        "second metric is temperature"
      );
      assert.equal(
        response.metrics[2].metric,
        "humidity",
        "third metric is humidity"
      );
    });

    test("handles location with no metrics", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          getLocationLatestMetrics() {
            return create(GetLocationLatestMetricsResponseSchema, {
              metrics: [],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.latest("empty-loc");

      assert.equal(response.metrics.length, 0, "returns empty metrics array");
    });
  });

  module("locationsApi.series", () => {
    test("retrieves time series data for a metric", async (assert) => {
      const point1Time = stringToGrpcTs("2025-10-20T10:00:00Z");
      const point2Time = stringToGrpcTs("2025-10-20T11:00:00Z");
      const point3Time = stringToGrpcTs("2025-10-20T12:00:00Z");

      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          getLocationSeries(request) {
            assert.equal(request.id, "loc999", "request contains correct id");
            assert.equal(
              request.metricKey,
              "pm2.5",
              "request contains correct metric key"
            );

            return create(GetLocationSeriesResponseSchema, {
              points: [
                create(SeriesPointSchema, {
                  recordedAt: point1Time,
                  value: 40.5,
                  unit: "µg/m³",
                }),
                create(SeriesPointSchema, {
                  recordedAt: point2Time,
                  value: 42.3,
                  unit: "µg/m³",
                }),
                create(SeriesPointSchema, {
                  recordedAt: point3Time,
                  value: 45.1,
                  unit: "µg/m³",
                }),
              ],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.series("loc999", "pm2.5");

      assert.equal(response.points.length, 3, "returns 3 data points");
      assert.equal(
        response.points[0].value,
        40.5,
        "first point has correct value"
      );
      assert.equal(
        response.points[0].unit,
        "µg/m³",
        "first point has correct unit"
      );
      assert.ok(response.points[0].recordedAt, "first point has timestamp");
      assert.equal(
        response.points[1].value,
        42.3,
        "second point has correct value"
      );
      assert.equal(
        response.points[2].value,
        45.1,
        "third point has correct value"
      );
    });

    test("accepts optional start and end timestamps", async (assert) => {
      const startTime = "2025-10-13T00:00:00Z";
      const endTime = "2025-10-20T23:59:59Z";

      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          getLocationSeries(request) {
            assert.equal(request.id, "loc111", "request contains correct id");
            assert.equal(
              request.metricKey,
              "temperature",
              "request contains correct metric key"
            );
            assert.ok(request.start, "start timestamp is provided");
            assert.ok(request.end, "end timestamp is provided");

            return create(GetLocationSeriesResponseSchema, {
              points: [
                create(SeriesPointSchema, {
                  recordedAt: stringToGrpcTs("2025-10-15T12:00:00Z"),
                  value: 20.5,
                  unit: "°C",
                }),
              ],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.series(
        "loc111",
        "temperature",
        startTime,
        endTime
      );

      assert.equal(response.points.length, 1, "returns filtered data points");
    });

    test("works without start and end timestamps", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          getLocationSeries(request) {
            assert.equal(request.start, undefined, "start is undefined");
            assert.equal(request.end, undefined, "end is undefined");

            return create(GetLocationSeriesResponseSchema, {
              points: [],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.series("loc222", "humidity");

      assert.equal(response.points.length, 0, "returns empty array");
      assert.ok(true, "request succeeds without timestamps");
    });

    test("handles empty time series data", async (assert) => {
      const mockTransport = createRouterTransport(({ service }) => {
        service(LocationsService, {
          getLocationSeries() {
            return create(GetLocationSeriesResponseSchema, {
              points: [],
            });
          },
        });
      });

      const api = createMockLocationsApi(mockTransport);
      const response = await api.series("loc333", "no-data");

      assert.equal(response.points.length, 0, "returns empty points array");
    });
  });
});
