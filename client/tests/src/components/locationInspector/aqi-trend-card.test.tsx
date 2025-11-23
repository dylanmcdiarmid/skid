import QUnit from "qunit";

const { module, test } = QUnit;

import { render } from "@tests/test-utils";
import type { SeriesPointBase } from "@/gen/locations/v1/locations_pb";
import { stringToGrpcTs } from "@/lib/utils";
import { AQITrendCard } from "./aqi-trend-card";

module("Component | AQITrendCard", () => {
  test("renders title and empty state when no series", (assert) => {
    const { getByText, queryByText } = render(<AQITrendCard series={[]} />);
    assert.dom(getByText("AQI Trend")).exists();
    assert
      .dom(getByText("No AQI data available for the selected range."))
      .exists();
    assert.strictEqual(
      queryByText("Measured AQI over selected range"),
      getByText("Measured AQI over selected range")
    );
  });

  test("renders chart container when series present (branch coverage)", (assert) => {
    const series: SeriesPointBase[] = [
      {
        recordedAt: stringToGrpcTs(new Date().toISOString()),
        value: 10,
        unit: "AQI",
      },
      {
        recordedAt: stringToGrpcTs(new Date().toISOString()),
        value: 20,
        unit: "AQI",
      },
    ];
    const { getByText, queryByText, container } = render(
      <AQITrendCard series={series} />
    );
    assert.dom(getByText("AQI Trend")).exists();
    assert.strictEqual(
      queryByText("No AQI data available for the selected range."),
      null
    );
    const chartWrapper = container.querySelector("[style]");
    assert.ok(chartWrapper, "chart wrapper exists");
  });
});
