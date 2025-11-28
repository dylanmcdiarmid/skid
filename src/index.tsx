import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import { renderToString } from 'react-dom/server';
import type { IndexGlobals } from '@/client/lib/globals';
import { api } from './api';
import { HtmlBase } from './html';

const isDev = process.env.NODE_ENV === 'development';

const jsGlobals: IndexGlobals = {
  isDev,
};

const getSpaHtml = () => {
  const cacheBust = isDev ? `?t=${Date.now()}` : '';
  const cssBundle = isDev
    ? `/assets/css/dev/bundle.css${cacheBust}`
    : '/assets/css/bundle.css';
  const jsBundle = isDev
    ? `/assets/js/dev/bundle.js${cacheBust}`
    : '/assets/js/bundle.js';

  return `<!DOCTYPE html>${renderToString(
    <HtmlBase cssBundle={cssBundle} jsBundle={jsBundle} jsGlobals={jsGlobals} />
  )}`;
};

const app = new Elysia()
  .use(staticPlugin({ prefix: '/assets' }))
  .use(api)
  .get('/', ({ set }) => {
    set.headers['Content-Type'] = 'text/html; charset=utf-8';
    return getSpaHtml();
  })
  .get('/*', ({ set, path }) => {
    // Only serve SPA for non-asset routes
    if (!path.startsWith('/assets')) {
      set.headers['Content-Type'] = 'text/html; charset=utf-8';
      return getSpaHtml();
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
