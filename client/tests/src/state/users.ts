import { atom } from "jotai";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { mockUsers } from "@/data/mock-users";
import type { User } from "@/types/user";

// Cross-component shared cache of the current user id
export const currentUserIdAtom = atomWithStorage<string | null>(
  "currentUserId",
  null
);

// Cache of user list results (e.g., from list endpoint)
// TODO: dummy list should be replaced with real users list when necessary
export const usersListAtom = atom<User[]>(mockUsers);

// Per-user cached data (e.g., fetched user details)
export const userAtomFamily = atomFamily((id?: string | null) =>
  atom(
    (get) => (id ? get(usersListAtom).find((user) => user.id === id) : null),
    (get, set, user: User) => {
      const prev = get(usersListAtom);
      set(usersListAtom, [...prev, user]);
    }
  )
);
