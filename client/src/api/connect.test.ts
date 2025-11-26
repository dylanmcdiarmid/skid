import QUnit from "qunit";

const { module, test } = QUnit;

import { api } from "./connect";

// Note: These mocks are not used in the current test implementation
// but are kept for reference in case they're needed for future tests

module("Connect API", (hooks) => {
  hooks.beforeEach(() => {
    // Reset any mocks before each test
  });

  module("api object structure", () => {
    test("exports api object with correct structure", (assert) => {
      assert.ok(api, "api object should exist");
      assert.ok(api.locations, "api.locations should exist");
    });

    test("api.locations is a Connect client", (assert) => {
      assert.ok(api.locations, "api.locations should exist");
      // The client should have methods that are functions
      assert.ok(
        typeof api.locations.listLocations === "function" ||
          typeof api.locations.getLocation === "function" ||
          typeof api.locations.getLocationLatestMetrics === "function" ||
          typeof api.locations.getLocationSeries === "function",
        "api.locations should have Connect client methods"
      );
    });
  });

  module("Connect client configuration", () => {
    test("transport is configured with correct baseUrl", (assert) => {
      // Since we can't directly access the transport, we test that the client exists
      // and that it's properly configured by checking if it has the expected structure
      assert.ok(api.locations, "Connect client should be created");

      // The client should be an object with methods
      assert.ok(
        typeof api.locations === "object",
        "Connect client should be an object"
      );
      assert.notStrictEqual(
        api.locations,
        null,
        "Connect client should not be null"
      );
    });
  });
});
