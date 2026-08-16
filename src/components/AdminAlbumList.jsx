import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteAlbum, deleteAlbumItem, updateAlbumItem } from "../lib/adminApi";

export function AdminAlbumList({ accessToken, albums, onChange }) {
  const [message, setMessage] = useState("");

  const handleRename = async (item) => {
    const title = window.prompt("Image title", item.title);

    if (!title || title === item.title) {
      return;
    }

    try {
      await updateAlbumItem({ accessToken, id: item.id, title });
      setMessage("Title updated.");
      await onChange();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.title}?`)) {
      return;
    }

    try {
      await deleteAlbumItem({ accessToken, id: item.id });
      setMessage("Deleted.");
      await onChange();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDeleteAlbum = async (album) => {
    const itemCount = Array.isArray(album.items) ? album.items.length : 0;

    if (!window.confirm(`Delete album "${album.title}" and remove ${itemCount} item(s) from the site?`)) {
      return;
    }

    if (window.prompt(`Type DELETE to confirm deleting "${album.title}".`) !== "DELETE") {
      return;
    }

    try {
      await deleteAlbum({ accessToken, slug: album.slug });
      setMessage(`Album "${album.title}" deleted.`);
      await onChange();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="admin-panel admin-gallery-admin">
      <div className="admin-panel__head">
        <h2>Album Items</h2>
        <p>Edit titles or remove uploaded images.</p>
      </div>

      {message && <p className="admin-status">{message}</p>}

      <div className="admin-albums">
        {albums.map((album) => (
          <section className="admin-album" key={album.slug}>
            <header>
              <div>
                <h3>{album.title}</h3>
                <span>{album.items.length}</span>
              </div>
              <button
                className="admin-album__delete"
                type="button"
                aria-label={`Delete album ${album.title}`}
                title="Delete album"
                onClick={() => handleDeleteAlbum(album)}
              >
                <Trash2 size={17} strokeWidth={1.8} />
              </button>
            </header>

            <div className="admin-items">
              {album.items.map((item) => (
                <article className="admin-item" key={item.id || item.src}>
                  <img src={item.src} alt={item.title} loading="lazy" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.storage_path || item.src}</span>
                  </div>
                  <button type="button" aria-label="Edit title" title="Edit title" onClick={() => handleRename(item)}>
                    <Pencil size={17} strokeWidth={1.8} />
                  </button>
                  <button type="button" aria-label="Delete image" title="Delete image" onClick={() => handleDelete(item)}>
                    <Trash2 size={17} strokeWidth={1.8} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
