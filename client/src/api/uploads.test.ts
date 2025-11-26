import QUnit from "qunit";

const { module, test } = QUnit;

import { type UploadResult, uploadsApi } from "./uploads";

// Mock fetch globally
const originalFetch = globalThis.fetch;

module("Uploads API", (hooks) => {
  hooks.beforeEach(() => {
    // Reset fetch mock before each test
    globalThis.fetch = originalFetch;
  });

  hooks.afterEach(() => {
    // Restore original fetch after each test
    globalThis.fetch = originalFetch;
  });

  module("uploadsApi.upload", () => {
    test("calls postForm with correct URL and FormData when only file provided", async (assert) => {
      const mockResponse: UploadResult = {
        message: "Upload successful",
        inserted: 5,
        locationId: "location-123",
      };
      const mockFile = new File(["test content"], "test.csv", {
        type: "text/csv",
      });
      let capturedUrl = "";
      let capturedOptions: RequestInit | undefined;

      globalThis.fetch = (_input: RequestInfo | URL, options?: RequestInit) => {
        capturedUrl = _input as string;
        capturedOptions = options;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);
      };

      const result = await uploadsApi.upload({ file: mockFile });

      assert.strictEqual(capturedUrl, "http://localhost:3000/api/upload");
      assert.strictEqual(capturedOptions?.method, "POST");
      assert.ok(capturedOptions?.body instanceof FormData);
      assert.deepEqual(result, mockResponse);
    });

    test("calls postForm with file and locationId", async (assert) => {
      const mockResponse: UploadResult = {
        message: "Upload successful",
        inserted: 3,
        locationId: "existing-location-456",
      };
      const mockFile = new File(["test content"], "test.csv", {
        type: "text/csv",
      });
      const locationId = "existing-location-456";
      let capturedUrl = "";
      let capturedOptions: RequestInit | undefined;

      globalThis.fetch = (_input: RequestInfo | URL, options?: RequestInit) => {
        capturedUrl = _input as string;
        capturedOptions = options;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);
      };

      const result = await uploadsApi.upload({ file: mockFile, locationId });

      assert.strictEqual(capturedUrl, "http://localhost:3000/api/upload");
      assert.strictEqual(capturedOptions?.method, "POST");
      assert.ok(capturedOptions?.body instanceof FormData);
      assert.deepEqual(result, mockResponse);
    });

    test("calls postForm with file and locationJson", async (assert) => {
      const mockResponse: UploadResult = {
        message: "Upload successful with new location",
        inserted: 10,
        locationId: "new-location-789",
      };
      const mockFile = new File(["test content"], "test.csv", {
        type: "text/csv",
      });
      const locationJson = JSON.stringify({
        name: "New Location",
        city: "Test City",
        country: "Test Country",
        latitude: 40.7128,
        longitude: -74.006,
      });
      let capturedUrl = "";
      let capturedOptions: RequestInit | undefined;

      globalThis.fetch = (_input: RequestInfo | URL, options?: RequestInit) => {
        capturedUrl = _input as string;
        capturedOptions = options;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);
      };

      const result = await uploadsApi.upload({ file: mockFile, locationJson });

      assert.strictEqual(capturedUrl, "http://localhost:3000/api/upload");
      assert.strictEqual(capturedOptions?.method, "POST");
      assert.ok(capturedOptions?.body instanceof FormData);
      assert.deepEqual(result, mockResponse);
    });

    test("propagates errors from postForm function", async (assert) => {
      const mockFile = new File(["test content"], "test.csv", {
        type: "text/csv",
      });
      const error = new Error("Upload failed");

      globalThis.fetch = () => Promise.reject(error);

      try {
        await uploadsApi.upload({ file: mockFile });
        assert.ok(false, "Should have thrown an error");
      } catch (e) {
        assert.strictEqual(e, error);
      }
    });
  });
});
