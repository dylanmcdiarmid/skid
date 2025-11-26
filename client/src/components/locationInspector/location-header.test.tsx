import QUnit from "qunit";

const { module, test } = QUnit;

import userEvent from "@testing-library/user-event";
import { render } from "@tests/test-utils";
import type { LocationItem } from "@/api/types";
import { LocationHeader } from "./location-header";

const baseLocation: LocationItem = {
  id: "1",
  name: "Station A",
  city: "City",
  region: "Region",
  country: "Country",
  latitude: 0,
  longitude: 0,
};

module("Component | LocationHeader", () => {
  test("renders location name and composed region line", (assert) => {
    const { getByText } = render(
      <LocationHeader
        dateRange="7d"
        latestAQI={42}
        selected={baseLocation}
        setDateRange={(_r) => {
          return;
        }}
      />
    );
    assert.dom(getByText("Station A")).exists();
    assert.dom(getByText("City, Region, Country")).exists();
  });

  test("renders date range buttons with correct pressed state", (assert) => {
    const { getByRole } = render(
      <LocationHeader
        dateRange="30d"
        latestAQI={10}
        selected={baseLocation}
        setDateRange={(_r) => {
          return;
        }}
      />
    );
    const btn7 = getByRole("button", { name: "7D" });
    const btn30 = getByRole("button", { name: "30D" });
    const btn90 = getByRole("button", { name: "90D" });
    assert.strictEqual(btn30.getAttribute("aria-pressed"), "true");
    assert.strictEqual(btn7.getAttribute("aria-pressed"), "false");
    assert.strictEqual(btn90.getAttribute("aria-pressed"), "false");
  });

  test("calls setDateRange when a different range is selected", async (assert) => {
    const user = userEvent.setup();
    let called: string | null = null;
    const { getByRole } = render(
      <LocationHeader
        dateRange="7d"
        latestAQI={160}
        selected={baseLocation}
        setDateRange={(r) => {
          called = r;
        }}
      />
    );
    const btn30 = getByRole("button", { name: "30D" });
    await user.click(btn30);
    assert.strictEqual(called, "30d");
  });

  test("shows AQI status badge text based on latestAQI", (assert) => {
    const { getByText, rerender } = render(
      <LocationHeader
        dateRange="7d"
        latestAQI={45}
        selected={baseLocation}
        setDateRange={(_r) => {
          return;
        }}
      />
    );
    assert.dom(getByText("Good")).exists();
    rerender(
      <LocationHeader
        dateRange="7d"
        latestAQI={120}
        selected={baseLocation}
        setDateRange={(_r) => {
          return;
        }}
      />
    );
    assert.dom(getByText("Unhealthy for Sensitive")).exists();
  });
});
