import { requireServerlessAdmin, sendJson } from "./_serverlessAuth.js";
import { findAlbum, readSiteData, saveUploadedFile, writeSiteData } from "./_localAlbumStore.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    requireServerlessAdmin(req);

    const formData = await requestToFormData(req);
    const albumSlug = sanitizeSlug(formData.get("albumSlug"));
    const title = sanitizeTitle(formData.get("title"));
    const file = formData.get("file");

    if (!albumSlug || !file || typeof file.arrayBuffer !== "function") {
      sendJson(res, 400, { error: "albumSlug and file are required." });
      return;
    }

    const data = await readSiteData();
    const album = findAlbum(data, albumSlug);

    if (!album) {
      sendJson(res, 404, { error: "Album does not exist." });
      return;
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedFile({
      albumSlug,
      fileName: file.name,
      contentType: file.type,
      buffer: bytes,
    });
    const item = {
      id: saved.id,
      type: "image",
      title: title || sanitizeTitle(file.name.replace(/\.[^.]+$/, "")) || "Uploaded image",
      src: saved.src,
      size: saved.size,
      storage_path: saved.storage_path,
    };

    album.items = Array.isArray(album.items) ? album.items : [];
    album.items.unshift(item);
    await writeSiteData(data);

    sendJson(res, 200, { item });
  } catch (error) {
    sendJson(res, 401, { error: error.message });
  }
}

async function requestToFormData(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || "localhost";
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const request = new Request(`${protocol}://${host}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: Buffer.concat(chunks),
    duplex: "half",
  });

  return request.formData();
}

function sanitizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeTitle(value) {
  return String(value || "")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, 120);
}
