// has a corresponding type in server.go
export interface IndexGlobals {
  isDev: boolean;
}

export function indexGlobals(): IndexGlobals | undefined {
  const ret = (window as unknown as { __globals?: IndexGlobals }).__globals;
  if (ret && ret.isDev === undefined) {
    ret.isDev = true;
  }
  return ret;
}
