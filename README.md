# Indian Traditional Wedding Invitation (React + Tailwind + Framer Motion)

A scrollable Indian wedding invitation website with full-screen themed sections and a separate `/controlplane` editor.

## Pages

- `/` → public invitation webpage
- `/controlplane` → control panel webpage

## What changed

- Invitation sections are now full-screen and seamless (no card/box partitions)
- Each section uses a different shade in the Royal Red & Gold theme family
- Control panel can edit all existing sections (title/body)
- You can add new sections dynamically
- You can upload photos/videos directly from your browser for any section
- Uploaded media can be reordered with drag-and-drop within each section

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
docker run --rm -p 8080:80 wedding-invite
```

Open:
- `http://localhost:8080/`
- `http://localhost:8080/controlplane`
