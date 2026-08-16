import { Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { uploadAlbumImage, validateImageFile } from "../lib/adminApi";

export function AdminUploadPanel({ accessToken, albums, selectedAlbumSlug, onAlbumSelect, onComplete }) {
  const [albumSlug, setAlbumSlug] = useState(selectedAlbumSlug || albums[0]?.slug || "");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedAlbum = useMemo(() => albums.find((album) => album.slug === albumSlug), [albums, albumSlug]);

  useEffect(() => {
    if (selectedAlbumSlug && selectedAlbumSlug !== albumSlug) {
      setAlbumSlug(selectedAlbumSlug);
      return;
    }

    if ((!albumSlug || !albums.some((album) => album.slug === albumSlug)) && albums[0]?.slug) {
      setAlbumSlug(albums[0].slug);
      onAlbumSelect?.(albums[0].slug);
    }
  }, [albumSlug, albums, selectedAlbumSlug, onAlbumSelect]);

  const handleFiles = (fileList) => {
    const nextFiles = Array.from(fileList || []);
    const error = nextFiles.map(validateImageFile).find(Boolean);

    if (error) {
      setStatus(error);
      setFiles([]);
      return;
    }

    setFiles(nextFiles);
    setStatus(nextFiles.length ? `${nextFiles.length} file(s) ready.` : "");
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!albumSlug || files.length === 0) {
      setStatus("Choose an album and at least one image.");
      return;
    }

    setBusy(true);
    setStatus("Uploading...");

    try {
      for (const file of files) {
        await uploadAlbumImage({
          accessToken,
          albumSlug,
          title: file.name.replace(/\.[^.]+$/, ""),
          file,
        });
      }

      setFiles([]);
      setStatus(`Uploaded to ${selectedAlbum?.title || albumSlug}.`);
      await onComplete();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-panel" onSubmit={handleUpload}>
      <div className="admin-panel__head">
        <h2>Upload</h2>
        <p>Add images without rebuilding the static site.</p>
      </div>

      <label>
        <span>Album</span>
        <select
          value={albumSlug}
          onChange={(event) => {
            setAlbumSlug(event.target.value);
            onAlbumSelect?.(event.target.value);
          }}
        >
          {albums.map((album) => (
            <option key={album.slug} value={album.slug}>
              {album.title}
            </option>
          ))}
        </select>
      </label>

      <label className="admin-drop">
        <Upload size={22} strokeWidth={1.8} />
        <span>{files.length ? `${files.length} selected` : "Choose images"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(event) => handleFiles(event.target.files)}
        />
      </label>

      <button className="admin-primary" type="submit" disabled={busy || !albumSlug || files.length === 0}>
        {busy ? "Uploading" : "Upload"}
      </button>

      {status && <p className="admin-status">{status}</p>}
    </form>
  );
}
