import crypto from "node:crypto";

const tokenTtlMs = 12 * 60 * 60 * 1000;

function adminConfig() {
  return {
    username: process.env.ADMIN_USERNAME?.trim(),
    password: process.env.ADMIN_PASSWORD,
    secret: process.env.ADMIN_JWT_SECRET,
  };
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function timingSafeEqualText(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminToken(username) {
  const { secret } = adminConfig();

  if (!secret) {
    throw new Error("Admin authentication is not configured.");
  }

  const payload = base64url(
    JSON.stringify({
      sub: username,
      role: "admin",
      exp: Date.now() + tokenTtlMs,
    }),
  );
  const signature = sign(payload, secret);

  return `${payload}.${signature}`;
}

export function verifyAdminToken(token) {
  const { secret } = adminConfig();

  if (!secret || !token || !token.includes(".")) {
    return null;
  }

  const [payload, signature] = token.split(".");
  const expected = sign(payload, secret);

  if (!timingSafeEqualText(signature, expected)) {
    return null;
  }

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

  if (data.role !== "admin" || Date.now() > data.exp) {
    return null;
  }

  return data;
}

export function requireServerlessAdmin(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const session = verifyAdminToken(token);

  if (!session) {
    throw new Error("Invalid or expired admin token.");
  }

  return session;
}

export function checkAdminCredentials(username, password) {
  const config = adminConfig();

  if (!config.username || !config.password || !config.secret) {
    return false;
  }

  return (
    timingSafeEqualText(username, config.username) && timingSafeEqualText(password, config.password)
  );
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}
