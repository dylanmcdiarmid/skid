import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { CupcakesService } from "@gen/cupcakes/v1/cupcakes_pb.ts";
import { LocationsService } from "@gen/locations/v1/locations_pb.ts";
import { MeasurementsService } from "@gen/measurements/v1/measurements_pb.ts";
import { MetricsService } from "@gen/metrics/v1/metrics_pb.ts";
import { SensorsService } from "@gen/sensors/v1/sensors_pb.ts";

const transport = createConnectTransport({
  baseUrl: "/rpc",
});

export const api = {
  locations: createClient(LocationsService, transport),
  metrics: createClient(MetricsService, transport),
  measurements: createClient(MeasurementsService, transport),
  sensors: createClient(SensorsService, transport),
  cupcakes: createClient(CupcakesService, transport),
} as const;

Object.freeze(api);
