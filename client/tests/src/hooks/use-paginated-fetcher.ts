import { isDev, type PagArgs, type Pagination } from "@lib/utils";
import type { PrimitiveAtom } from "jotai";
import { atom as jotaiAtom, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import {
  dateToMs,
  fromSeconds,
  nowMs,
  type Second,
  secondsToMs,
} from "@/types/time-brands";

export const paramsAtom = jotaiAtom<Record<string, Record<string, unknown>>>(
  {}
);

export type FetchAbortFn = () => boolean;
export type FetchResponseFn<T> = () => Promise<Pagination<T>>;

export interface PaginatedDataFetchFns<T> {
  // should abort the fetch
  abort: FetchAbortFn;
  // should actually execute the fetch
  response: FetchResponseFn<T>;
}

export type PaginatedDataFetcherFn<
  T,
  TParams extends Record<string, unknown> | undefined = undefined,
> = (pagArgs: PagArgs, params?: TParams) => PaginatedDataFetchFns<T>;

const shallowComparison = <TParams>(
  obj1: TParams extends Record<string, unknown> ? TParams : never,
  obj2: TParams extends Record<string, unknown> ? TParams : never
) => {
  if (typeof obj1 !== "object" && typeof obj2 === "object") {
    return false;
  }
  if (typeof obj1 === "object" && typeof obj2 !== "object") {
    return false;
  }
  if (typeof obj1 !== "object" && typeof obj2 !== "object") {
    return true;
  }
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    (Object.keys(obj1) as (keyof typeof obj1)[]).every((key) => {
      return obj1[key] === obj2[key];
    })
  );
};

export interface PaginatedDataWrapper<T> {
  page: number;
  pageSize: number;
  fetchedAt: Date;
  dirty: boolean;
  data: T;
}

export interface PaginatedDataCacheEntry<T> {
  pageSize: number;
  lastRefreshAt: Date;
  entries: Record<number, PaginatedDataWrapper<T>>;
}

export interface CachedPage<T> {
  page: number;
  pageSize: number;
  fetchedAt: Date;
  params?: Record<string, unknown>;
  data: Pagination<T>;
}

const DEFAULT_PAGE_LIFETIME_IN_SECONDS = fromSeconds(300);
export class CachedPages<T> {
  pages: Map<number, CachedPage<T>>;

  constructor() {
    this.pages = new Map();
  }

  setPage(cachedPage: CachedPage<T>) {
    this.pages.set(cachedPage.page, cachedPage);
  }

  getPageIfValid(
    page: number,
    pageSize: number,
    params?: Record<string, unknown>,
    maxPageLifetime: Second = DEFAULT_PAGE_LIFETIME_IN_SECONDS
  ): CachedPage<T> | undefined {
    const cachedPage = this.pages.get(page);
    if (!cachedPage) {
      return;
    }
    if (cachedPage.pageSize !== pageSize) {
      return;
    }
    if (
      nowMs() >=
      dateToMs(cachedPage.fetchedAt) + secondsToMs(maxPageLifetime)
    ) {
      return;
    }
    if (!shallowComparison(cachedPage.params ?? {}, params ?? {})) {
      return;
    }
    return cachedPage;
  }
}

export const defaultCachedPagesCache: Map<
  string,
  // biome-ignore lint/suspicious/noExplicitAny: <shared caching of different types>
  CachedPages<any>
> = new Map();

export const getCachedPages = <T>(
  cacheKey: string,
  // biome-ignore lint/suspicious/noExplicitAny: <shared caching of different types>
  cache: Map<string, CachedPages<any>> = defaultCachedPagesCache
): CachedPages<T> => {
  let ret = cache.get(cacheKey);
  if (!ret) {
    ret = new CachedPages();
    cache.set(cacheKey, ret);
  }
  return ret as CachedPages<T>;
};

// Can you update this function to take a second optional parameter that is boolean called exact that when true must match the cache key exactly, but checks any key that contains the string passed in when false and clear each page that matches? It should default to true if not provided.
export function invalidate(cacheKey: string, exact = true): void {
  if (exact) {
    const cached = getCachedPages(cacheKey, defaultCachedPagesCache);
    cached.pages.clear();
    return;
  }

  const keysToDelete: string[] = [];
  for (const key of defaultCachedPagesCache.keys()) {
    if (key.includes(cacheKey)) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    const cached = getCachedPages(key, defaultCachedPagesCache);
    cached.pages.clear();
  }
}

export interface UsePaginatedFetcherOptions<
  AtomData,
  TParams extends TParamsType = undefined,
> {
  // Function to fetch data from API
  fetcher: PaginatedDataFetcherFn<AtomData, TParams>;

  // Used to store cached pages
  cacheKey: string;

  // How long to keep a page in the cache
  maxPageLifetime?: Second;

  // allows using a different cachedPagesCache than the default
  cachedPagesCache?: Map<string, CachedPages<AtomData>>;
}

interface PaginationResponseError {
  message: string;
}

type AbortFunctionLike = () => void;
type TParamsType = Record<string, unknown> | undefined;

export function usePaginatedFetcher<
  T,
  TParams extends TParamsType = undefined,
>({
  fetcher,
  maxPageLifetime: maxPageLifetimeArg = DEFAULT_PAGE_LIFETIME_IN_SECONDS,
  cacheKey: cacheKeyArg,
  cachedPagesCache: cachedPagesCacheArg,
}: UsePaginatedFetcherOptions<T, TParams>): PaginatedFetcherResponse<
  T,
  TParams
> {
  const atomRef = useRef<PaginatedAtoms<T, TParams> | null>(null);
  const lastSuccessfulParams = useRef<TParams | undefined>(undefined);

  // Used for storing most recent values
  const totalPagesRef = useRef<number>(0);
  const pendingCurrentPageRef = useRef<number>(1);
  const currentPageRef = useRef<number>(1);
  const pageSizeRef = useRef<number>(0);

  // Invariants
  const cacheKey = useRef<string>(cacheKeyArg);
  const maxPageLifetime = useRef<Second>(maxPageLifetimeArg);
  const cachedPagesCache = useRef<Map<string, CachedPages<T>> | undefined>(
    cachedPagesCacheArg
  );

  const outgoingRequestAbort = useRef<AbortFunctionLike | null>(null);

  const wasMounted = useRef(false);
  if (wasMounted.current === false) {
    wasMounted.current = true;
  }

  if (atomRef.current === null) {
    atomRef.current = {
      data: jotaiAtom<Pagination<T>>({
        items: [],
        totalItems: 0,
        pageSize: 0,
        currentPage: 0,
        totalPages: 0,
      }),
      isLoading: jotaiAtom<boolean | null>(null),
      error: jotaiAtom<PaginationResponseError | null>(null),
      pendingRequestParams: jotaiAtom<PendingRequestParams<TParams> | null>(
        null
      ),
    };
  }

  const atoms = atomRef.current;
  const setDataAtomRaw = useSetAtom(atoms.data);
  const setDataAtom = useCallback(
    (data: Pagination<T>) => {
      totalPagesRef.current = data.totalPages;
      pageSizeRef.current = data.pageSize;
      currentPageRef.current = data.currentPage;
      pendingCurrentPageRef.current = data.currentPage;
      setDataAtomRaw(data);
    },
    [setDataAtomRaw]
  );
  if (isDev()) {
    if (cacheKey.current !== cacheKeyArg) {
      throw new Error("cacheKey is invariant");
    }
    if (maxPageLifetime.current !== maxPageLifetimeArg) {
      throw new Error("maxPageLifetime is invariant");
    }
    if (cachedPagesCache.current !== cachedPagesCacheArg) {
      throw new Error("cachedPagesCache is invariant");
    }
  }

  const setError = useSetAtom(atoms.error);
  const setIsLoading = useSetAtom(atoms.isLoading);
  const setPendingRequestParams = useSetAtom(atoms.pendingRequestParams);

  const loadPage = useCallback(
    (paginationArgs: PagArgs, params?: TParams, forceClearCache = false) => {
      const cachedPages = getCachedPages<T>(
        cacheKey.current,
        cachedPagesCache.current || defaultCachedPagesCache
      );
      const cachedPage = cachedPages.getPageIfValid(
        paginationArgs.page,
        paginationArgs.pageSize,
        params,
        maxPageLifetime.current
      );
      if (cachedPage && !forceClearCache) {
        setDataAtom(cachedPage.data);
        return;
      }
      const { abort, response } = fetcher(paginationArgs, params);
      if (outgoingRequestAbort.current) {
        outgoingRequestAbort.current();
      }
      outgoingRequestAbort.current = abort;
      setPendingRequestParams({
        paginationArgs,
        params: params || ({} as TParams),
      });
      pendingCurrentPageRef.current = paginationArgs.page;
      // Do we have existing results for this page?
      setIsLoading(true);
      response()
        .then((data) => {
          lastSuccessfulParams.current = params;
          cachedPages.setPage({
            page: paginationArgs.page,
            pageSize: paginationArgs.pageSize,
            fetchedAt: new Date(),
            params,
            data,
          });
          setDataAtom(data);
          outgoingRequestAbort.current = null;
          setPendingRequestParams(null);
          setIsLoading(false);
        })
        .catch((err) => {
          // n.b. We may want to pipeline or conditionally clear
          // pendingRequestParams or isLoading because abort calls happen
          // synchronously, meaning loadPage will be called before the abort
          // returns, meaning we can't clear pendingRequestParams as they'll be
          // set to the new request arguments in cases where abort was called
          // automatically to do a new request
          if (err && err.name === "AbortError") {
            return;
          }
          outgoingRequestAbort.current = null;
          setPendingRequestParams(null);
          setIsLoading(false);
          setError({
            message: err instanceof Error ? err.message : "Error loading page",
          });
        });
      return;
    },
    [fetcher, setError, setIsLoading, setDataAtom, setPendingRequestParams]
  );

  const abortRequest = useCallback(() => {
    if (outgoingRequestAbort.current == null) {
      return false;
    }
    outgoingRequestAbort.current();
    setIsLoading(false);
    setPendingRequestParams(null);
    return true;
  }, [setPendingRequestParams, setIsLoading]);

  const loadAdjacentPage = useCallback(
    (direction: -1 | 1, forceClearCache = false) => {
      if (totalPagesRef.current === 0) {
        return;
      }
      const currentPage =
        pendingCurrentPageRef.current || currentPageRef.current;

      const newPage = currentPage + direction;
      if (newPage > totalPagesRef.current) {
        return;
      }

      if (newPage < 1) {
        return;
      }

      loadPage(
        { page: newPage, pageSize: pageSizeRef.current },
        lastSuccessfulParams.current,
        forceClearCache
      );
    },
    [loadPage]
  );

  return {
    loadPage,
    abortRequest,
    loadAdjacentPage,
    state: atoms,
  };
}

export interface PaginatedFetcherResponse<
  T,
  TParams extends Record<string, unknown> | undefined = undefined,
> {
  // returns the request id
  loadPage: (
    paginationArgs: PagArgs,
    params?: TParams,
    forceClearCache?: boolean
  ) => void;
  // returns whether the request was aborted
  abortRequest: () => boolean;
  loadAdjacentPage: (direction: -1 | 1, forceClearCache: boolean) => void;
  state: PaginatedAtoms<T, TParams>;
}

export interface PendingRequestParams<TParams extends TParamsType> {
  paginationArgs: PagArgs;
  params: TParams;
}

export interface PaginatedAtoms<
  T,
  TParams extends Record<string, unknown> | undefined = undefined,
> {
  data: PrimitiveAtom<Pagination<T>>;
  isLoading: PrimitiveAtom<boolean | null>;
  error: PrimitiveAtom<PaginationResponseError | null>;
  pendingRequestParams: PrimitiveAtom<PendingRequestParams<TParams> | null>;
}
