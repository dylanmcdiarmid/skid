import { treaty } from '@elysiajs/eden';
import type { App } from '../../../src/api';

export const client = treaty<App>(
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
);

