import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import config from './data/config.json';

const STORAGE_KEY = 'wedding_invite_live_data_v3';

const getInitialData = () => {
  const fallback = {
    themeKey: config.theme,
    themeColors: config.themes[config.theme],
    invitation: config.invitation,
    sections: config.sections,
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
};

const tint = (hex, amount) => {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

function App() {
  const isControlPlane = window.location.pathname.startsWith('/controlplane');
  const [showIntro, setShowIntro] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [data, setData] = useState(getInitialData);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionBody, setNewSectionBody] = useState('');
  const [dragState, setDragState] = useState(null);
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

  const updateSection = (sectionId, key, value) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, [key]: value } : section)),
    }));
  };

  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    const newId = `section-${Date.now()}`;
    setData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: newId, title: newSectionTitle, body: newSectionBody, photos: [], videos: [] },
      ],
    }));
    setNewSectionTitle('');
    setNewSectionBody('');
  };

  const uploadMedia = async (sectionId, type, files) => {
    const valid = Array.from(files || []);
    const encoded = await Promise.all(
      valid.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    );

    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const key = type === 'photo' ? 'photos' : 'videos';
        return { ...section, [key]: [...section[key], ...encoded] };
      }),
    }));
  };

  const onDragStart = (sectionId, type, index) => {
    setDragState({ sectionId, type, index });
  };

  const onDropMedia = (sectionId, type, targetIndex) => {
    if (!dragState || dragState.sectionId !== sectionId || dragState.type !== type) return;
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const key = type === 'photo' ? 'photos' : 'videos';
        const arr = [...section[key]];
        const [moved] = arr.splice(dragState.index, 1);
        arr.splice(targetIndex, 0, moved);
        return { ...section, [key]: arr };
      }),
    }));
    setDragState(null);
  };

  return (
    <div style={{ color: theme.text }}>
      <audio ref={audioRef} src={config.music.url} loop autoPlay playsInline />

      {isControlPlane ? (
        <main className="control-bg min-h-screen px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="panel">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-display text-2xl" style={{ color: theme.primary }}>Control Plane</h2>
                <a href="/" className="underline" style={{ color: theme.primary }}>Go to Invitation</a>
              </div>
              <p className="text-sm mt-2">Edit all sections, upload media from your browser, and drag to rearrange media placement.</p>
            </div>

            <div className="panel grid md:grid-cols-2 gap-4">
              <label className="field">Bride Name<input value={data.invitation.bride} onChange={(e) => updateInvitation('bride', e.target.value)} /></label>
              <label className="field">Groom Name<input value={data.invitation.groom} onChange={(e) => updateInvitation('groom', e.target.value)} /></label>
              <label className="field">Venue<input value={data.invitation.venue} onChange={(e) => updateInvitation('venue', e.target.value)} /></label>
              <label className="field">Date<input type="date" value={data.invitation.date} onChange={(e) => updateInvitation('date', e.target.value)} /></label>
              <label className="field">Theme<select value={data.themeKey} onChange={(e) => setData((prev) => ({ ...prev, themeKey: e.target.value, themeColors: config.themes[e.target.value] }))}><option value="royalRed">Royal Red</option><option value="roseGold">Rose Gold</option></select></label>
              <label className="field">Primary Color<input type="color" value={data.themeColors.primary} onChange={(e) => setData((prev) => ({ ...prev, themeColors: { ...prev.themeColors, primary: e.target.value } }))} /></label>
            </div>

            <div className="panel space-y-4">
              <h3 className="font-display text-xl" style={{ color: theme.primary }}>Add New Section</h3>
              <label className="field">Section Title<input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} /></label>
              <label className="field">Section Body<textarea rows={3} value={newSectionBody} onChange={(e) => setNewSectionBody(e.target.value)} /></label>
              <button type="button" className="action-btn" onClick={addSection}>Add Section</button>
            </div>

            {data.sections.map((section) => (
              <div key={section.id} className="panel space-y-4">
                <h3 className="font-display text-xl" style={{ color: theme.primary }}>{section.title || 'Untitled Section'}</h3>
                <label className="field">Title<input value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} /></label>
                <label className="field">Body<textarea rows={3} value={section.body} onChange={(e) => updateSection(section.id, 'body', e.target.value)} /></label>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Upload Photos (browser upload)</p>
                    <input type="file" accept="image/*" multiple onChange={(e) => uploadMedia(section.id, 'photo', e.target.files)} />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {section.photos.map((src, index) => (
                        <img
                          key={`${src.slice(0, 20)}-${index}`}
                          src={src}
                          alt="Uploaded"
                          draggable
                          onDragStart={() => onDragStart(section.id, 'photo', index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDropMedia(section.id, 'photo', index)}
                          className="drag-item h-24 w-full object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Upload Videos (browser upload)</p>
                    <input type="file" accept="video/*" multiple onChange={(e) => uploadMedia(section.id, 'video', e.target.files)} />
                    <div className="grid grid-cols-1 gap-2">
                      {section.videos.map((src, index) => (
                        <video
                          key={`${src.slice(0, 20)}-${index}`}
                          controls
                          draggable
                          onDragStart={() => onDragStart(section.id, 'video', index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDropMedia(section.id, 'video', index)}
                          className="drag-item rounded-md"
                        >
                          <source src={src} type="video/mp4" />
                        </video>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main>
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
                  className="text-center p-8 rounded-2xl"
                  style={{ backgroundColor: tint(theme.cardBackground, 12) }}
                >
                  <h1 className="font-script text-6xl" style={{ color: theme.primary }}>{config.introText}</h1>
                  <p className="mt-2 text-sm">Tap to open invitation</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {data.sections.map((section, idx) => {
            const bg = tint(idx % 2 === 0 ? theme.primary : theme.secondary, idx % 3 === 0 ? 10 : -10);
            return (
              <section key={section.id} className="min-h-screen px-4 py-10 md:py-16" style={{ backgroundColor: bg }}>
                <div className="max-w-5xl mx-auto text-center text-white space-y-5">
                  {idx === 0 && (
                    <>
                      <div className="flex justify-end">
                        <a href="/controlplane" className="underline text-sm">Open Control Plane</a>
                      </div>
                      <p className="uppercase tracking-[0.2em] text-xs">{data.invitation.familiesLine}</p>
                      <h2 className="font-script text-6xl md:text-8xl">{data.invitation.bride} & {data.invitation.groom}</h2>
                      <p className="text-xl">{new Date(data.invitation.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>{data.invitation.time} • {data.invitation.venue}</p>
                      <p className="text-sm">{countdown}</p>
                      <button type="button" className="action-btn" onClick={() => setIsMuted((v) => !v)}>{isMuted ? 'Unmute Music' : 'Mute Music'}</button>
                    </>
                  )}

                  <h3 className="font-display text-4xl md:text-5xl">{section.title}</h3>
                  <p className="max-w-3xl mx-auto text-lg">{section.body}</p>

                  {section.photos.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {section.photos.map((src, i) => <img key={`${src.slice(0, 20)}-${i}`} src={src} alt="Wedding" className="w-full h-56 object-cover rounded-xl" />)}
                    </div>
                  )}

                  {section.videos.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                      {section.videos.map((src, i) => (
                        <video key={`${src.slice(0, 20)}-${i}`} controls className="w-full rounded-xl">
                          <source src={src} type="video/mp4" />
                        </video>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}

export default App;
