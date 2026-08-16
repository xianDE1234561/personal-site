import { readSiteData } from "./_localAlbumStore.js";
import { sendJson } from "./_serverlessAuth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    sendJson(res, 200, await readSiteData());
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}
