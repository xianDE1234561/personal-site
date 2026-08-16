import { LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminCreateAlbumPanel } from "../components/AdminCreateAlbumPanel";
import { AdminAlbumList } from "../components/AdminAlbumList";
import { AdminUploadPanel } from "../components/AdminUploadPanel";
import { fetchSiteData } from "../lib/albumsApi";
import { clearStoredAdminSession, getStoredAdminSession, signInAdmin } from "../lib/serverlessAuth";

export function Admin() {
  const [session, setSession] = useState(getStoredAdminSession);
  const [albums, setAlbums] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedAlbumSlug, setSelectedAlbumSlug] = useState("");

  const accessToken = session?.token;

  const loadAlbums = useCallback(async (preferredAlbumSlug = "") => {
    if (!accessToken) {
      return;
    }

    setBusy(true);
    try {
      const data = await fetchSiteData();
      const nextAlbums = data.albums || [];
      setAlbums(nextAlbums);
      setSelectedAlbumSlug((currentSlug) => {
        if (preferredAlbumSlug && nextAlbums.some((album) => album.slug === preferredAlbumSlug)) {
          return preferredAlbumSlug;
        }

        if (currentSlug && nextAlbums.some((album) => album.slug === currentSlug)) {
          return currentSlug;
        }

        return nextAlbums[0]?.slug || "";
      });
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    loadAlbums();
  }, [accessToken, loadAlbums]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const nextSession = await signInAdmin(username, password);
      setSession(nextSession);
      setPassword("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    clearStoredAdminSession();
    setSession(null);
    setAlbums([]);
    setSelectedAlbumSlug("");
  };

  const handleAlbumCreated = async (album) => {
    setSelectedAlbumSlug(album.slug);
    await loadAlbums(album.slug);
  };

  if (!session) {
    return (
      <main className="admin-page">
        <form className="admin-login" onSubmit={handleLogin}>
          <h1>Admin</h1>
          <label>
            <span>Username</span>
            <input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="admin-primary" type="submit" disabled={busy}>
            {busy ? "Signing in" : "Sign in"}
          </button>
          {message && <p className="admin-status">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p>Album Console</p>
          <h1>Admin</h1>
          {session?.user?.username && <span>{session.user.username}</span>}
        </div>
        <nav>
          <a href="/">Site</a>
          <button type="button" onClick={() => loadAlbums()} disabled={busy} aria-label="Refresh albums" title="Refresh albums">
            <RefreshCw size={18} strokeWidth={1.8} />
          </button>
          <button type="button" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
            <LogOut size={18} strokeWidth={1.8} />
          </button>
        </nav>
      </header>

      <div className="admin-layout">
        <div className="admin-side">
          <AdminCreateAlbumPanel accessToken={accessToken} onCreated={handleAlbumCreated} />
          <AdminUploadPanel
            accessToken={accessToken}
            albums={albums}
            selectedAlbumSlug={selectedAlbumSlug}
            onAlbumSelect={setSelectedAlbumSlug}
            onComplete={loadAlbums}
          />
        </div>
        <AdminAlbumList accessToken={accessToken} albums={albums} onChange={loadAlbums} />
      </div>
    </main>
  );
}
