import QUnit from 'qunit';

const { module, test } = QUnit;

import {
  type PaginatedDataFetchFns,
  usePaginatedFetcher,
} from '@hooks/use-paginated-fetcher';
import type { PagArgs, Pagination } from '@lib/utils';
import {
  assertIsAtom,
  getAtomValue,
  renderHook,
  sleep,
  waitForAtomUpdate,
} from '@tests/test-utils';
import { createStore } from 'jotai';
import { fromSeconds } from '@/types/time-brands';

module('Hook | usePaginatedFetcher', () => {
  function makePagination<T = any>(
    items: T[],
    overrides: Partial<Pagination<T>> = {}
  ): Promise<Pagination<T>> {
    return Promise.resolve({
      items,
      totalItems: overrides.totalItems || 0,
      pageSize: overrides.pageSize || 0,
      currentPage: overrides.currentPage || 0,
      totalPages: overrides.totalPages || 0,
    });
  }

  const emptyFetcher = (
    paginationArgs: PagArgs,
    _params?: any,
    _forceClearCache?: boolean
  ): PaginatedDataFetchFns<any> => {
    return {
      abort: () => false,
      response: () =>
        Promise.resolve(
          makePagination([], {
            currentPage: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
          })
        ),
    };
  };

  test('usePaginatedFetcher empty response', async (assert) => {
    const store = createStore();
    const { result } = renderHook(
      () =>
        usePaginatedFetcher({
          fetcher: emptyFetcher,
          cacheKey: 'test',
          cachedPagesCache: new Map(),
        }),
      { store }
    );
    const dataAtom = result.current.state?.data;
    const loadingAtom = result.current.state?.isLoading;
    const errorAtom = result.current.state?.error;
    assertIsAtom(dataAtom);
    assertIsAtom(loadingAtom);
    assertIsAtom(errorAtom);

    const pageSize = 10;
    const page = 3;
    // await act(async () => {
    const data = await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page, pageSize }, undefined, true),
    });
    assert.equal(data.pageSize, pageSize);
    assert.equal(data.currentPage, page);
    assert.equal(data.totalItems, 0);
    assert.equal(data.totalPages, 0);
    assert.equal(data.items.length, 0);
    // });
  });

  // Ensure globals exist for dev-mode checks used by the hook
  (window as any).__globals = (window as any).__globals || {
    isDev: true,
  };

  function makeItems(count: number, start = 0) {
    return Array.from({ length: count }, (_, i) => start + i);
  }

  test('usePaginatedFetcher non-empty response and loading toggles', async (assert) => {
    const store = createStore();
    const delayMs = 5;

    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<number> => {
      let aborted = false;
      return {
        abort: () => {
          aborted = true;
          return true;
        },
        response: async () => {
          await sleep(delayMs);
          if (aborted as boolean) {
            throw new Error('Aborted');
          }
          const numberOfItemsToMake = 5;
          return makePagination(makeItems(numberOfItemsToMake), {
            currentPage: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
            totalItems: 5,
            totalPages: 1,
          });
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number>({
          fetcher,
          cacheKey: 'test-non-empty',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;
    const loadingAtom = result.current.state.isLoading;
    const errorAtom = result.current.state.error;

    // await act(async () => {
    const afterSubscribe = () => {
      result.current.loadPage({ page: 1, pageSize: 10 });
    };
    const loadingTrue = await waitForAtomUpdate(store, loadingAtom, {
      predicate: (v) => v === true,
      timeoutMs: 200,
      executeAfterSubscribe: afterSubscribe,
    });
    assert.equal(loadingTrue, true);

    // Wait for loading to be false again
    const loadingFalse = await waitForAtomUpdate(store, loadingAtom, {
      predicate: (v) => v === false,
      timeoutMs: 200,
    });
    assert.equal(loadingFalse, false);

    const data = getAtomValue(store, dataAtom);
    const expectedItemCount = 5;
    assert.equal(data.items.length, expectedItemCount);
    assert.equal(data.totalItems, expectedItemCount);
    assert.equal(data.totalPages, 1);
    assert.equal(data.currentPage, 1);

    const err = getAtomValue(store, errorAtom);
    assert.equal(err, null);
    // })
  });

  test('caches page results and serves from cache on repeat calls', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<string> => {
      return {
        abort: () => false,
        response: () => {
          responseCalls += 1;
          return makePagination(
            [`item-${paginationArgs.page}-${paginationArgs.pageSize}`],
            {
              currentPage: paginationArgs.page,
              pageSize: paginationArgs.pageSize,
              totalItems: 1,
              totalPages: 1,
            }
          );
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<string>({
          fetcher,
          cacheKey: 'test-cache',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;

    // await act(async () => {
    const first = await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 1, pageSize: 25 }),
    });
    assert.equal(first.items[0], 'item-1-25');
    assert.equal(responseCalls, 1);

    // Reset the data atom so when we update with the same data, it still triggers a new subscription
    store.set(dataAtom, {} as any);

    // Second call with same args should be served from cache
    const second = await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 1, pageSize: 25 }),
    });
    assert.equal(second.items[0], 'item-1-25');
    assert.equal(
      responseCalls,
      1,
      'should not call response again for cached page'
    );
    // })
  });

  test('force clearing cache triggers a new fetch', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<string> => {
      return {
        abort: () => false,
        response: () => {
          responseCalls += 1;
          return makePagination(
            [`item-${paginationArgs.page}-${paginationArgs.pageSize}`],
            {
              currentPage: paginationArgs.page,
              pageSize: paginationArgs.pageSize,
              totalItems: 1,
              totalPages: 1,
            }
          );
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<string>({
          fetcher,
          cacheKey: 'test-force',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;

    // await act(async () => {
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 2, pageSize: 10 }),
    });
    assert.equal(responseCalls, 1);

    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 2, pageSize: 10 }, undefined, true),
    });
    assert.equal(responseCalls, 2, 'force should bypass cache and fetch again');
    // })
  });

  test('params equality uses cache; params change triggers new fetch', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const fetcher = (
      paginationArgs: PagArgs,
      _params?: Record<string, unknown>
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => false,
        response: () => {
          responseCalls += 1;
          return makePagination(makeItems(1), {
            currentPage: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
            totalItems: 1,
            totalPages: 1,
          });
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number, Record<string, unknown>>({
          fetcher,
          cacheKey: 'test-params',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;

    // await act(async () => {
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 1, pageSize: 5 }, { q: 'same' }),
    });
    assert.equal(responseCalls, 1);

    // clear the data atom so we can trigger subscription with same data
    store.set(dataAtom, {} as any);

    // Same params: should use cache
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 1, pageSize: 5 }, { q: 'same' }),
    });
    assert.equal(responseCalls, 1, 'same params should use cache');

    // Different params: should fetch again
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 1, pageSize: 5 }, { q: 'different' }),
    });
    assert.equal(responseCalls, 2, 'changed params should fetch new page');
    // })
  });

  test('abortRequest triggers abort function and returns correct status', (assert) => {
    const store = createStore();
    let aborted = false;
    const TWENTY_MS = 20 as const;
    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => {
          aborted = true;
          return true;
        },
        response: async () => {
          await sleep(TWENTY_MS);
          return makePagination(makeItems(0), {
            currentPage: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
            totalItems: 0,
            totalPages: 0,
          });
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number>({
          fetcher,
          cacheKey: 'test-abort',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    // await act(async () => {
    // Nothing to abort yet
    assert.equal(result.current.abortRequest(), false);

    result.current.loadPage({ page: 1, pageSize: 10 });
    const didAbort = result.current.abortRequest();
    assert.equal(didAbort, true);
    assert.equal(aborted, true);
    // })
  });

  test('cache TTL expiry: maxPageLifetime=0 forces refetch', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<string> => {
      return {
        abort: () => false,
        response: () => {
          responseCalls += 1;
          return makePagination(
            [`ttl-item-${paginationArgs.page}-${paginationArgs.pageSize}`],
            {
              currentPage: paginationArgs.page,
              pageSize: paginationArgs.pageSize,
              totalItems: 1,
              totalPages: 1,
            }
          );
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<string>({
          fetcher,
          cacheKey: 'test-ttl',
          maxPageLifetime: fromSeconds(0),
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;

    // await act(async () => {
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 1, pageSize: 15 }),
    });
    assert.equal(responseCalls, 1);

    // clear the data atom so we can trigger subscription with same data
    store.set(dataAtom, {} as any);

    // Immediate second call should not use cache due to TTL=0
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 1, pageSize: 15 }),
    });
    assert.equal(responseCalls, 2);
    // })
  });

  const TWENTY_SECONDS = 20;
  const TEN_SECONDS = 10;
  const FIVE_ITEMS = 5;
  const TEN_ITEMS = 10;
  const TWENTY_FIVE_ITEMS = 25;
  const FIFTY_ITEMS = 50;
  const PAGE_SIZE_TEN = 10;
  const PAGE_SIZE_FIFTEEN = 15;
  const PAGE_TWO = 2;
  const PAGE_THREE = 3;
  const PAGE_FOUR = 4;
  const TOTAL_PAGES_THREE = 3;
  const TOTAL_PAGES_FIVE = 5;
  const TOTAL_PAGES_TEN = 10;
  const DELAY_FIFTY_MS = 50;
  const TIMEOUT_200_MS = 200;

  test('loadAdjacentPage navigates forward and backward correctly', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => false,
        response: () => {
          responseCalls += 1;
          return makePagination(
            makeItems(FIVE_ITEMS, paginationArgs.page * TEN_ITEMS),
            {
              currentPage: paginationArgs.page,
              pageSize: paginationArgs.pageSize,
              totalItems: TWENTY_FIVE_ITEMS,
              totalPages: TOTAL_PAGES_FIVE,
            }
          );
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number>({
          fetcher,
          cacheKey: 'test-adjacent',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;

    // await act(async () => {
    // Load initial page 2
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({
          page: PAGE_TWO,
          pageSize: PAGE_SIZE_TEN,
        }),
    });
    assert.equal(responseCalls, 1);
    let pageData = getAtomValue(store, dataAtom);
    assert.equal(pageData.currentPage, PAGE_TWO);

    // Navigate forward to page 3
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () => result.current.loadAdjacentPage(1, true),
    });
    assert.equal(responseCalls, 2);
    pageData = getAtomValue(store, dataAtom);
    assert.equal(pageData.currentPage, PAGE_THREE);

    // Navigate backward to page 2
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () => result.current.loadAdjacentPage(-1, true),
    });
    const EXPECTED_CALLS_THREE = 3;
    assert.equal(responseCalls, EXPECTED_CALLS_THREE);
    pageData = getAtomValue(store, dataAtom);
    assert.equal(pageData.currentPage, PAGE_TWO);
    // })
  });

  test('loadAdjacentPage respects page bounds', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const THREE_ITEMS = 3;
    const NINE_ITEMS = 9;
    const PAGE_ONE = 1;
    const SLEEP_TEN_MS = 10;

    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => false,
        response: () => {
          responseCalls += 1;
          return makePagination(
            makeItems(THREE_ITEMS, paginationArgs.page * TEN_ITEMS),
            {
              currentPage: paginationArgs.page,
              pageSize: paginationArgs.pageSize,
              totalItems: NINE_ITEMS,
              totalPages: TOTAL_PAGES_THREE,
            }
          );
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number>({
          fetcher,
          cacheKey: 'test-bounds',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;

    // await act () => {
    // Load page 1
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: PAGE_ONE, pageSize: PAGE_SIZE_TEN }),
    });
    assert.equal(responseCalls, 1);

    // Try to go backward from page 1 - should not fetch
    result.current.loadAdjacentPage(-1, false);
    await sleep(SLEEP_TEN_MS); // Give it a moment to potentially fetch
    assert.equal(
      responseCalls,
      1,
      'should not fetch when trying to go below page 1'
    );

    // Navigate to last page (3)
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({
          page: TOTAL_PAGES_THREE,
          pageSize: PAGE_SIZE_TEN,
        }),
    });
    assert.equal(responseCalls, 2);

    // Try to go forward from last page - should not fetch
    result.current.loadAdjacentPage(1, false);
    await sleep(SLEEP_TEN_MS); // Give it a moment to potentially fetch
    assert.equal(
      responseCalls,
      2,
      'should not fetch when trying to go above totalPages'
    );
    // })
  });

  test('loadAdjacentPage handles empty totalPages gracefully', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const PAGE_ONE = 1;
    const SLEEP_TEN_MS = 10;

    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => false,
        response: () => {
          responseCalls += 1;
          return makePagination([], {
            currentPage: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
            totalItems: 0,
            totalPages: 0,
          });
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number>({
          fetcher,
          cacheKey: 'test-empty',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;

    // await act(async () => {
    // Load empty page
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({
          page: PAGE_ONE,
          pageSize: PAGE_SIZE_TEN,
        }),
    });
    assert.equal(responseCalls, 1);

    // Try to navigate when totalPages is 0
    result.current.loadAdjacentPage(1, false);
    result.current.loadAdjacentPage(-1, false);
    await sleep(SLEEP_TEN_MS);
    assert.equal(responseCalls, 1, 'should not fetch when totalPages is 0');
    // })
  });

  test('loadAdjacentPage uses pendingRequestParams when request is in flight', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => false,
        response: async () => {
          await sleep(DELAY_FIFTY_MS);
          responseCalls += 1;
          return makePagination(
            makeItems(FIVE_ITEMS, paginationArgs.page * TEN_ITEMS),
            {
              currentPage: paginationArgs.page,
              pageSize: paginationArgs.pageSize,
              totalItems: FIFTY_ITEMS,
              totalPages: TOTAL_PAGES_TEN,
            }
          );
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number>({
          fetcher,
          cacheKey: 'test-pending',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;
    const pendingParamsAtom = result.current.state.pendingRequestParams;

    // await act(async () => {
    // Start loading page 3
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({
          page: PAGE_THREE,
          pageSize: PAGE_SIZE_TEN,
        }),
    });

    // While request is in flight, call loadAdjacentPage forward
    // This should use page 3 (from pendingRequestParams) + 1 = page 4
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () => result.current.loadAdjacentPage(1, true),
      timeoutMs: TIMEOUT_200_MS,
    });

    assert.equal(
      getAtomValue(store, dataAtom).currentPage,
      PAGE_FOUR,
      'should navigate to page 4 based on pending request'
    );
    assert.equal(responseCalls, 2, 'should make two requests');

    const pendingParams = getAtomValue(store, pendingParamsAtom);
    assert.equal(
      pendingParams,
      null,
      'pendingRequestParams should be null after completion'
    );
    // })
  });

  test('loadAdjacentPage with forceClearCache bypasses cache', async (assert) => {
    const store = createStore();
    let responseCalls = 0;
    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<string> => {
      return {
        abort: () => false,
        response: () => {
          responseCalls += 1;
          return makePagination(
            [`call-${responseCalls}-page-${paginationArgs.page}`],
            {
              currentPage: paginationArgs.page,
              pageSize: paginationArgs.pageSize,
              totalItems: 15,
              totalPages: 3,
            }
          );
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<string>({
          fetcher,
          cacheKey: 'test-force-cache',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const dataAtom = result.current.state.data;

    // await act(async () => {
    // Load page 1
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () =>
        result.current.loadPage({ page: 1, pageSize: 10 }),
    });
    assert.equal(responseCalls, 1);

    // Navigate to page 2
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () => result.current.loadAdjacentPage(1, false),
    });
    assert.equal(responseCalls, 2);

    // Navigate back to page 1 (should use cache)
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () => result.current.loadAdjacentPage(-1, false),
    });
    assert.equal(responseCalls, 2, 'should use cache for page 1');
    let pageData = getAtomValue(store, dataAtom);
    assert.equal(pageData.items[0], 'call-1-page-1', 'should show cached data');

    // Navigate to page 1 again with forceClearCache
    await waitForAtomUpdate(store, dataAtom, {
      executeAfterSubscribe: () => result.current.loadAdjacentPage(1, true),
    });
    const EXPECTED_CALLS_THREE = 3;
    assert.equal(
      responseCalls,
      EXPECTED_CALLS_THREE,
      'should bypass cache with forceClearCache'
    );
    pageData = getAtomValue(store, dataAtom);
    assert.equal(pageData.items[0], 'call-3-page-2', 'should show fresh data');
    // })
  });

  test('pendingRequestParams tracks ongoing requests correctly', async (assert) => {
    const store = createStore();
    const DELAY_THIRTY_MS = 30;
    const THREE_ITEMS = 3;
    const NINE_ITEMS = 9;

    const fetcher = (
      paginationArgs: PagArgs,
      _params?: { filter: string }
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => false,
        response: async () => {
          await sleep(DELAY_THIRTY_MS);
          return makePagination(makeItems(THREE_ITEMS), {
            currentPage: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
            totalItems: NINE_ITEMS,
            totalPages: TOTAL_PAGES_THREE,
          });
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number, { filter: string }>({
          fetcher,
          cacheKey: 'test-pending-params',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const pendingParamsAtom = result.current.state.pendingRequestParams;

    // await act(async () => {
    // Start a request
    result.current.loadPage(
      { page: PAGE_TWO, pageSize: PAGE_SIZE_FIFTEEN },
      { filter: 'test' }
    );

    // Check that pendingRequestParams is set
    const pendingParams = getAtomValue(store, pendingParamsAtom);
    assert.deepEqual(pendingParams?.paginationArgs, {
      page: PAGE_TWO,
      pageSize: PAGE_SIZE_FIFTEEN,
    });
    assert.deepEqual(pendingParams?.params, { filter: 'test' });

    // Wait for request to complete
    await waitForAtomUpdate(store, pendingParamsAtom, {
      predicate: (params) => params === null,
      timeoutMs: TIMEOUT_200_MS,
    });

    const finalPendingParams = getAtomValue(store, pendingParamsAtom);
    assert.equal(
      finalPendingParams,
      null,
      'pendingRequestParams should be null after completion'
    );
    // })
  });

  test('abortRequest clears pendingRequestParams', (assert) => {
    const store = createStore();
    let aborted = false;
    const THREE_ITEMS = 3;
    const NINE_ITEMS = 9;
    const PAGE_ONE = 1;

    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => {
          aborted = true;
          return true;
        },
        response: async () => {
          await sleep(DELAY_FIFTY_MS);
          if (aborted as boolean) {
            throw new Error('Request aborted');
          }
          return makePagination(makeItems(THREE_ITEMS), {
            currentPage: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
            totalItems: NINE_ITEMS,
            totalPages: TOTAL_PAGES_THREE,
          });
        },
      };
    };

    const { result } = renderHook(
      () =>
        usePaginatedFetcher<number>({
          fetcher,
          cacheKey: 'test-abort-pending',
          cachedPagesCache: new Map(),
        }),
      { store }
    );

    const pendingParamsAtom = result.current.state.pendingRequestParams;

    // await act(async () => {
    // Start a request
    result.current.loadPage({ page: PAGE_ONE, pageSize: PAGE_SIZE_TEN });

    // Verify pendingRequestParams is set
    let pendingParams = getAtomValue(store, pendingParamsAtom);
    assert.notEqual(pendingParams, null, 'pendingRequestParams should be set');

    // Abort the request
    const didAbort = result.current.abortRequest();
    assert.equal(didAbort, true, 'should successfully abort');

    // Check that pendingRequestParams is cleared
    pendingParams = getAtomValue(store, pendingParamsAtom);
    assert.equal(
      pendingParams,
      null,
      'pendingRequestParams should be cleared after abort'
    );
    // })
  });

  test('dev invariants: cacheKey and maxPageLifetime are invariant', (assert) => {
    const store = createStore();

    const fetcher = (
      paginationArgs: PagArgs
    ): PaginatedDataFetchFns<number> => {
      return {
        abort: () => false,
        response: async () =>
          makePagination(makeItems(0), {
            currentPage: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
          }),
      };
    };
    const initialCache = new Map();
    const changedCache = new Map();

    const testValues = {
      defaults: {
        fetcher,
        cacheKey: 'inv-1',
        maxPageLifetime: fromSeconds(TEN_SECONDS),
        cachedPagesCache: initialCache,
      },
      changed: {
        cacheKey: 'inv-2',
        maxPageLifetime: fromSeconds(TWENTY_SECONDS),
        cachedPagesCache: changedCache,
      },
    };

    const changeKeys = Object.keys(testValues.changed);
    for (const _key of changeKeys) {
      const { rerender } = renderHook(
        (props: any) => usePaginatedFetcher<number>(props),
        {
          initialProps: {
            ...testValues.defaults,
          },
          store,
        }
      );
      assert.throws(() => {
        rerender({
          ...testValues.defaults,
          ...testValues.changed,
        });
      });
    }
  });
});
