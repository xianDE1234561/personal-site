import { createAlbum, deleteAlbumUploads, findAlbumIndex, readSiteData, writeSiteData } from "./_localAlbumStore.js";
import { readJson, requireServerlessAdmin, sendJson } from "./_serverlessAuth.js";

export default async function handler(req, res) {
  if (!["POST", "DELETE"].includes(req.method)) {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    requireServerlessAdmin(req);

    const body = await readJson(req);
    const data = await readSiteData();

    if (req.method === "DELETE") {
      const slug = String(body.slug || "").trim();

      if (!slug) {
        sendJson(res, 400, { error: "slug is required." });
        return;
      }

      const albumIndex = findAlbumIndex(data, slug);

      if (albumIndex === -1) {
        sendJson(res, 404, { error: "Album not found." });
        return;
      }

      const [album] = data.albums.splice(albumIndex, 1);
      await writeSiteData(data);
      await deleteAlbumUploads(album);
      sendJson(res, 200, { ok: true, album });
      return;
    }

    const album = createAlbum(data, body.title);

    await writeSiteData(data);
    sendJson(res, 200, { album });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}
