import { useEffect, useRef, useState } from "react";
import { ExternalLink, Image as ImageIcon, Mail, Play, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { fetchSiteData } from "./lib/albumsApi";
import { Admin } from "./pages/Admin";

const fallbackTracks = [
  {
    title: "Let Go",
    src: "/Let-Go.mp3",
  },
  {
    title: "Star Crossing Night",
    src: "/Star-Crossing-Night.mp3",
  },
];

const fallbackAlbums = [];

const links = [
  {
    label: "Steam",
    href: "https://steamcommunity.com/profiles/76561199732762490/",
    Icon: ExternalLink,
  },
  {
    label: "Bilibili",
    href: "https://space.bilibili.com/3493124909304438?spm_id_from=333.337.0.0",
    Icon: Play,
  },
  {
    label: "Email",
    href: "mailto:forxiande@outlook.com",
    Icon: Mail,
  },
];

const contacts = [
  {
    label: "WeChat",
    value: "xian61123",
  },
  {
    label: "QQ",
    value: "3989267150",
  },
  {
    label: "Email",
    value: "forxiande@outlook.com",
    href: "mailto:forxiande@outlook.com",
  },
];

const slides = Array.from({ length: 8 }, (_, index) => ({
  src: `/slides/slide-${String(index + 1).padStart(2, "0")}.jpg`,
  title: `Photo ${index + 1}`,
}));

function Home() {
  const audioRef = useRef(null);
  const wheelLockedRef = useRef(false);
  const [albums, setAlbums] = useState(fallbackAlbums);
  const [tracks, setTracks] = useState(fallbackTracks);
  const [soundOn, setSoundOn] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [activeAlbumIndex, setActiveAlbumIndex] = useState(0);
  const currentTrack = tracks[trackIndex] || fallbackTracks[0];
  const currentSlide = slides[slideIndex];
  const activeAlbum = albums[activeAlbumIndex] || albums[0];

  useEffect(() => {
    fetchSiteData()
      .then((data) => {
        if (Array.isArray(data.albums)) {
          setAlbums(data.albums);
        }
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          setTracks(data.tracks);
          setTrackIndex(0);
        }
      })
      .catch(() => {
        setAlbums(fallbackAlbums);
        setTracks(fallbackTracks);
      });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !soundOn) {
      return;
    }

    audio.currentTime = 0;
    audio.volume = 0.7;
    audio.play().catch(() => setSoundOn(false));
  }, [trackIndex, soundOn]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSlideIndex((index) => (index + 1) % slides.length);
    }, 10000);

    return () => window.clearInterval(timerId);
  }, []);

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (soundOn) {
      audio.pause();
      setSoundOn(false);
      return;
    }

    audio.volume = 0.7;
    audio.play().then(() => setSoundOn(true)).catch(() => setSoundOn(false));
  };

  const switchTrack = () => {
    setTrackIndex((index) => (index + 1) % tracks.length);
  };

  const switchSlide = (direction = 1) => {
    setSlideIndex((index) => (index + direction + slides.length) % slides.length);
  };

  const handleWheel = (event) => {
    if (albumOpen || Math.abs(event.deltaY) < 24 || wheelLockedRef.current) {
      return;
    }

    wheelLockedRef.current = true;
    switchSlide(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLockedRef.current = false;
    }, 650);
  };

  return (
    <main className="landing" onWheel={handleWheel}>
      <img className="landing__bg" src={currentSlide.src} alt="" aria-hidden="true" />
      <audio ref={audioRef} src={currentTrack.src} loop preload="auto" />
      <div className="landing__shade" />

      <button className="album-launcher" type="button" onClick={() => setAlbumOpen(true)}>
        <ImageIcon size={19} strokeWidth={1.8} />
        <span>相册</span>
      </button>

      <div className="landing__music" aria-label="Background music controls">
        <button className="landing__sound" type="button" onClick={toggleSound} aria-pressed={soundOn}>
          {soundOn ? <Volume2 size={19} strokeWidth={1.8} /> : <VolumeX size={19} strokeWidth={1.8} />}
          <span>{soundOn ? "关闭音乐" : "开启音乐"}</span>
        </button>
        <button className="landing__switch" type="button" onClick={switchTrack} aria-label="切换歌曲" title="切换歌曲">
          <SkipForward size={19} strokeWidth={1.8} />
        </button>
        <span className="landing__track">{currentTrack.title}</span>
      </div>

      <section className="landing__gallery" aria-label="Photo slideshow">
        <img src={currentSlide.src} alt={currentSlide.title} />
        <div className="landing__counter">
          {slideIndex + 1}/{slides.length}
        </div>
      </section>

      <section className="landing__info" aria-label="SONG contact information">
        <h1>SONG</h1>
        <div className="landing__contacts">
          {contacts.map(({ label, value, href }) =>
            href ? (
              <a key={label} href={href}>
                <span>{label}</span>
                <strong>{value}</strong>
              </a>
            ) : (
              <p key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </p>
            ),
          )}
        </div>
        <div className="landing__links" aria-label="social links">
          {links.map(({ label, href, Icon }) => (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </section>

      {albumOpen && (
        <aside className="album-panel" aria-label="Album browser">
          <div className="album-panel__header">
            <div>
              <p>Albums</p>
              <h2>相册</h2>
            </div>
            <button type="button" onClick={() => setAlbumOpen(false)} aria-label="关闭相册">
              <X size={19} strokeWidth={1.8} />
            </button>
          </div>

          <div className="album-tabs" aria-label="Album folders">
            {albums.map((album, index) => (
              <button
                key={album.slug}
                className={index === activeAlbumIndex ? "is-active" : ""}
                type="button"
                onClick={() => setActiveAlbumIndex(index)}
              >
                <span>{album.title}</span>
                <strong>{album.items.length}</strong>
              </button>
            ))}
          </div>

          {activeAlbum ? (
            <div className="album-grid">
              {activeAlbum.items.map((item) => (
                <figure className="album-card" key={item.src}>
                  {item.type === "video" ? (
                    <>
                      <video src={item.src} preload="metadata" controls playsInline />
                      <span className="album-card__type">Video</span>
                    </>
                  ) : (
                    <img src={item.src} alt={item.title} loading="lazy" />
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <div className="album-empty">暂无相册内容</div>
          )}
        </aside>
      )}
    </main>
  );
}

export function App() {
  return window.location.pathname === "/admin" ? <Admin /> : <Home />;
}
