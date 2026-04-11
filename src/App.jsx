import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import config from './data/config.json';

const STORAGE_KEY = 'wedding_invite_live_data_v4';
const CONTROL_PANEL_PASSWORD = 'disha&akshit@2106';
const CONTROL_UNLOCK_KEY = 'wedding_invite_control_unlocked';
const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 40;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
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

const readAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

const isImageBackground = (url = '') =>
  /\.(gif|webp|png|jpg|jpeg)$/i.test(url) || /^data:image\//i.test(url);

const isVideoBackground = (url = '') =>
  /\.(mp4|webm|ogg)$/i.test(url) || /^data:video\//i.test(url);

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
        contentPosition: section.contentPosition || 'center',
        transition: section.transition || 'fadeUp',
        titleSize: section.titleSize ?? 52,
        bodySize: section.bodySize ?? 22,
        media: (section.media || []).map((item) => ({
          ...item,
          shadow: item.shadow ?? false,
          videoRoundness: item.videoRoundness ?? 0,
          fontFamily: item.fontFamily || 'Playfair Display',
          transitionType: item.transitionType || 'fade',
          transitionDuration: item.transitionDuration ?? 0.8,
          muted: item.type === 'video' ? item.muted ?? true : item.muted,
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
      muted: true,
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
      contentPosition: section.contentPosition || 'center',
      transition: section.transition || 'fadeUp',
      titleSize: section.titleSize ?? 52,
      bodySize: section.bodySize ?? 22,
      media: [...photos, ...videos].map((item) => ({
        ...item,
        shadow: false,
        videoRoundness: 0,
        fontFamily: 'Playfair Display',
        transitionType: 'fade',
        transitionDuration: 0.8,
        muted: item.type === 'video' ? true : item.muted,
      })),
    };
  });

const mediaTransitionMap = {
  none: { initial: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, animate: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideUp: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } },
  zoomIn: { initial: { opacity: 0, scale: 0.82 }, animate: { opacity: 1, scale: 1 } },
  rotateIn: { initial: { opacity: 0, rotate: -8, scale: 0.9 }, animate: { opacity: 1, rotate: 0, scale: 1 } },
};

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

const normalizeInvitation = (invitation = {}) => {
  const fallbackPosition = invitation.heroPosition || 'center';
  return {
    ...config.invitation,
    ...invitation,
    titleLinePosition: invitation.titleLinePosition || fallbackPosition,
    familiesLinePosition: invitation.familiesLinePosition || fallbackPosition,
    namesPosition: invitation.namesPosition || fallbackPosition,
    datePosition: invitation.datePosition || fallbackPosition,
    venuePosition: invitation.venuePosition || fallbackPosition,
    countdownPosition: invitation.countdownPosition || fallbackPosition,
    titleLineSize: invitation.titleLineSize ?? 12,
    familiesLineSize: invitation.familiesLineSize ?? 12,
    namesSize: invitation.namesSize ?? 84,
    dateSize: invitation.dateSize ?? 24,
    venueSize: invitation.venueSize ?? 16,
    countdownSize: invitation.countdownSize ?? 14,
  };
};

const getInitialData = () => {
  const fallback = {
    themeKey: config.theme,
    themeColors: config.themes[config.theme],
    invitation: normalizeInvitation(config.invitation),
    sections: normalizeSections(config.sections),
    musicUrl: config.music?.url || '',
    musicName: config.music?.name || 'Default Music',
    presets: [],
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return {
      ...fallback,
      ...parsed,
      invitation: normalizeInvitation(parsed.invitation || fallback.invitation),
      sections: normalizeSections(parsed.sections || fallback.sections),
    };
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
  const [musicUploadProgress, setMusicUploadProgress] = useState(0);
  const [presetName, setPresetName] = useState('');
  const [videoUiMute, setVideoUiMute] = useState({});
  const [sectionBgRatio, setSectionBgRatio] = useState({});
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
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // Server state is primary; local cache may exceed quota for large media.
          }
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

  const moveSection = (sectionId, direction) => {
    setData((prev) => {
      const currentIndex = prev.sections.findIndex((section) => section.id === sectionId);
      if (currentIndex < 0) return prev;
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.sections.length) return prev;
      const reordered = [...prev.sections];
      const [picked] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, picked);
      return { ...prev, sections: reordered };
    });
  };

  const resetSectionMediaPositions = (sectionId) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          media: section.media.map((item) => ({
            ...item,
            x: Math.max(0, Math.min(90, Number(((100 - (item.w || 20)) / 2).toFixed(2)))),
            y: Math.max(0, Math.min(90, Number(((100 - (item.h || 20)) / 2).toFixed(2)))),
          })),
        };
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
          contentPosition: 'center',
          transition: 'fadeUp',
          titleSize: 52,
          bodySize: 22,
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
              transitionType: 'fade',
              transitionDuration: 0.8,
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
        ? await Promise.all(
            valid.map((file) => (file.type === 'image/gif' ? readAsDataUrl(file) : compressImageFile(file)))
          )
        : await Promise.all(valid.map((file) => readAsDataUrl(file)));

    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const next = encoded.map((src, idx) => ({
          id: `${sectionId}-${type}-${Date.now()}-${idx}`,
          type,
          src,
          shadow: false,
          videoRoundness: 0,
          fontFamily: 'Playfair Display',
          transitionType: 'fade',
          transitionDuration: 0.8,
          muted: type === 'video' ? true : undefined,
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
    setMusicUploadProgress(0);
    reader.onprogress = (e) => {
      if (!e.lengthComputable) return;
      setMusicUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onload = () => {
      setData((prev) => ({ ...prev, musicUrl: reader.result, musicName: file.name }));
      setNotice('');
      setMusicUploadProgress(100);
    };
    reader.readAsDataURL(file);
  };

  const uploadSectionBackground = async (sectionId, files) => {
    const file = Array.from(files || [])[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setNotice('Background image must be JPG/PNG/WEBP/GIF.');
      return;
    }
    const src = file.type === 'image/gif' ? await readAsDataUrl(file) : await compressImageFile(file);
    updateSection(sectionId, 'backgroundImageUrl', src);
    if (file.type === 'image/gif') {
      updateSection(sectionId, 'animationUrl', src);
      updateSection(sectionId, 'backgroundImageUrl', '');
    }
  };

  const uploadSectionBackgroundAnimation = async (sectionId, files) => {
    const file = Array.from(files || [])[0];
    if (!file) return;
    const allowed = ['image/gif', ...VIDEO_TYPES];
    if (!allowed.includes(file.type)) {
      setNotice('Background animation must be GIF/MP4/WEBM/OGG.');
      return;
    }
    const src = await readAsDataUrl(file);
    updateSection(sectionId, 'animationUrl', src);
    updateSection(sectionId, 'backgroundImageUrl', '');
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

  const getVideoMuted = (item) => {
    if (item.muted ?? true) return true;
    return videoUiMute[item.id] ?? true;
  };

  const enableVideoSound = (item) => {
    if (item.muted ?? true) return;
    setVideoUiMute((prev) => ({ ...prev, [item.id]: false }));
  };

  const disableVideoSound = (item) => {
    if (item.muted ?? true) return;
    setVideoUiMute((prev) => ({ ...prev, [item.id]: true }));
  };

  const setSectionBackgroundRatio = (sectionId, width, height) => {
    if (!width || !height) return;
    const ratio = Number((width / height).toFixed(4));
    setSectionBgRatio((prev) => (prev[sectionId] === ratio ? prev : { ...prev, [sectionId]: ratio }));
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
        setSavedSnapshot(snapshot);
        setNotice('Saved to server. Everyone using this link sees latest pushed changes.');
        try {
          localStorage.setItem(STORAGE_KEY, snapshot);
        } catch {
          setNotice('Saved to server successfully. Local browser cache skipped due storage limit.');
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'server not reachable';
        try {
          localStorage.setItem(STORAGE_KEY, snapshot);
          setSavedSnapshot(snapshot);
          setNotice(`Server save failed (${reason}). Saved only in this browser, so phones/other devices will still show old data.`);
        } catch {
          setNotice(`Save failed (${reason}) and browser storage limit was reached. Remove large media and retry so changes can sync to other devices.`);
        }
      }
    };
    persist();
  };

  const buildPresetPayload = () => ({
    themeKey: data.themeKey,
    themeColors: data.themeColors,
    invitation: data.invitation,
    sections: data.sections,
    musicUrl: data.musicUrl,
    musicName: data.musicName,
  });

  const savePreset = () => {
    const payload = buildPresetPayload();
    const name = presetName.trim() || `Preset ${data.presets.length + 1}`;
    setData((prev) => {
      const nextPresets = [
        ...prev.presets,
        { id: `preset-${Date.now()}`, name, createdAt: new Date().toISOString(), payload },
      ].slice(-5);
      return { ...prev, presets: nextPresets };
    });
    setPresetName('');
    setNotice('Preset saved. Click Save Changes to persist presets to server.');
  };

  const loadPreset = (presetId) => {
    const found = data.presets.find((p) => p.id === presetId);
    if (!found) return;
    setData((prev) => ({
      ...prev,
      ...found.payload,
      sections: normalizeSections(found.payload.sections || []),
      presets: prev.presets,
    }));
    setNotice(`Loaded preset: ${found.name}`);
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
              <label className="field">Invitation Main Title<input value={data.invitation.titleLine || ''} onChange={(e) => updateInvitation('titleLine', e.target.value)} /></label>
              <label className="field">Families Line<input value={data.invitation.familiesLine || ''} onChange={(e) => updateInvitation('familiesLine', e.target.value)} /></label>
              <label className="field">Bride Name<input value={data.invitation.bride} onChange={(e) => updateInvitation('bride', e.target.value)} /></label>
              <label className="field">Groom Name<input value={data.invitation.groom} onChange={(e) => updateInvitation('groom', e.target.value)} /></label>
              <label className="field">Venue<input value={data.invitation.venue} onChange={(e) => updateInvitation('venue', e.target.value)} /></label>
              <label className="field">Date<input type="date" value={data.invitation.date} onChange={(e) => updateInvitation('date', e.target.value)} /></label>
                  <label className="field">Main Title Position
                    <select value={data.invitation.heroPosition || 'center'} onChange={(e) => updateInvitation('heroPosition', e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                  <label className="field">Title Line Position
                    <select value={data.invitation.titleLinePosition || data.invitation.heroPosition || 'center'} onChange={(e) => updateInvitation('titleLinePosition', e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                  <label className="field">Families Line Position
                    <select value={data.invitation.familiesLinePosition || data.invitation.heroPosition || 'center'} onChange={(e) => updateInvitation('familiesLinePosition', e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                  <label className="field">Names Position
                    <select value={data.invitation.namesPosition || data.invitation.heroPosition || 'center'} onChange={(e) => updateInvitation('namesPosition', e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                  <label className="field">Date Position
                    <select value={data.invitation.datePosition || data.invitation.heroPosition || 'center'} onChange={(e) => updateInvitation('datePosition', e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                  <label className="field">Venue/Time Position
                    <select value={data.invitation.venuePosition || data.invitation.heroPosition || 'center'} onChange={(e) => updateInvitation('venuePosition', e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                  <label className="field">Countdown Position
                    <select value={data.invitation.countdownPosition || data.invitation.heroPosition || 'center'} onChange={(e) => updateInvitation('countdownPosition', e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                  <label className="field">Theme<select value={data.themeKey} onChange={(e) => setData((prev) => ({ ...prev, themeKey: e.target.value, themeColors: config.themes[e.target.value] }))}><option value="royalRed">Royal Red</option><option value="roseGold">Rose Gold</option></select></label>
              <label className="field">Primary Color<input type="color" value={data.themeColors.primary} onChange={(e) => setData((prev) => ({ ...prev, themeColors: { ...prev.themeColors, primary: e.target.value } }))} /></label>
              <label className="field">Title Line Size ({data.invitation.titleLineSize ?? 12}px)
                <input type="range" min="10" max="40" value={data.invitation.titleLineSize ?? 12} onChange={(e) => updateInvitation('titleLineSize', Number(e.target.value))} />
              </label>
              <label className="field">Families Line Size ({data.invitation.familiesLineSize ?? 12}px)
                <input type="range" min="10" max="40" value={data.invitation.familiesLineSize ?? 12} onChange={(e) => updateInvitation('familiesLineSize', Number(e.target.value))} />
              </label>
              <label className="field">Names Size ({data.invitation.namesSize ?? 84}px)
                <input type="range" min="28" max="140" value={data.invitation.namesSize ?? 84} onChange={(e) => updateInvitation('namesSize', Number(e.target.value))} />
              </label>
              <label className="field">Date Size ({data.invitation.dateSize ?? 24}px)
                <input type="range" min="14" max="56" value={data.invitation.dateSize ?? 24} onChange={(e) => updateInvitation('dateSize', Number(e.target.value))} />
              </label>
              <label className="field">Venue/Time Size ({data.invitation.venueSize ?? 16}px)
                <input type="range" min="12" max="40" value={data.invitation.venueSize ?? 16} onChange={(e) => updateInvitation('venueSize', Number(e.target.value))} />
              </label>
              <label className="field">Countdown Size ({data.invitation.countdownSize ?? 14}px)
                <input type="range" min="10" max="36" value={data.invitation.countdownSize ?? 14} onChange={(e) => updateInvitation('countdownSize', Number(e.target.value))} />
              </label>
            </div>

            <div className="panel space-y-3">
              <h3 className="font-display text-xl" style={{ color: theme.primary }}>Presets (max 5)</h3>
              <div className="flex flex-wrap gap-2">
                <input
                  className="flex-1 min-w-56 rounded-lg border px-3 py-2 text-sm"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name"
                />
                <button type="button" className="action-btn" onClick={savePreset}>Save as Preset</button>
              </div>
              <div className="space-y-2">
                {data.presets.length === 0 && <p className="text-sm opacity-70">No presets saved yet.</p>}
                {data.presets.map((preset) => (
                  <div key={preset.id} className="flex items-center justify-between gap-2 rounded-md bg-white/80 px-3 py-2">
                    <div className="text-sm">
                      <p className="font-semibold">{preset.name}</p>
                      <p className="opacity-70">{new Date(preset.createdAt).toLocaleString()}</p>
                    </div>
                    <button type="button" className="action-btn" onClick={() => loadPreset(preset.id)}>Load</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel grid md:grid-cols-2 gap-4">
              <label className="field">Music URL
                <input
                  value={data.musicUrl || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, musicUrl: e.target.value, musicName: 'Custom URL Music' }))}
                  placeholder="https://...mp3"
                />
              </label>
              <div className="field">
                <span>Upload Music (browser file)</span>
                <input type="file" accept="audio/*" onChange={(e) => uploadMusic(e.target.files)} />
              </div>
              <div className="field">
                <span>Current Music</span>
                <p className="rounded-md bg-white/80 px-3 py-2 text-sm">{data.musicName || 'No music selected'}</p>
              </div>
              <div className="field">
                <span>Upload Progress</span>
                <div className="h-3 w-full rounded bg-black/10 overflow-hidden">
                  <div className="h-full bg-emerald-600 transition-all" style={{ width: `${musicUploadProgress}%` }} />
                </div>
                <p className="text-xs">{musicUploadProgress}%</p>
                <button
                  type="button"
                  className="mt-2 rounded-md bg-red-700 px-3 py-1 text-xs font-semibold text-white"
                  onClick={() => setData((prev) => ({ ...prev, musicUrl: '', musicName: '' }))}
                >
                  Remove Music
                </button>
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
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl" style={{ color: theme.primary }}>{section.title || 'Untitled Section'}</h3>
                  <div className="flex gap-2">
                    <button type="button" className="action-btn" onClick={() => moveSection(section.id, 'up')}>Move Up</button>
                    <button type="button" className="action-btn" onClick={() => moveSection(section.id, 'down')}>Move Down</button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="field">Title<input value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} /></label>
                  <label className="field">Section Color<input type="color" value={section.sectionColor} onChange={(e) => updateSection(section.id, 'sectionColor', e.target.value)} /></label>
                  <label className="field">Title Font Color<input type="color" value={section.titleColor || '#ffffff'} onChange={(e) => updateSection(section.id, 'titleColor', e.target.value)} /></label>
                  <label className="field">Body Font Color<input type="color" value={section.bodyColor || '#fff5e9'} onChange={(e) => updateSection(section.id, 'bodyColor', e.target.value)} /></label>
                  <label className="field">Section Title Size ({section.titleSize ?? 52}px)
                    <input type="range" min="24" max="100" value={section.titleSize ?? 52} onChange={(e) => updateSection(section.id, 'titleSize', Number(e.target.value))} />
                  </label>
                  <label className="field">Section Body Size ({section.bodySize ?? 22}px)
                    <input type="range" min="14" max="48" value={section.bodySize ?? 22} onChange={(e) => updateSection(section.id, 'bodySize', Number(e.target.value))} />
                  </label>
                  <label className="field">Content Position
                    <select value={section.contentPosition || 'center'} onChange={(e) => updateSection(section.id, 'contentPosition', e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
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
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => uploadSectionBackground(section.id, e.target.files)} />
                  </div>
                  <div className="field">
                    <span>Upload GIF/Video Background</span>
                    <input type="file" accept="image/gif,video/mp4,video/webm,video/ogg" onChange={(e) => uploadSectionBackgroundAnimation(section.id, e.target.files)} />
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
                    <motion.div
                      key={item.id}
                      className="absolute media-item"
                      draggable
                      onDragStart={() => setDragMedia({ sectionId: section.id, mediaId: item.id })}
                      initial={(mediaTransitionMap[item.transitionType || 'fade'] || mediaTransitionMap.fade).initial}
                      animate={(mediaTransitionMap[item.transitionType || 'fade'] || mediaTransitionMap.fade).animate}
                      transition={{ duration: item.transitionDuration ?? 0.8, ease: 'easeOut' }}
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
                        <div className="w-full h-full flex items-center justify-center">
                          <video
                            autoPlay
                            loop
                            muted={getVideoMuted(item)}
                            playsInline
                            onMouseEnter={() => enableVideoSound(item)}
                            onMouseLeave={() => disableVideoSound(item)}
                            onTouchStart={() => enableVideoSound(item)}
                            onTouchEnd={() => disableVideoSound(item)}
                            className={item.shadow ? 'max-w-full max-h-full object-contain shadow-lg' : 'max-w-full max-h-full object-contain'}
                            style={{ borderRadius: `${item.videoRoundness ?? 0}%` }}
                          >
                            <source src={item.src} type="video/mp4" />
                          </video>
                        </div>
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-center px-2 rounded-md"
                          style={{ color: item.color || '#ffffff', fontSize: `${item.fontSize || 24}px`, fontFamily: item.fontFamily || 'Playfair Display' }}
                        >
                          {item.text}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button type="button" className="action-btn" onClick={() => resetSectionMediaPositions(section.id)}>
                      Reset Media Positions to Center
                    </button>
                  </div>
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
                        {item.type === 'video' && (
                          <label className="field">Mute Video
                            <input type="checkbox" checked={item.muted ?? true} onChange={(e) => updateMedia(section.id, item.id, 'muted', e.target.checked)} />
                          </label>
                        )}
                        {item.type === 'video' && (
                          <label className="field">Video Roundness ({item.videoRoundness ?? 0}%)
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="1"
                              value={item.videoRoundness ?? 0}
                              onChange={(e) => updateMedia(section.id, item.id, 'videoRoundness', Number(e.target.value))}
                            />
                          </label>
                        )}
                        <label className="field">Transition
                          <select value={item.transitionType || 'fade'} onChange={(e) => updateMedia(section.id, item.id, 'transitionType', e.target.value)}>
                            <option value="none">None</option>
                            <option value="fade">Fade</option>
                            <option value="slideUp">Slide Up</option>
                            <option value="zoomIn">Zoom In</option>
                            <option value="rotateIn">Rotate In</option>
                          </select>
                        </label>
                        <label className="field">Transition Duration ({Number(item.transitionDuration ?? 0.8).toFixed(1)}s)
                          <input
                            type="range"
                            min="0.2"
                            max="2.5"
                            step="0.1"
                            value={item.transitionDuration ?? 0.8}
                            onChange={(e) => updateMedia(section.id, item.id, 'transitionDuration', Number(e.target.value))}
                          />
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
                      {(item.type === 'photo' || item.type === 'video' || item.type === 'text') && (
                        <button
                          type="button"
                          className="mt-2 rounded-md bg-red-700 px-3 py-1 text-xs font-semibold text-white"
                          onClick={() => removeMedia(section.id, item.id)}
                        >
                          {item.type === 'photo' ? 'Remove Photo' : item.type === 'video' ? 'Remove Video' : 'Remove Text'}
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

          {data.sections.map((section, idx) => {
            const bgRatio = sectionBgRatio[section.id];
            const hasMediaBackground = Boolean(section.backgroundImageUrl || section.animationUrl);
            const useAspectRatioSizing = Boolean(bgRatio && section.animationUrl && !section.backgroundImageUrl);
            return (
            <motion.section
              key={section.id}
              className={`min-h-screen px-4 py-10 md:py-16 relative overflow-hidden flex ${
                section.contentPosition === 'top'
                  ? 'items-start'
                  : section.contentPosition === 'bottom'
                    ? 'items-end'
                    : 'items-center'
              }`}
              style={{
                backgroundColor: hasMediaBackground ? '#000000' : section.sectionColor || tint(theme.primary, idx * 8),
                aspectRatio: useAspectRatioSizing ? bgRatio : undefined,
                minHeight: useAspectRatioSizing ? 'auto' : undefined,
              }}
              initial={transitionMap[section.transition || 'fadeUp'].initial}
              whileInView={transitionMap[section.transition || 'fadeUp'].whileInView}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
            >
              {section.backgroundImageUrl && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <img
                    src={section.backgroundImageUrl}
                    alt=""
                    className="w-full h-full object-contain"
                    onLoad={(e) => setSectionBackgroundRatio(section.id, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
                  />
                  <div className="absolute inset-0 bg-black" style={{ opacity: (section.animationDim ?? 45) / 100 }} />
                </div>
              )}
              {!section.backgroundImageUrl && section.animationUrl && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                  {isImageBackground(section.animationUrl) ? (
                    <img
                      src={section.animationUrl}
                      alt=""
                      className="w-full h-full object-contain"
                      onLoad={(e) => setSectionBackgroundRatio(section.id, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
                    />
                  ) : isVideoBackground(section.animationUrl) ? (
                    <video
                      src={section.animationUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-contain"
                      onLoadedMetadata={(e) => setSectionBackgroundRatio(section.id, e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
                    />
                  ) : (
                    <iframe title={`animation-bg-${section.id}`} src={section.animationUrl} className="w-full h-full border-0" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-black" style={{ opacity: (section.animationDim ?? 45) / 100 }} />
                </div>
              )}
              <div className="max-w-5xl w-full mx-auto text-center text-white space-y-5 relative">
                <div className="relative z-10 space-y-5">
                {idx === 0 && (
                  <div className="space-y-3">
                    <div className="grid min-h-[40vh] grid-rows-3 gap-2">
                      {['top', 'center', 'bottom'].map((slot) => (
                        <div
                          key={slot}
                          className={`flex flex-col items-center justify-center gap-3 px-2 text-center`}
                        >
                          {(data.invitation.titleLinePosition || data.invitation.heroPosition || 'center') === slot && (
                            <p className="uppercase tracking-[0.2em]" style={{ fontSize: `${data.invitation.titleLineSize ?? 12}px` }}>
                              {data.invitation.titleLine || 'Wedding Invitation'}
                            </p>
                          )}
                          {(data.invitation.familiesLinePosition || data.invitation.heroPosition || 'center') === slot && (
                            <p className="uppercase tracking-[0.2em]" style={{ fontSize: `${data.invitation.familiesLineSize ?? 12}px` }}>
                              {data.invitation.familiesLine}
                            </p>
                          )}
                          {(data.invitation.namesPosition || data.invitation.heroPosition || 'center') === slot && (
                            <h2 className="font-script leading-tight" style={{ fontSize: `${data.invitation.namesSize ?? 84}px` }}>
                              {data.invitation.bride} & {data.invitation.groom}
                            </h2>
                          )}
                          {(data.invitation.datePosition || data.invitation.heroPosition || 'center') === slot && (
                            <p style={{ fontSize: `${data.invitation.dateSize ?? 24}px` }}>
                              {new Date(data.invitation.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          )}
                          {(data.invitation.venuePosition || data.invitation.heroPosition || 'center') === slot && (
                            <p style={{ fontSize: `${data.invitation.venueSize ?? 16}px` }}>
                              {data.invitation.time} • {data.invitation.venue}
                            </p>
                          )}
                          {(data.invitation.countdownPosition || data.invitation.heroPosition || 'center') === slot && (
                            <p style={{ fontSize: `${data.invitation.countdownSize ?? 14}px` }}>{countdown}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" className="action-btn" onClick={() => (isMuted ? startMusic() : setIsMuted(true))}>{isMuted ? 'Unmute Music' : 'Mute Music'}</button>
                      <button type="button" className="action-btn" onClick={startMusic}>Play Music</button>
                    </div>
                  </div>
                )}
                <h3 className="font-display" style={{ color: section.titleColor || '#ffffff', fontSize: `${section.titleSize ?? 52}px`, lineHeight: 1.15 }}>{section.title}</h3>
                <p className="max-w-3xl mx-auto" style={{ color: section.bodyColor || '#fff5e9', fontSize: `${section.bodySize ?? 22}px`, lineHeight: 1.45 }}>{section.body}</p>

                <div className="stage-output">
                  {section.media.map((item) => (
                    <motion.div
                      key={item.id}
                      className="absolute"
                      initial={(mediaTransitionMap[item.transitionType || 'fade'] || mediaTransitionMap.fade).initial}
                      whileInView={(mediaTransitionMap[item.transitionType || 'fade'] || mediaTransitionMap.fade).animate}
                      viewport={{ once: false, amount: 0.35 }}
                      transition={{ duration: item.transitionDuration ?? 0.8, ease: 'easeOut' }}
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        width: `${Math.min((item.w || 20) * 1.55, 94)}%`,
                        height: `${Math.min((item.h || 20) * 1.45, 92)}%`,
                      }}
                    >
                      {item.type === 'photo' ? (
                        <img src={item.src} alt="Wedding" className={`w-full h-full object-contain rounded-xl ${item.shadow ? 'shadow-lg' : ''}`} />
                      ) : item.type === 'video' ? (
                        <div className="w-full h-full relative flex items-center justify-center">
                          <video
                            autoPlay
                            loop
                            muted={getVideoMuted(item)}
                            playsInline
                            onMouseEnter={() => enableVideoSound(item)}
                            onMouseLeave={() => disableVideoSound(item)}
                            onTouchStart={() => enableVideoSound(item)}
                            onTouchEnd={() => disableVideoSound(item)}
                            className={item.shadow ? 'max-w-full max-h-full object-contain shadow-lg' : 'max-w-full max-h-full object-contain'}
                            style={{ borderRadius: `${item.videoRoundness ?? 0}%` }}
                          >
                            <source src={item.src} type="video/mp4" />
                          </video>
                        </div>
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-center px-3 rounded-xl ${item.shadow ? 'shadow-lg' : ''}`}
                          style={{ color: item.color || '#ffffff', fontSize: `${item.fontSize || 24}px`, fontFamily: item.fontFamily || 'Playfair Display' }}
                        >
                          {item.text}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                </div>
              </div>
            </motion.section>
          );
          })}
        </main>
      )}
    </div>
  );
}

export default App;
