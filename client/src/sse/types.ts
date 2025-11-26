// Map of topic names to their payload types (defined first for type references)
export type TopicPayloadMap = {
  air: AirStatusPayload;
  frontend_updated: FrontendUpdatedPayload;
  server_instance: ServerInstancePayload;
  [key: `measurements:location:${string}`]: MeasurementUpdatePayload;
};

// Extract valid topic names from the map
export type TopicName = keyof TopicPayloadMap;

export type SSEMessage<T = unknown> = {
  topic: TopicName;
  data: T;
};

// Topic-specific payload types
export type AirStatusPayload = {
  status: string;
  time: string;
};

export type MeasurementUpdatePayload = {
  id: string;
  location_id: string;
  metric: string;
  value: number;
  unit: string;
  recorded_at: string;
};

export type FrontendUpdatedPayload = {
  message: string;
};

export type ServerInstancePayload = {
  instance_id: string;
};
