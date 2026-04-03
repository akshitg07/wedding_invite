import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import config from './data/config.json';

const STORAGE_KEY = 'wedding_invite_live_data_v4';
const CONTROL_PANEL_PASSWORD = 'disha&akshit@2106';
const CONTROL_UNLOCK_KEY = 'wedding_invite_control_unlocked';
const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 40;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

const compressImageFile = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 2400;
        const ratio = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const tint = (hex, amount) => {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

const normalizeSections = (sections) =>
  sections.map((section, idx) => {
    if (section.media) {
      return {
        ...section,
        sectionColor: section.sectionColor || tint(config.themes[config.theme].primary, idx * 8),
        titleColor: section.titleColor || '#ffffff',
        bodyColor: section.bodyColor || '#fff5e9',
        animationUrl: section.animationUrl || '',
        animationDim: section.animationDim ?? 45,
        backgroundImageUrl: section.backgroundImageUrl || '',
        transition: section.transition || 'fadeUp',
        media: (section.media || []).map((item) => ({
          ...item,
          shadow: item.shadow ?? false,
          fontFamily: item.fontFamily || 'Playfair Display',
        })),
      };
    }

    const photos = (section.photos || []).map((src, photoIdx) => ({
      id: `${section.id}-photo-${photoIdx}`,
      type: 'photo',
      src,
      x: 8 + (photoIdx % 3) * 30,
      y: 28 + Math.floor(photoIdx / 3) * 24,
      w: 24,
      h: 20,
    }));

    const videos = (section.videos || []).map((src, videoIdx) => ({
      id: `${section.id}-video-${videoIdx}`,
      type: 'video',
      src,
      x: 8 + (videoIdx % 2) * 45,
      y: 54,
      w: 38,
      h: 26,
    }));

    return {
      ...section,
      sectionColor: section.sectionColor || tint(config.themes[config.theme].primary, idx * 8),
      titleColor: section.titleColor || '#ffffff',
      bodyColor: section.bodyColor || '#fff5e9',
      animationUrl: section.animationUrl || '',
      animationDim: section.animationDim ?? 45,
      backgroundImageUrl: section.backgroundImageUrl || '',
      transition: section.transition || 'fadeUp',
      media: [...photos, ...videos].map((item) => ({
        ...item,
        shadow: false,
        fontFamily: 'Playfair Display',
      })),
    };
  });

const transitionMap = {
  fadeUp: {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 60 },
    whileInView: { opacity: 1, x: 0 },
  },
  zoomIn: {
    initial: { opacity: 0, scale: 0.92 },
    whileInView: { opacity: 1, scale: 1 },
  },
  rotateIn: {
    initial: { opacity: 0, rotate: -3, scale: 0.96 },
    whileInView: { opacity: 1, rotate: 0, scale: 1 },
  },
};

const getInitialData = () => {
  const fallback = {
    themeKey: config.theme,
    themeColors: config.themes[config.theme],
    invitation: config.invitation,
    sections: normalizeSections(config.sections),
    musicUrl: config.music?.url || '',
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return { ...fallback, ...parsed, sections: normalizeSections(parsed.sections || fallback.sections) };
  } catch {
    return fallback;
  }
};

function App() {
  const isControlPlane = window.location.pathname.startsWith('/controlplane');
  const [showIntro, setShowIntro] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [data, setData] = useState(getInitialData);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionBody, setNewSectionBody] = useState('');
  const [textDrafts, setTextDrafts] = useState({});
  const [dragMedia, setDragMedia] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [notice, setNotice] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [controlPassword, setControlPassword] = useState('');
  const [controlUnlocked, setControlUnlocked] = useState(
    () => sessionStorage.getItem(CONTROL_UNLOCK_KEY) === 'true'
  );
  const audioRef = useRef(null);

  const theme = useMemo(
    () => ({ ...config.themes[data.themeKey], ...data.themeColors }),
    [data.themeKey, data.themeColors]
  );

  useEffect(() => {
    const current = JSON.stringify(data);
    setIsDirty(Boolean(savedSnapshot) && savedSnapshot !== current);
  }, [data, savedSnapshot]);

  useEffect(() => {
    const bootstrapState = async () => {
      try {
        const res = await fetch('/api/state');
        if (!res.ok) throw new Error('Unable to fetch server state');
        const payload = await res.json();
        if (payload?.state) {
          const merged = {
            ...getInitialData(),
            ...payload.state,
            sections: normalizeSections(payload.state.sections || getInitialData().sections),
          };
          setData(merged);
          setSavedSnapshot(JSON.stringify(merged));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return;
        }
      } catch {
        setNotice('Server state not reachable. Using local browser data.');
      }

      const local = localStorage.getItem(STORAGE_KEY);
      if (local) setSavedSnapshot(local);
    };

    bootstrapState();
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
    if (!isMuted) {
      const playPromise = audioRef.current.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => setNotice('Autoplay blocked. Click "Play Music" to start audio.'));
      }
    }
  }, [isMuted]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    if (!isMuted) {
      const playPromise = audioRef.current.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => setNotice('Music source updated but playback was blocked. Click "Play Music".'));
      }
    }
  }, [data.musicUrl]);

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

  const updateMedia = (sectionId, mediaId, key, value) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          media: section.media.map((item) => (item.id === mediaId ? { ...item, [key]: value } : item)),
        };
      }),
    }));
  };

  const removeMedia = (sectionId, mediaId) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return { ...section, media: section.media.filter((item) => item.id !== mediaId) };
      }),
    }));
  };

  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    setData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `section-${Date.now()}`,
          title: newSectionTitle,
          body: newSectionBody,
          sectionColor: tint(prev.themeColors.primary, prev.sections.length * 10),
          titleColor: '#ffffff',
          bodyColor: '#fff5e9',
          animationUrl: '',
          animationDim: 45,
          backgroundImageUrl: '',
          transition: 'fadeUp',
          media: [],
        },
      ],
    }));
    setNewSectionTitle('');
    setNewSectionBody('');
  };

  const addCanvasText = (sectionId) => {
    const text = (textDrafts[sectionId] || '').trim();
    if (!text) return;
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          media: [
            ...section.media,
            {
              id: `${sectionId}-text-${Date.now()}`,
              type: 'text',
              text,
              color: '#ffffff',
              shadow: false,
              fontFamily: 'Playfair Display',
              fontSize: 28,
              x: 24,
              y: 36,
              w: 40,
              h: 18,
            },
          ],
        };
      }),
    }));
    setTextDrafts((prev) => ({ ...prev, [sectionId]: '' }));
  };

  const uploadMedia = async (sectionId, type, files) => {
    const list = Array.from(files || []);
    const allowTypes = type === 'photo' ? IMAGE_TYPES : VIDEO_TYPES;
    const maxMb = type === 'photo' ? MAX_IMAGE_MB : MAX_VIDEO_MB;

    const valid = list.filter((file) => {
      const okType = allowTypes.includes(file.type);
      const okSize = file.size <= maxMb * 1024 * 1024;
      return okType && okSize;
    });

    if (valid.length !== list.length) {
      setNotice(`Some ${type} files were skipped (allowed types + max ${maxMb}MB).`);
    } else {
      setNotice('');
    }

    const encoded =
      type === 'photo'
        ? await Promise.all(valid.map((file) => compressImageFile(file)))
        : await Promise.all(
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
        const next = encoded.map((src, idx) => ({
          id: `${sectionId}-${type}-${Date.now()}-${idx}`,
          type,
          src,
          shadow: false,
          fontFamily: 'Playfair Display',
          x: 8 + (idx % 3) * 26,
          y: type === 'photo' ? 28 : 58,
          w: type === 'photo' ? 24 : 38,
          h: type === 'photo' ? 20 : 26,
        }));
        return { ...section, media: [...section.media, ...next] };
      }),
    }));
  };

  const uploadMusic = (files) => {
    const file = Array.from(files || [])[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setNotice('Please upload a valid audio file for music.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setData((prev) => ({ ...prev, musicUrl: reader.result }));
      setNotice('');
      setIsMuted(false);
    };
    reader.readAsDataURL(file);
  };

  const uploadSectionBackground = async (sectionId, files) => {
    const file = Array.from(files || [])[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setNotice('Background image must be JPG/PNG/WEBP.');
      return;
    }
    const src = await compressImageFile(file);
    updateSection(sectionId, 'backgroundImageUrl', src);
  };

  const startMusic = () => {
    setIsMuted(false);
    if (!audioRef.current) return;
    audioRef.current.muted = false;
    audioRef.current.volume = 1;
    const playPromise = audioRef.current.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => setNotice('Unable to autoplay. Please click Play Music again.'));
    }
  };

  const saveData = () => {
    const persist = async () => {
      const snapshot = JSON.stringify(data);
      try {
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: snapshot,
        });
        if (!res.ok) throw new Error('Failed to persist on server');
        localStorage.setItem(STORAGE_KEY, snapshot);
        setSavedSnapshot(snapshot);
        setNotice('Saved to server. Everyone using this link sees latest pushed changes.');
      } catch {
        try {
          localStorage.setItem(STORAGE_KEY, snapshot);
          setSavedSnapshot(snapshot);
          setNotice('Server save failed. Saved locally in this browser only.');
        } catch {
          setNotice('Save failed: browser storage limit reached. Remove some large media and try again.');
        }
      }
    };
    persist();
  };

  const dropOnCanvas = (e, sectionId) => {
    e.preventDefault();
    if (!dragMedia || dragMedia.sectionId !== sectionId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateMedia(sectionId, dragMedia.mediaId, 'x', Math.max(0, Math.min(90, Number(x.toFixed(2)))));
    updateMedia(sectionId, dragMedia.mediaId, 'y', Math.max(0, Math.min(90, Number(y.toFixed(2)))));
    setDragMedia(null);
  };

  return (
    <div style={{ color: theme.text }}>
      <audio
        ref={audioRef}
        src={data.musicUrl || config.music.url}
        loop
        autoPlay
        playsInline
        preload="auto"
        onError={() => setNotice('Music failed to load. Check the music URL or uploaded file.')}
      />

      {isControlPlane ? (
        !controlUnlocked ? (
          <main className="control-bg min-h-screen flex items-center justify-center px-4">
            <div className="panel w-full max-w-md space-y-4">
              <h2 className="font-display text-2xl" style={{ color: theme.primary }}>Control Plane Locked</h2>
              <p className="text-sm">Enter password to access control panel.</p>
              <input
                type="password"
                value={controlPassword}
                onChange={(e) => setControlPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Enter password"
              />
              <button
                type="button"
                className="action-btn"
                onClick={() => {
                  if (controlPassword === CONTROL_PANEL_PASSWORD) {
                    sessionStorage.setItem(CONTROL_UNLOCK_KEY, 'true');
                    setControlUnlocked(true);
                    setNotice('');
                    return;
                  }
                  setNotice('Incorrect password for control plane.');
                }}
              >
                Unlock
              </button>
              {notice && <p className="text-sm text-red-700">{notice}</p>}
            </div>
          </main>
        ) : (
        <main className="control-bg min-h-screen px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="panel">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-display text-2xl" style={{ color: theme.primary }}>Control Plane</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => {
                      sessionStorage.removeItem(CONTROL_UNLOCK_KEY);
                      setControlUnlocked(false);
                    }}
                  >
                    Lock
                  </button>
                  <button type="button" className="action-btn" onClick={saveData}>
                    {isDirty ? 'Save Changes' : 'Saved'}
                  </button>
                  <a href="/" className="underline" style={{ color: theme.primary }}>Go to Invitation</a>
                </div>
              </div>
              <p className="text-sm mt-2">Set section colors, upload media from browser, drag and place items in canvas, and resize with sliders.</p>
              {notice && <p className="mt-2 text-sm text-red-700">{notice}</p>}
            </div>

            <div className="panel grid md:grid-cols-2 gap-4">
              <label className="field">Bride Name<input value={data.invitation.bride} onChange={(e) => updateInvitation('bride', e.target.value)} /></label>
              <label className="field">Groom Name<input value={data.invitation.groom} onChange={(e) => updateInvitation('groom', e.target.value)} /></label>
              <label className="field">Venue<input value={data.invitation.venue} onChange={(e) => updateInvitation('venue', e.target.value)} /></label>
              <label className="field">Date<input type="date" value={data.invitation.date} onChange={(e) => updateInvitation('date', e.target.value)} /></label>
              <label className="field">Theme<select value={data.themeKey} onChange={(e) => setData((prev) => ({ ...prev, themeKey: e.target.value, themeColors: config.themes[e.target.value] }))}><option value="royalRed">Royal Red</option><option value="roseGold">Rose Gold</option></select></label>
              <label className="field">Primary Color<input type="color" value={data.themeColors.primary} onChange={(e) => setData((prev) => ({ ...prev, themeColors: { ...prev.themeColors, primary: e.target.value } }))} /></label>
            </div>

            <div className="panel grid md:grid-cols-2 gap-4">
              <label className="field">Music URL
                <input
                  value={data.musicUrl || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, musicUrl: e.target.value }))}
                  placeholder="https://...mp3"
                />
              </label>
              <div className="field">
                <span>Upload Music (browser file)</span>
                <input type="file" accept="audio/*" onChange={(e) => uploadMusic(e.target.files)} />
              </div>
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
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="field">Title<input value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} /></label>
                  <label className="field">Section Color<input type="color" value={section.sectionColor} onChange={(e) => updateSection(section.id, 'sectionColor', e.target.value)} /></label>
                  <label className="field">Title Font Color<input type="color" value={section.titleColor || '#ffffff'} onChange={(e) => updateSection(section.id, 'titleColor', e.target.value)} /></label>
                  <label className="field">Body Font Color<input type="color" value={section.bodyColor || '#fff5e9'} onChange={(e) => updateSection(section.id, 'bodyColor', e.target.value)} /></label>
                  <label className="field">Transition
                    <select value={section.transition || 'fadeUp'} onChange={(e) => updateSection(section.id, 'transition', e.target.value)}>
                      <option value="fadeUp">Fade Up</option>
                      <option value="slideLeft">Slide Left</option>
                      <option value="zoomIn">Zoom In</option>
                      <option value="rotateIn">Rotate In</option>
                    </select>
                  </label>
                  <label className="field">Internet Animation URL<input value={section.animationUrl || ''} onChange={(e) => updateSection(section.id, 'animationUrl', e.target.value)} placeholder="https://...gif / mp4 / embed url" /></label>
                  <label className="field">Background Dimness ({section.animationDim ?? 45}%)
                    <input type="range" min="0" max="90" value={section.animationDim ?? 45} onChange={(e) => updateSection(section.id, 'animationDim', Number(e.target.value))} />
                  </label>
                  <label className="field">Section Background Image URL
                    <input value={section.backgroundImageUrl || ''} onChange={(e) => updateSection(section.id, 'backgroundImageUrl', e.target.value)} placeholder="https://...jpg / png / webp" />
                  </label>
                  <div className="field">
                    <span>Upload Section Background</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadSectionBackground(section.id, e.target.files)} />
                  </div>
                </div>
                <label className="field">Body<textarea rows={3} value={section.body} onChange={(e) => updateSection(section.id, 'body', e.target.value)} /></label>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold">Upload Photos</p>
                    <p className="text-xs opacity-70">JPG/PNG/WEBP, up to {MAX_IMAGE_MB}MB each.</p>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => uploadMedia(section.id, 'photo', e.target.files)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Upload Videos</p>
                    <p className="text-xs opacity-70">MP4/WEBM/OGG, up to {MAX_VIDEO_MB}MB each.</p>
                    <input type="file" accept="video/mp4,video/webm,video/ogg" multiple onChange={(e) => uploadMedia(section.id, 'video', e.target.files)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Add Text in Media Area</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border px-3 py-2 text-sm"
                      placeholder="Write text to place in canvas"
                      value={textDrafts[section.id] || ''}
                      onChange={(e) => setTextDrafts((prev) => ({ ...prev, [section.id]: e.target.value }))}
                    />
                    <button type="button" className="action-btn" onClick={() => addCanvasText(section.id)}>Add Text</button>
                  </div>
                </div>

                <div className="canvas" onDragOver={(e) => e.preventDefault()} onDrop={(e) => dropOnCanvas(e, section.id)}>
                  {section.media.map((item) => (
                    <div
                      key={item.id}
                      className="absolute media-item"
                      draggable
                      onDragStart={() => setDragMedia({ sectionId: section.id, mediaId: item.id })}
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        width: `${item.w}%`,
                        height: `${item.h}%`,
                      }}
                    >
                      {item.type === 'photo' ? (
                        <img src={item.src} alt="Uploaded" className={`w-full h-full object-contain rounded-md ${item.shadow ? 'shadow-lg' : ''}`} />
                      ) : item.type === 'video' ? (
                        <video controls className={`w-full h-full rounded-md ${item.shadow ? 'shadow-lg' : ''}`}><source src={item.src} type="video/mp4" /></video>
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-center px-2 rounded-md"
                          style={{ color: item.color || '#ffffff', fontSize: `${item.fontSize || 24}px`, fontFamily: item.fontFamily || 'Playfair Display' }}
                        >
                          {item.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {section.media.map((item) => (
                    <div key={`${item.id}-controls`} className="media-controls">
                      <p className="text-xs font-semibold">{item.type.toUpperCase()} ({item.id})</p>
                      <div className="grid md:grid-cols-4 gap-2">
                        <label className="field">X %<input type="range" min="0" max="90" value={item.x} onChange={(e) => updateMedia(section.id, item.id, 'x', Number(e.target.value))} /></label>
                        <label className="field">Y %<input type="range" min="0" max="90" value={item.y} onChange={(e) => updateMedia(section.id, item.id, 'y', Number(e.target.value))} /></label>
                        <label className="field">Width %<input type="range" min="10" max="80" value={item.w} onChange={(e) => updateMedia(section.id, item.id, 'w', Number(e.target.value))} /></label>
                        <label className="field">Height %<input type="range" min="10" max="70" value={item.h} onChange={(e) => updateMedia(section.id, item.id, 'h', Number(e.target.value))} /></label>
                        <label className="field">Shadow
                          <input type="checkbox" checked={Boolean(item.shadow)} onChange={(e) => updateMedia(section.id, item.id, 'shadow', e.target.checked)} />
                        </label>
                        {item.type === 'text' && (
                          <>
                            <label className="field">Text<input value={item.text} onChange={(e) => updateMedia(section.id, item.id, 'text', e.target.value)} /></label>
                            <label className="field">Text Color<input type="color" value={item.color || '#ffffff'} onChange={(e) => updateMedia(section.id, item.id, 'color', e.target.value)} /></label>
                            <label className="field">Font Size<input type="range" min="14" max="72" value={item.fontSize || 24} onChange={(e) => updateMedia(section.id, item.id, 'fontSize', Number(e.target.value))} /></label>
                            <label className="field">Font
                              <select value={item.fontFamily || 'Playfair Display'} onChange={(e) => updateMedia(section.id, item.id, 'fontFamily', e.target.value)}>
                                <option value="Playfair Display">Playfair Display</option>
                                <option value="Great Vibes">Great Vibes</option>
                                <option value="serif">Serif</option>
                                <option value="sans-serif">Sans Serif</option>
                              </select>
                            </label>
                          </>
                        )}
                      </div>
                      {item.type === 'photo' && (
                        <button
                          type="button"
                          className="mt-2 rounded-md bg-red-700 px-3 py-1 text-xs font-semibold text-white"
                          onClick={() => removeMedia(section.id, item.id)}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
        )
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
                  startMusic();
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

          {data.sections.map((section, idx) => (
            <motion.section
              key={section.id}
              className="min-h-screen px-4 py-10 md:py-16"
              style={{ backgroundColor: section.sectionColor || tint(theme.primary, idx * 8) }}
              initial={transitionMap[section.transition || 'fadeUp'].initial}
              whileInView={transitionMap[section.transition || 'fadeUp'].whileInView}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
            >
              <div className="max-w-5xl mx-auto text-center text-white space-y-5 relative">
                {section.backgroundImageUrl && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden z-0 pointer-events-none">
                    <img src={section.backgroundImageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black" style={{ opacity: (section.animationDim ?? 45) / 100 }} />
                  </div>
                )}
                {!section.backgroundImageUrl && section.animationUrl && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden z-0 pointer-events-none">
                    {section.animationUrl.match(/\.(gif|webp|png|jpg|jpeg)$/i) ? (
                      <img src={section.animationUrl} alt="" className="w-full h-full object-cover" />
                    ) : section.animationUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={section.animationUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <iframe title={`animation-bg-${section.id}`} src={section.animationUrl} className="w-full h-full border-0" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-black" style={{ opacity: (section.animationDim ?? 45) / 100 }} />
                  </div>
                )}
                <div className="relative z-10 space-y-5">
                {idx === 0 && (
                  <>
                    <p className="uppercase tracking-[0.2em] text-xs">{data.invitation.familiesLine}</p>
                    <h2 className="font-script text-6xl md:text-8xl">{data.invitation.bride} & {data.invitation.groom}</h2>
                    <p className="text-xl">{new Date(data.invitation.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p>{data.invitation.time} • {data.invitation.venue}</p>
                    <p className="text-sm">{countdown}</p>
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" className="action-btn" onClick={() => (isMuted ? startMusic() : setIsMuted(true))}>{isMuted ? 'Unmute Music' : 'Mute Music'}</button>
                      <button type="button" className="action-btn" onClick={startMusic}>Play Music</button>
                    </div>
                  </>
                )}
                <h3 className="font-display text-4xl md:text-5xl" style={{ color: section.titleColor || '#ffffff' }}>{section.title}</h3>
                <p className="max-w-3xl mx-auto text-lg" style={{ color: section.bodyColor || '#fff5e9' }}>{section.body}</p>

                <div className="stage-output">
                  {section.media.map((item) => (
                    <div
                      key={item.id}
                      className="absolute"
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        width: `${item.w}%`,
                        height: `${item.h}%`,
                      }}
                    >
                      {item.type === 'photo' ? (
                        <img src={item.src} alt="Wedding" className={`w-full h-full object-contain rounded-xl ${item.shadow ? 'shadow-lg' : ''}`} />
                      ) : item.type === 'video' ? (
                        <video controls className={`w-full h-full rounded-xl ${item.shadow ? 'shadow-lg' : ''}`}><source src={item.src} type="video/mp4" /></video>
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-center px-3 rounded-xl ${item.shadow ? 'shadow-lg' : ''}`}
                          style={{ color: item.color || '#ffffff', fontSize: `${item.fontSize || 24}px`, fontFamily: item.fontFamily || 'Playfair Display' }}
                        >
                          {item.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </motion.section>
          ))}
        </main>
      )}
    </div>
  );
}

export default App;
