# Indian Traditional Wedding Invitation (React + Tailwind + Framer Motion)

A modern, scrollable Indian wedding invitation website with royal aesthetics, mandala-inspired decor, media sections, and a separate control plane page.

## Pages

- `/` → public invitation page
- `/controlplane` → admin/control page for live content editing

## Features

- Separate **Control Plane** webpage at `/controlplane`
- Edit bride/groom names, venue, date, and theme colors
- Two theme presets only: **Royal Red** and **Rose Gold**
- Add image URLs to gallery and video URLs to video clips section
- Add unlimited custom sections from control plane (rendered on invitation page)
- Smooth intro screen (`Shubh Vivaah`) and soft petal animation
- Scrollable single-page invitation layout with low visual partitioning
- Background music with mute/unmute control

## Data Persistence

Changes from `/controlplane` are saved to browser `localStorage` and reflected on `/`.

## Run Locally

```bash
npm install
npm run dev
```

Then open:
- `http://localhost:5173/`
- `http://localhost:5173/controlplane`

## Run with Docker

```bash
docker build -t wedding-invite .
docker run --rm -p 8080:80 wedding-invite
```

Then open:
- `http://localhost:8080/`
- `http://localhost:8080/controlplane`
