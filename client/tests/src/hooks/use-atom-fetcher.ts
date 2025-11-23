import type { PrimitiveAtom } from "jotai";
import { atom as jotaiAtom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

export const paramsAtom = jotaiAtom<Record<string, Record<string, unknown>>>(
  {}
);

export interface UseAtomDataOptions<
  AtomData,
  TParams extends Record<string, unknown> | undefined = undefined,
> {
  // The atom to read/write data to
  atom: PrimitiveAtom<AtomData>;

  // Function to fetch data from API
  fetchData: (params: TParams) => Promise<AtomData>;

  // Optional parameters to pass to fetchData
  fetchParams?: TParams;

  // Cache key to identify this specific data request
  cacheKey: string;
}

const shallowComparison = <TParams>(
  obj1: TParams extends Record<string, unknown> ? TParams : never,
  obj2: TParams extends Record<string, unknown> ? TParams : never
) => {
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    (Object.keys(obj1) as (keyof typeof obj1)[]).every((key) => {
      return obj1[key] === obj2[key];
    })
  );
};

/**
 * Custom hook that integrates data fetching with Jotai atoms that store arrays or records.
 * Handles atom state management while delegating data fetching and transformation to passed in fetchData function.
 */
export function useAtomFetcher<
  AtomData,
  TParams extends Record<string, unknown> | undefined = undefined,
>({
  atom,
  fetchData,
  fetchParams,
  cacheKey,
}: UseAtomDataOptions<AtomData, TParams>) {
  const setAtomData = useSetAtom(atom);
  const atomData = useAtomValue(atom);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [hasFetched, setHasFetched] = useState(false)
  const hasFetched = useRef(false);
  const [allCachedParams, setAllCachedParams] = useAtom(paramsAtom);
  const cachedParams = allCachedParams[cacheKey];

  // Custom fetch function that checks atom state before fetching
  const fetchDataWithAtomCheck = useCallback(
    async (params?: TParams) => {
      hasFetched.current = true;
      // Use the data fetcher's fetch function, but override the actual fetch logic
      try {
        setIsLoading(true);
        setAllCachedParams((prev) => ({
          ...prev,
          [cacheKey]: params || {},
        }));
        const response = await fetchData(params || ({} as TParams));
        setAtomData(response);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Error fetching data for atom";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchData, setAtomData, setAllCachedParams, cacheKey]
  );

  // Auto-load data when component renders
  useEffect(() => {
    // Check if we need to load data
    const shouldLoadData = () => {
      // If the data is still loading, do not load the data
      if (isLoading) {
        return false;
      }
      // If there are no cached params but fetch params exist, OR the cached params are not the same as the fetch params, load the data
      if (
        (!cachedParams && fetchParams) ||
        (cachedParams &&
          fetchParams &&
          !shallowComparison(cachedParams, fetchParams))
      ) {
        return true;
      }
      // If the atom data is not empty, do not load the data
      if (atomData && Object.keys(atomData).length > 0) {
        return false;
      }
      // If the data has already been fetched, do not load the data
      return !hasFetched.current;
    };

    const loadData = async () => {
      await fetchDataWithAtomCheck(fetchParams);
    };

    if (shouldLoadData()) {
      loadData();
    }
  }, [fetchDataWithAtomCheck, fetchParams, cachedParams, isLoading, atomData]);

  const refreshAtomData = useCallback(
    (params?: TParams) => {
      fetchDataWithAtomCheck(params);
    },
    [fetchDataWithAtomCheck]
  );

  return {
    isLoading,
    error,
    data: atomData,
    setData: setAtomData,
    refreshAtomData,
  };
}
