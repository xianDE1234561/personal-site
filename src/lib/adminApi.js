const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxFileSize = 10 * 1024 * 1024;

export function validateImageFile(file) {
  if (!allowedTypes.includes(file.type)) {
    return "Only JPG, PNG, WebP, and GIF files are allowed.";
  }

  if (file.size > maxFileSize) {
    return "Each file must be 10 MB or smaller.";
  }

  return "";
}

export async function uploadAlbumImage({ accessToken, albumSlug, title, file }) {
  const formData = new FormData();
  formData.append("albumSlug", albumSlug);
  formData.append("title", title || file.name.replace(/\.[^.]+$/, ""));
  formData.append("file", file);

  const response = await fetch("/api/admin-upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Upload failed with ${response.status}`);
  }

  return response.json();
}

export async function createAlbum({ accessToken, title }) {
  const response = await fetch("/api/admin-album", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Create album failed with ${response.status}`);
  }

  return response.json();
}

export async function deleteAlbum({ accessToken, slug }) {
  const response = await fetch("/api/admin-album", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ slug }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Delete album failed with ${response.status}`);
  }

  return response.json();
}

export async function updateAlbumItem({ accessToken, id, title }) {
  const response = await fetch("/api/admin-item", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, title }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Update failed with ${response.status}`);
  }

  return response.json();
}

export async function deleteAlbumItem({ accessToken, id }) {
  const response = await fetch("/api/admin-item", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Delete failed with ${response.status}`);
  }

  return response.json();
}
