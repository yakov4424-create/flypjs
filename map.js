/**
 * JetWatch — MapLibre GL Map Integration
 * Flightradar24-Style Vibrant Terrain, Altitude Gradient Trajectory,
 * Chopped Projected Route, Airport Markers & Realistic Aircraft
 */

const MAP_STYLES = {
    voyager: {
        id: 'voyager',
        label: 'FR24 Terrain',
        url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
    },
    satellite: {
        id: 'satellite',
        label: 'Satellite Hybrid',
        spec: {
            version: 8,
            sources: {
                'esri-satellite': {
                    type: 'raster',
                    tiles: [
                        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    ],
                    tileSize: 256,
                    attribution: 'Esri, Maxar, Earthstar Geographics'
                },
                'esri-labels': {
                    type: 'raster',
                    tiles: [
                        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
                    ],
                    tileSize: 256
                }
            },
            layers: [
                { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite' },
                { id: 'esri-labels-layer', type: 'raster', source: 'esri-labels' }
            ]
        }
    },
    dark: {
        id: 'dark',
        label: 'Dark Ops',
        url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    },
    positron: {
        id: 'positron',
        label: 'Silver Clean',
        url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
    }
};

class JetMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = new Map(); // hex -> MapLibre Marker
        this.airportMarkers = []; // MapLibre Markers for origin/destination
        this.userLocationMarker = null;

        this.flightTrailSourceId = 'flight-trail';
        this.flightProjectedSourceId = 'flight-projected';

        this.currentStyleKey = localStorage.getItem('jetwatch_map_style') || 'voyager';
        this.init();
    }

    init() {
        const styleConfig = MAP_STYLES[this.currentStyleKey] || MAP_STYLES.voyager;
        const initialStyle = styleConfig.url || styleConfig.spec;

        this.map = new maplibregl.Map({
            container: this.containerId,
            style: initialStyle,
            center: [-98.5795, 39.8283], // Center of United States
            zoom: 4.2,
            pitch: 0,
            attributionControl: false
        });

        if (this.currentStyleKey === 'dark') {
            document.body.classList.add('map-dark-theme');
        } else {
            document.body.classList.remove('map-dark-theme');
        }

        this.map.on('load', () => {
            this.setupMapLayers();
        });
    }

    zoomIn() {
        if (this.map) {
            this.map.zoomIn({ duration: 300 });
        }
    }

    zoomOut() {
        if (this.map) {
            this.map.zoomOut({ duration: 300 });
        }
    }

    resize() {
        if (this.map && this.map.resize) {
            this.map.resize();
        }
    }

    /**
     * Official Flightradar24 Altitude Trail Color Ramp:
     * White (< 500 ft) -> Yellow -> Green -> Light Blue -> Dark Blue -> Purple (Standard Cruise up to 39k ft) -> Red (High Cruise > 39k ft)
     */
    getAltitudeColor(altFt) {
        const alt = Number(altFt) || 0;
        if (alt <= 500) return '#ffffff';   // < 500 ft: White (On ground / Runway roll / Touchdown)
        if (alt <= 4000) return '#facc15';  // 500 - 4,000 ft: Yellow (Initial climb / Final approach)
        if (alt <= 10000) return '#22c55e'; // 4,000 - 10,000 ft: Green (Lower transition altitudes)
        if (alt <= 18000) return '#38bdf8'; // 10,000 - 18,000 ft: Light Blue (Mid-altitude climb)
        if (alt <= 26000) return '#2563eb'; // 18,000 - 26,000 ft: Dark Blue (Upper climb)
        if (alt <= 39000) return '#a855f7'; // 26,000 - 39,000 ft: Purple / Magenta (Standard airliner cruise — exactly as shown on LY04!)
        return '#ef4444';                   // > 39,000+ ft: Red (Highest altitude cruise FL400 - FL450+)
    }

    setupMapLayers() {
        // 1. Projected remaining route (FR24-style clean dark slate dashed line to destination)
        if (!this.map.getSource(this.flightProjectedSourceId)) {
            this.map.addSource(this.flightProjectedSourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            this.map.addLayer({
                id: 'flight-projected-line',
                type: 'line',
                source: this.flightProjectedSourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#475569',
                    'line-width': 2.2,
                    'line-dasharray': [4, 4],
                    'line-opacity': 0.8
                }
            });
        }

        // 2. Flown trail segmented by altitude
        if (!this.map.getSource(this.flightTrailSourceId)) {
            this.map.addSource(this.flightTrailSourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Subtle crisp contrast outline under trail
            this.map.addLayer({
                id: 'flight-trail-glow',
                type: 'line',
                source: this.flightTrailSourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#0f172a',
                    'line-width': 4.5,
                    'line-opacity': 0.25
                }
            });

            // Solid altitude-colored flight track
            this.map.addLayer({
                id: 'flight-trail-line',
                type: 'line',
                source: this.flightTrailSourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': ['coalesce', ['get', 'color'], '#2563eb'],
                    'line-width': 3.5,
                    'line-opacity': 1.0
                }
            });
        }

        // 3. Route waypoints
        if (!this.map.getSource('route-waypoints')) {
            this.map.addSource('route-waypoints', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            this.map.addLayer({
                id: 'route-waypoints-circle',
                type: 'circle',
                source: 'route-waypoints',
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#0284c7',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });
        }
    }

    /**
     * Switch basemap style smoothly (Voyager, Dark, Satellite, Positron)
     */
    switchMapStyle(styleKey) {
        if (!MAP_STYLES[styleKey] || !this.map) return;
        this.currentStyleKey = styleKey;
        localStorage.setItem('jetwatch_map_style', styleKey);

        const styleConfig = MAP_STYLES[styleKey];
        const targetStyle = styleConfig.url || styleConfig.spec;

        if (styleKey === 'dark') {
            document.body.classList.add('map-dark-theme');
        } else {
            document.body.classList.remove('map-dark-theme');
        }

        this.map.setStyle(targetStyle);
        this.map.once('style.load', () => {
            this.setupMapLayers();
            if (window.app && window.app.updateMapTrailForSelected) {
                window.app.updateMapTrailForSelected();
            }
        });

        // Update active class on dropdown buttons
        document.querySelectorAll('.map-layer-menu .layer-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === styleKey);
        });

        const labelEl = document.getElementById('current-layer-label');
        if (labelEl) {
            labelEl.textContent = styleConfig.label;
        }
    }

    setMapTheme(theme) {
        this.switchMapStyle(theme === 'light' ? 'voyager' : 'dark');
    }

    /**
     * Create realistic Flightradar24 top-down aircraft SVG marker
     */
    createMarkerElement(aircraft, isAirborne, heading, isSelected = false) {
        const el = document.createElement('div');
        el.className = 'map-marker';
        el.dataset.hex = aircraft.icao;

        const wrapper = document.createElement('div');
        wrapper.className = `marker-jet-wrapper ${isAirborne ? 'air' : 'ground'} ${isSelected ? 'selected' : ''}`;

        const isHelo = (aircraft.model && aircraft.model.toLowerCase().includes('helicopter')) || 
                       (aircraft.name && aircraft.name.toLowerCase().includes('helicopter')) ||
                       (aircraft.model && (aircraft.model.includes('S-76') || aircraft.model.includes('H160')));

        const primaryColor = isSelected ? '#ea580c' : (isAirborne ? '#f59e0b' : '#94a3b8');
        const contourColor = '#5c2605';

        if (isAirborne && isHelo) {
            // Clean VIP Helicopter SVG
            wrapper.innerHTML = `
                <svg class="marker-jet-svg" style="transform: rotate(${heading || 0}deg);" viewBox="0 0 48 48">
                    <path fill="${primaryColor}" stroke="${contourColor}" stroke-width="0.8" d="M24 10 C27 10 28 17 28 28 C28 35 27 38 24 39 C21 38 20 35 20 28 C20 17 21 10 24 10 Z"/>
                    <path fill="${primaryColor}" stroke="${contourColor}" stroke-width="0.8" d="M22.5 38 L22.5 45 L25.5 45 L25.5 38 Z"/>
                    <line x1="24" y1="4" x2="24" y2="40" stroke="${contourColor}" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="6" y1="22" x2="42" y2="22" stroke="${contourColor}" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="24" cy="22" r="2.5" fill="${primaryColor}" stroke="${contourColor}" stroke-width="0.8"/>
                </svg>
            `;
        } else if (isAirborne) {
            // Authentic Flightradar24 Solid Airplane Silhouette (Streamlined, zero white stroke)
            wrapper.innerHTML = `
                <svg class="marker-jet-svg" style="transform: rotate(${heading || 0}deg);" viewBox="0 0 48 48">
                    <path fill="${primaryColor}" stroke="${contourColor}" stroke-width="0.75" stroke-linejoin="round" d="
                        M24 3
                        C24.7 3 25.6 5.5 25.8 11
                        L25.8 17.5
                        L45.5 28.5
                        L45.5 31.8
                        L25.8 26.8
                        L25.8 37.5
                        L33.5 42
                        L33.5 44.5
                        L24.8 42.5
                        L24 42.5
                        L23.2 42.5
                        L14.5 44.5
                        L14.5 42
                        L22.2 37.5
                        L22.2 26.8
                        L2.5 31.8
                        L2.5 28.5
                        L22.2 17.5
                        L22.2 11
                        C22.4 5.5 23.3 3 24 3 Z
                    "/>
                    <rect x="28.5" y="24" width="2.4" height="5" rx="1.2" fill="${primaryColor}" stroke="${contourColor}" stroke-width="0.75"/>
                    <rect x="17.1" y="24" width="2.4" height="5" rx="1.2" fill="${primaryColor}" stroke="${contourColor}" stroke-width="0.75"/>
                </svg>
            `;
        } else {
            // Ground stationary / taxiing marker
            wrapper.innerHTML = `<div class="marker-ground-dot"></div>`;
        }

        const label = document.createElement('span');
        label.className = 'marker-label';
        const displayLabel = (window.app && window.app.getDisplayCallsign) ? window.app.getDisplayCallsign(aircraft) : (aircraft.displayCallsign || aircraft.tail);
        label.textContent = displayLabel;

        el.appendChild(wrapper);
        el.appendChild(label);

        // Click handler to select plane
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.app) {
                window.app.selectAircraft(aircraft.id);
            }
        });

        return el;
    }

    /**
     * Update or add markers for active aircraft
     */
    updateAircraftMarkers(aircraftList, selectedId = null) {
        const activeHexes = new Set();

        aircraftList.forEach(a => {
            if (!a.liveData || !a.liveData.lat || !a.liveData.lon) return;

            const hex = a.icao;
            activeHexes.add(hex);
            const isAirborne = a.liveData.status === 'air';
            const heading = a.liveData.track || 0;
            const coords = [a.liveData.lon, a.liveData.lat];
            const isSelected = a.id === selectedId;

            if (this.markers.has(hex)) {
                const marker = this.markers.get(hex);
                marker.setLngLat(coords);

                const icon = marker.getElement().querySelector('.marker-jet-svg');
                if (icon) {
                    icon.style.transform = `rotate(${heading}deg)`;
                    const primaryColor = isSelected ? '#ea580c' : (isAirborne ? '#f59e0b' : '#94a3b8');
                    icon.querySelectorAll('path, rect, circle').forEach(el => {
                        el.setAttribute('fill', primaryColor);
                    });
                }
                const wrapper = marker.getElement().querySelector('.marker-jet-wrapper');
                if (wrapper) {
                    wrapper.className = `marker-jet-wrapper ${isAirborne ? 'air' : 'ground'} ${isSelected ? 'selected' : ''}`;
                }
                const labelEl = marker.getElement().querySelector('.marker-label');
                if (labelEl) {
                    labelEl.textContent = (window.app && window.app.getDisplayCallsign) ? window.app.getDisplayCallsign(a) : (a.displayCallsign || a.tail);
                }
            } else {
                const el = this.createMarkerElement(a, isAirborne, heading, isSelected);
                const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                    .setLngLat(coords)
                    .addTo(this.map);

                this.markers.set(hex, marker);
            }
        });

        // Remove markers for planes that no longer have positions
        for (const [hex, marker] of this.markers.entries()) {
            if (!activeHexes.has(hex)) {
                marker.remove();
                this.markers.delete(hex);
            }
        }
    }

    /**
     * Fly map smoothly to a specific plane
     */
    flyToAircraft(lat, lon, zoom = 9) {
        if (!this.map) return;
        this.map.flyTo({
            center: [lon, lat],
            zoom: zoom,
            speed: 1.4,
            curve: 1.2,
            essential: true
        });
    }

    /**
     * Fit camera bounds to encompass all active aircraft
     */
    fitAllPlanes(coordsList) {
        if (!this.map || !coordsList || coordsList.length === 0) return;

        if (coordsList.length === 1) {
            this.flyToAircraft(coordsList[0][1], coordsList[0][0], 8);
            return;
        }

        const bounds = new maplibregl.LngLatBounds();
        coordsList.forEach(coord => bounds.extend(coord));

        this.map.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 100, right: 80 },
            maxZoom: 10,
            duration: 1200
        });
    }

    /**
     * Reset camera view back to default overview (US center)
     */
    resetView() {
        if (!this.map) return;
        this.map.flyTo({
            center: [-98.5795, 39.8283],
            zoom: 3.5,
            bearing: 0,
            pitch: 0,
            speed: 1.2,
            curve: 1.1,
            essential: true
        });
    }

    /**
     * Center map directly on the user's current GPS / browser location
     */
    flyToUserLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;

                // Add or update user location marker
                if (!this.userLocationMarker) {
                    const el = document.createElement('div');
                    el.className = 'user-location-marker';
                    el.innerHTML = '<div class="user-location-dot"></div><div class="user-location-pulse"></div>';
                    this.userLocationMarker = new maplibregl.Marker({ element: el })
                        .setLngLat([longitude, latitude])
                        .addTo(this.map);
                } else {
                    this.userLocationMarker.setLngLat([longitude, latitude]);
                }

                this.map.flyTo({
                    center: [longitude, latitude],
                    zoom: 9,
                    bearing: 0,
                    pitch: 0,
                    speed: 1.3,
                    curve: 1.1,
                    essential: true
                });
            },
            (err) => {
                console.warn('Geolocation error:', err);
                alert('Could not determine your location. Please check browser location permissions.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }

    /**
     * Create an authentic Flightradar24 airport pin
     */
    createAirportMarkerElement(iata, city, type = 'dep') {
        const el = document.createElement('div');
        el.className = `map-airport-pin ${type === 'dep' ? 'dep-pin' : 'arr-pin'}`;
        
        const isDep = type === 'dep';
        const iconSvg = isDep 
            ? `<svg class="airport-pin-icon" viewBox="0 0 24 24"><path d="M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10 8.39 3.86 6.84 4.27l3.89 7.02-3.81 1.02-2.18-1.52-1.16.31 1.77 3.09 1.16-.31 1.25-2.09 13.9-3.73c.8-.21 1.28-1.04 1.06-1.84z"/></svg>`
            : `<svg class="airport-pin-icon" viewBox="0 0 24 24"><path d="M2.5 19h19v2h-19zm16.84-3.15c.8.21 1.62-.26 1.84-1.06.21-.8-.26-1.62-1.06-1.84l-4.48-1.2-2.07-7.73-1.55-.41.38 8.03-3.81-1.02-1.29-2.33-1.16-.31.39 3.54 1.16.31 2.05-1.31 8.6 2.3z"/></svg>`;

        el.innerHTML = `
            <div class="airport-pin-bubble">
                ${iconSvg}
                <span class="airport-pin-iata">${iata}</span>
            </div>
            ${city ? `<span class="airport-pin-city">${city}</span>` : ''}
        `;
        return el;
    }

    /**
     * Render flight trail for selected aircraft:
     * - Altitude-segmented colored lines
     * - Radar breadcrumb waypoint circles
     * - Chopped/dashed projected route line to destination
     * - Origin and destination airport pins
     * 
     * @param {Array<[lon, lat, alt]>} trailCoords
     * @param {Array<{coords: [lon, lat], title: string}>} waypoints
     * @param {Array<[lon, lat]>} projectedCoords - [[planeLon, planeLat], [destLon, destLat]]
     * @param {Object} originInfo - { iata, city, coords: [lon, lat] }
     * @param {Object} destInfo - { iata, city, coords: [lon, lat] }
     */
    renderFlightTrail(trailCoords, waypoints = [], projectedCoords = null, originInfo = null, destInfo = null) {
        if (!this.map) return;

        // Clear existing airport pins
        this.airportMarkers.forEach(m => m.remove());
        this.airportMarkers = [];

        // 1. Render Flown Trail Segments by Altitude (Clean Solid Ribbon — No Dots)
        if (this.map.getSource(this.flightTrailSourceId)) {
            if (!trailCoords || trailCoords.length < 2) {
                this.map.getSource(this.flightTrailSourceId).setData({
                    type: 'FeatureCollection',
                    features: []
                });
            } else {
                const segmentFeatures = [];

                for (let i = 0; i < trailCoords.length - 1; i++) {
                    const p1 = trailCoords[i];
                    const p2 = trailCoords[i + 1];
                    const alt1 = p1[2] !== undefined ? p1[2] : (p2[2] !== undefined ? p2[2] : 25000);
                    const alt2 = p2[2] !== undefined ? p2[2] : alt1;
                    const avgAlt = (alt1 + alt2) / 2;
                    const color = this.getAltitudeColor(avgAlt);

                    segmentFeatures.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [[p1[0], p1[1]], [p2[0], p2[1]]]
                        },
                        properties: {
                            color: color,
                            altitude: Math.round(avgAlt)
                        }
                    });
                }

                this.map.getSource(this.flightTrailSourceId).setData({
                    type: 'FeatureCollection',
                    features: segmentFeatures
                });
            }
        }

        // 2. Render Chopped/Dashed Projected Line to Destination
        if (this.map.getSource(this.flightProjectedSourceId)) {
            if (projectedCoords && projectedCoords.length >= 2) {
                this.map.getSource(this.flightProjectedSourceId).setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: projectedCoords
                        }
                    }]
                });
            } else {
                this.map.getSource(this.flightProjectedSourceId).setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }
        }

        // 3. Render Airport Map Markers
        if (originInfo && originInfo.coords && Number.isFinite(originInfo.coords[0]) && Number.isFinite(originInfo.coords[1])) {
            const el = this.createAirportMarkerElement(originInfo.iata || 'DEP', originInfo.city || '', 'dep');
            const m = new maplibregl.Marker({ element: el })
                .setLngLat(originInfo.coords)
                .addTo(this.map);
            this.airportMarkers.push(m);
        }

        if (destInfo && destInfo.coords && Number.isFinite(destInfo.coords[0]) && Number.isFinite(destInfo.coords[1])) {
            const el = this.createAirportMarkerElement(destInfo.iata || 'ARR', destInfo.city || '', 'arr');
            const m = new maplibregl.Marker({ element: el })
                .setLngLat(destInfo.coords)
                .addTo(this.map);
            this.airportMarkers.push(m);
        }

        // 4. Fallback waypoints
        if (this.map.getSource('route-waypoints')) {
            const features = (waypoints || []).map(wp => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: wp.coords
                },
                properties: {
                    title: wp.title || ''
                }
            }));

            this.map.getSource('route-waypoints').setData({
                type: 'FeatureCollection',
                features: features
            });
        }
    }
}
