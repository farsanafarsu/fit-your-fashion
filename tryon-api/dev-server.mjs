// Local stand-in for Vercel: `npm run dev` serves POST http://localhost:3001/api/tryon-token.
// Reads tryon-api/.env (never committed). Vercel itself doesn't use this file.
import http from "node:http";
import fs from "node:fs";

if (fs.existsSync(new URL("./.env", import.meta.url))) {
  for (const line of fs.readFileSync(new URL("./.env", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const { default: handler } = await import("./api/tryon-token.js"); // after .env, so it sees the values

const PORT = Number(process.env.PORT || 3001);
http.createServer((req, res) => {
  if (req.url.split("?")[0] !== "/api/tryon-token") { res.statusCode = 404; return res.end(); }
  handler(req, res).catch((e) => { console.error(e); res.statusCode = 500; res.end(); });
}).listen(PORT, () => console.log(`tryon-token dev server on http://localhost:${PORT}/api/tryon-token`));
