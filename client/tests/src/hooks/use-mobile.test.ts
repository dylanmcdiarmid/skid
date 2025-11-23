import QUnit from "qunit";

const { module, test } = QUnit;

import { waitFor } from "@testing-library/react";
import { renderHook } from "@tests/test-utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Keep in sync with hook's breakpoint
const MOBILE_BREAKPOINT = 768;

module("Hook | useIsMobile", (hooks) => {
  let originalMatchMedia: typeof window.matchMedia;
  let changeListeners: Set<(e: Event) => void>;

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    });
  };

  const triggerMatchMediaChange = () => {
    const ev = new Event("change");
    for (const listener of changeListeners) {
      listener(ev);
    }
  };

  hooks.beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    changeListeners = new Set();

    // Mock matchMedia used by the hook
    window.matchMedia = (query: string) => {
      return {
        media: query,
        matches: window.innerWidth < MOBILE_BREAKPOINT,
        onchange: null,
        addEventListener: (_type: string, listener: (e: Event) => void) => {
          changeListeners.add(listener);
        },
        removeEventListener: (_type: string, listener: (e: Event) => void) => {
          changeListeners.delete(listener);
        },
        dispatchEvent: (e: Event) => {
          for (const listener of changeListeners) {
            listener(e);
          }
          return true;
        },
      } as unknown as MediaQueryList;
    };
  });

  hooks.afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test("returns false on desktop width", (assert) => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    assert.expect(1);
    return waitFor(() => {
      if (result.current !== false) {
        throw new Error("waiting for isMobile=false");
      }
      assert.strictEqual(result.current, false);
    });
  });

  test("returns true on mobile width", async (assert) => {
    setWindowWidth(375);
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => {
      if (result.current !== true) {
        throw new Error("waiting for mobile=true");
      }
    });
    assert.strictEqual(result.current, true);
  });

  test("updates from desktop to mobile on change event", async (assert) => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => {
      if (result.current !== false) {
        throw new Error("waiting for initial false");
      }
    });

    setWindowWidth(MOBILE_BREAKPOINT - 1);
    triggerMatchMediaChange();

    await waitFor(() => {
      if (result.current !== true) {
        throw new Error("waiting for toggle to true");
      }
    });
    assert.strictEqual(result.current, true);
  });

  test("updates from mobile to desktop on change event", async (assert) => {
    setWindowWidth(375);
    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      if (result.current !== true) {
        throw new Error("waiting for initial true");
      }
    });
    assert.strictEqual(result.current, true);

    setWindowWidth(MOBILE_BREAKPOINT);
    triggerMatchMediaChange();

    await waitFor(() => {
      if (result.current !== false) {
        throw new Error("waiting for toggle to false");
      }
    });
    assert.strictEqual(result.current, false);
  });
});
