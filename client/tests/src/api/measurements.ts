import { api } from "@/api/connect";
import type { CreateMeasurementRequestBase } from "@/gen/measurements/v1/measurements_pb";

export const measurementsApi = {
  create(params: CreateMeasurementRequestBase) {
    return api.measurements.createMeasurement(params);
  },
} as const;

Object.freeze(measurementsApi);
