import { atom } from "jotai";

export type AppNotification = {
  id: string;
  kind: "info" | "success" | "warning" | "error";
  message: string;
  createdAt: number;
};

export const notificationsAtom = atom<AppNotification[]>([]);

export const pushNotificationAtom = atom(
  null,
  (
    get,
    set,
    input: Omit<AppNotification, "id" | "createdAt"> & { id?: string }
  ) => {
    const id =
      input.id ?? `n_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const next: AppNotification = {
      id,
      kind: input.kind,
      message: input.message,
      createdAt: Date.now(),
    };
    const list = get(notificationsAtom);
    set(notificationsAtom, [next, ...list]);
  }
);

export const removeNotificationAtom = atom(null, (get, set, id: string) => {
  const list = get(notificationsAtom);
  set(
    notificationsAtom,
    list.filter((n) => n.id !== id)
  );
});
