import { useState } from "react";
import { api } from "@/api/connect";
import type {
  CupcakeItem,
  ListCupcakesRequest,
} from "@/gen/cupcakes/v1/cupcakes_pb";
import type {
  ListLocationsRequest,
  LocationItem,
} from "@/gen/locations/v1/locations_pb";
import type {
  ListMetricsRequest,
  MetricItem,
} from "@/gen/metrics/v1/metrics_pb";
import type {
  ListSensorsRequest,
  SensorItem,
} from "@/gen/sensors/v1/sensors_pb";

// type MessageData<T> = T extends Message<infer _Name> & infer Data
//   ? Data
//   : never;

export type MessageData<T> = Omit<T, "$typeName" | "$unknown">;

type ListLocationsRequestData = MessageData<ListLocationsRequest>;
type ListMetricsRequestData = MessageData<ListMetricsRequest>;
type ListSensorsRequestData = MessageData<ListSensorsRequest>;
type ListCupcakesRequestData = MessageData<ListCupcakesRequest>;

export default function Scratch() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [sensors, setSensors] = useState<SensorItem[]>([]);
  const [cupcakes, setCupcakes] = useState<CupcakeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleListLocations = async () => {
    setLoading(true);

    try {
      // const req = create(ListLocationsRequestSchema, { limit: 10, offset: 0 });
      const req: ListLocationsRequestData = { limit: 10, offset: 0 };
      const response = await api.locations.listLocations(req);
      setLocations(response.items);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleListMetrics = async () => {
    setLoading(true);

    try {
      const req: ListMetricsRequestData = { limit: 10, offset: 0 };
      const response = await api.metrics.listMetrics(req);
      setMetrics(response.metrics);
      console.log(response);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleListSensors = async () => {
    setLoading(true);

    try {
      const req: ListSensorsRequestData = { limit: 10, offset: 0 };
      const response = await api.sensors.listSensors(req);
      // Don't know why the property is named "items" here unlike the others.
      setSensors(response.items);
      console.log(response);
    } catch (error) {
      console.error("Failed to fetch sensors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleListCupcakes = async () => {
    setLoading(true);

    try {
      const req: ListCupcakesRequestData = { limit: 10, offset: 0 };
      const response = await api.cupcakes.listCupcakes(req);
      // Don't know why the property is named "items" here unlike the others.
      setCupcakes(response.items);
      console.log(response);
    } catch (error) {
      console.error("Failed to fetch sensors:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 font-bold text-2xl">Locations</h1>

      <button
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading}
        onClick={handleListLocations}
        type="button"
      >
        {loading ? "Loading..." : "List Locations"}
      </button>

      {locations.length > 0 && (
        <div className="mt-8 space-y-4">
          {locations.map((location) => (
            <div
              className="rounded-lg border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md"
              key={location.id}
            >
              <h2 className="font-semibold text-gray-900 text-xl">
                {location.name}
              </h2>
              <div className="mt-2 space-y-1 text-gray-600 text-sm">
                <p>
                  {location.city && `${location.city}, `}
                  {location.region && `${location.region}, `}
                  {location.country}
                </p>
                <p className="text-gray-500">
                  Coordinates: {location.latitude.toFixed(4)},{" "}
                  {location.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <h1 className="mb-6 font-bold text-2xl">Metrics</h1>

      <button
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading}
        onClick={handleListMetrics}
        type="button"
      >
        {loading ? "Loading..." : "List Metrics"}
      </button>

      {metrics.length > 0 && (
        <div className="mt-8 space-y-4">
          {metrics.map((metric) => (
            <div
              className="rounded-lg border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md"
              key={metric.id}
            >
              <h2 className="font-semibold text-gray-900 text-xl">
                {metric.id}
              </h2>
              <div className="mt-2 space-y-1 text-gray-600 text-sm">
                <p>
                  Id={metric.id}
                  Name={metric.displayName}
                  Unit={metric.unit}
                  Desc={metric.description}
                  Key={metric.key}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <h1 className="mb-6 font-bold text-2xl">Sensors</h1>

      <button
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading}
        onClick={handleListSensors}
        type="button"
      >
        {loading ? "Loading..." : "List Sensors"}
      </button>

      {sensors.length > 0 && (
        <div className="mt-8 space-y-4">
          {sensors.map((sensor) => (
            <div
              className="rounded-lg border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md"
              key={sensor.id}
            >
              <h2 className="font-semibold text-gray-900 text-xl">
                {sensor.name}
              </h2>
              <div className="mt-2 space-y-1 text-gray-600 text-sm">
                <p>
                  {sensor.model}
                  {sensor.locationId}
                  {sensor.externalId}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <h1 className="mb-6 font-bold text-2xl">CupCakeS</h1>

      <button
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading}
        onClick={handleListCupcakes}
        type="button"
      >
        {loading ? "Loading..." : "List Cupcakes"}
      </button>

      {cupcakes.length > 0 && (
        <div className="mt-8 space-y-4">
          {cupcakes.map((cupcake) => (
            <div
              className="rounded-lg border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md"
              key={cupcake.id}
            >
              <h2 className="font-semibold text-gray-900 text-xl">
                {cupcake.name}
              </h2>
              <div className="mt-2 space-y-1 text-gray-600 text-sm">
                <p>
                  <ul>
                    {Object.entries(cupcake).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong>
                        {String(value)}
                      </li>
                    ))}
                  </ul>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
