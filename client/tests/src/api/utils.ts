export const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`http://localhost:3000${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const postForm = async <T>(path: string, body: FormData): Promise<T> => {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: "POST",
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
};
