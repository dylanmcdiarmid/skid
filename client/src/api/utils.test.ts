import QUnit from 'qunit';

const { module, test } = QUnit;

import { get, postForm } from './utils';

// Mock fetch globally
const originalFetch = globalThis.fetch;

module('API Utils', (hooks) => {
  hooks.beforeEach(() => {
    // Reset fetch mock before each test
    globalThis.fetch = originalFetch;
  });

  hooks.afterEach(() => {
    // Restore original fetch after each test
    globalThis.fetch = originalFetch;
  });

  module('get function', () => {
    test('makes successful GET request and returns JSON', async (assert) => {
      const mockResponse = { data: 'test' };
      globalThis.fetch = (() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)) as unknown as typeof fetch;

      const result = await get('/test-endpoint');
      assert.deepEqual(result, mockResponse);
    });

    test('constructs correct URL with API_BASE', async (assert) => {
      let capturedUrl = '';
      globalThis.fetch = ((input: RequestInfo | URL) => {
        capturedUrl = input as string;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);
      }) as unknown as typeof fetch;

      await get('/test-endpoint');
      assert.strictEqual(capturedUrl, 'http://localhost:3000/test-endpoint');
    });

    test('throws error when response is not ok', async (assert) => {
      globalThis.fetch = (() =>
        Promise.resolve({
          ok: false,
          status: 404,
        } as Response)) as unknown as typeof fetch;

      try {
        await get('/test-endpoint');
        assert.ok(false, 'Should have thrown an error');
      } catch (error) {
        assert.strictEqual(
          (error as Error).message,
          'GET /test-endpoint failed: 404'
        );
      }
    });
  });

  module('postForm function', () => {
    test('makes successful POST request with FormData and returns JSON', async (assert) => {
      const mockResponse = { success: true };
      const formData = new FormData();
      formData.append('test', 'value');

      let capturedOptions: RequestInit | undefined;
      globalThis.fetch = ((
        _input: RequestInfo | URL,
        options?: RequestInit
      ) => {
        capturedOptions = options;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);
      }) as unknown as typeof fetch;

      const result = await postForm('/test-endpoint', formData);
      assert.deepEqual(result, mockResponse);
      assert.strictEqual(capturedOptions?.method, 'POST');
      assert.strictEqual(capturedOptions?.body, formData);
    });

    test('constructs correct URL with API_BASE', async (assert) => {
      let capturedUrl = '';
      const formData = new FormData();

      globalThis.fetch = ((input: RequestInfo | URL) => {
        capturedUrl = input as string;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);
      }) as unknown as typeof fetch;

      await postForm('/test-endpoint', formData);
      assert.strictEqual(capturedUrl, 'http://localhost:3000/test-endpoint');
    });

    test('throws error when response is not ok', async (assert) => {
      const formData = new FormData();
      globalThis.fetch = (() =>
        Promise.resolve({
          ok: false,
          status: 400,
          text: () => Promise.resolve('Bad Request'),
        } as Response)) as unknown as typeof fetch;

      try {
        await postForm('/test-endpoint', formData);
        assert.ok(false, 'Should have thrown an error');
      } catch (error) {
        assert.strictEqual(
          (error as Error).message,
          'POST /test-endpoint failed: 400 Bad Request'
        );
      }
    });
  });
});
