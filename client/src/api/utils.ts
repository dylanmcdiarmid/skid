import { faker } from '@faker-js/faker';

export const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`http://localhost:3000${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const postForm = async <T>(path: string, body: FormData): Promise<T> => {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: 'POST',
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
};

export const generateRandomDate = (start: Date, end: Date): Date => {
  return faker.date.between({ from: start, to: end });
};

export const createDateStepGenerator = (
  start: Date,
  end: Date,
  count: number
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const step = (endTime - startTime) / count;
  let currentStep = 0;

  return {
    next: (): Date => {
      if (currentStep >= count) {
        return end;
      }
      const stepStart = startTime + currentStep * step;
      const stepEnd = startTime + (currentStep + 1) * step;

      // Generate random time within this step's window
      const randomTime = faker.date.between({
        from: new Date(stepStart),
        to: new Date(Math.min(stepEnd, endTime)),
      });

      currentStep++;
      return randomTime;
    },
  };
};
