// has a corresponding type in server.go
export interface IndexGlobals {
  isSupervisor: boolean;
  isLoggedIn: boolean;
  userEmail: string;
  simulationEnabled: boolean;
  isDev: boolean;
}

export function indexGlobals(): IndexGlobals | undefined {
  const ret = (window as unknown as { __globals?: IndexGlobals }).__globals;
  if (ret && ret.isDev === undefined) {
    ret.isDev = true;
  }
  return ret;
}
