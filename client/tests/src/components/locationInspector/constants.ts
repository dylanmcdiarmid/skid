export type DateRange = "7d" | "30d" | "90d";

export const AQI_GOOD_THRESHOLD = 50;
export const AQI_MODERATE_THRESHOLD = 100;
export const AQI_UNHEALTHY_SENSITIVE_THRESHOLD = 150;
export const ALERT_AQI_THRESHOLD = 150;

export const RANGE_DAYS_7 = 7;
export const RANGE_DAYS_30 = 30;
export const RANGE_DAYS_90 = 90;
export const RANGE_DAYS_365 = 365;

export const CHART_GRID_DASH_ARRAY = "3 3";
export const CHART_Y_AXIS_WIDTH = 36;
export const CHART_PRIMARY_COLOR_HEX = "#2563eb";
export const GRADIENT_START_OFFSET_PERCENT = 5;
export const GRADIENT_END_OFFSET_PERCENT = 95;
export const GRADIENT_START_OPACITY = 0.35;
export const GRADIENT_END_OPACITY = 0.02;

export const getAQIStatus = (aqi: number): string => {
  if (aqi <= AQI_GOOD_THRESHOLD) {
    return "Good";
  }
  if (aqi <= AQI_MODERATE_THRESHOLD) {
    return "Moderate";
  }
  if (aqi <= AQI_UNHEALTHY_SENSITIVE_THRESHOLD) {
    return "Unhealthy for Sensitive";
  }
  return "Unhealthy";
};

export const getAQIBadgeClasses = (aqi: number): string => {
  if (aqi <= AQI_GOOD_THRESHOLD) {
    return "bg-green-100 text-green-700";
  }
  if (aqi <= AQI_MODERATE_THRESHOLD) {
    return "bg-yellow-100 text-yellow-700";
  }
  if (aqi <= AQI_UNHEALTHY_SENSITIVE_THRESHOLD) {
    return "bg-orange-100 text-orange-700";
  }
  return "bg-red-100 text-red-700";
};

export const getRangeStart = (dateRange: DateRange, now: Date): Date => {
  const start = new Date(now);
  if (dateRange === "30d") {
    start.setDate(now.getDate() - RANGE_DAYS_30);
  } else if (dateRange === "90d") {
    start.setDate(now.getDate() - RANGE_DAYS_90);
  } else {
    start.setDate(now.getDate() - RANGE_DAYS_7);
  }
  return start;
};
