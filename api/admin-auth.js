import { checkAdminCredentials, createAdminToken, readJson, sendJson } from "./_serverlessAuth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const { username, password } = await readJson(req);

    if (!checkAdminCredentials(username, password)) {
      sendJson(res, 401, { error: "Invalid username or password." });
      return;
    }

    sendJson(res, 200, {
      token: createAdminToken(username),
      user: {
        username,
      },
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}
