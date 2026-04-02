# Indian Traditional Wedding Invitation (React + Tailwind + Framer Motion)

A scrollable Indian wedding invitation website with full-screen themed sections and a separate `/controlplane` editor.

## Pages

- `/` → public invitation webpage
- `/controlplane` → control panel webpage

## Control Plane capabilities

- Edit all section titles, descriptions, and **section colors**
- Change title/body font color for each section independently
- Add new sections dynamically
- Upload photos/videos **from browser only** for each section
- Drag-and-place photos/videos anywhere in the section canvas
- Add text blocks inside media canvas (beside/over images) and drag-place them
- Resize placed media using width/height sliders
- Edit media placement precisely with X/Y sliders

## Upload constraints

### Images
- Supported extensions/types: `.jpg`, `.jpeg`, `.png`, `.webp`
- Max image size: **15 MB per file**
- Images are auto-compressed client-side during upload to improve stability

### Videos
- Supported extensions/types: `.mp4`, `.webm`, `.ogg`
- Max video size: **40 MB per file**

Files outside these constraints are skipped during upload.

## Persistence

All control panel changes are saved in browser `localStorage` and used by `/`.

## Run

```bash
npm install
npm run dev
```

Open:
- `http://localhost:5173/`
- `http://localhost:5173/controlplane`

## Docker

```bash
docker build -t wedding-invite .
docker run --rm -p 9080:80 wedding-invite
```

Open:
- `http://localhost:8080/`
- `http://localhost:8080/controlplane`
