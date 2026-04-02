import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import config from './data/config.json';

const floatingPetals = Array.from({ length: 12 }, (_, i) => i);

function toGoogleCalendarLink({ title, details, location, startDate, durationMinutes }) {
  const start = new Date(`${startDate}T18:30:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    location,
    dates: `${fmt(start)}/${fmt(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function App() {
  const [themeKey, setThemeKey] = useState(config.theme);
  const [showIntro, setShowIntro] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [petalsEnabled, setPetalsEnabled] = useState(config.animations.petals);
  const audioRef = useRef(null);

  const theme = config.themes[themeKey];
  const weddingDate = new Date(`${config.invitation.date}T18:30:00`);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = weddingDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('The celebration has begun!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setCountdown(`${days} days, ${hours} hrs, ${mins} mins to go`);
    }, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % config.images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  const calendarLink = useMemo(
    () =>
      toGoogleCalendarLink({
        title: config.calendar.title,
        details: config.calendar.details,
        location: config.invitation.venue,
        startDate: config.invitation.date,
        durationMinutes: config.calendar.durationMinutes,
      }),
    []
  );

  const whatsappLink = useMemo(() => {
    const text = `${config.share.text} ${window.location.href}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, []);

  return (
    <div
      className="min-h-screen px-4 py-10 md:py-12 relative overflow-hidden"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      <audio ref={audioRef} src={config.music.url} loop autoPlay playsInline />

      {petalsEnabled && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {floatingPetals.map((petal) => (
            <motion.span
              key={petal}
              className="petal"
              initial={{ y: -100, x: `${petal * 8}%`, opacity: 0.2 }}
              animate={{ y: '105vh', rotate: 360, opacity: [0.15, 0.3, 0.1] }}
              transition={{ duration: 10 + petal, repeat: Infinity, ease: 'linear', delay: petal * 0.8 }}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 z-20 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.78)' }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            onClick={() => {
              setShowIntro(false);
              setIsMuted(false);
            }}
          >
            <motion.div
              className="text-center px-8 py-10 rounded-2xl border"
              style={{ borderColor: theme.secondary, backgroundColor: theme.cardBackground }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <p className="tracking-[0.3em] uppercase text-xs md:text-sm">Save the Date</p>
              <h1 className="font-script text-6xl md:text-7xl mt-4" style={{ color: theme.primary }}>
                {config.introText}
              </h1>
              <p className="mt-4 text-sm">Tap to open invitation</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <motion.div
          className="invite-card border-4 p-4 md:p-8 lg:p-10 rounded-3xl relative"
          style={{
            borderColor: theme.secondary,
            backgroundColor: theme.cardBackground,
            boxShadow: `0 0 0 4px ${theme.accent}, 0 18px 40px rgba(0,0,0,0.25)`,
          }}
          initial={config.animations.entry ? { opacity: 0, scale: 0.92 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9 }}
        >
          <div className="decor decor-left" style={{ borderColor: theme.secondary }} />
          <div className="decor decor-right" style={{ borderColor: theme.secondary }} />

          <div className="text-center space-y-4 relative z-10">
            <p className="tracking-[0.25em] uppercase text-xs md:text-sm" style={{ color: theme.primary }}>
              {config.invitation.familiesLine}
            </p>
            <h2 className="font-script text-6xl md:text-7xl leading-tight" style={{ color: theme.primary }}>
              {config.invitation.bride}
              <span className="mx-3 font-display text-3xl md:text-4xl" style={{ color: theme.secondary }}>
                &
              </span>
              {config.invitation.groom}
            </h2>
            <p className="font-display text-lg md:text-xl">request the pleasure of your graceful presence</p>
            <p className="font-display text-lg md:text-2xl" style={{ color: theme.primary }}>
              {new Date(config.invitation.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              <span className="block text-base md:text-xl mt-1">{config.invitation.time}</span>
            </p>

            <p className="mx-auto max-w-2xl text-sm md:text-base">{config.invitation.message}</p>
            <p className="font-medium">{config.invitation.from}</p>
          </div>

          <div className="grid gap-6 mt-8 lg:grid-cols-2 relative z-10">
            <div className="rounded-2xl border p-4" style={{ borderColor: theme.secondary }}>
              <h3 className="font-display text-xl mb-2" style={{ color: theme.primary }}>
                Venue
              </h3>
              <p>{config.invitation.venue}</p>
              <a
                className="inline-block mt-3 underline"
                href={config.invitation.mapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: theme.primary }}
              >
                Open in Google Maps
              </a>

              <div className="mt-4 space-y-2 text-sm">
                <p className="font-semibold">Countdown</p>
                <p>{countdown}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a className="action-btn" href={calendarLink} target="_blank" rel="noreferrer">
                  Add to Calendar
                </a>
                <a className="action-btn" href={whatsappLink} target="_blank" rel="noreferrer">
                  Share on WhatsApp
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl mb-3" style={{ color: theme.primary }}>
                Wedding Moments
              </h3>
              <motion.div
                key={config.images[photoIndex].src}
                className="image-frame"
                initial={{ opacity: 0.4, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <img
                  src={config.images[photoIndex].src}
                  alt={config.images[photoIndex].alt}
                  className="h-64 md:h-72 w-full object-cover rounded-xl"
                />
              </motion.div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {config.images.map((img, idx) => (
                  <button
                    type="button"
                    key={img.src}
                    onClick={() => setPhotoIndex(idx)}
                    className={`thumb ${idx === photoIndex ? 'active' : ''}`}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img src={img.src} alt={img.alt} className="h-20 w-full object-cover rounded-md" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-10">
            <label className="text-sm font-medium" htmlFor="themePicker">
              Theme:
            </label>
            <select
              id="themePicker"
              value={themeKey}
              onChange={(e) => setThemeKey(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              {Object.entries(config.themes).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>

            <button type="button" className="action-btn" onClick={() => setIsMuted((v) => !v)}>
              {isMuted ? 'Unmute Music' : 'Mute Music'}
            </button>
            <button type="button" className="action-btn" onClick={() => setPetalsEnabled((v) => !v)}>
              {petalsEnabled ? 'Hide Petals' : 'Show Petals'}
            </button>
          </div>

          {config.animations.confetti && <div className="confetti" aria-hidden="true" />}
        </motion.div>
      </div>
    </div>
  );
}

export default App;
