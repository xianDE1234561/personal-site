import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import adminAlbum from "./api/admin-album.js";
import adminAuth from "./api/admin-auth.js";
import adminItem from "./api/admin-item.js";
import adminUpload from "./api/admin-upload.js";
import siteData from "./api/site-data.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");
const port = Number(process.env.PORT || 3000);

loadEnvFile(".env");
loadEnvFile(".env.local");

const apiRoutes = new Map([
  ["GET /api/site-data", siteData],
  ["POST /api/admin-auth", adminAuth],
  ["POST /api/admin-album", adminAlbum],
  ["DELETE /api/admin-album", adminAlbum],
  ["POST /api/admin-upload", adminUpload],
  ["PATCH /api/admin-item", adminItem],
  ["DELETE /api/admin-item", adminItem],
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const apiHandler = apiRoutes.get(`${req.method} ${url.pathname}`);

    if (apiHandler) {
      await apiHandler(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendText(res, 405, "Method not allowed");
      return;
    }

    const served =
      (await serveStaticFile(req, res, publicDir, url.pathname)) ||
      (await serveStaticFile(req, res, distDir, url.pathname)) ||
      (await serveIndex(req, res));

    if (!served) {
      sendText(res, 404, "Not found");
    }
  } catch (error) {
    console.error(error);
    sendText(res, 500, "Internal server error");
  }
});

server.listen(port, () => {
  console.log(`SONG site listening on http://127.0.0.1:${port}`);
});

async function serveStaticFile(req, res, baseDir, pathname) {
  const filePath = resolveSafeFile(baseDir, pathname);

  if (!filePath) {
    return false;
  }

  const stat = await fsp.stat(filePath).catch(() => null);

  if (!stat?.isFile()) {
    return false;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", getContentType(filePath));
  res.setHeader("Content-Length", stat.size);

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  fs.createReadStream(filePath).pipe(res);
  return true;
}

async function serveIndex(req, res) {
  const indexPath = path.join(distDir, "index.html");
  const stat = await fsp.stat(indexPath).catch(() => null);

  if (!stat?.isFile()) {
    return false;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Length", stat.size);

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  fs.createReadStream(indexPath).pipe(res);
  return true;
}

function resolveSafeFile(baseDir, pathname) {
  const decodedPathname = decodeURIComponent(pathname);
  const normalized = decodedPathname === "/" ? "/index.html" : decodedPathname;
  const targetPath = path.resolve(baseDir, `.${normalized}`);
  const safeBaseDir = path.resolve(baseDir);

  if (!targetPath.startsWith(safeBaseDir)) {
    return "";
  }

  return targetPath;
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };

  return types[extension] || "application/octet-stream";
}

function sendText(res, status, message) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(message);
}

function loadEnvFile(name) {
  const envPath = path.join(rootDir, name);

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}
