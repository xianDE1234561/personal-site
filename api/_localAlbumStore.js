import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(moduleDir, "..");
const siteDataPath = path.join(projectRoot, "public", "site-data.json");
const uploadRoot = path.join(projectRoot, "public", "user-uploads");
const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);
const maxFileSize = 10 * 1024 * 1024;

export function getAllowedTypes() {
  return allowedTypes;
}

export function getMaxFileSize() {
  return maxFileSize;
}

export async function readSiteData() {
  const raw = (await fs.readFile(siteDataPath, "utf8")).replace(/^\uFEFF/, "");
  const data = JSON.parse(raw);
  return {
    albums: Array.isArray(data.albums) ? data.albums : [],
    tracks: Array.isArray(data.tracks) ? data.tracks : [],
  };
}

export async function writeSiteData(data) {
  await fs.writeFile(siteDataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function findAlbum(data, albumSlug) {
  return data.albums.find((album) => album.slug === albumSlug);
}

export function findAlbumIndex(data, albumSlug) {
  return data.albums.findIndex((album) => album.slug === albumSlug);
}

export function createAlbum(data, title) {
  const cleanTitle = sanitizeTitle(title);

  if (!cleanTitle) {
    throw new Error("Album title is required.");
  }

  const baseSlug = slugify(cleanTitle) || "album";
  const usedSlugs = new Set(data.albums.map((album) => album.slug));
  let slug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const album = {
    title: cleanTitle,
    slug,
    items: [],
  };

  data.albums.push(album);
  return album;
}

export function findItem(data, id) {
  for (const album of data.albums) {
    const index = album.items.findIndex((item) => item.id === id || item.src === id);

    if (index !== -1) {
      return { album, item: album.items[index], index };
    }
  }

  return null;
}

export async function saveUploadedFile({ albumSlug, fileName, contentType, buffer }) {
  if (!allowedTypes.has(contentType)) {
    throw new Error("Only JPG, PNG, WebP, and GIF files are allowed.");
  }

  if (buffer.length > maxFileSize) {
    throw new Error("Each file must be 10 MB or smaller.");
  }

  const extension = allowedTypes.get(contentType);
  const safeBaseName = path
    .basename(fileName || "upload", path.extname(fileName || "upload"))
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "upload";
  const id = `${albumSlug}-${Date.now()}-${cryptoRandomId()}`;
  const storedName = `${safeBaseName}-${id}${extension}`;
  const relativeDir = path.join("user-uploads", albumSlug);
  const targetDir = path.join(uploadRoot, albumSlug);
  const targetPath = path.join(targetDir, storedName);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, buffer);

  return {
    id,
    src: `/${relativeDir.replace(/\\/g, "/")}/${storedName}`,
    storage_path: `${relativeDir.replace(/\\/g, "/")}/${storedName}`,
    size: buffer.length,
  };
}

export async function deleteUploadedFile(item) {
  if (!item.storage_path || !item.storage_path.startsWith("user-uploads/")) {
    return;
  }

  const targetPath = path.resolve(projectRoot, "public", item.storage_path);
  const uploadRootResolved = path.resolve(uploadRoot);

  if (!isInsideDirectory(targetPath, uploadRootResolved)) {
    return;
  }

  await fs.unlink(targetPath).catch((error) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}

export async function deleteAlbumUploads(album) {
  const items = Array.isArray(album.items) ? album.items : [];

  for (const item of items) {
    await deleteUploadedFile(item);
  }

  const albumUploadDir = path.resolve(uploadRoot, album.slug);
  const uploadRootResolved = path.resolve(uploadRoot);

  if (!isInsideDirectory(albumUploadDir, uploadRootResolved)) {
    return;
  }

  await fs.rm(albumUploadDir, { recursive: true, force: true }).catch((error) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}

function cryptoRandomId() {
  return crypto.randomUUID().slice(0, 8);
}

function isInsideDirectory(targetPath, baseDir) {
  const relativePath = path.relative(baseDir, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function sanitizeTitle(value) {
  return String(value || "")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, 80);
}

function slugify(value) {
  const asciiSlug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (asciiSlug) {
    return asciiSlug.slice(0, 48);
  }

  return `album-${Date.now().toString(36)}`;
}
