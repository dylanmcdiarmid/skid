import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import { renderToString } from 'react-dom/server';
import type { IndexGlobals } from '@/client/lib/globals';
import { HtmlBase } from './html';

const isDev = process.env.NODE_ENV === 'development';

const jsGlobals: IndexGlobals = {
  isDev,
};

const getSpaHtml = () => {
  const cacheBust = isDev ? `?t=${Date.now()}` : '';
  const cssBundle = isDev
    ? `/css/dev/bundle.css${cacheBust}`
    : '/css/bundle.css';
  const jsBundle = isDev ? `/js/dev/bundle.js${cacheBust}` : '/js/bundle.js';

  return `<!DOCTYPE html>${renderToString(
    <HtmlBase cssBundle={cssBundle} jsBundle={jsBundle} jsGlobals={jsGlobals} />
  )}`;
};

const app = new Elysia()
  .use(staticPlugin({ prefix: '/' }))
  .get('/', ({ set }) => {
    set.headers['Content-Type'] = 'text/html; charset=utf-8';
    return getSpaHtml();
  })
  .onError(({ code, set, path }) => {
    // Serve SPA for 404s on non-API routes
    if (code === 'NOT_FOUND' && !path.startsWith('/api')) {
      set.status = 200;
      set.headers['Content-Type'] = 'text/html; charset=utf-8';
      return getSpaHtml();
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
