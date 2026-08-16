import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import adminAuth from "../api/admin-auth.js";
import adminAlbum from "../api/admin-album.js";
import adminItem from "../api/admin-item.js";
import adminUpload from "../api/admin-upload.js";
import siteData from "../api/site-data.js";

loadLocalEnv();

const routes = new Map([
  ["GET /api/site-data", siteData],
  ["POST /api/admin-auth", adminAuth],
  ["POST /api/admin-album", adminAlbum],
  ["DELETE /api/admin-album", adminAlbum],
  ["POST /api/admin-upload", adminUpload],
  ["PATCH /api/admin-item", adminItem],
  ["DELETE /api/admin-item", adminItem],
]);

export function localApiMiddleware() {
  return async (req, res, next) => {
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    const handler = routes.get(`${req.method} ${pathname}`);

    if (!handler) {
      next();
      return;
    }

    try {
      await handler(req, res);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: error.message }));
    }
  };
}

function loadLocalEnv() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(moduleDir, "..", ".env.local");

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
