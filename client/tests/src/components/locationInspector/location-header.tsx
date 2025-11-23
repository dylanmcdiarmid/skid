import type { LocationItem } from "@/api/types";
import type { DateRange } from "./constants";
import { getAQIBadgeClasses, getAQIStatus } from "./constants";

export const LocationHeader = ({
  selected,
  dateRange,
  setDateRange,
  latestAQI,
}: {
  selected: LocationItem;
  dateRange: DateRange;
  setDateRange: (r: DateRange) => void;
  latestAQI: number;
}) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="font-bold text-2xl text-gray-900">{selected.name}</h1>
        <p className="mt-1 text-gray-600">
          {[selected.city, selected.region, selected.country]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {["7d", "30d", "90d"].map((r) => (
          <button
            aria-pressed={dateRange === (r as DateRange)}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              dateRange === r
                ? "bg-blue-600 text-white"
                : "border bg-white text-gray-900 hover:bg-gray-50"
            }`}
            key={r}
            onClick={() => setDateRange(r as DateRange)}
            type="button"
          >
            {r.toUpperCase()}
          </button>
        ))}
        <div
          className={`rounded-full px-2 py-1 font-medium text-xs ${getAQIBadgeClasses(latestAQI)}`}
        >
          {getAQIStatus(latestAQI)}
        </div>
      </div>
    </div>
  );
};

export default LocationHeader;
