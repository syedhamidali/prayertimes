# Muslim Prayer Times & Hijri Calendar

A modern web application for accurate Islamic prayer times, Hijri calendar display, and Islamic event tracking — with PDF export support including Arabic text rendering.

**Live:** [syedha.com/prayertimes](https://syedha.com/prayertimes)

---

## Features

### Prayer Times
- Six daily prayers: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha
- **19 calculation methods** including Jafari (Shia Ithna-Ashari), Leva Research Institute (Qom), ISNA, MWL, Umm al-Qura, Tehran, and regional variants
- Location-aware via GPS, IP geolocation, interactive map, or manual coordinates
- Current prayer highlighting with countdown
- 12-hour / 24-hour format toggle

### Hijri Calendar
- Full month grid with Hijri and Gregorian dates side by side
- Multiple Hijri calculation methods (Leva, Jafari, Shafi, Hanafi, Maliki, Hanbali, Umm al-Qura, ISNA)
- Gregorian dates sourced from [AlAdhan API](https://aladhan.com) for accurate Hijri-Gregorian alignment
- Month/year navigation with "Today" button

### Islamic Events
- 80+ important Islamic dates sourced from SIA ToolKit
- Color-coded by type: martyrdom (red), wiladat/birth (green), victory/event (amber)
- Click any event day on the calendar to see details
- Events included in PDF exports

### PDF Export
- Export calendar or prayer times as professionally formatted PDFs
- **Arabic text rendering** via canvas-based approach with Amiri font
- Qur'an 4:103 verse header (toggleable)
- Dynamic multi-line editor with per-line controls:
  - Font size (8–28pt), color (picker + presets), bold/italic
  - Header or footer positioning
- Live preview before exporting
- Toggleable default footer (AlAdhan credit, syedha.com link, generation date)

### UI/UX
- Responsive design optimized for mobile and desktop
- Light and dark theme support
- Islamic geometric pattern backgrounds
- Toast notifications for user feedback

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 (SWC) |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Routing | React Router 6 (HashRouter) |
| State | TanStack React Query |
| Maps | Leaflet + React Leaflet |
| PDF | jsPDF |
| Arabic Font | Amiri (Google Fonts + local fallback) |
| Deployment | GitHub Pages |

---

## External APIs

| API | Purpose |
|-----|---------|
| [AlAdhan](https://aladhan.com) | Prayer times calculation and Hijri calendar |
| [BigDataCloud](https://www.bigdatacloud.com) | Reverse geocoding from coordinates |
| [ipapi.co](https://ipapi.co) | IP-based location detection |
| [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org) | Reverse geocoding for map |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Development

```bash
git clone https://github.com/syedhamidali/prayertimes.git
cd prayertimes
npm install
npm run dev
```

The dev server starts at `http://localhost:8080`.

### Production Build

```bash
npm run build
npm run preview
```

The build output is in the `dist/` directory.

---

## Project Structure

```
src/
├── components/
│   ├── CalendarGrid.tsx      # Hijri month grid with events
│   ├── CalendarHeader.tsx    # Month/year navigation
│   ├── ExportButton.tsx      # PDF export dialog with customization
│   ├── PrayerTimesCard.tsx   # Daily prayer times display
│   ├── LocationMap.tsx       # Interactive Leaflet map
│   ├── MethodSelector.tsx    # Calculation method picker
│   ├── YearSelector.tsx      # Year/month controls
│   └── ui/                   # shadcn/ui component library
├── lib/
│   ├── prayerTimes.ts        # Prayer calculation methods & types
│   ├── hijriUtils.ts         # Hijri-Gregorian conversion (Julian Day)
│   ├── aladhanApi.ts         # AlAdhan API client
│   ├── arabicPdf.ts          # Canvas-based Arabic PDF rendering
│   ├── islamicEvents.ts      # 80+ Islamic events database
│   └── solar.ts              # Solar position calculations
├── pages/
│   ├── Index.tsx              # Main application page
│   └── NotFound.tsx           # 404 page
└── hooks/
    ├── use-mobile.tsx         # Responsive breakpoint hook
    └── use-toast.ts           # Toast notification hook
```

---

## Deployment

The app deploys automatically to GitHub Pages on push to `main` via the workflow in `.github/workflows/deploy.yml`.

The Vite config uses a relative base path (`./`) so it works on any GitHub Pages subpath without configuration.

---

## Calculation Methods

The app supports these prayer time calculation methods:

| Method | Region / Authority |
|--------|--------------------|
| Leva Research Institute (Qom) | Iran / Shia |
| Shia Ithna-Ashari (Jafari) | General Shia |
| Jafari (Karachi) | Pakistan / Shia |
| University of Tehran | Iran |
| ISNA | North America |
| Muslim World League | Global |
| Umm al-Qura | Saudi Arabia |
| Egyptian General Authority | Egypt |
| Gulf Region | UAE, Oman |
| Kuwait | Kuwait |
| Qatar | Qatar |
| Singapore | Southeast Asia |
| France | Europe |
| Turkey (Diyanet) | Turkey |
| Russia | Russia |
| Shafi / Maliki / Hanbali / Hanafi | Fiqh-based |

---

## License

This project is open source.

---

## Credits

- Prayer times data by [AlAdhan API](https://aladhan.com)
- Islamic events sourced from [SIA ToolKit](https://github.com/AliHaider0343/SIA-ToolKit)
- Arabic font: [Amiri](https://github.com/aliftype/amiri) by Khaled Hosny
- UI components: [shadcn/ui](https://ui.shadcn.com)
