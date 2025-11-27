/** biome-ignore-all lint/style/noHeadElement: server */
/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: server side */
interface HtmlBaseProps {
  cssBundle: string;
  children?: React.ReactNode;
  jsGlobals?: unknown;
  jsBundle?: string;
}

export function HtmlBase({
  cssBundle,
  children,
  jsGlobals,
  jsBundle,
}: HtmlBaseProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>Skid</title>
        <link href={cssBundle} rel="stylesheet" />
        <link
          href="/assets/favicon-96x96.png"
          rel="icon"
          sizes="96x96"
          type="image/png"
        />
        <link href="/assets/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/assets/favicon.ico" rel="shortcut icon" />
        <link
          href="/assets/apple-touch-icon.png"
          rel="apple-touch-icon"
          sizes="180x180"
        />
        <meta content="Skid" name="apple-mobile-web-app-title" />
        <link href="/assets/site.webmanifest" rel="manifest" />
      </head>
      <body>
        <div id="root">{children}</div>
        {jsGlobals ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__globals = ${JSON.stringify(jsGlobals)}`,
            }}
          />
        ) : null}
        {jsBundle ? <script src={jsBundle} /> : null}
      </body>
    </html>
  );
}
