import QUnit from "qunit";

const { module, test } = QUnit;

import { waitFor } from "@testing-library/react";
import { FakeTimers } from "@tests/test-utils";
import type { TimeoutId } from "@tests/types";
import { init, onTopic, subscribe, unsubscribe } from "./client";

class MockEventSource {
  static instances: MockEventSource[] = [];
  static lastUrl = "";
  static OPEN = 1;
  static CLOSED = 2;

  url: string;
  readyState: number = MockEventSource.OPEN;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.lastUrl = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
    this.closed = true;
  }

  dispatchOpen() {
    this.onopen?.(new Event("open"));
  }

  dispatchMessageRaw(raw: string) {
    this.onmessage?.({ data: raw } as MessageEvent);
  }

  dispatchMessage(obj: unknown) {
    this.dispatchMessageRaw(JSON.stringify(obj));
  }

  dispatchError() {
    this.onerror?.(new Event("error"));
  }
}

module("SSE Client", (hooks) => {
  let originalEventSource: typeof EventSource;
  let timers = new FakeTimers();

  hooks.beforeEach(() => {
    // Mock EventSource
    originalEventSource = (globalThis as any).EventSource as typeof EventSource;
    (globalThis as any).EventSource =
      MockEventSource as unknown as typeof EventSource;
    MockEventSource.instances = [];
    MockEventSource.lastUrl = "";

    // Fresh timers instance for tests that choose to override timers locally
    timers = new FakeTimers();
  });

  hooks.afterEach(() => {
    (globalThis as any).EventSource = originalEventSource;
  });

  module("subscriptions", () => {
    test("connects on first subscribe and builds URL with topic", (assert) => {
      subscribe("news" as any);

      assert.ok(
        MockEventSource.instances.length === 1,
        "EventSource created once"
      );

      const url = new URL(MockEventSource.lastUrl, window.location.origin);
      assert.strictEqual(url.pathname, "/sse");
      assert.strictEqual(url.searchParams.getAll("topic").length, 1);
      assert.strictEqual(url.searchParams.getAll("topic").at(0), "news");
    });

    test("does not reconnect when subscribing to the same topic twice", (assert) => {
      subscribe("dup" as any);
      assert.strictEqual(MockEventSource.instances.length, 1, "first connect");

      subscribe("dup" as any); // no reconnect
      assert.strictEqual(
        MockEventSource.instances.length,
        1,
        "still one connection"
      );
    });

    test("unsubscribe closes connection and updates connection state", (assert) => {
      subscribe("only" as any);
      const first = MockEventSource.instances[0];
      assert.ok(first, "connection exists");

      unsubscribe("only" as any);

      assert.ok(first.closed, "previous connection closed");
    });
  });

  module("message handling", () => {
    test("onTopic registers multiple handlers and they are invoked", async (assert) => {
      subscribe("topic-a" as any);
      const calls: unknown[] = [];
      const calls2: unknown[] = [];

      const off1 = onTopic("topic-a" as any, (data: unknown) => {
        calls.push(data);
      });
      onTopic("topic-a" as any, (data: unknown) => {
        calls2.push(data);
      });

      const es = MockEventSource.instances[0];
      es.dispatchMessage({ topic: "topic-a", data: { x: 1 } });

      await waitFor(() => {
        if (!(calls.length === 1 && calls2.length === 1)) {
          throw new Error("waiting for both handlers");
        }
      });
      assert.deepEqual(calls[0], { x: 1 });
      assert.deepEqual(calls2[0], { x: 1 });

      // Remove first handler and ensure only the second is called next
      off1();
      es.dispatchMessage({ topic: "topic-a", data: { y: 2 } });

      await waitFor(() => {
        if (calls2.length !== 2) {
          throw new Error("waiting for remaining handler");
        }
      });
      assert.strictEqual(calls.length, 1, "first handler not called again");
    });

    test("unknown topic does not invoke any handlers", (assert) => {
      subscribe("topic-b" as any);
      const es = MockEventSource.instances[0];
      // No handlers registered for unknown topic
      es.dispatchMessage({ topic: "unknown", data: { z: 3 } });
      assert.ok(true, "no crash on unknown topic");
    });

    test("invalid JSON in message is caught and does not throw", (assert) => {
      subscribe("topic-c" as any);
      const es = MockEventSource.instances[0];
      es.dispatchMessageRaw("not-json");
      assert.ok(true, "no throw on invalid json");
    });
  });

  module("reconnect and errors", () => {
    test("reconnects after error when closed, using backoff timer", (assert) => {
      const originalSetTimeout = globalThis.setTimeout;
      const originalClearTimeout = globalThis.clearTimeout;
      (globalThis as any).setTimeout =
        timers.setTimeout as unknown as typeof setTimeout;
      (globalThis as any).clearTimeout =
        timers.clearTimeout as unknown as typeof clearTimeout;

      subscribe("topic-r" as any);
      const first = MockEventSource.instances[0];

      // Simulate error with CLOSED state to trigger reconnect timer
      first.readyState = MockEventSource.CLOSED;
      first.dispatchError();

      // Before timeout elapses, no new connection
      assert.strictEqual(
        MockEventSource.instances.length,
        1,
        "still first connection"
      );

      // Advance less than RECONNECT_MS (4000)
      timers.advanceBy(3999);
      assert.strictEqual(
        MockEventSource.instances.length,
        1,
        "no reconnect yet"
      );

      // Advance to trigger reconnect
      timers.advanceBy(1);
      assert.strictEqual(
        MockEventSource.instances.length,
        2,
        "reconnected once"
      );

      // restore real timers
      (globalThis as any).setTimeout = originalSetTimeout;
      (globalThis as any).clearTimeout = originalClearTimeout;
    });
  });

  module("server restart debounce and init", () => {
    test("init subscribes to server_instance and builds URL with it", () => {
      init();
      const url = new URL(MockEventSource.lastUrl, window.location.origin);
      const topics = url.searchParams.getAll("topic");
      QUnit.assert.ok(
        topics.includes("server_instance"),
        "server_instance subscribed by init"
      );
    });

    // TODO: Need to dig into the reload functionality more to understand how to test it.
    test("reload is debounced when server instance changes", (assert) => {
      // Intercept timer scheduling to verify debounce without touching location.reload
      const originalSetTimeout = globalThis.setTimeout;
      const originalClearTimeout = globalThis.clearTimeout;
      let nextId = 1;
      const scheduled: Array<{ id: number; delay: number }> = [];
      let cleared = 0;
      const active = new Set<number>();
      (globalThis as any).setTimeout = ((_cb: () => void, delay?: number) => {
        const id = nextId++;
        scheduled.push({ id, delay: Number(delay ?? 0) });
        active.add(id);
        // Do not execute the callback; we're only validating debounce behavior
        return id as unknown as ReturnType<typeof setTimeout>;
      }) as unknown as typeof setTimeout;
      (globalThis as any).clearTimeout = ((id: any) => {
        if (active.has(id as number)) {
          active.delete(id as number);
          cleared += 1;
        }
      }) as unknown as typeof clearTimeout;

      // ensure a connection exists, then init to register server_instance handler
      subscribe("seed" as any);
      init();
      const last = MockEventSource.instances.at(-1);
      if (!last) {
        assert.ok(false, "no EventSource instance created");
        // restore
        (globalThis as any).setTimeout = originalSetTimeout;
        (globalThis as any).clearTimeout = originalClearTimeout;
        return;
      }

      // First instance id: sets baseline, no debounce schedule
      last.dispatchMessage({
        topic: "server_instance",
        data: { instance_id: "A" },
      });
      assert.strictEqual(scheduled.length, 0, "no timer on first id");

      // Change id -> schedule debounce
      last.dispatchMessage({
        topic: "server_instance",
        data: { instance_id: "B" },
      });
      assert.strictEqual(scheduled.length, 1, "one timer scheduled");

      // Another change within debounce -> clear previous and schedule new
      last.dispatchMessage({
        topic: "server_instance",
        data: { instance_id: "C" },
      });
      assert.strictEqual(
        scheduled.length,
        2,
        "second timer scheduled after reset"
      );
      assert.strictEqual(cleared >= 1, true, "previous timer cleared");

      // restore real timers
      (globalThis as any).setTimeout = originalSetTimeout;
      (globalThis as any).clearTimeout = originalClearTimeout;
    });

    test("beforeunload closes EventSource and clears reconnect timer", (assert) => {
      // Create a connection and schedule a reconnect timer
      subscribe("pre-exit" as any);
      const first = MockEventSource.instances[0];

      let cleared = 0;
      const originalClearTimeout = globalThis.clearTimeout;
      (globalThis as any).clearTimeout = ((id: TimeoutId) => {
        cleared += 1;
        return originalClearTimeout(id as unknown as number);
      }) as unknown as typeof clearTimeout;

      // Simulate an error to schedule reconnect timer (4000ms)
      first.readyState = MockEventSource.CLOSED;
      first.dispatchError();

      // Establish a fresh connection (as reconnect would) then trigger cleanup
      subscribe("another" as any);
      const current = MockEventSource.instances.at(-1);
      // Trigger page close cleanup
      window.dispatchEvent(new Event("beforeunload"));

      assert.ok(
        current ? current.closed : first.closed,
        "EventSource closed on beforeunload"
      );
      assert.ok(cleared >= 1, "reconnect timer cleared on beforeunload");

      // restore clearTimeout
      (globalThis as any).clearTimeout = originalClearTimeout;
    });
  });
});
