import type { createStore } from "jotai";
import { notificationsAtom } from "@/state/notifications";

export type Store = ReturnType<typeof createStore>;

export function initializeState(store: Store) {
  store.set(notificationsAtom, []);
}
