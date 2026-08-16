import { requireServerlessAdmin, readJson, sendJson } from "./_serverlessAuth.js";
import { deleteUploadedFile, findItem, readSiteData, writeSiteData } from "./_localAlbumStore.js";

export default async function handler(req, res) {
  if (!["PATCH", "DELETE"].includes(req.method)) {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    requireServerlessAdmin(req);
    const body = await readJson(req);
    const id = String(body.id || "");

    if (!id) {
      sendJson(res, 400, { error: "id is required." });
      return;
    }

    const data = await readSiteData();
    const match = findItem(data, id);

    if (!match) {
      sendJson(res, 404, { error: "Album item not found." });
      return;
    }

    if (req.method === "PATCH") {
      const title = String(body.title || "")
        .trim()
        .replace(/[<>]/g, "")
        .slice(0, 120);

      if (!title) {
        sendJson(res, 400, { error: "title is required." });
        return;
      }

      match.item.title = title;
      await writeSiteData(data);
      sendJson(res, 200, { item: match.item });
      return;
    }

    match.album.items.splice(match.index, 1);
    await writeSiteData(data);
    await deleteUploadedFile(match.item);

    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 401, { error: error.message });
  }
}
