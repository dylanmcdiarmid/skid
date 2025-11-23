import QUnit from "qunit";

const { module, test } = QUnit;

import { paramsAtom, useAtomFetcher } from "@hooks/use-atom-fetcher";
import { waitFor } from "@testing-library/react";
import {
  getAtomValue,
  renderHook,
  sleep,
  waitForAtomUpdate,
} from "@tests/test-utils";
import { atom, createStore } from "jotai";

module("Hook | useAtomFetcher", () => {
  test("auto-loads on mount, sets data, clears loading, caches params", async (assert) => {
    const store = createStore();
    type Data = Record<string, unknown>;
    type P = { q: string };
    const dataAtom = atom<Data>({});
    const resolved: Data = { foo: "bar" };
    let calls = 0;
    const fetchData = async (_params?: P): Promise<Data> => {
      calls += 1;
      await sleep(1);
      return resolved;
    };
    const fetchParams: P = { q: "hi" };

    const { result } = renderHook(
      () =>
        useAtomFetcher<Data, P>({
          atom: dataAtom,
          fetchData,
          fetchParams,
          cacheKey: "use-atom-fetcher:basic",
        }),
      { store }
    );

    const value = await waitForAtomUpdate(store, dataAtom);
    assert.deepEqual(value, resolved, "sets atom data from fetch");

    await sleep(1);
    assert.equal(
      result.current.isLoading,
      false,
      "isLoading is false after fetch"
    );
    assert.equal(result.current.error, null, "error is null");

    const cached = getAtomValue(store, paramsAtom);
    assert.deepEqual(
      cached["use-atom-fetcher:basic"],
      fetchParams,
      "caches fetch params by cacheKey"
    );
    assert.equal(calls, 1, "fetchData called once on mount");
  });

  test("refreshAtomData updates data and cached params", async (assert) => {
    const store = createStore();
    type Data = { n: number };
    type Params = { key?: string };
    const dataAtom = atom<Data>({} as Data);
    const resultsByParam: Record<string, Data> = {
      "1": { n: 1 },
      "2": { n: 2 },
    };
    const fetchData = async (params?: Params): Promise<Data> => {
      await sleep(1);
      const key = params?.key ?? "1";
      return resultsByParam[key];
    };

    const { result } = renderHook(
      () =>
        useAtomFetcher<Data, Params>({
          atom: dataAtom,
          fetchData,
          fetchParams: { key: "1" },
          cacheKey: "use-atom-fetcher:refresh",
        }),
      { store }
    );

    await waitForAtomUpdate(store, dataAtom, {
      predicate: (v) => v.n === 1,
    });

    result.current.refreshAtomData({ key: "2" });
    const updated = await waitForAtomUpdate(store, dataAtom, {
      predicate: (v) => v.n === 2,
    });
    assert.deepEqual(updated, { n: 2 }, "refresh loads new data");

    const cached = getAtomValue(store, paramsAtom);
    assert.deepEqual(
      cached["use-atom-fetcher:refresh"],
      { key: "2" },
      "updates cached params to latest"
    );
  });

  test("sets error and clears loading when fetch fails", async (assert) => {
    const store = createStore();
    type Data = { ok: boolean };
    const dataAtom = atom<Data | null>(null);

    const fetchData = async (): Promise<Data> => {
      await sleep(1);
      throw new Error("boom");
    };

    const { result } = renderHook(
      () =>
        useAtomFetcher<Data | null>({
          atom: dataAtom,
          fetchData,
          cacheKey: "use-atom-fetcher:error",
        }),
      { store }
    );

    await waitFor(() => {
      if (result.current.error !== "boom") {
        throw new Error("error message is not set to boom");
      }
    });
    assert.equal(result.current.error, "boom", "error message is set");
    assert.equal(
      result.current.isLoading,
      false,
      "isLoading is false after error"
    );
    const data = getAtomValue(store, dataAtom);
    assert.deepEqual(data, null, "data remains unchanged on error");
  });

  test("does not auto-fetch when atom already has data", async (assert) => {
    const store = createStore();
    const initial = { filled: true };
    const dataAtom = atom<typeof initial>(initial);

    let calls = 0;
    const fetchData = () => {
      calls += 1;
      return Promise.resolve(initial);
    };

    renderHook(
      () =>
        useAtomFetcher({
          atom: dataAtom,
          fetchData,
          cacheKey: "use-atom-fetcher:no-autoload",
        }),
      { store }
    );

    await sleep(5);
    assert.equal(calls, 0, "fetchData was not called when atom had data");
  });
});
