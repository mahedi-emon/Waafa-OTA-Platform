// HTTP/2 over TLS in front of `next start` for Lighthouse runs (issue 236). Production serves every page and asset
// through nginx with HTTP/2 (deploy/nginx/site-https.conf.template); Lighthouse models HTTP/1.1 with six
// connections per host, so measuring plain http://localhost would queue requests the live site never queues.
//   node scripts/h2-proxy.mjs <listen port> <target port> <cert.pem> <key.pem>
import { readFileSync } from "node:fs";
import http from "node:http";
import http2 from "node:http2";

const [listen = "3443", target = "3200", cert, key] = process.argv.slice(2);
const HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-connection",
  "http2-settings",
]);

const server = http2.createSecureServer({
  cert: readFileSync(cert),
  key: readFileSync(key),
  allowHTTP1: true,
});
server.on("request", (request, response) => {
  const headers = {};
  for (const [name, value] of Object.entries(request.headers)) {
    if (name.startsWith(":") || HOP.has(name)) continue;
    headers[name] = value;
  }
  headers.host = `localhost:${target}`;
  headers["x-forwarded-proto"] = "https";
  const upstream = http.request(
    { host: "127.0.0.1", port: Number(target), method: request.method, path: request.url, headers },
    (reply) => {
      const out = {};
      for (const [name, value] of Object.entries(reply.headers))
        if (!HOP.has(name)) out[name] = value;
      response.writeHead(reply.statusCode ?? 502, out);
      reply.pipe(response);
    },
  );
  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502);
    response.end();
  });
  request.pipe(upstream);
});
server.listen(Number(listen), () =>
  process.stdout.write(`HTTP/2 proxy on https://localhost:${listen} → :${target}\n`),
);
