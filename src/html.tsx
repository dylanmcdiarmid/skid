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
