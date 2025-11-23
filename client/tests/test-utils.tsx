import type { RenderHookOptions, RenderOptions } from "@testing-library/react";
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  within,
} from "@testing-library/react";
import type { Atom, WritableAtom } from "jotai";
import { createStore, Provider } from "jotai";
import type { ReactElement, ReactNode } from "react";
import type { Store } from "@/state/init";
import type { TimeoutId } from "./types";

// biome-ignore lint/suspicious/noExplicitAny: <This can be any atom in the system>
export type InitialValue<T = unknown> = [WritableAtom<T, any, any>, T];

export interface JotaiRenderOptions {
  initialValues?: InitialValue[];
  store?: Store;
}

export function render(
  ui: ReactElement,
  options?: RenderOptions & JotaiRenderOptions
) {
  const container = createQunitContainer();

  const Wrapper = createTestStoreWrapper(
    options?.store,
    options?.initialValues
  );

  // Render the component into the qunit-fixture inner div
  const result = rtlRender(ui, {
    ...options,
    container,
    wrapper: Wrapper,
  });

  return result;
}

export function renderHook<Result, Props>(
  renderFn: (initialProps: Props) => Result,
  options?: (RenderHookOptions<Props> & JotaiRenderOptions) | undefined
) {
  const container = createQunitContainer();

  const Wrapper = createTestStoreWrapper(
    options?.store,
    options?.initialValues
  );

  return rtlRenderHook(renderFn, {
    ...options,
    container,
    wrapper: Wrapper,
  });
}

/**
 * Gets the Radix UI popper content wrapper and returns scoped queries for it.
 * This is useful for testing components like dropdowns, popovers, tooltips, etc.
 * that render their content in a portal outside the main test container.
 *
 * @returns Scoped queries within the popper content wrapper
 * @throws Error if the content wrapper is not found
 */
export function getPopperContentQueries() {
  const contentWrapper = document.querySelector(
    "[data-radix-popper-content-wrapper]"
  );

  if (!contentWrapper) {
    throw new Error(
      "Could not find Radix popper content wrapper. Make sure the component is rendered and opened."
    );
  }

  return within(contentWrapper as HTMLElement);
}

export function getSheetContentQueries() {
  const contentWrapper = document.querySelector("[data-slot='sheet-content']");

  if (!contentWrapper) {
    throw new Error(
      "Could not find Sheet content wrapper. Make sure the component is rendered and opened."
    );
  }

  return within(contentWrapper as HTMLElement);
}

export function getSheetOverlayQueries() {
  const contentWrapper = document.querySelector("[data-slot='sheet-overlay']");

  if (!contentWrapper) {
    throw new Error(
      "Could not find Sheet overlay wrapper. Make sure the component is rendered and opened."
    );
  }

  return within(contentWrapper as HTMLElement);
}

export class FakeTimers {
  private now = 0;
  private nextId = 1;
  private readonly timers = new Map<number, { time: number; cb: () => void }>();

  setTimeout = (cb: () => void, delay?: number): TimeoutId => {
    const id = this.nextId++;
    const runAt = this.now + (delay ?? 0);
    this.timers.set(id, { time: runAt, cb });
    return id as TimeoutId;
  };

  clearTimeout = (id: TimeoutId) => {
    this.timers.delete(id as unknown as number);
  };

  advanceBy = (ms: number) => {
    this.now += ms;
    // Execute due timers; include newly scheduled timers that are now due
    // Keep draining until no more due timers remain
    while (this.timers.size > 0) {
      const due: number[] = [];
      for (const [id, t] of this.timers) {
        if (t.time <= this.now) {
          due.push(id);
        }
      }
      if (due.length === 0) {
        break;
      }
      // Execute in insertion order
      for (const id of due.sort((a, b) => a - b)) {
        const task = this.timers.get(id);
        this.timers.delete(id);
        if (task) {
          task.cb();
        }
      }
    }
  };
}

// A type guard to check if a value is a Jotai atom without throwing an error.
// It checks for the essential properties that define a primitive atom.
const isAtom = <Value, Args extends unknown[], Result>(
  thing: unknown
): thing is Atom<Value> | WritableAtom<Value, Args, Result> => {
  return (
    typeof thing === "object" &&
    thing !== null &&
    "read" in thing &&
    "write" in thing &&
    "toString" in thing &&
    typeof (thing as { read: unknown }).read === "function" &&
    typeof (thing as { toString: unknown }).toString === "function"
  );
};

/**
 * Asserts that the given value is a valid Jotai atom.
 * If the value is not a valid atom, it throws a TypeError.
 * This is useful for runtime validation in functions that expect atoms.
 *
 * @template Value The type of the value the atom holds.
 * @template Args The arguments for the atom's write function.
 * @template Result The return type of the atom's write function.
 * @param {unknown} value The value to be checked.
 * @param {string} [message] Optional custom error message.
 * @throws {TypeError} If the value is not a valid Jotai atom.
 */
export function assertIsAtom<Value, Args extends unknown[], Result>(
  value: unknown,
  message?: string
): asserts value is Atom<Value> | WritableAtom<Value, Args, Result> {
  if (!isAtom(value)) {
    throw new TypeError(
      message || "The provided value is not a valid Jotai atom."
    );
  }
}

export function waitForAtomUpdate<T>(
  store: Store,
  atom: Atom<T>,
  options: {
    timeoutMs?: number;
    predicate?: (value: T) => boolean;
    executeAfterSubscribe?: () => void;
  } = {}
): Promise<T> {
  const { timeoutMs = 100, predicate } = options;

  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | null = null;

    const timeoutId = setTimeout(() => {
      unsubscribe?.();
      reject(
        new Error(
          `waitForAtomUpdate> Atom update timed out after ${timeoutMs}ms`
        )
      );
    }, timeoutMs);
    // console.log(
    //   "waitForAtomUpdate> SUBSCRIBING TO ATOM",
    //   atom.toString(),
    //   predicate
    // )

    unsubscribe = store.sub(atom, () => {
      const value = store.get(atom);
      // console.log(
      //   "waitForAtomUpdate> SUB TRIGGERED FOR ATOM",
      //   atom.toString(),
      //   "value",
      //   value
      // )

      // If there's a predicate, only resolve if it passes
      if (!predicate || predicate(value)) {
        // console.log("waitForAtomUpdate> RESOLVING PROMISE")
        clearTimeout(timeoutId);
        unsubscribe?.();
        resolve(value);
      }
    });
    if (options.executeAfterSubscribe) {
      options.executeAfterSubscribe();
    }
  });
}

export function getAtomValue<T>(store: Store, atom: Atom<T>): T {
  return store.get(atom);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTestStoreWrapper(
  store?: Store,
  initialValues?: InitialValue[] | null
) {
  const _store = store ?? createStore();
  if (initialValues) {
    for (const [atom, value] of initialValues) {
      _store.set(atom, value);
    }
  }
  const Wrapper = ({ children }: { children?: ReactNode }) => (
    <Provider store={_store}>{children}</Provider>
  );
  return Wrapper;
}

function createQunitContainer() {
  // Get or create the qunit-fixture div
  let fixture = document.getElementById("qunit-fixture");
  if (!fixture) {
    fixture = document.createElement("div");
    fixture.id = "qunit-fixture";
    document.body.appendChild(fixture);
  }

  const container = document.createElement("div");
  fixture.appendChild(container);
  return container;
}
