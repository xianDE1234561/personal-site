import { FolderPlus } from "lucide-react";
import { useState } from "react";
import { createAlbum } from "../lib/adminApi";

export function AdminCreateAlbumPanel({ accessToken, onCreated }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setStatus("Enter an album name.");
      return;
    }

    setBusy(true);
    setStatus("Creating...");

    try {
      const result = await createAlbum({ accessToken, title });
      setTitle("");
      setStatus(`Created ${result.album.title}.`);
      await onCreated(result.album);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-panel" onSubmit={handleCreate}>
      <div className="admin-panel__head">
        <h2>Create Album</h2>
        <p>Add a new album before uploading images.</p>
      </div>

      <label>
        <span>Album name</span>
        <input
          value={title}
          maxLength={80}
          autoComplete="off"
          placeholder="New album"
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <button className="admin-primary" type="submit" disabled={busy || !title.trim()}>
        <FolderPlus size={18} strokeWidth={1.8} />
        <span>{busy ? "Creating" : "Create"}</span>
      </button>

      {status && <p className="admin-status">{status}</p>}
    </form>
  );
}
