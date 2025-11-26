/** biome-ignore-all lint/suspicious/noConsole: <console logging for debugging> */
import type { SSEMessage, TopicName, TopicPayloadMap } from "./types";

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const RECONNECT_MS = 4000;
let serverInstanceID: string | null = null;
let reloadDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const RELOAD_DEBOUNCE_MS = 200;

const subscriptions = new Set<TopicName>();
const topicHandlers = new Map<TopicName, Set<(data: unknown) => void>>();

function buildSSEUrl(topics: TopicName[]): string {
  const params = new URLSearchParams();
  for (const topic of topics) {
    params.append("topic", topic);
  }
  return `${window.location.protocol}//${window.location.host}/sse?${params.toString()}`;
}

function handleServerInstanceChange(newInstanceID: string) {
  if (serverInstanceID !== null && serverInstanceID !== newInstanceID) {
    if (reloadDebounceTimer) {
      clearTimeout(reloadDebounceTimer);
    }

    reloadDebounceTimer = setTimeout(() => {
      window.location.reload();
    }, RELOAD_DEBOUNCE_MS);
  }

  serverInstanceID = newInstanceID;
}

function handleMessage(ev: MessageEvent) {
  try {
    const parsed = parseJSON<SSEMessage>(ev.data);

    if (parsed.topic && topicHandlers.has(parsed.topic)) {
      const handlers = topicHandlers.get(parsed.topic);
      if (handlers) {
        for (const fn of handlers) {
          fn(parsed.data);
        }
      }
    }
  } catch {
    // suppressing errors
  }
}

function connect() {
  if (eventSource && eventSource.readyState === EventSource.OPEN) {
    return;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Don't connect if there are no subscriptions
  if (subscriptions.size === 0) {
    return;
  }

  try {
    const topics = Array.from(subscriptions);
    const url = buildSSEUrl(topics);
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      // no-op
    };

    eventSource.onmessage = handleMessage;

    eventSource.onerror = () => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        eventSource = null;
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      }
    };
  } catch {
    reconnectTimer = setTimeout(connect, RECONNECT_MS);
  }
}

function reconnect() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  connect();
}

export function init() {
  // Backend restart detection (Go server changes)
  onTopic("server_instance", (data) => {
    if (data.instance_id) {
      handleServerInstanceChange(data.instance_id);
    }
  });
  subscribe("server_instance");

  window.addEventListener("beforeunload", () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (eventSource) {
      eventSource.close();
    }
  });
}

export function subscribe<T extends TopicName>(topic: T) {
  const wasAlreadySubscribed = subscriptions.has(topic);
  subscriptions.add(topic);

  // Reconnect to update topic list
  if (!wasAlreadySubscribed) {
    reconnect();
  }
}

export function unsubscribe<T extends TopicName>(topic: T) {
  const wasSubscribed = subscriptions.has(topic);
  subscriptions.delete(topic);

  // Reconnect to update topic list
  if (wasSubscribed) {
    reconnect();
  }
}

export function onTopic<T extends TopicName>(
  topic: T,
  handler: (data: TopicPayloadMap[T]) => void
): () => void {
  if (!topicHandlers.has(topic)) {
    topicHandlers.set(topic, new Set());
  }
  const set = topicHandlers.get(topic);
  if (set) {
    set.add(handler as (data: unknown) => void);
  }
  return () => {
    const s = topicHandlers.get(topic);
    if (s) {
      s.delete(handler as (data: unknown) => void);
      if (s.size === 0) {
        topicHandlers.delete(topic);
      }
    }
  };
}

function parseJSON<T>(json: string): T {
  return JSON.parse(json) as T;
}
