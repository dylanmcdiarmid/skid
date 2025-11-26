import QUnit from "qunit";

const { module, test } = QUnit;

import { api } from "./client";

module("API Client", () => {
  module("api object structure", () => {
    test("exports api object with correct structure", (assert) => {
      assert.ok(api, "api object should exist");
      assert.ok(api.locations, "api.locations should exist");
      assert.ok(api.metrics, "api.metrics should exist");
    });

    test("api.locations has all expected methods", (assert) => {
      assert.ok(
        typeof api.locations.list === "function",
        "api.locations.list should be a function"
      );
      assert.ok(
        typeof api.locations.get === "function",
        "api.locations.get should be a function"
      );
      assert.ok(
        typeof api.locations.latest === "function",
        "api.locations.latest should be a function"
      );
      assert.ok(
        typeof api.locations.series === "function",
        "api.locations.series should be a function"
      );
    });

    test("api.metrics has all expected methods", (assert) => {
      assert.ok(
        typeof api.metrics.list === "function",
        "api.metrics.list should be a function"
      );
      assert.ok(
        typeof api.metrics.get === "function",
        "api.metrics.get should be a function"
      );
    });
  });
});
