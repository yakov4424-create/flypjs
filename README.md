# JetWatch — Live VIP Aircraft Tracker ✈️

A standalone, modern, real-time private jet and helicopter flight tracking web application.

## Features
- **Live Flight Tracking**: Connects directly to open ADS-B transponder networks ([adsb.lol](https://adsb.lol) and [adsb.fi](https://adsb.fi)). Uncensored, unblocked, and free.
- **Interactive Dark Vector Map**: Powered by MapLibre GL with sleek dark-mode cartography and rotating aircraft markers.
- **Pre-Loaded VIP Watchlist**:
  - `N787FZ` — Joel Landau · Bombardier Global 7500
  - `VP-CZS` — Joel Landau · Airbus H160 Helicopter
  - `N821SS` — Louis Scheiner · Sikorsky S-76C Helicopter
  - `N7965M` — Mark Stagg · Embraer Legacy EMB-135
- **Automatic N-Number Converter**: Type any standard US N-number (e.g. `N12345`), and the app automatically calculates its 24-bit ICAO Hex code mathematically.
- **Local Storage Persistence**: Easily add, edit, or remove your own aircraft watchlist. Changes stay saved in your browser.
- **Progressive Web App (PWA)**: Mobile-ready to "Add to Home Screen" on iPhone and Android.

## How to Run Locally
1. Double-click `index.html` to open it in your browser, or:
2. Run a simple static web server in this folder:
   ```bash
   python3 -m http.server 8080
   ```
   Then open `http://localhost:8080` in Chrome or Safari.

## How to Open in Antigravity as its Own Project
1. In Antigravity, go to **File → Open Folder...** (or press `Cmd + O`).
2. Select this **`Jet-Tracker`** folder located on your **Desktop**.
3. You now have a fresh, dedicated workspace and conversation completely separated from Luminary Jets!
