export type LocationItem = {
  id: string;
  name: string;
  city?: string | null;
  region?: string | null;
  country: string;
  latitude: number;
  longitude: number;
};

export type LocationsListResponse = {
  items: LocationItem[];
};

export type MetricItem = {
  id: string;
  key: string;
  displayName: string;
  unit: string;
  description: string;
  validMin?: number | null;
  validMax?: number | null;
};

export type SeriesPoint = {
  recordedAt: string;
  value: number;
  unit: string;
};
