import QUnit from "qunit";

const { module, test } = QUnit;

import { render } from "@tests/test-utils";
import type {
  LatestMetricBase,
  SeriesPointBase,
} from "@/gen/locations/v1/locations_pb";
import { stringToGrpcTs } from "@/lib/utils";
import { MetricsGrid } from "./metrics-grid";

module("Component | MetricsGrid", () => {
  test("returns null when there are no non-AQI metrics", (assert) => {
    const latest: LatestMetricBase[] = [
      {
        metric: "aqi",
        value: 42,
        unit: "AQI",
        recordedAt: stringToGrpcTs(new Date().toISOString()),
      },
    ];
    const { container } = render(
      <MetricsGrid latest={latest} metricSeriesMap={{}} />
    );
    assert.strictEqual(
      container.innerHTML.trim().length > 0,
      false,
      "renders nothing"
    );
  });

  test("renders metric cards and empty state per metric", (assert) => {
    const now = stringToGrpcTs(new Date().toISOString());
    const latest: LatestMetricBase[] = [
      { metric: "pm25", value: 12.4, unit: "µg/m³", recordedAt: now },
      { metric: "pm10", value: 0, unit: "µg/m³", recordedAt: now },
    ];
    const seriesMap: Record<string, SeriesPointBase[]> = {
      pm25: [
        { recordedAt: now, value: 10, unit: "µg/m³" },
        { recordedAt: now, value: 15, unit: "µg/m³" },
      ],
      pm10: [],
    };
    const { getByText, queryAllByText } = render(
      <MetricsGrid latest={latest} metricSeriesMap={seriesMap} />
    );

    assert.dom(getByText("Metrics")).exists();
    assert.dom(getByText("pm25")).exists();
    assert.dom(getByText("pm10")).exists();
    const empties = queryAllByText("No data for this metric.");
    assert.ok(
      empties.length >= 1,
      "shows empty message for metrics without data"
    );
  });
});
