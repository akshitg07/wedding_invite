import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import config from './data/config.json';

const STORAGE_KEY = 'wedding_invite_live_data_v2';
const petals = Array.from({ length: 10 }, (_, i) => i);

const getInitialData = () => {
  const fallback = {
    themeKey: config.theme,
    themeColors: config.themes[config.theme],
    invitation: config.invitation,
    images: config.images,
    videos: config.videos,
    sections: config.sections || [],
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  const isControlPlane = window.location.pathname.startsWith('/controlplane');
  const [showIntro, setShowIntro] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [data, setData] = useState(getInitialData);
  const [newImage, setNewImage] = useState('');
  const [newVideo, setNewVideo] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionBody, setNewSectionBody] = useState('');
  const [countdown, setCountdown] = useState('');
  const audioRef = useRef(null);

  const theme = useMemo(
    () => ({ ...config.themes[data.themeKey], ...data.themeColors }),
    [data.themeKey, data.themeColors]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const weddingDate = new Date(`${data.invitation.date}T18:30:00`);
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
  }, [data.invitation.date]);

  const updateInvitation = (key, value) => {
    setData((prev) => ({ ...prev, invitation: { ...prev.invitation, [key]: value } }));
  };

  const addImage = () => {
    if (!newImage.trim()) return;
    setData((prev) => ({ ...prev, images: [...prev.images, newImage.trim()] }));
    setNewImage('');
  };

  const addVideo = () => {
    if (!newVideo.trim()) return;
    setData((prev) => ({ ...prev, videos: [...prev.videos, newVideo.trim()] }));
    setNewVideo('');
  };

  const addSection = () => {
    if (!newSectionTitle.trim() || !newSectionBody.trim()) return;
    setData((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: newSectionTitle.trim(), body: newSectionBody.trim() }],
    }));
    setNewSectionTitle('');
    setNewSectionBody('');
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme.background, color: theme.text }}>
      <audio ref={audioRef} src={config.music.url} loop autoPlay playsInline />

      <div className="pointer-events-none fixed inset-0 opacity-60" aria-hidden="true">
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

      {!isControlPlane && (
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
      )}

      {isControlPlane ? (
        <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
          <section className="soft-panel p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-display text-2xl" style={{ color: theme.primary }}>Control Plane</h2>
              <a href="/" className="text-sm underline" style={{ color: theme.primary }}>Go to Invitation</a>
            </div>
            <p className="text-sm mt-2">This page controls all live invitation content on <code>/</code>.</p>
          </section>

          <section className="soft-panel p-6 space-y-4">
            <h3 className="font-display text-xl" style={{ color: theme.primary }}>Core Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="field">Bride Name<input value={data.invitation.bride} onChange={(e) => updateInvitation('bride', e.target.value)} /></label>
              <label className="field">Groom Name<input value={data.invitation.groom} onChange={(e) => updateInvitation('groom', e.target.value)} /></label>
              <label className="field">Venue<input value={data.invitation.venue} onChange={(e) => updateInvitation('venue', e.target.value)} /></label>
              <label className="field">Date<input type="date" value={data.invitation.date} onChange={(e) => updateInvitation('date', e.target.value)} /></label>
            </div>
          </section>

          <section className="soft-panel p-6 space-y-4">
            <h3 className="font-display text-xl" style={{ color: theme.primary }}>Theme</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="field">Theme Preset
                <select
                  value={data.themeKey}
                  onChange={(e) => setData((prev) => ({ ...prev, themeKey: e.target.value, themeColors: config.themes[e.target.value] }))}
                >
                  <option value="royalRed">Royal Red</option>
                  <option value="roseGold">Rose Gold</option>
                </select>
              </label>
              <label className="field">Primary Color<input type="color" value={data.themeColors.primary} onChange={(e) => setData((prev) => ({ ...prev, themeColors: { ...prev.themeColors, primary: e.target.value } }))} /></label>
              <label className="field">Secondary Color<input type="color" value={data.themeColors.secondary} onChange={(e) => setData((prev) => ({ ...prev, themeColors: { ...prev.themeColors, secondary: e.target.value } }))} /></label>
              <label className="field">Card Background<input type="color" value={data.themeColors.cardBackground} onChange={(e) => setData((prev) => ({ ...prev, themeColors: { ...prev.themeColors, cardBackground: e.target.value } }))} /></label>
            </div>
          </section>

          <section className="soft-panel p-6 space-y-4">
            <h3 className="font-display text-xl" style={{ color: theme.primary }}>Media</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="field">Add Picture URL<input value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="https://..." /></label>
                <button className="action-btn" type="button" onClick={addImage}>Add Picture</button>
              </div>
              <div className="space-y-2">
                <label className="field">Add Video URL<input value={newVideo} onChange={(e) => setNewVideo(e.target.value)} placeholder="https://...mp4" /></label>
                <button className="action-btn" type="button" onClick={addVideo}>Add Video</button>
              </div>
            </div>
          </section>

          <section className="soft-panel p-6 space-y-4">
            <h3 className="font-display text-xl" style={{ color: theme.primary }}>Custom Sections</h3>
            <label className="field">Section Title<input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} /></label>
            <label className="field">Section Content<textarea value={newSectionBody} onChange={(e) => setNewSectionBody(e.target.value)} rows={4} /></label>
            <button className="action-btn" type="button" onClick={addSection}>Add New Section</button>
          </section>
        </main>
      ) : (
        <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
          <section className="soft-panel p-6 text-center space-y-3">
            <div className="flex justify-end">
              <a href="/controlplane" className="text-sm underline" style={{ color: theme.primary }}>Open Control Plane</a>
            </div>
            <p className="uppercase tracking-[0.25em] text-xs" style={{ color: theme.primary }}>{data.invitation.familiesLine}</p>
            <h2 className="font-script text-6xl md:text-7xl" style={{ color: theme.primary }}>{data.invitation.bride} <span className="font-display text-3xl">&</span> {data.invitation.groom}</h2>
            <p className="text-lg">request the honor of your presence</p>
            <p className="text-xl" style={{ color: theme.primary }}>{new Date(data.invitation.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>{data.invitation.time}</p>
            <p className="max-w-3xl mx-auto">{data.invitation.message}</p>
            <p className="font-semibold">{data.invitation.from}</p>
          </section>

          <section className="soft-panel p-6">
            <h3 className="font-display text-2xl mb-3" style={{ color: theme.primary }}>Event Details</h3>
            <p>{data.invitation.venue}</p>
            <a href={data.invitation.mapsUrl} target="_blank" rel="noreferrer" className="underline mt-2 inline-block" style={{ color: theme.primary }}>Open venue in Google Maps</a>
            <p className="mt-3 text-sm">{countdown}</p>
            <button className="action-btn mt-3" type="button" onClick={() => setIsMuted((v) => !v)}>{isMuted ? 'Unmute Music' : 'Mute Music'}</button>
          </section>

          <section className="soft-panel p-6">
            <h3 className="font-display text-2xl mb-3" style={{ color: theme.primary }}>Photo Gallery</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.images.map((src) => <img key={src} src={src} alt="Wedding memory" className="w-full h-52 object-cover rounded-xl" />)}
            </div>
          </section>

          <section className="soft-panel p-6">
            <h3 className="font-display text-2xl mb-3" style={{ color: theme.primary }}>Video Clips</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {data.videos.map((src) => (
                <video key={src} controls className="w-full rounded-xl">
                  <source src={src} type="video/mp4" />
                </video>
              ))}
            </div>
          </section>

          {data.sections.map((section) => (
            <section key={`${section.title}-${section.body.slice(0, 20)}`} className="soft-panel p-6">
              <h3 className="font-display text-2xl mb-2" style={{ color: theme.primary }}>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </main>
      )}
    </div>
  );
}

export default App;
