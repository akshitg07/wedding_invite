# Indian Traditional Wedding Invitation (React + Tailwind + Framer Motion)

A modern, customizable Indian wedding invitation web app with royal card aesthetics, mandala-inspired decor, music controls, gallery, countdown, and share actions.

## Features

- Indian traditional card-inspired layout with elegant spacing and readability
- Theme switcher with 4 palettes configured via `config.json`
- Intro overlay (`Shubh Vivaah`) with invitation-opening interaction
- Bride/Groom details, date/time, venue + Google Maps link, family message
- Background music with visible mute/unmute control and autoplay fallback via intro tap
- Photo gallery with auto-rotate and manual thumbnail selection
- Subtle petal animation + decorative confetti texture
- Countdown timer to wedding date
- Add-to-Calendar (Google Calendar) and WhatsApp share buttons
- Mobile-first responsive layout

## Project Structure

```txt
src/
  App.jsx
  styles.css
  data/
    config.json
```

## Configuration

Edit `src/data/config.json` to customize:

- `invitation`: names, date/time, venue, maps URL, message
- `themes`: colors for all palette variants
- `images`: gallery images and alt text
- `music.url`: instrumental track URL
- `animations`: enable/disable entry/petal/confetti effects
- `calendar`: metadata for calendar link
- `share.text`: WhatsApp pre-filled message

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).

## Production Build

```bash
npm run build
npm run preview
```
