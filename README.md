# Indian Traditional Wedding Invitation (React + Tailwind + Framer Motion)

A modern, scrollable Indian wedding invitation website with royal card aesthetics, mandala-inspired decor, music controls, editable content, gallery, and video clips.

## Features

- Live control panel for editing bride/groom names, venue, date, theme colors, images, and video URLs
- Indian traditional card-inspired layout with elegant spacing and readability
- Fixed design presets: **Royal Red** and **Rose Gold**
- Intro overlay (`Shubh Vivaah`) with invitation-opening interaction
- Bride/Groom details, date/time, venue + Google Maps link, family message
- Background music with visible mute/unmute control and autoplay fallback via intro tap
- Scrollable website layout with separate invitation, details, gallery, and video sections
- Subtle petal animation for visual polish
- Countdown timer to wedding date
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

Edit `src/data/config.json` to customize initial values:

- `theme`: default theme preset (`royalRed` or `roseGold`)
- `themes`: base colors for the two supported theme presets
- `invitation`: names, date/time, venue, maps URL, message
- `images`: default gallery images
- `videos`: default video clip URLs
- `music.url`: instrumental track URL

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).

## Run with Docker

Build the image:

```bash
docker build -t wedding-invite .
```

Run the container:

```bash
docker run --rm -p 8080:80 wedding-invite
```

Then open `http://localhost:8080`.
