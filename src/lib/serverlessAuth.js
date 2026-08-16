const authStorageKey = "song_admin_serverless_session";

export function getStoredAdminSession() {
  try {
    const raw = window.localStorage.getItem(authStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredAdminSession() {
  window.localStorage.removeItem(authStorageKey);
}

export async function signInAdmin(username, password) {
  const response = await fetch("/api/admin-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Login failed.");
  }

  const session = await response.json();
  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
  return session;
}
