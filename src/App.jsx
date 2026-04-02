import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import config from './data/config.json';

const petals = Array.from({ length: 10 }, (_, i) => i);

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [themeKey, setThemeKey] = useState(config.theme);
  const [themeColors, setThemeColors] = useState(config.themes[config.theme]);
  const [invitation, setInvitation] = useState(config.invitation);
  const [images, setImages] = useState(config.images);
  const [videos, setVideos] = useState(config.videos);
  const [newImage, setNewImage] = useState('');
  const [newVideo, setNewVideo] = useState('');
  const [countdown, setCountdown] = useState('');
  const audioRef = useRef(null);

  const theme = useMemo(
    () => ({ ...config.themes[themeKey], ...themeColors }),
    [themeKey, themeColors]
  );

  useEffect(() => {
    setThemeColors(config.themes[themeKey]);
  }, [themeKey]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const weddingDate = new Date(`${invitation.date}T18:30:00`);
    const timer = setInterval(() => {
      const diff = weddingDate.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('The wedding celebrations have started!');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setCountdown(`${days} days ${hrs} hrs ${mins} mins remaining`);
    }, 1000);

    return () => clearInterval(timer);
  }, [invitation.date]);

  const addImage = () => {
    if (!newImage.trim()) return;
    setImages((prev) => [...prev, newImage.trim()]);
    setNewImage('');
  };

  const addVideo = () => {
    if (!newVideo.trim()) return;
    setVideos((prev) => [...prev, newVideo.trim()]);
    setNewVideo('');
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      <audio ref={audioRef} src={config.music.url} loop autoPlay playsInline />

      <div className="pointer-events-none fixed inset-0 opacity-70" aria-hidden="true">
        {petals.map((id) => (
          <motion.span
            key={id}
            className="petal"
            initial={{ y: -120, x: `${id * 10}%` }}
            animate={{ y: '105vh', rotate: 360 }}
            transition={{ duration: 10 + id, repeat: Infinity, ease: 'linear', delay: id * 0.6 }}
          />
        ))}
      </div>

      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 z-30 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowIntro(false);
              setIsMuted(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 rounded-2xl border"
              style={{ borderColor: theme.secondary, backgroundColor: theme.cardBackground }}
            >
              <p className="uppercase tracking-[0.3em] text-xs">Save The Date</p>
              <h1 className="font-script text-6xl mt-3" style={{ color: theme.primary }}>
                {config.introText}
              </h1>
              <p className="mt-3 text-sm">Tap to open your invitation website</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <section className="rounded-2xl border p-5 md:p-6" style={{ backgroundColor: theme.cardBackground, borderColor: theme.secondary }}>
          <h2 className="font-display text-2xl mb-4" style={{ color: theme.primary }}>
            Control Panel
          </h2>
          <p className="text-sm mb-4">Edit names, venue, date, theme colors, and add picture/video URLs.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="field">Bride Name
              <input value={invitation.bride} onChange={(e) => setInvitation({ ...invitation, bride: e.target.value })} />
            </label>
            <label className="field">Groom Name
              <input value={invitation.groom} onChange={(e) => setInvitation({ ...invitation, groom: e.target.value })} />
            </label>
            <label className="field">Venue
              <input value={invitation.venue} onChange={(e) => setInvitation({ ...invitation, venue: e.target.value })} />
            </label>
            <label className="field">Date
              <input type="date" value={invitation.date} onChange={(e) => setInvitation({ ...invitation, date: e.target.value })} />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <label className="field">Theme Preset
              <select value={themeKey} onChange={(e) => setThemeKey(e.target.value)}>
                <option value="royalRed">Royal Red</option>
                <option value="roseGold">Rose Gold</option>
              </select>
            </label>
            <label className="field">Primary Color
              <input type="color" value={themeColors.primary} onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })} />
            </label>
            <label className="field">Secondary Color
              <input type="color" value={themeColors.secondary} onChange={(e) => setThemeColors({ ...themeColors, secondary: e.target.value })} />
            </label>
            <label className="field">Card Background
              <input type="color" value={themeColors.cardBackground} onChange={(e) => setThemeColors({ ...themeColors, cardBackground: e.target.value })} />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <label className="field">Add Picture URL
                <input value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="https://..." />
              </label>
              <button className="action-btn" type="button" onClick={addImage}>Add Picture</button>
            </div>
            <div className="space-y-2">
              <label className="field">Add Video URL
                <input value={newVideo} onChange={(e) => setNewVideo(e.target.value)} placeholder="https://...mp4" />
              </label>
              <button className="action-btn" type="button" onClick={addVideo}>Add Video</button>
            </div>
          </div>
        </section>

        <section className="invite-card rounded-3xl border-4 p-5 md:p-8" style={{ borderColor: theme.secondary, backgroundColor: theme.cardBackground }}>
          <div className="text-center space-y-3">
            <p className="uppercase tracking-[0.25em] text-xs" style={{ color: theme.primary }}>{invitation.familiesLine}</p>
            <h2 className="font-script text-6xl md:text-7xl" style={{ color: theme.primary }}>
              {invitation.bride} <span className="font-display text-3xl">&</span> {invitation.groom}
            </h2>
            <p className="text-lg">request the honor of your presence</p>
            <p className="text-xl" style={{ color: theme.primary }}>
              {new Date(invitation.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p>{invitation.time}</p>
            <p className="max-w-3xl mx-auto">{invitation.message}</p>
            <p className="font-semibold">{invitation.from}</p>
          </div>
        </section>

        <section className="rounded-2xl border p-5" style={{ borderColor: theme.secondary, backgroundColor: theme.cardBackground }}>
          <h3 className="font-display text-2xl mb-3" style={{ color: theme.primary }}>Event Details</h3>
          <p>{invitation.venue}</p>
          <a href={invitation.mapsUrl} target="_blank" rel="noreferrer" className="underline mt-2 inline-block" style={{ color: theme.primary }}>
            Open venue in Google Maps
          </a>
          <p className="mt-3 text-sm">{countdown}</p>
          <div className="mt-4">
            <button className="action-btn" type="button" onClick={() => setIsMuted((v) => !v)}>
              {isMuted ? 'Unmute Music' : 'Mute Music'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border p-5" style={{ borderColor: theme.secondary, backgroundColor: theme.cardBackground }}>
          <h3 className="font-display text-2xl mb-3" style={{ color: theme.primary }}>Photo Gallery</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((src) => (
              <div key={src} className="image-frame">
                <img src={src} alt="Wedding memory" className="w-full h-52 object-cover rounded-lg" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border p-5" style={{ borderColor: theme.secondary, backgroundColor: theme.cardBackground }}>
          <h3 className="font-display text-2xl mb-3" style={{ color: theme.primary }}>Video Clips</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {videos.map((src) => (
              <video key={src} controls className="w-full rounded-xl border" style={{ borderColor: theme.secondary }}>
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
