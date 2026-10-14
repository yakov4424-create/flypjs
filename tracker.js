/**
 * JetWatch — Core Flight Tracking Engine
 * Free ADS-B Data Polling, N-Number to ICAO Hex Converter, and UI Controller
 */

function getAppApiBase() {
    return (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') ? 'http://localhost:8088' : '';
}

// ==========================================
// FAA N-Number to 24-bit ICAO Hex Converter
// ==========================================
const FAA_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes I and O

function nNumberToHex(nNumber) {
    if (!nNumber) return null;
    let s = nNumber.trim().toUpperCase();
    if (!s.startsWith('N')) return null;
    s = s.slice(1);
    if (!s || s.length > 5) return null;

    // Check valid character structure
    if (!/^[1-9][0-9]{0,4}$|^[1-9][0-9]{0,3}[A-HJ-NP-Z]$|^[1-9][0-9]{0,2}[A-HJ-NP-Z]{2}$/.test(s)) {
        return null;
    }

    try {
        let d1 = parseInt(s.charAt(0), 10);
        let count = (d1 - 1) * 101711 + 1;

        if (s.length === 1) return formatHex(count);

        let c2 = s.charAt(1);
        if (isDigit(c2)) {
            let d2 = parseInt(c2, 10);
            count += d2 * 10111 + 1;
            if (s.length === 2) return formatHex(count);

            let c3 = s.charAt(2);
            if (isDigit(c3)) {
                let d3 = parseInt(c3, 10);
                count += d3 * 1021 + 1;
                if (s.length === 3) return formatHex(count);

                let c4 = s.charAt(3);
                if (isDigit(c4)) {
                    let d4 = parseInt(c4, 10);
                    count += d4 * 103 + 1;
                    if (s.length === 4) return formatHex(count);

                    let c5 = s.charAt(4);
                    if (isDigit(c5)) {
                        count += parseInt(c5, 10);
                        return formatHex(count);
                    } else {
                        count += letterIndex(c5) + 1;
                        return formatHex(count);
                    }
                } else {
                    count += (letterIndex(c4) * 25) + 1;
                    if (s.length === 5) {
                        count += letterIndex(s.charAt(4)) + 1;
                    }
                    return formatHex(count);
                }
            } else {
                count += (letterIndex(c3) * 25) + 1;
                if (s.length === 4) {
                    count += letterIndex(s.charAt(3)) + 1;
                }
                return formatHex(count);
            }
        } else {
            count += (letterIndex(c2) * 25) + 1;
            if (s.length === 3) {
                count += letterIndex(s.charAt(2)) + 1;
            }
            return formatHex(count);
        }
    } catch (e) {
        return null;
    }
}

function isDigit(c) { return c >= '0' && c <= '9'; }
function letterIndex(c) { return FAA_LETTERS.indexOf(c); }
function formatHex(offset) {
    let hexVal = (0xa00000 + offset).toString(16).toLowerCase();
    return hexVal.padStart(6, '0');
}

// Known foreign / non-standard ICAO overrides
const KNOWN_ICAO_LOOKUP = {
    'N821SS': 'ab3633',
    'N787FZ': 'aaa856',
    'N429FX': 'a51da1',
    'LXJ429': 'a51da1',
    'VP-CZS': '400294',
    'N7965M': 'aacd52',
    '4X-ISR': '7386c0',
    'N185QS': 'a154ae',
    'N327FX': 'a388e4',
    'N379FX': 'a455cd',
    'N933QS': 'acf23d',
    'N223A': 'a1ec26',
    'N117TF': 'a047e3',
    'N517DN': 'a67bc8',
    'VJT289': '4d23ab',
    '9H-VISTA': '4d23ab',
    '9HVISTA': '4d23ab',
    '4X-EDC': '7380c2',
    '4XEDC': '7380c2',
    'LY04': '7380c2',
    'LY4': '7380c2',
    'LY004': '7380c2',
    'ELY4': '7380c2',
    'ELY004': '7380c2',
    'LY9': '7380c2',
    'LY09': '7380c2',
    'LY009': '7380c2',
    'ELY9': '7380c2',
    'ELY009': '7380c2',
    'UA85': '4d6a98',
    'UAL85': '4d6a98',
    'UA1': 'ffd5f4',
    'UAL1': 'ffd5f4',
    'DL887': 'a67bc8',
    'VP-CZS': '400294',
    'VPCZS': '400294',
    'LXJ379': 'a455cd',
    'DAL887': 'a67bc8',
    'EJA595': 'a7b169',
    'N595QS': 'a7b169',
    'N380EE': 'a45703'
};

// Recognized standard aircraft models for instant display
const KNOWN_MODELS = {
    'N380EE': 'Gulfstream G800',
    'N787FZ': 'Bombardier Global 7500',
    'VP-CZS': 'Airbus H160 · Helicopter',
    'N821SS': 'Sikorsky S-76C · Helicopter',
    'N7965M': 'Embraer Legacy (EMB-135)',
    '4X-ISR': 'Gulfstream G280',
    'N185QS': 'Bombardier Global 7500',
    'N327FX': 'Embraer Praetor 500',
    'N429FX': 'Embraer Praetor 500',
    'LXJ429': 'Embraer Praetor 500',
    'N379FX': 'Embraer Phenom 300',
    'LXJ379': 'Embraer Phenom 300',
    'N933QS': 'Cessna Citation Latitude',
    'N595QS': 'Cessna Citation Latitude',
    'EJA595': 'Cessna Citation Latitude',
    'N223A': 'Gulfstream G-V',
    'N117TF': 'Bombardier Global 6000',
    'N517DN': 'Airbus A321neo',
    'DAL887': 'Airbus A321neo',
    '9H-VISTA': 'Bombardier Global 7500',
    'VJT289': 'Bombardier Global 7500',
    '4X-EDC': 'Boeing 787-9 Dreamliner',
    '4X-ECE': 'Boeing 777-200ER',
    'UA85': 'Boeing 787-10 Dreamliner',
    'UAL85': 'Boeing 787-10 Dreamliner'
};

// Known active route pre-seeds for fleet aircraft
const KNOWN_ROUTES = {
    '4X-EDC': {
        origin: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 },
        destination: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 }
    },
    '4XEDC': {
        origin: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 },
        destination: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 }
    },
    'LY04': {
        origin: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 },
        destination: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 }
    },
    'LY4': {
        origin: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 },
        destination: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 }
    },
    'LY004': {
        origin: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 },
        destination: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 }
    },
    'ELY4': {
        origin: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 },
        destination: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 }
    },
    'ELY004': {
        origin: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 },
        destination: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 }
    },
    'LY9': {
        origin: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 },
        destination: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 }
    },
    'LY09': {
        origin: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 },
        destination: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 }
    },
    'LY009': {
        origin: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 },
        destination: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 }
    },
    'ELY9': {
        origin: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 },
        destination: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 }
    },
    'ELY009': {
        origin: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856 },
        destination: { iata: 'JFK', city: 'New York (JFK)', lat: 40.6399, lon: -73.7787 }
    },
    'UA85': {
        origin: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856, tz: 'Asia/Jerusalem' },
        destination: { iata: 'EWR', city: 'Newark (EWR)', lat: 40.6895, lon: -74.1745, tz: 'America/New_York' }
    },
    'UAL85': {
        origin: { iata: 'TLV', city: 'Tel Aviv (Ben Gurion)', lat: 32.0094, lon: 34.8856, tz: 'Asia/Jerusalem' },
        destination: { iata: 'EWR', city: 'Newark (EWR)', lat: 40.6895, lon: -74.1745, tz: 'America/New_York' }
    },
    'UA1': {
        origin: { iata: 'SFO', city: 'San Francisco (SFO)', lat: 37.6213, lon: -122.3790 },
        destination: { iata: 'SIN', city: 'Singapore (Changi)', lat: 1.3644, lon: 103.9915 }
    },
    'UAL1': {
        origin: { iata: 'SFO', city: 'San Francisco (SFO)', lat: 37.6213, lon: -122.3790 },
        destination: { iata: 'SIN', city: 'Singapore (Changi)', lat: 1.3644, lon: 103.9915 }
    },
    'VJT289': {
        origin: { iata: 'LBG', city: 'Paris (Le Bourget)', lat: 48.9695, lon: 2.4415 },
        destination: { iata: 'CONFIDENTIAL', city: 'Private / Unlisted Arrival', lat: null, lon: null, isConfidential: true }
    },
    '9H-VISTA': {
        origin: { iata: 'LBG', city: 'Paris (Le Bourget)', lat: 48.9695, lon: 2.4415 },
        destination: { iata: 'CONFIDENTIAL', city: 'Private / Unlisted Arrival', lat: null, lon: null, isConfidential: true }
    },
    'N787FZ': {
        origin: { iata: 'TEB', city: 'Teterboro (New York)', lat: 40.8501, lon: -74.0608 },
        destination: { iata: 'CONFIDENTIAL', city: 'Private / Unlisted Arrival', lat: null, lon: null, isConfidential: true }
    },
    'N429FX': {
        origin: { iata: 'HPN', city: 'White Plains (New York)', lat: 41.0670, lon: -73.7076 },
        destination: { iata: 'CONFIDENTIAL', city: 'Private / Unlisted Arrival', lat: null, lon: null, isConfidential: true }
    },
    'LXJ429': {
        origin: { iata: 'HPN', city: 'White Plains (New York)', lat: 41.0670, lon: -73.7076 },
        destination: { iata: 'CONFIDENTIAL', city: 'Private / Unlisted Arrival', lat: null, lon: null, isConfidential: true }
    }
};

// ==========================================
// Comprehensive Major VIP & Regional Airports Database
// ==========================================
const MAJOR_VIP_AIRPORTS = [
    { iata: 'TEB', icao: 'KTEB', city: 'Teterboro, NJ', name: 'Teterboro Executive', lat: 40.8501, lon: -74.0608 },
    { iata: 'HPN', icao: 'KHPN', city: 'White Plains, NY', name: 'Westchester County', lat: 41.0670, lon: -73.7076 },
    { iata: 'EWR', icao: 'KEWR', city: 'Newark, NJ', name: 'Newark Liberty Intl', lat: 40.6895, lon: -74.1745 },
    { iata: 'JFK', icao: 'KJFK', city: 'New York, NY', name: 'John F. Kennedy Intl', lat: 40.6399, lon: -73.7787 },
    { iata: 'LGA', icao: 'KLGA', city: 'New York, NY', name: 'LaGuardia', lat: 40.7769, lon: -73.8740 },
    { iata: 'FRG', icao: 'KFRG', city: 'Farmingdale, NY', name: 'Republic Airport', lat: 40.7288, lon: -73.4134 },
    { iata: 'MMU', icao: 'KMMU', city: 'Morristown, NJ', name: 'Morristown Municipal', lat: 40.7994, lon: -74.4149 },
    { iata: 'BED', icao: 'KBED', city: 'Bedford, MA', name: 'Hanscom Field', lat: 42.4700, lon: -71.2890 },
    { iata: 'BOS', icao: 'KBOS', city: 'Boston, MA', name: 'Boston Logan', lat: 42.3656, lon: -71.0096 },
    { iata: 'IAD', icao: 'KIAD', city: 'Washington, DC', name: 'Dulles International', lat: 38.9531, lon: -77.4565 },
    { iata: 'DCA', icao: 'KDCA', city: 'Washington, DC', name: 'Reagan National', lat: 38.8512, lon: -77.0402 },
    { iata: 'BWI', icao: 'KBWI', city: 'Baltimore, MD', name: 'Baltimore/Washington', lat: 39.1754, lon: -76.6683 },
    { iata: 'SHD', icao: 'KSHD', city: 'Staunton/Weyers Cave, VA', name: 'Shenandoah Valley', lat: 38.2638, lon: -78.8964 },
    { iata: 'CHO', icao: 'KCHO', city: 'Charlottesville, VA', name: 'Charlottesville-Albemarle', lat: 38.1386, lon: -78.4529 },
    { iata: 'ROA', icao: 'KROA', city: 'Roanoke, VA', name: 'Roanoke-Blacksburg', lat: 37.3255, lon: -79.9754 },
    { iata: 'RIC', icao: 'KRIC', city: 'Richmond, VA', name: 'Richmond International', lat: 37.5052, lon: -77.3197 },
    { iata: 'CLT', icao: 'KCLT', city: 'Charlotte, NC', name: 'Charlotte Douglas', lat: 35.2140, lon: -80.9431 },
    { iata: 'RDU', icao: 'KRDU', city: 'Raleigh/Durham, NC', name: 'Raleigh-Durham', lat: 35.8801, lon: -78.7880 },
    { iata: 'ATL', icao: 'KATL', city: 'Atlanta, GA', name: 'Hartsfield-Jackson Atlanta', lat: 33.6407, lon: -84.4277 },
    { iata: 'PDK', icao: 'KPDK', city: 'Atlanta, GA', name: 'DeKalb-Peachtree Executive', lat: 33.8756, lon: -84.3020 },
    { iata: 'MIA', icao: 'KMIA', city: 'Miami, FL', name: 'Miami International', lat: 25.7959, lon: -80.2870 },
    { iata: 'OPF', icao: 'KOPF', city: 'Miami, FL', name: 'Miami-Opa Locka Executive', lat: 25.9070, lon: -80.2784 },
    { iata: 'FLL', icao: 'KFLL', city: 'Fort Lauderdale, FL', name: 'Fort Lauderdale-Hollywood', lat: 26.0742, lon: -80.1506 },
    { iata: 'FXE', icao: 'KFXE', city: 'Fort Lauderdale, FL', name: 'Fort Lauderdale Executive', lat: 26.1973, lon: -80.1707 },
    { iata: 'PBI', icao: 'KPBI', city: 'West Palm Beach, FL', name: 'Palm Beach International', lat: 26.6832, lon: -80.0956 },
    { iata: 'APF', icao: 'KAPF', city: 'Naples, FL', name: 'Naples Airport', lat: 26.1525, lon: -81.7756 },
    { iata: 'ORD', icao: 'KORD', city: 'Chicago, IL', name: "O'Hare International", lat: 41.9742, lon: -87.9073 },
    { iata: 'MDW', icao: 'KMDW', city: 'Chicago, IL', name: 'Chicago Midway', lat: 41.7868, lon: -87.7522 },
    { iata: 'PWK', icao: 'KPWK', city: 'Chicago, IL', name: 'Chicago Executive', lat: 42.1142, lon: -87.9015 },
    { iata: 'DAL', icao: 'KDAL', city: 'Dallas, TX', name: 'Dallas Love Field', lat: 32.8471, lon: -96.8518 },
    { iata: 'DFW', icao: 'KDFW', city: 'Dallas/Fort Worth, TX', name: 'DFW International', lat: 32.8998, lon: -97.0403 },
    { iata: 'HOU', icao: 'KHOU', city: 'Houston, TX', name: 'William P. Hobby', lat: 29.6454, lon: -95.2789 },
    { iata: 'LAS', icao: 'KLAS', city: 'Las Vegas, NV', name: 'Harry Reid International', lat: 36.0840, lon: -115.1537 },
    { iata: 'VGT', icao: 'KVGT', city: 'Las Vegas, NV', name: 'North Las Vegas', lat: 36.2107, lon: -115.1944 },
    { iata: 'VNY', icao: 'KVNY', city: 'Van Nuys, CA', name: 'Van Nuys Airport', lat: 34.2098, lon: -118.4899 },
    { iata: 'LAX', icao: 'KLAX', city: 'Los Angeles, CA', name: 'Los Angeles International', lat: 33.9416, lon: -118.4085 },
    { iata: 'SNA', icao: 'KSNA', city: 'Santa Ana, CA', name: 'John Wayne Airport', lat: 33.6757, lon: -117.8674 },
    { iata: 'SFO', icao: 'KSFO', city: 'San Francisco, CA', name: 'San Francisco International', lat: 37.6213, lon: -122.3790 },
    { iata: 'OAK', icao: 'KOAK', city: 'Oakland, CA', name: 'Oakland International', lat: 37.7213, lon: -122.2207 },
    { iata: 'SJC', icao: 'KSJC', city: 'San Jose, CA', name: 'San Jose Mineta', lat: 37.3619, lon: -121.9290 },
    { iata: 'TLV', icao: 'LLBG', city: 'Tel Aviv, Israel', name: 'Ben Gurion', lat: 32.0094, lon: 34.8856 },
    { iata: 'LBG', icao: 'LFPB', city: 'Paris, France', name: 'Paris Le Bourget', lat: 48.9695, lon: 2.4415 },
    { iata: 'FAB', icao: 'EGLF', city: 'Farnborough, UK', name: 'Farnborough Airport', lat: 51.2758, lon: -0.7763 },
    { iata: 'GVA', icao: 'LSGG', city: 'Geneva, Switzerland', name: 'Geneva Airport', lat: 46.2370, lon: 6.1091 },
    { iata: 'ZRH', icao: 'LSZH', city: 'Zurich, Switzerland', name: 'Zurich Airport', lat: 47.4582, lon: 8.5555 }
];

// ==========================================
// Default Starter VIP Aircraft Watchlist
// ==========================================
const DEFAULT_AIRCRAFT = [
    {
        id: 'jet-n787fz',
        tail: 'N787FZ',
        name: 'Joel Landau · Plane',
        model: 'Bombardier Global 7500',
        icao: 'aaa856'
    },
    {
        id: 'jet-vpczs',
        tail: 'VP-CZS',
        name: 'Joel Landau · Helicopter',
        model: 'Airbus H160 · Helicopter',
        icao: '400294'
    },
    {
        id: 'jet-n821ss',
        tail: 'N821SS',
        name: 'Louis Scheiner',
        model: 'Sikorsky S-76C · Helicopter',
        icao: 'ab3633'
    },
    {
        id: 'jet-n7965m',
        tail: 'N7965M',
        name: 'Mark Stagg',
        model: 'Embraer Legacy (EMB-135)',
        icao: 'aacd52'
    },
    {
        id: 'jet-n185qs',
        tail: 'N185QS',
        name: 'NetJets · Global 7500',
        model: 'Bombardier Global 7500',
        icao: 'a154ae'
    },
    {
        id: 'jet-n327fx',
        tail: 'N327FX',
        name: 'Flexjet · Praetor 500',
        model: 'Embraer Praetor 500',
        icao: 'a388e4'
    },
    {
        id: 'jet-n379fx',
        tail: 'N379FX',
        name: 'Flexjet · Phenom 300',
        model: 'Embraer Phenom 300 (E55P)',
        icao: 'a455cd'
    },
    {
        id: 'jet-n223a',
        tail: 'N223A',
        name: 'Gulfstream V · Executive',
        model: 'Gulfstream G-V (GLF5)',
        icao: 'a1ec26'
    },
    {
        id: 'jet-n117tf',
        tail: 'N117TF',
        name: 'Global 7500 · VIP',
        model: 'Bombardier Global 7500 (GL7T)',
        icao: 'a047e3'
    },
    {
        id: 'jet-n517dn',
        tail: 'N517DN',
        name: 'Delta Air Lines · DAL887',
        model: 'Airbus A321neo',
        icao: 'a67bc8'
    },
    {
        id: 'jet-vjt289',
        tail: '9H-VISTA',
        name: 'VistaJet · VJT289',
        model: 'Bombardier Global 7500 (GL7T)',
        icao: '4d23ab'
    },
    {
        id: 'jet-4xedc',
        tail: '4X-EDC',
        name: 'El Al Israel Airlines',
        model: 'Boeing 787-9 Dreamliner',
        icao: '7380c2'
    },
    {
        id: 'jet-ua85',
        tail: 'UA85',
        name: 'United Airlines · UA85',
        model: 'Boeing 787-10 Dreamliner',
        icao: '4d6a98'
    }
];

// ==========================================
// Comprehensive Airport -> IANA Timezone Map
// ==========================================
const AIRPORT_IANA_MAP = {
    // US Eastern
    'JFK': 'America/New_York', 'KJFK': 'America/New_York',
    'EWR': 'America/New_York', 'KEWR': 'America/New_York',
    'LGA': 'America/New_York', 'KLGA': 'America/New_York',
    'TEB': 'America/New_York', 'KTEB': 'America/New_York',
    'HPN': 'America/New_York', 'KHPN': 'America/New_York',
    'FRG': 'America/New_York', 'KFRG': 'America/New_York',
    'BOS': 'America/New_York', 'KBOS': 'America/New_York',
    'BED': 'America/New_York', 'KBED': 'America/New_York',
    'PHL': 'America/New_York', 'KPHL': 'America/New_York',
    'BWI': 'America/New_York', 'KBWI': 'America/New_York',
    'IAD': 'America/New_York', 'KIAD': 'America/New_York',
    'DCA': 'America/New_York', 'KDCA': 'America/New_York',
    'MIA': 'America/New_York', 'KMIA': 'America/New_York',
    'FLL': 'America/New_York', 'KFLL': 'America/New_York',
    'OPF': 'America/New_York', 'KOPF': 'America/New_York',
    'PBI': 'America/New_York', 'KPBI': 'America/New_York',
    'MCO': 'America/New_York', 'KMCO': 'America/New_York',
    'TPA': 'America/New_York', 'KTPA': 'America/New_York',
    'ATL': 'America/New_York', 'KATL': 'America/New_York',
    'CLT': 'America/New_York', 'KCLT': 'America/New_York',
    // US Central
    'ORD': 'America/Chicago', 'KORD': 'America/Chicago',
    'MDW': 'America/Chicago', 'KMDW': 'America/Chicago',
    'DFW': 'America/Chicago', 'KDFW': 'America/Chicago',
    'DAL': 'America/Chicago', 'KDAL': 'America/Chicago',
    'IAH': 'America/Chicago', 'KIAH': 'America/Chicago',
    'HOU': 'America/Chicago', 'KHOU': 'America/Chicago',
    'MSP': 'America/Chicago', 'KMSP': 'America/Chicago',
    'DTW': 'America/Detroit', 'KDTW': 'America/Detroit',
    'BNA': 'America/Chicago', 'KBNA': 'America/Chicago',
    'AUS': 'America/Chicago', 'KAUS': 'America/Chicago',
    'SAT': 'America/Chicago', 'KSAT': 'America/Chicago',
    'STL': 'America/Chicago', 'KSTL': 'America/Chicago',
    // US Mountain
    'DEN': 'America/Denver', 'KDEN': 'America/Denver',
    'APA': 'America/Denver', 'KAPA': 'America/Denver',
    'SLC': 'America/Denver', 'KSLC': 'America/Denver',
    'ASE': 'America/Denver', 'KASE': 'America/Denver',
    'EGE': 'America/Denver', 'KEGE': 'America/Denver',
    'PHX': 'America/Phoenix', 'KPHX': 'America/Phoenix',
    'SDL': 'America/Phoenix', 'KSDL': 'America/Phoenix',
    // US Pacific
    'LAX': 'America/Los_Angeles', 'KLAX': 'America/Los_Angeles',
    'VNY': 'America/Los_Angeles', 'KVNY': 'America/Los_Angeles',
    'BUR': 'America/Los_Angeles', 'KBUR': 'America/Los_Angeles',
    'SNA': 'America/Los_Angeles', 'KSNA': 'America/Los_Angeles',
    'SAN': 'America/Los_Angeles', 'KSAN': 'America/Los_Angeles',
    'SFO': 'America/Los_Angeles', 'KSFO': 'America/Los_Angeles',
    'OAK': 'America/Los_Angeles', 'KOAK': 'America/Los_Angeles',
    'SJC': 'America/Los_Angeles', 'KSJC': 'America/Los_Angeles',
    'SEA': 'America/Los_Angeles', 'KSEA': 'America/Los_Angeles',
    'BFI': 'America/Los_Angeles', 'KBFI': 'America/Los_Angeles',
    'PDX': 'America/Los_Angeles', 'KPDX': 'America/Los_Angeles',
    'LAS': 'America/Los_Angeles', 'KLAS': 'America/Los_Angeles',
    // Israel
    'TLV': 'Asia/Jerusalem', 'LLBG': 'Asia/Jerusalem',
    'HFA': 'Asia/Jerusalem', 'LLHA': 'Asia/Jerusalem',
    'ETM': 'Asia/Jerusalem', 'LLER': 'Asia/Jerusalem',
    // UK & Europe
    'LHR': 'Europe/London', 'EGLL': 'Europe/London',
    'LGW': 'Europe/London', 'EGKK': 'Europe/London',
    'LTN': 'Europe/London', 'EGGW': 'Europe/London',
    'STN': 'Europe/London', 'EGSS': 'Europe/London',
    'FAB': 'Europe/London', 'EGLF': 'Europe/London',
    'CDG': 'Europe/Paris', 'LFPG': 'Europe/Paris',
    'ORY': 'Europe/Paris', 'LFPO': 'Europe/Paris',
    'LFPB': 'Europe/Paris', 'LBG': 'Europe/Paris',
    'AMS': 'Europe/Amsterdam', 'EHAM': 'Europe/Amsterdam',
    'FRA': 'Europe/Berlin', 'EDDF': 'Europe/Berlin',
    'MUC': 'Europe/Berlin', 'EDDM': 'Europe/Berlin',
    'BER': 'Europe/Berlin', 'EDDB': 'Europe/Berlin',
    'ZRH': 'Europe/Zurich', 'LSZH': 'Europe/Zurich',
    'GVA': 'Europe/Zurich', 'LSGG': 'Europe/Zurich',
    'VIE': 'Europe/Vienna', 'LOWW': 'Europe/Vienna',
    'FCO': 'Europe/Rome', 'LIRF': 'Europe/Rome',
    'MXP': 'Europe/Rome', 'LIMC': 'Europe/Rome',
    'LIN': 'Europe/Rome', 'LIML': 'Europe/Rome',
    'MAD': 'Europe/Madrid', 'LEMD': 'Europe/Madrid',
    'BCN': 'Europe/Madrid', 'LEBL': 'Europe/Madrid',
    'LIS': 'Europe/Lisbon', 'LPPT': 'Europe/Lisbon',
    'ATH': 'Europe/Athens', 'LGAV': 'Europe/Athens',
    'IST': 'Europe/Istanbul', 'LTFM': 'Europe/Istanbul',
    'SAW': 'Europe/Istanbul', 'LTFJ': 'Europe/Istanbul',
    // Middle East
    'DXB': 'Asia/Dubai', 'OMDB': 'Asia/Dubai',
    'DWC': 'Asia/Dubai', 'OMDW': 'Asia/Dubai',
    'AUH': 'Asia/Dubai', 'OMAA': 'Asia/Dubai',
    'DOH': 'Asia/Qatar', 'OTHH': 'Asia/Qatar',
    'RUH': 'Asia/Riyadh', 'OERK': 'Asia/Riyadh',
    'JED': 'Asia/Riyadh', 'OEJN': 'Asia/Riyadh',
    'BAH': 'Asia/Bahrain', 'OBBI': 'Asia/Bahrain',
    'KWI': 'Asia/Kuwait', 'OKBK': 'Asia/Kuwait',
    // Asia & Pacific
    'HND': 'Asia/Tokyo', 'RJTT': 'Asia/Tokyo',
    'NRT': 'Asia/Tokyo', 'RJAA': 'Asia/Tokyo',
    'KIX': 'Asia/Tokyo', 'RJBB': 'Asia/Tokyo',
    'ICN': 'Asia/Seoul', 'RKSI': 'Asia/Seoul',
    'GMP': 'Asia/Seoul', 'RKSS': 'Asia/Seoul',
    'HKG': 'Asia/Hong_Kong', 'VHHH': 'Asia/Hong_Kong',
    'SIN': 'Asia/Singapore', 'WSSS': 'Asia/Singapore',
    'BKK': 'Asia/Bangkok', 'VTBS': 'Asia/Bangkok',
    'DEL': 'Asia/Kolkata', 'VIDP': 'Asia/Kolkata',
    'BOM': 'Asia/Kolkata', 'VABB': 'Asia/Kolkata',
    'SYD': 'Australia/Sydney', 'YSSY': 'Australia/Sydney',
    'MEL': 'Australia/Melbourne', 'YMML': 'Australia/Melbourne'
};

// ==========================================
// JetWatch App Controller
// ==========================================
class JetWatchApp {
    constructor() {
        this.storageKey = 'jetwatch_fleet_v2';
        this.aircraft = [];
        this.selectedAircraftId = null;
        this.searchQuery = '';
        this.pollInterval = 15000; // 15 seconds
        this.timer = null;
        this.map = null;
        this.trailHistory = new Map(); // hex -> Array<[lon, lat]>
        this.routeCache = new Map(); // callsign/tail -> {origin, destination}
        this.theme = localStorage.getItem('jetwatch_theme') || 'dark';
        this.timeDisplayPref = localStorage.getItem('jetwatch_time_pref') || 'airport'; // 'airport' | 'device' | 'utc'
        this.notificationsEnabled = localStorage.getItem('jetwatch_notify') === 'true';
        this.previousStatusMap = new Map(); // hex -> 'air' | 'ground' | 'offline'
        this.statusHistoryMap = new Map(); // hex -> { confirmedStatus, candidateStatus, candidateCount, airborneSince }
        this.lastTakeoffAlertTime = new Map(); // hex -> timestamp of last takeoff notification
        this.lastLandingAlertTime = new Map(); // hex -> timestamp of last landing notification
        this.lastGlobalNotificationTime = 0; // throttle across all aircraft
        this.chimeAudioBuffer = null; // pre-decoded authentic Airbus MP3 buffer

        // Live ATC Radio Tuner state
        this.currentAtcAirport = null;
        this.currentAtcData = null;
        this.currentAtcChannelType = 'TWR';
        this.isAtcPlaying = false;
        this.atcTargetTab = null;
        this.atcVolume = 0.8;
        this.atcFreqCache = new Map();

        this.init();
    }

    init() {
        this.loadAircraft();
        this.setupDOM();
        this.renderStats();
        this.renderAircraftList();
        this.map = new JetMap('map');
        window.app = this;
        this.loadChimeBuffer();

        // Initial fetch
        this.refreshLiveData();

        // Start background polling
        this.timer = setInterval(() => this.refreshLiveData(), this.pollInterval);
    }

    loadAircraft() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                this.aircraft = JSON.parse(raw);
            } else {
                this.aircraft = [...DEFAULT_AIRCRAFT];
                this.saveAircraft();
            }
        } catch (e) {
            this.aircraft = [...DEFAULT_AIRCRAFT];
        }

        // 1. Always apply known overrides and normalizations first
        this.aircraft.forEach(a => {
            const cleanTail = a.tail.trim().toUpperCase();
            if (KNOWN_ICAO_LOOKUP[cleanTail]) {
                a.icao = KNOWN_ICAO_LOOKUP[cleanTail]; // always trust the lookup table
            } else if (!a.icao || !/^[0-9a-fA-F]{6}$/.test(a.icao)) {
                a.icao = nNumberToHex(cleanTail) || '';
            }

            // Upgrade generic "Private Aircraft" models if a recognized model exists
            if (KNOWN_MODELS[cleanTail] && (!a.model || a.model === 'Private Aircraft' || a.model === 'Commercial Airliner')) {
                a.model = KNOWN_MODELS[cleanTail];
            }

            // Upgrade N380EE specific owner/name if generic
            if (cleanTail === 'N380EE' && (!a.name || a.name === 'N380EE' || a.name.includes('Private Jet') || a.name === 'Private Owner')) {
                a.name = 'Gulfstream G800 Executive';
            }

            // Auto-heal any stale LY4 card that was previously frozen to 4X-EDC / 787
            if ((a.id === 'elal-ly04' || a.id === 'ly4' || cleanTail === 'LY4' || a.displayCallsign === 'LY4')) {
                a.tail = 'LY4';
                a.model = 'Boeing 777-200ER';
                a.name = 'El Al Israel Airlines';
                a.icao = '738075';
            }

            // Purge stale hardcoded routes from prior sessions so live legs load immediately
            if (cleanTail === 'N379FX' || cleanTail === 'LXJ379' || a.icao === 'a455cd') {
                if (a.route && a.route.origin && a.route.origin.iata === 'CGF' && a.route.destination && a.route.destination.iata === 'AVL') {
                    a.route = null;
                }
            }
            if (cleanTail === 'N517DN' || cleanTail === 'DAL887' || a.icao === 'a67bc8') {
                if (a.route && a.route.destination && a.route.destination.iata === 'SLC') {
                    a.route = null;
                }
            }

            if (!a.route && KNOWN_ROUTES[cleanTail]) {
                a.route = JSON.parse(JSON.stringify(KNOWN_ROUTES[cleanTail]));
            }
        });

        // 2. Ensure all DEFAULT_AIRCRAFT exist without inserting duplicate ICAO/tails
        DEFAULT_AIRCRAFT.forEach(def => {
            const alreadyExists = this.aircraft.some(a => 
                (a.tail && def.tail && a.tail.toUpperCase() === def.tail.toUpperCase()) ||
                (a.icao && def.icao && a.icao.toLowerCase() === def.icao.toLowerCase())
            );
            if (!alreadyExists) {
                this.aircraft.push({ ...def });
            }
        });

        // 3. Deduplicate any existing duplicate aircraft sharing the same ICAO hex or tail
        const seenIcaos = new Set();
        const seenTails = new Set();
        const uniqueFleet = [];

        for (const plane of this.aircraft) {
            const hexKey = (plane.icao || '').toLowerCase().trim();
            const tailKey = (plane.tail || '').toUpperCase().trim();

            if (hexKey && seenIcaos.has(hexKey)) {
                continue; // duplicate by hex!
            }
            if (tailKey && seenTails.has(tailKey)) {
                continue; // duplicate by tail!
            }

            if (hexKey) seenIcaos.add(hexKey);
            if (tailKey) seenTails.add(tailKey);
            uniqueFleet.push(plane);
        }
        this.aircraft = uniqueFleet;
        this.saveAircraft(); // persist deduplicated fleet

        // Background model enrichment for any planes still with "Private Aircraft"
        setTimeout(() => {
            let changed = false;
            Promise.all(this.aircraft.map(async plane => {
                if (!plane.model || plane.model === 'Private Aircraft') {
                    const info = await this.lookupAircraft(plane.tail);
                    if (info && info.model && info.model !== 'Private Aircraft') {
                        plane.model = info.model;
                        if (info.name && (!plane.name || plane.name === plane.tail || plane.name.includes('Private Jet'))) {
                            plane.name = info.name;
                        }
                        changed = true;
                    }
                }
            })).then(() => {
                if (changed) {
                    this.saveAircraft();
                    this.renderAircraftList();
                }
            });
        }, 800);
    }

    saveAircraft() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.aircraft));
        } catch (e) {
            console.error('Failed to save to localStorage', e);
        }
    }

    async lookupAircraft(query) {
        if (!query) return null;
        const clean = query.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '');
        if (!clean) return null;

        // 1. Instant check in client-side overrides
        if (KNOWN_ICAO_LOOKUP[clean]) {
            const hex = KNOWN_ICAO_LOOKUP[clean];
            const def = DEFAULT_AIRCRAFT.find(a => a.tail.toUpperCase() === clean || a.icao.toLowerCase() === hex);
            if (def) {
                return {
                    tail: def.tail,
                    icao: hex,
                    model: def.model,
                    name: def.name,
                    source: 'client_registry'
                };
            }
        }

        // 2. Fetch from backend /api/lookup/ (with apiBase to support file:// and web hosting)
        const apiBase = getAppApiBase();
        try {
            const res = await fetch(`${apiBase}/api/lookup/${encodeURIComponent(clean)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                    return data;
                }
            }
        } catch (e) {}

        // 2b. Check live server stream & direct adsb.lol for real transponder hex
        try {
            const liveRes = await fetch(`${apiBase}/api/callsign/${encodeURIComponent(clean)}`, { cache: 'no-store' });
            if (liveRes && liveRes.ok) {
                const liveData = await liveRes.json();
                if (liveData && liveData.ac && liveData.ac[0]) {
                    const ac = liveData.ac[0];
                    return {
                        tail: clean,
                        icao: ac.hex ? ac.hex.toLowerCase() : null,
                        model: ac.desc || ac.t || 'Commercial Airliner',
                        name: ac.ownOp || (clean.startsWith('LY') ? 'El Al Israel Airlines' : clean),
                        source: 'live_stream'
                    };
                }
            }
        } catch (e) {}

        // 3. Direct ADS-B DB callsign lookup fallback for any commercial airline flight (e.g. LY6, UA85)
        const mAir = clean.match(/^([A-Z]{2,3})([0-9]{1,4})$/);
        if (mAir) {
            let iata = mAir[1];
            let num = mAir[2].replace(/^0+/, '');
            const iataToIcao = {
                'LY': 'ELY', 'UA': 'UAL', 'DL': 'DAL', 'AA': 'AAL',
                'BA': 'BAW', 'LH': 'DLH', 'AF': 'AFR', 'KL': 'KLM'
            };
            const icaoPrefix = iataToIcao[iata] || iata;
            const targetCall = `${icaoPrefix}${num}`;

            // Try direct adsb.lol for live transponder
            try {
                const lolRes = await fetch(`https://api.adsb.lol/v2/callsign/${targetCall}`).catch(() => null);
                if (lolRes && lolRes.ok) {
                    const lolData = await lolRes.json();
                    if (lolData && lolData.ac && lolData.ac[0]) {
                        const ac = lolData.ac[0];
                        return {
                            tail: clean,
                            icao: ac.hex ? ac.hex.toLowerCase() : null,
                            model: ac.t || 'Commercial Airliner',
                            name: (iata === 'LY' || icaoPrefix === 'ELY') ? 'El Al Israel Airlines' : clean,
                            source: 'direct_adsb_lol'
                        };
                    }
                }
            } catch (e) {}

            try {
                const res = await fetch(`https://api.adsbdb.com/v0/callsign/${targetCall}`).catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    if (data && data.response && data.response.flightroute) {
                        const fr = data.response.flightroute;
                        const airlineName = fr.airline ? fr.airline.name : (iata === 'LY' || icaoPrefix === 'ELY' ? 'El Al Israel Airlines' : 'Commercial Airline');
                        const defaultModel = (iata === 'LY' || icaoPrefix === 'ELY') ? 'Boeing 787-9 Dreamliner' : 'Commercial Airliner';
                        let hash = 0;
                        for (let i = 0; i < targetCall.length; i++) hash = ((hash << 5) - hash) + targetCall.charCodeAt(i);
                        const hex = Math.abs(hash).toString(16).padStart(6, '0').slice(-6);

                        return {
                            tail: clean,
                            icao: hex,
                            model: defaultModel,
                            name: airlineName,
                            source: 'direct_airline_route'
                        };
                    }
                }
            } catch (e) {}

            // Instant smart pattern match for El Al and major carriers if offline
            if (iata === 'LY' || icaoPrefix === 'ELY') {
                return {
                    tail: clean,
                    icao: 'a04c7e',
                    model: 'Boeing 787-9 Dreamliner',
                    name: 'El Al Israel Airlines',
                    source: 'smart_client'
                };
            }
        }

        // 4. Mathematical FAA N-Number fallback
        const hex = nNumberToHex(clean);
        if (hex) {
            return {
                tail: clean,
                icao: hex.toLowerCase(),
                model: 'Private Aircraft',
                name: clean.endsWith('QS') ? 'NetJets' : clean.endsWith('FX') ? 'Flexjet' : 'Private Owner',
                source: 'faa_calc'
            };
        }

        return null;
    }

    setupDOM() {
        // Buttons
        document.getElementById('refresh-btn').addEventListener('click', () => {
            const btn = document.getElementById('refresh-btn');
            btn.classList.add('rotating');
            this.refreshLiveData().finally(() => {
                setTimeout(() => btn.classList.remove('rotating'), 600);
            });
        });

        // Floating Map Controls (Bottom-Right: Zoom & Location)
        const zoomInBtn = document.getElementById('zoom-in-btn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                if (this.map && this.map.zoomIn) this.map.zoomIn();
            });
        }

        const zoomOutBtn = document.getElementById('zoom-out-btn');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                if (this.map && this.map.zoomOut) this.map.zoomOut();
            });
        }

        const recenterBtn = document.getElementById('recenter-btn');
        if (recenterBtn) {
            recenterBtn.addEventListener('click', () => {
                this.fitAllActivePlanes();
            });
        }

        const myLocBtn = document.getElementById('my-location-btn');
        if (myLocBtn) {
            myLocBtn.addEventListener('click', () => {
                if (this.map && this.map.flyToUserLocation) {
                    this.map.flyToUserLocation();
                }
            });
        }

        const resetBtn = document.getElementById('reset-view-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.map && this.map.resetView) {
                    this.map.resetView();
                }
            });
        }

        // Settings Modal Handling
        const settingsModal = document.getElementById('settings-modal');
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettingsBtn = document.getElementById('close-settings-modal-btn');
        const doneSettingsBtn = document.getElementById('done-settings-btn');

        const openSettingsModal = () => {
            if (!settingsModal) return;
            // Sync current active settings to UI
            const curStyle = (this.map && this.map.currentStyleKey) || localStorage.getItem('jetwatch_map_style') || 'voyager';
            document.querySelectorAll('#settings-map-styles .style-choice-card').forEach(card => {
                card.classList.toggle('active', card.dataset.style === curStyle);
            });

            const curTheme = this.theme || 'dark';
            document.querySelectorAll('.theme-seg-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === curTheme);
            });

            const soundToggle = document.getElementById('setting-sound-toggle');
            if (soundToggle) soundToggle.checked = (localStorage.getItem('jetwatch_sound') !== 'false');

            const notifyToggle = document.getElementById('setting-notify-toggle');
            if (notifyToggle) notifyToggle.checked = !!this.notificationsEnabled;

            const curSpeedUnit = localStorage.getItem('jetwatch_unit_speed') || 'kts';
            document.querySelectorAll('#unit-speed-ctrl .unit-seg-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.unit === curSpeedUnit);
            });

            const curAltUnit = localStorage.getItem('jetwatch_unit_alt') || 'ft';
            document.querySelectorAll('#unit-alt-ctrl .unit-seg-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.unit === curAltUnit);
            });

            const curTimePref = this.timeDisplayPref || 'airport';
            document.querySelectorAll('#setting-time-ctrl .unit-seg-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.time === curTimePref);
            });

            settingsModal.hidden = false;
        };

        const closeSettingsModal = () => {
            if (settingsModal) settingsModal.hidden = true;
        };

        if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
        if (doneSettingsBtn) doneSettingsBtn.addEventListener('click', closeSettingsModal);
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) closeSettingsModal();
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && settingsModal && !settingsModal.hidden) {
                closeSettingsModal();
            }
        });

        // Map Styles in Settings
        document.querySelectorAll('#settings-map-styles .style-choice-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const styleKey = btn.dataset.style;
                document.querySelectorAll('#settings-map-styles .style-choice-card').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                if (this.map && this.map.switchMapStyle) {
                    this.map.switchMapStyle(styleKey);
                }
                localStorage.setItem('jetwatch_map_style', styleKey);
            });
        });

        // Theme selector in Settings
        this.applyTheme(this.theme);
        document.querySelectorAll('.theme-seg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.theme = theme;
                localStorage.setItem('jetwatch_theme', theme);
                this.applyTheme(theme);
                document.querySelectorAll('.theme-seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Test Chime in Settings
        const testChimeBtn = document.getElementById('test-chime-btn');
        if (testChimeBtn) {
            testChimeBtn.addEventListener('click', () => {
                this.playChime(true);
            });
        }

        // Sound Toggle in Settings
        const soundToggle = document.getElementById('setting-sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', () => {
                localStorage.setItem('jetwatch_sound', soundToggle.checked ? 'true' : 'false');
            });
        }

        // Push Notifications Toggle in Settings
        const notifyToggle = document.getElementById('setting-notify-toggle');
        if (notifyToggle) {
            notifyToggle.addEventListener('change', async () => {
                if (notifyToggle.checked) {
                    if ('Notification' in window) {
                        const perm = await Notification.requestPermission();
                        if (perm === 'granted') {
                            this.notificationsEnabled = true;
                            localStorage.setItem('jetwatch_notifications', 'true');
                            const notifyBtn = document.getElementById('notify-btn');
                            if (notifyBtn) notifyBtn.classList.add('active');
                        } else {
                            notifyToggle.checked = false;
                            this.notificationsEnabled = false;
                            localStorage.setItem('jetwatch_notifications', 'false');
                        }
                    }
                } else {
                    this.notificationsEnabled = false;
                    localStorage.setItem('jetwatch_notifications', 'false');
                    const notifyBtn = document.getElementById('notify-btn');
                    if (notifyBtn) notifyBtn.classList.remove('active');
                }
            });
        }

        // Units selection
        document.querySelectorAll('#unit-speed-ctrl .unit-seg-btn').forEach(b => {
            b.addEventListener('click', () => {
                document.querySelectorAll('#unit-speed-ctrl .unit-seg-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                localStorage.setItem('jetwatch_unit_speed', b.dataset.unit);
            });
        });
        document.querySelectorAll('#unit-alt-ctrl .unit-seg-btn').forEach(b => {
            b.addEventListener('click', () => {
                document.querySelectorAll('#unit-alt-ctrl .unit-seg-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                localStorage.setItem('jetwatch_unit_alt', b.dataset.unit);
            });
        });

        // Time Display selection (Airport Local, Device Time, UTC)
        document.querySelectorAll('#setting-time-ctrl .unit-seg-btn').forEach(b => {
            b.addEventListener('click', () => {
                document.querySelectorAll('#setting-time-ctrl .unit-seg-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                this.timeDisplayPref = b.dataset.time || 'airport';
                localStorage.setItem('jetwatch_time_pref', this.timeDisplayPref);
                // Immediately refresh active aircraft card & timeline with new time format
                const selected = this.aircraft.find(a => a.id === this.selectedAircraftId);
                if (selected) {
                    this.updateSelectedCard();
                    this.updateFlightTimeline(selected);
                }
            });
        });

        // Global Audio Unlocker on first user interaction
        const unlockAudio = () => {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(() => {});
            }
            if (!this.chimeAudioBuffer) {
                this.loadChimeBuffer();
            }
            const audioEl = document.getElementById('seatbelt-audio');
            if (audioEl) {
                audioEl.volume = 1.0;
                audioEl.load();
            }
        };
        ['click', 'touchstart', 'keydown'].forEach(evt => {
            document.addEventListener(evt, unlockAudio, { once: true });
        });

        // Notification Toggle (Takeoff Alerts)
        const notifyBtn = document.getElementById('notify-btn');
        if (notifyBtn) {
            if (this.notificationsEnabled) notifyBtn.classList.add('active');
            notifyBtn.addEventListener('click', async () => {
                this.playChime(); // Instant chime audio test
                if (!this.notificationsEnabled) {
                    if ('Notification' in window) {
                        const perm = await Notification.requestPermission();
                        if (perm === 'granted') {
                            this.notificationsEnabled = true;
                            localStorage.setItem('jetwatch_notify', 'true');
                            notifyBtn.classList.add('active');
                            new Notification('JetWatch Alerts Active 🔔', {
                                body: 'Chime confirmed! You will hear this tone when VIP jets take off.',
                                icon: 'manifest.webmanifest',
                                silent: true
                            });
                        } else {
                            alert('Please allow browser notifications in your browser settings to receive alerts.');
                        }
                    } else {
                        alert('Browser notifications are not supported in this browser.');
                    }
                } else {
                    this.notificationsEnabled = false;
                    localStorage.setItem('jetwatch_notify', 'false');
                    notifyBtn.classList.remove('active');
                }
            });
        }

        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.renderAircraftList();
        });

        // Fleet Filter Pills (All, In Air, Helicopters, Jets)
        this.currentFilter = 'all';
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentFilter = pill.dataset.filter;
                this.renderAircraftList();
            });
        });

        // Add Aircraft Modal
        const addModal = document.getElementById('add-modal');
        const openModal = () => {
            addModal.hidden = false;
            addModal.style.display = 'flex';
            setTimeout(() => document.getElementById('input-tail').focus(), 50);
        };
        document.getElementById('add-plane-btn').addEventListener('click', openModal);

        const closeModal = () => {
            addModal.hidden = true;
            addModal.style.display = 'none';
            document.getElementById('add-plane-form').reset();
            document.getElementById('input-icao').placeholder = 'Auto-calculated for US planes or enter 6-hex code (e.g. aaab1c)';
        };

        document.getElementById('close-modal-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });

        document.getElementById('cancel-add-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });

        // Close on clicking backdrop outside modal
        addModal.addEventListener('click', (e) => {
            if (e.target === addModal) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !addModal.hidden && addModal.style.display !== 'none') {
                closeModal();
            }
        });

        // Auto-calculate ICAO hex and auto-recognize aircraft when typing in Add form
        let tailLookupTimeout = null;
        const tailInput = document.getElementById('input-tail');
        const statusPill = document.getElementById('tail-lookup-status');
        const icaoInput = document.getElementById('input-icao');
        const modelInput = document.getElementById('input-model');
        const nameInput = document.getElementById('input-name');

        const triggerLookup = async () => {
            const rawVal = tailInput.value.trim().toUpperCase();
            if (rawVal.length < 2) {
                if (statusPill) statusPill.style.display = 'none';
                return;
            }

            // Quick instant calculation for US N-numbers
            const instantHex = KNOWN_ICAO_LOOKUP[rawVal] || nNumberToHex(rawVal);
            if (instantHex && !icaoInput.value) {
                icaoInput.value = instantHex;
            }

            if (statusPill) {
                statusPill.className = 'lookup-status-pill loading';
                statusPill.style.display = 'flex';
                statusPill.innerHTML = '<span class="status-dot"></span> Identifying aircraft details...';
            }

            const info = await this.lookupAircraft(rawVal);
            // Verify input hasn't changed while waiting
            if (tailInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') !== rawVal.replace(/[^A-Z0-9]/g, '')) {
                return;
            }

            if (info && info.icao) {
                if (info.tail) tailInput.value = info.tail;
                icaoInput.value = info.icao;
                if (info.model && (!modelInput.value || modelInput.dataset.autofilled)) {
                    modelInput.value = info.model;
                    modelInput.dataset.autofilled = 'true';
                }
                if (info.name && (!nameInput.value || nameInput.dataset.autofilled)) {
                    nameInput.value = info.name;
                    nameInput.dataset.autofilled = 'true';
                }

                if (statusPill) {
                    statusPill.className = 'lookup-status-pill success';
                    statusPill.innerHTML = `✓ Recognized: <b>${info.model || 'Aircraft'}</b> • ${info.name || 'Owner'} (<code>${info.icao}</code>)`;
                }
            } else if (instantHex) {
                icaoInput.value = instantHex;
                if (statusPill) {
                    statusPill.className = 'lookup-status-pill success';
                    statusPill.innerHTML = `✓ US N-Number calculated (ICAO: <code>${instantHex}</code>)`;
                }
            } else {
                if (statusPill) {
                    statusPill.className = 'lookup-status-pill warn';
                    statusPill.innerHTML = `Unregistered tail. Auto-detects live, or customize details below.`;
                }
            }
        };

        tailInput.addEventListener('input', () => {
            clearTimeout(tailLookupTimeout);
            tailLookupTimeout = setTimeout(triggerLookup, 350);
        });

        tailInput.addEventListener('change', triggerLookup);
        tailInput.addEventListener('blur', () => {
            if (tailInput.value.trim().length >= 2) triggerLookup();
        });

        modelInput.addEventListener('input', () => delete modelInput.dataset.autofilled);
        nameInput.addEventListener('input', () => delete nameInput.dataset.autofilled);

        // Add Form Submit
        document.getElementById('add-plane-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-add-btn') || e.target.querySelector('button[type="submit"]');
            const origText = submitBtn ? submitBtn.textContent : 'Add';
            if (submitBtn) {
                submitBtn.textContent = 'Verifying & Adding...';
                submitBtn.disabled = true;
            }

            try {
                let tail = tailInput.value.trim().toUpperCase();
                let name = nameInput.value.trim();
                let model = modelInput.value.trim();
                let icao = icaoInput.value.trim().toLowerCase();

                // If hex or details still empty, perform instant lookup now
                if (!icao || !name || !model) {
                    const info = await this.lookupAircraft(tail);
                    if (info) {
                        if (!icao && info.icao) icao = info.icao.toLowerCase();
                        if (!name && info.name) name = info.name;
                        if (!model && info.model) model = info.model;
                        if (info.tail) tail = info.tail;
                    }
                }

                if (!icao || !/^[0-9a-f]{6}$/.test(icao)) {
                    icao = (KNOWN_ICAO_LOOKUP[tail] || nNumberToHex(tail) || '').toLowerCase();
                }

                if (!icao || !/^[0-9a-f]{6}$/.test(icao)) {
                    let hash = 0;
                    for (let i = 0; i < tail.length; i++) hash = ((hash << 5) - hash) + tail.charCodeAt(i);
                    icao = Math.abs(hash).toString(16).padStart(6, '0').slice(-6);
                }

                if (!name) name = tail;
                if (!model) model = 'Commercial Airliner';

                // If plane already in list (by tail or ICAO hex), update it instead of adding duplicate
                const existingIdx = this.aircraft.findIndex(a => 
                    (a.tail && a.tail.toUpperCase() === tail.toUpperCase()) ||
                    (a.icao && icao && a.icao.toLowerCase() === icao.toLowerCase())
                );
                if (existingIdx >= 0) {
                    this.aircraft[existingIdx].name = name;
                    this.aircraft[existingIdx].model = model;
                    this.aircraft[existingIdx].icao = icao;
                } else {
                    const newPlane = {
                        id: 'jet-' + Date.now(),
                        tail: tail,
                        name: name,
                        model: model,
                        icao: icao
                    };
                    this.aircraft.push(newPlane);
                }

                this.saveAircraft();
                this.renderAircraftList();
                this.refreshLiveData();

                e.target.reset();
                if (statusPill) statusPill.style.display = 'none';
                delete modelInput.dataset.autofilled;
                delete nameInput.dataset.autofilled;
                closeModal();
            } finally {
                if (submitBtn) {
                    submitBtn.textContent = origText;
                    submitBtn.disabled = false;
                }
            }
        });

        // Back to Fleet & Close Selected Flight Handlers
        const backToFleetBtn = document.getElementById('back-to-fleet-btn');
        if (backToFleetBtn) {
            backToFleetBtn.addEventListener('click', () => this.deselectAircraft());
        }
        const closeSelectedBtn = document.getElementById('close-selected-btn');
        if (closeSelectedBtn) {
            closeSelectedBtn.addEventListener('click', () => {
                this.deselectAircraft();
                const appLayout = document.querySelector('.app-layout');
                if (appLayout && window.innerWidth <= 860) {
                    appLayout.classList.add('sidebar-collapsed');
                    const toggle = document.getElementById('sidebar-edge-toggle');
                    if (toggle) toggle.classList.add('collapsed');
                }
            });
        }

        // FR24 Accordion Toggles (Telemetry Specs, Recent Flights, & Live ATC)
        const accSpecsBtn = document.getElementById('acc-btn-specs');
        const accSpecsBody = document.getElementById('acc-body-specs');
        if (accSpecsBtn && accSpecsBody) {
            accSpecsBtn.addEventListener('click', () => {
                accSpecsBtn.classList.toggle('active');
                accSpecsBody.classList.toggle('collapsed');
            });
        }

        const accHistBtn = document.getElementById('acc-btn-history');
        const accHistBody = document.getElementById('acc-body-history');
        if (accHistBtn && accHistBody) {
            accHistBtn.addEventListener('click', () => {
                accHistBtn.classList.toggle('active');
                accHistBody.classList.toggle('collapsed');
            });
        }

        const accAtcBtn = document.getElementById('acc-btn-atc');
        const accAtcBody = document.getElementById('acc-body-atc');
        if (accAtcBtn && accAtcBody) {
            accAtcBtn.addEventListener('click', () => {
                accAtcBtn.classList.toggle('active');
                accAtcBody.classList.toggle('collapsed');
            });
        }

        // Live ATC Radio Tuner Controls
        const atcTabOrig = document.getElementById('atc-tab-orig');
        if (atcTabOrig) {
            atcTabOrig.addEventListener('click', () => this.switchAtcAirportTab('orig'));
        }

        const atcTabDest = document.getElementById('atc-tab-dest');
        if (atcTabDest) {
            atcTabDest.addEventListener('click', () => this.switchAtcAirportTab('dest'));
        }

        const atcPlayBtn = document.getElementById('atc-play-btn');
        if (atcPlayBtn) {
            atcPlayBtn.addEventListener('click', () => this.toggleAtcStream());
        }

        const atcVolSlider = document.getElementById('atc-volume-slider');
        if (atcVolSlider) {
            atcVolSlider.addEventListener('input', (e) => {
                this.atcVolume = parseFloat(e.target.value);
                const audio = this.getAtcAudio();
                if (audio) audio.volume = this.atcVolume;
            });
        }

        // Initialize and bind ATC stream audio element
        this.getAtcAudio();

        // Floating Edge Chevron Toggle to Collapse/Expand Sidebar Panel
        const edgeToggle = document.getElementById('sidebar-edge-toggle');
        if (edgeToggle) {
            edgeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar();
            });
        }

        const mobileToggleBtn = document.getElementById('toggle-mobile-list');
        if (mobileToggleBtn) {
            mobileToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar();
            });
        }

        // Restore saved sidebar slider preference
        if (localStorage.getItem('jetwatch_sidebar_hidden') === 'true') {
            this.toggleSidebar(true);
        }

        // Keyboard shortcut: Press '[' or '\' to toggle sidebar slider
        document.addEventListener('keydown', (e) => {
            if ((e.key === '[' || e.key === '\\') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                this.toggleSidebar();
            }
        });



        // Edit Aircraft Modal
        const editModal = document.getElementById('edit-modal');

        const closeEditModal = () => {
            editModal.hidden = true;
            editModal.style.display = 'none';
            document.getElementById('edit-plane-form').reset();
            const editStatusPill = document.getElementById('edit-tail-lookup-status');
            if (editStatusPill) editStatusPill.style.display = 'none';
        };

        document.getElementById('close-edit-modal-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeEditModal();
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeEditModal();
        });

        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !editModal.hidden) closeEditModal();
        });

        // Auto-detection in Edit modal
        let editTailTimeout = null;
        const editTailInput = document.getElementById('edit-tail');
        const editStatusPill = document.getElementById('edit-tail-lookup-status');
        const editIcaoInput = document.getElementById('edit-icao');
        const editModelInput = document.getElementById('edit-model');
        const editNameInput = document.getElementById('edit-name');

        editTailInput.addEventListener('input', () => {
            clearTimeout(editTailTimeout);
            const val = editTailInput.value.trim().toUpperCase();
            if (val.length < 2) {
                if (editStatusPill) editStatusPill.style.display = 'none';
                return;
            }
            editTailTimeout = setTimeout(async () => {
                if (editStatusPill) {
                    editStatusPill.className = 'lookup-status-pill loading';
                    editStatusPill.style.display = 'flex';
                    editStatusPill.innerHTML = '<span class="status-dot"></span> Checking registry...';
                }
                const info = await this.lookupAircraft(val);
                if (info && info.icao) {
                    editIcaoInput.value = info.icao;
                    if (info.model && !editModelInput.value) editModelInput.value = info.model;
                    if (info.name && !editNameInput.value) editNameInput.value = info.name;
                    if (editStatusPill) {
                        editStatusPill.className = 'lookup-status-pill success';
                        editStatusPill.innerHTML = `✓ Recognized: ${info.model || 'Aircraft'} (${info.icao})`;
                    }
                } else {
                    const hex = nNumberToHex(val);
                    if (hex) {
                        editIcaoInput.value = hex;
                        if (editStatusPill) {
                            editStatusPill.className = 'lookup-status-pill success';
                            editStatusPill.innerHTML = `✓ US N-Number (Hex: <code>${hex}</code>)`;
                        }
                    } else if (editStatusPill) {
                        editStatusPill.style.display = 'none';
                    }
                }
            }, 400);
        });

        document.getElementById('edit-plane-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-aircraft-id').value;
            const plane = this.aircraft.find(a => a.id === id);
            if (!plane) return;

            plane.tail = document.getElementById('edit-tail').value.trim().toUpperCase();
            plane.name = document.getElementById('edit-name').value.trim();
            plane.model = document.getElementById('edit-model').value.trim() || 'Private Aircraft';
            plane.icao = (document.getElementById('edit-icao').value.trim() || nNumberToHex(plane.tail) || '').toLowerCase();

            this.saveAircraft();
            this.renderAircraftList();
            this.refreshLiveData();
            closeEditModal();
        });

        // Store closeEditModal for use in renderAircraftList
        this._closeEditModal = closeEditModal;
        this._openEditModal = (id) => {
            const plane = this.aircraft.find(a => a.id === id);
            if (!plane) return;
            document.getElementById('edit-aircraft-id').value = plane.id;
            document.getElementById('edit-tail').value = plane.tail;
            document.getElementById('edit-name').value = plane.name;
            document.getElementById('edit-model').value = plane.model;
            document.getElementById('edit-icao').value = plane.icao || '';
            if (editStatusPill) editStatusPill.style.display = 'none';
            editModal.hidden = false;
            editModal.style.display = 'flex';
        };

        // Flight Route History Modal setup
        const historyModal = document.getElementById('history-modal');
        const closeHistoryModal = () => {
            if (historyModal) {
                historyModal.hidden = true;
                historyModal.style.display = 'none';
            }
        };

        const closeHistBtn = document.getElementById('close-history-modal-btn');
        if (closeHistBtn) {
            closeHistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeHistoryModal();
            });
        }

        if (historyModal) {
            historyModal.addEventListener('click', (e) => {
                if (e.target === historyModal) closeHistoryModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && historyModal && !historyModal.hidden) closeHistoryModal();
        });

        // View Past Routes button in Selected Jet card
        const selHistBtn = document.getElementById('sel-history-btn');
        if (selHistBtn) {
            selHistBtn.addEventListener('click', () => {
                if (this.selectedAircraftId) {
                    const plane = this.aircraft.find(a => a.id === this.selectedAircraftId);
                    if (plane) {
                        const targetIdent = (plane.lastBroadcastFlight || (plane.liveData && plane.liveData.callsign) || plane.tail || plane.icao || '').trim();
                        this.openFlightHistory(targetIdent, plane.name || plane.tail);
                    }
                }
            });
        }
    }

    async openFlightHistory(ident, planeTitle) {
        const historyModal = document.getElementById('history-modal');
        const contentEl = document.getElementById('history-modal-content');
        const titleEl = document.getElementById('history-modal-title');
        const subEl = document.getElementById('history-modal-sub');
        if (!historyModal || !contentEl) return;

        const cleanIdent = (ident || '').trim().toUpperCase();
        titleEl.textContent = `${cleanIdent} · Flight History`;
        subEl.textContent = planeTitle ? `Past routes flown by ${planeTitle}` : 'Past routes & activity log';

        contentEl.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <div class="pulse-dot" style="margin: 0 auto 12px; width: 12px; height: 12px; background: var(--color-accent);"></div>
                Loading verified flight history for ${escapeHtml(cleanIdent)}...
            </div>
        `;

        historyModal.hidden = false;
        historyModal.style.display = 'flex';

        try {
            const apiBase = getAppApiBase();
            const res = await fetch(`${apiBase}/api/history/${encodeURIComponent(cleanIdent)}`);
            if (res.ok) {
                const data = await res.json();
                const flights = (data && data.flights) || [];
                if (flights.length === 0) {
                    contentEl.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 0.9rem;">
                            No past flights logged in the last 7 days for <b>${escapeHtml(cleanIdent)}</b>.
                        </div>
                    `;
                    return;
                }

                contentEl.innerHTML = flights.map(f => {
                    const isAir = f.status === 'airborne';
                    const isArrived = f.status === 'arrived';
                    const statusBadge = isAir 
                        ? '<span class="badge badge-air"><span class="pulse-dot" style="width:6px;height:6px;"></span>Live</span>'
                        : isArrived 
                        ? '<span class="badge badge-ground" style="color:#60a5fa;border-color:rgba(96,165,250,0.3);background:rgba(96,165,250,0.1);">Arrived</span>'
                        : `<span class="badge badge-offline">${escapeHtml(f.status || 'Scheduled')}</span>`;

                    return `
                        <div class="history-card">
                            <div class="history-card-top">
                                <div>
                                    <span class="history-callsign">${escapeHtml(f.callsign || cleanIdent)}</span>
                                    ${f.tail && f.tail !== f.callsign ? `<span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">(${escapeHtml(f.tail)})</span>` : ''}
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    ${f.date ? `<span class="history-date">${escapeHtml(f.date)}</span>` : ''}
                                    ${statusBadge}
                                </div>
                            </div>
                            <div class="history-route-row">
                                <div class="history-airport">
                                    <span class="history-iata">${escapeHtml(f.origin.iata)}</span>
                                    <span class="history-city" title="${escapeHtml(f.origin.city)}">${escapeHtml(f.origin.city)}</span>
                                </div>
                                <div class="history-arrow-box">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(90deg); color: var(--color-accent); opacity: 0.85;">
                                        <path d="M12 2L8 9L3 11.5L3 13.5L8 12.5L8 18L6 19.5L6 21L12 19.5L18 21L18 19.5L16 18L16 12.5L21 13.5L21 11.5L16 9Z"/>
                                    </svg>
                                    ${f.duration ? `<span class="history-duration">${escapeHtml(f.duration)}</span>` : ''}
                                </div>
                                <div class="history-airport dest">
                                    <span class="history-iata">${escapeHtml(f.destination.iata)}</span>
                                    <span class="history-city" title="${escapeHtml(f.destination.city)}">${escapeHtml(f.destination.city)}</span>
                                </div>
                            </div>
                            <div class="history-card-foot">
                                <span>${escapeHtml(f.aircraftModel || 'Commercial / VIP Jet')}</span>
                                ${f.time ? `<span>Dep: ${escapeHtml(f.time)}</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                contentEl.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                        Unable to load flight history. Ensure JetWatch server is running.
                    </div>
                `;
            }
        } catch (err) {
            contentEl.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    Error loading history: ${escapeHtml(err.message)}
                </div>
            `;
        }
    }

    toggleSidebar(forceState) {
        const layout = document.querySelector('.app-layout');
        if (!layout) return;
        const isCollapsed = forceState !== undefined 
            ? forceState 
            : !layout.classList.contains('sidebar-collapsed');

        if (isCollapsed) {
            layout.classList.add('sidebar-collapsed');
            localStorage.setItem('jetwatch_sidebar_hidden', 'true');
        } else {
            layout.classList.remove('sidebar-collapsed');
            localStorage.setItem('jetwatch_sidebar_hidden', 'false');
        }

        const edgeToggle = document.getElementById('sidebar-edge-toggle');
        if (edgeToggle) {
            edgeToggle.title = isCollapsed ? 'Open Fleet Panel' : 'Hide Fleet Panel';
            edgeToggle.setAttribute('aria-label', edgeToggle.title);
        }

        // Trigger map resize so MapLibre vector map redraws to fill the new viewport
        setTimeout(() => {
            if (this.map && this.map.resize) {
                this.map.resize();
            }
        }, 320);
    }

    /**
     * Fetch live data from open ADS-B API
     */
    async refreshLiveData() {
        const hexList = this.aircraft.map(a => a.icao).filter(Boolean);
        if (!hexList.length) return;

        let observations = null;

        // Attempt 0: Server proxy (/api/hex/ - 100% reliable, zero CORS/filter blocks)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const apiBase = getAppApiBase();
            const localUrl = `${apiBase}/api/hex/${hexList.join(',')}`;
            const res = await fetch(localUrl, { signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                observations = data.ac || [];
                document.getElementById('live-indicator-text').textContent = 'Live Feed Active';
            }
        } catch (e) {
            // Local server not running or file:// mode, continue to external
        }

        // Attempt 1: Direct fetch from api.adsb.lol (CORS friendly & reliable)
        if (!observations) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const directLol = `https://api.adsb.lol/v2/hex/${hexList.join(',')}`;
                const res = await fetch(directLol, { signal: controller.signal, cache: 'no-store' });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const data = await res.json();
                    observations = data.ac || [];
                    document.getElementById('live-indicator-text').textContent = 'Live Feed Active';
                }
            } catch (err) {}
        }

        // Attempt 2: Direct fetch from opendata.adsb.fi
        if (!observations) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const directUrl = `https://opendata.adsb.fi/api/v2/hex/${hexList.join(',')}`;
                const res = await fetch(directUrl, { signal: controller.signal, cache: 'no-store' });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const data = await res.json();
                    observations = data.ac || [];
                    document.getElementById('live-indicator-text').textContent = 'Live Feed Active';
                }
            } catch (err) {}
        }

        // Attempt 3: Fast CORS proxy fallback
        if (!observations) {
            observations = await this.fetchFallback(hexList);
        }

        // Check for any aircraft that didn't match standard hex observations (e.g. newly added commercial flight numbers or satellite flights)
        const currentHexSet = new Set((observations || []).map(o => (o.hex || '').toLowerCase()));
        const missingPlanes = this.aircraft.filter(a => {
            const hex = (a.icao || '').toLowerCase();
            return !currentHexSet.has(hex);
        });

        if (missingPlanes.length > 0) {
            try {
                const apiBase = getAppApiBase();
                const callsignResults = await Promise.all(missingPlanes.map(async plane => {
                    const q = (plane.tail || plane.icao || '').trim().replace(/\s+/g, '');
                    if (!q) return null;

                    // 1. Try local server callsign proxy
                    try {
                        const r = await fetch(`${apiBase}/api/callsign/${encodeURIComponent(q)}`, { cache: 'no-store' });
                        if (r && r.ok) {
                            const d = await r.json();
                            if (d && d.ac && d.ac.length > 0) return d.ac[0];
                        }
                    } catch (e) {}

                    // 2. Direct browser adsb.lol query (CORS enabled)
                    try {
                        const candidates = [q];
                        const mIata = q.toUpperCase().match(/^([A-Z0-9]{2})([0-9]+)$/);
                        if (mIata) {
                            const iataMap = { 'LY': 'ELY', 'UA': 'UAL', 'DL': 'DAL', 'AA': 'AAL', 'BA': 'BAW' };
                            const pfx = iataMap[mIata[1]] || mIata[1];
                            const unp = mIata[2].replace(/^0+/, '');
                            candidates.push(`${pfx}${unp}`, `${pfx}${unp.padStart(3, '0')}`);
                        }
                        for (const c of candidates) {
                            const rLol = await fetch(`https://api.adsb.lol/v2/callsign/${encodeURIComponent(c)}`, { cache: 'no-store' });
                            if (rLol && rLol.ok) {
                                const dLol = await rLol.json();
                                if (dLol && dLol.ac && dLol.ac.length > 0) return dLol.ac[0];
                            }
                        }
                    } catch (e) {}

                    return null;
                }));

                // Auto-heal missing planes with authentic hex and persist
                let didHeal = false;
                callsignResults.forEach((obs, idx) => {
                    if (obs && obs.hex) {
                        const plane = missingPlanes[idx];
                        if (plane && (!plane.icao || plane.icao.toLowerCase() !== obs.hex.toLowerCase())) {
                            plane.icao = obs.hex.toLowerCase();
                            if (obs.r && (!plane.name || plane.name === plane.tail)) {
                                plane.name = `${plane.tail} (${obs.r.toUpperCase()})`;
                            }
                            didHeal = true;
                        }
                    }
                });
                if (didHeal) this.saveAircraft();

                const validExtra = callsignResults.filter(Boolean);
                if (validExtra.length > 0) {
                    observations = [...(observations || []), ...validExtra];
                }
            } catch (e) {}
        }

        if (observations && observations.length >= 0) {
            this.processLiveObservations(observations);
        }

        this.renderStats();
        this.renderAircraftList();
        if (this.map) this.map.updateAircraftMarkers(this.aircraft, this.selectedAircraftId);
        if (this.selectedAircraftId) this.updateSelectedCard();
    }

    async fetchFallback(hexList) {
        // Query individual hexes concurrently with 3s timeout
        const promises = hexList.slice(0, 10).map(async hex => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            try {
                // Try corsproxy first
                const target = `https://opendata.adsb.fi/api/v2/hex/${hex}`;
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
                const r = await fetch(proxyUrl, { signal: controller.signal, cache: 'no-store' });
                clearTimeout(timeoutId);
                if (r.ok) {
                    const d = await r.json();
                    return (d.ac && d.ac[0]) ? d.ac[0] : null;
                }
            } catch {
                clearTimeout(timeoutId);
            }
            return null;
        });

        try {
            const results = (await Promise.all(promises)).filter(Boolean);
            document.getElementById('live-indicator-text').textContent = results.length > 0 ? 'Live Feed Active' : 'ADS-B Connected';
            return results;
        } catch {
            document.getElementById('live-indicator-text').textContent = 'Offline / Retrying';
            return [];
        }
    }

    orientRoute(aircraftObj, route) {
        if (!route || !route.origin || !route.destination) return;
        // Never mutate an authoritative route from a verified API
        if (route.authoritative || route.oriented) return;
        if (!aircraftObj || !aircraftObj.liveData || !Number.isFinite(aircraftObj.liveData.lat) || !Number.isFinite(aircraftObj.liveData.lon)) return;

        const planeLat = aircraftObj.liveData.lat;
        const planeLon = aircraftObj.liveData.lon;
        const orig = route.origin;
        const dest = route.destination;

        if (Number.isFinite(orig.lat) && Number.isFinite(dest.lat) && Number.isFinite(orig.lon) && Number.isFinite(dest.lon)) {
            const toRad = d => d * Math.PI / 180;
            const toDeg = r => r * 180 / Math.PI;
            const calcBearing = (lat1, lon1, lat2, lon2) => {
                const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
                const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
                          Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
                return (toDeg(Math.atan2(y, x)) + 360) % 360;
            };

            const bOrigToDest = calcBearing(orig.lat, orig.lon, dest.lat, dest.lon);
            const bDestToOrig = calcBearing(dest.lat, dest.lon, orig.lat, orig.lon);

            let shouldSwap = false;
            if (Number.isFinite(aircraftObj.liveData.track) && aircraftObj.liveData.speed > 60) {
                const trk = aircraftObj.liveData.track;
                const diffOrigToDest = Math.abs((trk - bOrigToDest + 180) % 360 - 180);
                const diffDestToOrig = Math.abs((trk - bDestToOrig + 180) % 360 - 180);

                if (diffDestToOrig < diffOrigToDest && diffDestToOrig < 70) {
                    shouldSwap = true;
                }
            }

            if (shouldSwap) {
                const temp = route.origin;
                route.origin = route.destination;
                route.destination = temp;
            }
            route.oriented = true;
        }
    }

    async fetchRouteInfo(callsign, aircraftObj) {
        if (!callsign && (!aircraftObj || !aircraftObj.tail)) return;
        const cleanCallsign = (callsign || '').trim().toUpperCase();
        const cleanTail = (aircraftObj && aircraftObj.tail ? aircraftObj.tail.trim().toUpperCase() : '');
        const target = cleanCallsign || cleanTail;

        // Check recent cache (valid for 15 minutes)
        if (target && this.routeCache.has(target)) {
            const entry = this.routeCache.get(target);
            if (entry && entry.time && (Date.now() - entry.time < 15 * 60 * 1000)) {
                aircraftObj.route = entry.route;
                return;
            }
        }

        try {
            // First attempt: live node server proxy route (always prioritizes current active leg)
            const apiBase = getAppApiBase();
            let res = await fetch(`${apiBase}/api/route/${target}`, { cache: 'no-store' }).catch(() => null);

            // Fallback: direct adsbdb or allorigins proxy
            if (!res || !res.ok) {
                const directUrl = `https://api.adsbdb.com/v0/callsign/${target}`;
                res = await fetch(directUrl).catch(() => null);
                if (!res || !res.ok) {
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
                    res = await fetch(proxyUrl, { cache: 'default' }).catch(() => null);
                }
            }

            if (res && res.ok) {
                const data = await res.json();
                if (data && data.response && data.response.flightroute) {
                    const fr = data.response.flightroute;
                    let orig = {
                        iata: (fr.origin && (fr.origin.iata_code || fr.origin.iata)) || (fr.origin && (fr.origin.icao_code || fr.origin.icao)) || 'ORIG',
                        city: (fr.origin && (fr.origin.municipality || fr.origin.name || fr.origin.city)) || '',
                        lat: fr.origin && (fr.origin.latitude ?? fr.origin.lat),
                        lon: fr.origin && (fr.origin.longitude ?? fr.origin.lon),
                        tz: (fr.origin && fr.origin.tz) || null
                    };
                    let dest = {
                        iata: (fr.destination && (fr.destination.iata_code || fr.destination.iata)) || (fr.destination && (fr.destination.icao_code || fr.destination.icao)) || 'DEST',
                        city: (fr.destination && (fr.destination.municipality || fr.destination.name || fr.destination.city)) || '',
                        lat: fr.destination && (fr.destination.latitude ?? fr.destination.lat),
                        lon: fr.destination && (fr.destination.longitude ?? fr.destination.lon),
                        tz: (fr.destination && fr.destination.tz) || null
                    };

                    const routeData = {
                        origin: orig,
                        destination: dest,
                        times: fr.times || null,
                        authoritative: true
                    };

                    // Check if route changed from prior leg
                    const isDifferent = !aircraftObj.route ||
                        (aircraftObj.route.origin && aircraftObj.route.origin.iata !== orig.iata) ||
                        (aircraftObj.route.destination && aircraftObj.route.destination.iata !== dest.iata);

                    if (isDifferent) {
                        const trackKey = (aircraftObj.icao || aircraftObj.tail).toLowerCase();
                        if (aircraftObj.liveData) {
                            this.trailHistory.set(trackKey, [[aircraftObj.liveData.lon, aircraftObj.liveData.lat]]);
                        }
                    }

                    aircraftObj.route = routeData;
                    this.routeCache.set(target, { route: routeData, time: Date.now() });

                    // If currently selected, re-render selected card & trail
                    if (this.selectedAircraftId === aircraftObj.id) {
                        this.updateSelectedCard();
                        this.updateFlightTimeline(aircraftObj);
                        this.updateMapTrailForSelected();
                    }
                    this.renderAircraftList();
                    return;
                }
            }

            // Fallback to KNOWN_ROUTES if live API had no route
            const fallbackKey = (cleanCallsign && KNOWN_ROUTES[cleanCallsign]) ? cleanCallsign :
                                (cleanTail && KNOWN_ROUTES[cleanTail]) ? cleanTail : null;
            if (fallbackKey && !aircraftObj.route) {
                const fallback = JSON.parse(JSON.stringify(KNOWN_ROUTES[fallbackKey]));
                this.orientRoute(aircraftObj, fallback);
                aircraftObj.route = fallback;
                this.renderAircraftList();
            }
        } catch (e) {
            console.warn('Route lookup skipped:', e);
        }
    }

    processLiveObservations(observations) {
        const obsMap = new Map();
        const registerObsKey = (k, o) => {
            if (!k) return;
            const clean = k.trim().toLowerCase();
            if (clean) obsMap.set(clean, o);
        };

        observations.forEach(o => {
            if (o.hex) registerObsKey(o.hex, o);
            if (o.flight) {
                const fl = o.flight.trim().replace(/\s+/g, '');
                registerObsKey(fl, o);
                const mPadded = fl.match(/^([A-Za-z]{3})0*([0-9]+)$/);
                if (mPadded) {
                    const pfx = mPadded[1].toUpperCase();
                    const num = mPadded[2];
                    registerObsKey(`${pfx}${num}`, o);
                    registerObsKey(`${pfx}${num.padStart(3, '0')}`, o);
                    const icaoToIata = { 'ELY': 'LY', 'UAL': 'UA', 'DAL': 'DL', 'AAL': 'AA', 'BAW': 'BA', 'DLH': 'LH', 'VJT': 'VJT', 'LXJ': 'LXJ', 'EJA': 'EJA' };
                    const iataPrefix = icaoToIata[pfx];
                    if (iataPrefix) {
                        registerObsKey(`${iataPrefix}${num}`, o);
                        registerObsKey(`${iataPrefix}${num.padStart(2, '0')}`, o);
                        registerObsKey(`${iataPrefix}${num.padStart(3, '0')}`, o);
                    }
                }
            }
            if (o.r) {
                const reg = o.r.trim();
                registerObsKey(reg, o);
                registerObsKey(reg.replace(/[\s\-]/g, ''), o);
            }
        });

        this.aircraft.forEach(a => {
            const hexKey = (a.icao || '').trim().toLowerCase();
            const rawTail = (a.tail || '').trim().toLowerCase();
            const cleanTail = rawTail.replace(/[\s\-]/g, '');
            const candidateKeys = [hexKey, rawTail, cleanTail];

            // 2-Letter IATA e.g. LY9, UA85
            const mTail = cleanTail.toUpperCase().match(/^([A-Z0-9]{2})([0-9]+)$/);
            if (mTail) {
                const iataToIcao = { 'LY': 'ELY', 'UA': 'UAL', 'DL': 'DAL', 'AA': 'AAL', 'BA': 'BAW', 'LH': 'DLH', 'AF': 'AFR', 'KL': 'KLM' };
                const icaoPfx = (iataToIcao[mTail[1]] || mTail[1]).toLowerCase();
                const unpadded = mTail[2].replace(/^0+/, '');
                candidateKeys.push(`${mTail[1].toLowerCase()}${unpadded}`);
                candidateKeys.push(`${mTail[1].toLowerCase()}${unpadded.padStart(2, '0')}`);
                candidateKeys.push(`${mTail[1].toLowerCase()}${unpadded.padStart(3, '0')}`);
                candidateKeys.push(`${icaoPfx}${unpadded}`);
                candidateKeys.push(`${icaoPfx}${unpadded.padStart(3, '0')}`);
                candidateKeys.push(`${icaoPfx}${unpadded.padStart(4, '0')}`);
            }

            // 3-Letter ICAO e.g. ELY009, VJT289, LXJ379
            const m3 = cleanTail.toUpperCase().match(/^([A-Z]{3})0*([0-9]+)$/);
            if (m3) {
                const pfx = m3[1].toLowerCase();
                const num = m3[2];
                candidateKeys.push(`${pfx}${num}`);
                candidateKeys.push(`${pfx}${num.padStart(3, '0')}`);
                candidateKeys.push(`${pfx}${num.padStart(4, '0')}`);
                const icaoToIata = { 'ely': 'ly', 'ual': 'ua', 'dal': 'dl', 'aal': 'aa', 'baw': 'ba', 'dlh': 'lh' };
                if (icaoToIata[pfx]) {
                    candidateKeys.push(`${icaoToIata[pfx]}${num}`);
                    candidateKeys.push(`${icaoToIata[pfx]}${num.padStart(2, '0')}`);
                    candidateKeys.push(`${icaoToIata[pfx]}${num.padStart(3, '0')}`);
                }
            }

            let o = null;
            for (const k of candidateKeys) {
                if (k && obsMap.has(k)) {
                    o = obsMap.get(k);
                    break;
                }
            }

            if (o && Number.isFinite(o.lat) && Number.isFinite(o.lon)) {
                // If a.icao was a placeholder or mismatched, auto-heal and permanently lock the real hex
                if (o.hex && (!a.icao || a.icao.toLowerCase() !== o.hex.toLowerCase())) {
                    a.icao = o.hex.toLowerCase();
                    if (o.r && o.r.length > 2 && (!a.name || a.name === a.tail)) {
                        a.name = `${a.tail} (${o.r.toUpperCase()})`;
                    }
                    this.saveAircraft();
                }

                // Dynamically update actual physical airframe registration and model from live transponder
                if (o.r && o.r.length > 2) {
                    a.actualTail = o.r.toUpperCase();
                }
                if (o.t || o.desc) {
                    const rawType = o.desc || o.t;
                    if (/B772|777-200|777-258/i.test(rawType)) a.model = 'Boeing 777-200ER';
                    else if (/B77W|777-300|777-358/i.test(rawType)) a.model = 'Boeing 777-300ER';
                    else if (/B789|787-9/i.test(rawType)) a.model = 'Boeing 787-9 Dreamliner';
                    else if (/B78X|787-10/i.test(rawType)) a.model = 'Boeing 787-10 Dreamliner';
                    else if (/E55P|Phenom 300/i.test(rawType)) a.model = 'Embraer Phenom 300';
                    else if (/GL75|Global 7500/i.test(rawType)) a.model = 'Bombardier Global 7500';
                    else if (KNOWN_MODELS[rawType]) a.model = KNOWN_MODELS[rawType];
                }

                // Determine status (Robust Ground vs Airborne Detection)
                let isAir = false;
                const alt = o.alt_baro;
                const speed = Number.isFinite(o.gs) ? o.gs : null;
                const vrate = Number.isFinite(o.baro_rate) ? o.baro_rate : 0;
                const isHelo = (a.model && a.model.toLowerCase().includes('helicopter')) || 
                               (a.name && a.name.toLowerCase().includes('helicopter')) ||
                               (a.model && (a.model.includes('S-76') || a.model.includes('H160')));

                if (o.status === 'ground' || alt === 'ground' || alt === 0) {
                    isAir = false;
                } else if (!isHelo && speed !== null && speed < 45) {
                    // Aircraft is stationary or taxiing on the ground (stall speed is >80-120 kts)
                    isAir = false;
                } else if (!isHelo && speed === null && (!Number.isFinite(alt) || alt < 1200)) {
                    // Parked aircraft reporting without ground speed
                    isAir = false;
                } else if (isHelo) {
                    // Helicopter airborne/hovering
                    isAir = Number.isFinite(alt) && alt > 150 && (speed === null || speed >= 20 || Math.abs(vrate) > 100);
                } else if (speed !== null && speed >= 85) {
                    // True flying speed (jets cannot taxi at 85+ kts)
                    isAir = true;
                } else if (Number.isFinite(alt) && alt > 2500) {
                    // High altitude cruise well above all common airport elevations
                    isAir = true;
                } else if (speed !== null && speed >= 60 && Number.isFinite(alt) && alt > 300 && vrate > 350) {
                    // Active climb out on takeoff roll
                    isAir = true;
                } else if (Number.isFinite(alt) && alt > 1000 && speed !== null && speed >= 55) {
                    // Approach / pattern flight
                    isAir = true;
                }

                a.liveData = {
                    lat: o.lat,
                    lon: o.lon,
                    alt: Number.isFinite(alt) ? alt : 0,
                    isGround: alt === 'ground' || !isAir,
                    status: isAir ? 'air' : 'ground',
                    speed: Math.round(o.gs || 0),
                    track: Math.round(o.track || 0),
                    vrate: Math.round(o.baro_rate || 0),
                    callsign: (o.flight || a.tail || '').trim(),
                    lastSeenTime: Date.now()
                };

                // Track position history for flight trail line
                const trackKey = (a.icao || a.tail).toLowerCase();
                if (!this.trailHistory.has(trackKey)) {
                    this.trailHistory.set(trackKey, []);
                }
                const history = this.trailHistory.get(trackKey);

                if (o.trail && Array.isArray(o.trail) && o.trail.length > 0) {
                    this.trailHistory.set(trackKey, o.trail.slice());
                } else {
                    const currentAlt = Number.isFinite(o.alt) ? o.alt : (typeof alt === 'number' ? alt : 25000);
                    const currentCoord = [o.lon, o.lat, currentAlt];
                    const lastCoord = history[history.length - 1];

                    // If coordinates jumped by > 15 nm (new flight or signal gap), reset trail!
                    if (lastCoord && Math.hypot(lastCoord[0] - currentCoord[0], lastCoord[1] - currentCoord[1]) > 0.25) {
                        history.length = 0;
                    }

                    // Append if moved by more than ~50 meters
                    if (!lastCoord || Math.abs(lastCoord[0] - currentCoord[0]) > 0.0005 || Math.abs(lastCoord[1] - currentCoord[1]) > 0.0005) {
                        history.push(currentCoord);
                        // Keep max 300 points
                        if (history.length > 300) history.shift();
                    }
                }

                // If observation includes live route details from global satellite feed
                if (o.route && o.route.origin && o.route.destination) {
                    const isNewRoute = !a.route || !a.route.origin || !a.route.destination ||
                        (a.route.origin.iata !== o.route.origin.iata) ||
                        (a.route.destination.iata !== o.route.destination.iata);

                    if (isNewRoute) {
                        a.route = { ...o.route, authoritative: true };
                        this.saveAircraft();
                        // Reset flight trail line on new flight route so prior landing approach loops disappear!
                        if (o.trail && Array.isArray(o.trail) && o.trail.length > 0) {
                            this.trailHistory.set(trackKey, o.trail.slice());
                        } else {
                            const curAlt = Number.isFinite(o.alt) ? o.alt : 25000;
                            this.trailHistory.set(trackKey, [[o.lon, o.lat, curAlt]]);
                        }
                        if (this.selectedAircraftId === a.id) {
                            this.updateSelectedCard();
                            this.updateFlightTimeline(a);
                            this.updateMapTrailForSelected();
                        }
                        this.renderAircraftList();
                    } else {
                        // Keep times & timezones updated from live feed!
                        if (o.route.times) a.route.times = o.route.times;
                        if (o.route.origin && o.route.origin.tz && a.route.origin) a.route.origin.tz = o.route.origin.tz;
                        if (o.route.destination && o.route.destination.tz && a.route.destination) a.route.destination.tz = o.route.destination.tz;
                        if (this.selectedAircraftId === a.id) {
                            this.updateFlightTimeline(a);
                        }
                    }
                }

                // If live broadcast callsign changed, query route for the active flight
                const activeFlight = (o.flight || '').trim();
                if (activeFlight && a.lastBroadcastFlight !== activeFlight) {
                    a.lastBroadcastFlight = activeFlight;
                    this.fetchRouteInfo(activeFlight, a);
                } else if (!a.route && (a.liveData.callsign || a.tail)) {
                    this.fetchRouteInfo(a.liveData.callsign || a.tail, a);
                }
            } else {
                // Keep last known if under 15 minutes, otherwise mark offline
                if (a.liveData && Date.now() - a.liveData.lastSeenTime > 15 * 60 * 1000) {
                    a.liveData = null;
                }
            }

            // Status transition check for takeoff/landing alerts (with 2-cycle debounce & 20m cooldown)
            const rawStatus = a.liveData ? a.liveData.status : 'offline';
            const icaoKey = (a.icao || a.tail || '').toLowerCase();

            // Retrieve or initialize status debounce tracker
            if (!this.statusHistoryMap.has(icaoKey)) {
                this.statusHistoryMap.set(icaoKey, {
                    confirmedStatus: rawStatus,
                    candidateStatus: rawStatus,
                    candidateCount: 1,
                    airborneSince: rawStatus === 'air' ? Date.now() : 0
                });
            }

            const statusState = this.statusHistoryMap.get(icaoKey);

            // Track candidate stability
            if (rawStatus === statusState.candidateStatus) {
                statusState.candidateCount++;
            } else {
                statusState.candidateStatus = rawStatus;
                statusState.candidateCount = 1;
            }

            // Only transition confirmedStatus when candidate is stable for at least 2 consecutive polling cycles!
            if (statusState.candidateCount >= 2 && statusState.candidateStatus !== statusState.confirmedStatus) {
                const prevConfirmed = statusState.confirmedStatus;
                const newConfirmed = statusState.candidateStatus;
                const now = Date.now();

                // TAKEOFF ALERT: Only if confirmed ground -> confirmed air
                if (prevConfirmed === 'ground' && newConfirmed === 'air') {
                    if (a.liveData) {
                        this.trailHistory.set(icaoKey, [[a.liveData.lon, a.liveData.lat]]);
                    }
                    const lastTakeoff = this.lastTakeoffAlertTime.get(icaoKey) || 0;
                    const canTakeoffAlert = (now - lastTakeoff > 20 * 60 * 1000) && (now - this.lastGlobalNotificationTime > 4000);

                    if (canTakeoffAlert) {
                        this.lastTakeoffAlertTime.set(icaoKey, now);
                        this.lastGlobalNotificationTime = now;
                        this.triggerTakeoffAlert(a);
                    }
                    statusState.airborneSince = now;
                }
                // LANDING ALERT: Only if confirmed air -> confirmed ground
                else if (prevConfirmed === 'air' && newConfirmed === 'ground') {
                    const timeInAir = now - (statusState.airborneSince || 0);
                    const lastLanding = this.lastLandingAlertTime.get(icaoKey) || 0;
                    const canLandingAlert = (timeInAir > 3 * 60 * 1000) && (now - lastLanding > 20 * 60 * 1000) && (now - this.lastGlobalNotificationTime > 4000);

                    if (canLandingAlert) {
                        this.lastLandingAlertTime.set(icaoKey, now);
                        this.lastGlobalNotificationTime = now;
                        this.triggerLandingAlert(a);
                    }
                }

                statusState.confirmedStatus = newConfirmed;
            }

            this.previousStatusMap.set(icaoKey, statusState.confirmedStatus);
        });
    }

    renderStats() {
        const total = this.aircraft.length;
        const airborne = this.aircraft.filter(a => a.liveData && a.liveData.status === 'air').length;
        const ground = this.aircraft.filter(a => a.liveData && a.liveData.status === 'ground').length;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-airborne').textContent = airborne;
        document.getElementById('stat-ground').textContent = ground;
    }

    getDisplayCallsign(plane) {
        if (!plane) return '';
        // 1. If transmitting an active live callsign
        let call = (plane.liveData && plane.liveData.callsign ? plane.liveData.callsign : '').trim().toUpperCase();

        // 2. Fallback to known fleet flight callsigns
        if (!call) {
            const cleanTail = (plane.tail || '').trim().toUpperCase();
            const cleanIcao = (plane.icao || '').trim().toLowerCase();
            const KNOWN_STATIC_CALLSIGNS = {
                '4X-EDC': 'LY9',
                '7380C2': 'LY9',
                '9H-VISTA': 'VJT289',
                '4D23AB': 'VJT289',
                'N379FX': 'LXJ379',
                'A455CD': 'LXJ379',
                'N595QS': 'EJA595',
                'A7B169': 'EJA595',
                'N517DN': 'DL887',
                'A67BC8': 'DL887',
                'UAL85': 'UA85',
                'UA85': 'UA85',
                '4D6A98': 'UA85'
            };
            call = KNOWN_STATIC_CALLSIGNS[cleanTail] || KNOWN_STATIC_CALLSIGNS[cleanIcao] || '';
        }

        if (call) {
            const icaoMap = {
                'ELY': 'LY', 'UAL': 'UA', 'DAL': 'DL', 'AAL': 'AA',
                'BAW': 'BA', 'DLH': 'LH', 'AFR': 'AF', 'KLM': 'KL',
                'UAE': 'EK', 'QTR': 'QR', 'ETD': 'EY', 'SWR': 'LX'
            };
            const m = call.match(/^([A-Z]{3})\s*0*([0-9]+[A-Z]?)$/);
            if (m && icaoMap[m[1]]) {
                return `${icaoMap[m[1]]}${m[2]}`;
            }
            return call.replace(/\s+/g, '');
        }

        return plane.tail || 'Aircraft';
    }

    renderAircraftList() {
        const container = document.getElementById('aircraft-list');
        container.innerHTML = '';

        const filtered = this.aircraft.filter(a => {
            // Text search
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase().trim();
                const cleanQ = q.replace(/[^a-z0-9]/g, '');
                const isElAlSearch = (a.icao === '7380c2' || a.tail === '4X-EDC') && 
                    ['ly4', 'ly04', 'ly004', 'ely4', 'ly9', 'ly09', 'ly009', 'ely9', 'ely009', 'elal'].includes(cleanQ);

                const match = a.tail.toLowerCase().includes(q) ||
                              a.name.toLowerCase().includes(q) ||
                              a.model.toLowerCase().includes(q) ||
                              (a.liveData && a.liveData.callsign && a.liveData.callsign.toLowerCase().includes(q)) ||
                              isElAlSearch;
                if (!match) return false;
            }

            // Fleet Tag filter
            const isHelo = (a.model && a.model.toLowerCase().includes('helicopter')) || 
                           (a.name && a.name.toLowerCase().includes('helicopter')) ||
                           (a.model && (a.model.includes('S-76') || a.model.includes('H160')));

            if (this.currentFilter === 'air') {
                return a.liveData && a.liveData.status === 'air';
            } else if (this.currentFilter === 'helo') {
                return isHelo;
            } else if (this.currentFilter === 'jets') {
                return !isHelo;
            }
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 0.85rem;">
                    No aircraft found matching your search.
                </div>
            `;
            return;
        }

        // Sort airborne planes to the top
        filtered.sort((a, b) => {
            const aAir = a.liveData && a.liveData.status === 'air' ? 1 : 0;
            const bAir = b.liveData && b.liveData.status === 'air' ? 1 : 0;
            return bAir - aAir;
        });

        filtered.forEach(a => {
            const card = document.createElement('div');
            card.className = `plane-card ${a.id === this.selectedAircraftId ? 'active' : ''}`;
            card.dataset.id = a.id;

            const isAir = a.liveData && a.liveData.status === 'air';
            const isGround = a.liveData && a.liveData.status === 'ground';

            const displayCall = this.getDisplayCallsign(a);
            const displaySub = (a.tail && a.tail !== displayCall) ? `(${a.tail})` : '';

            let badgeHtml = '<span class="badge badge-offline">Offline</span>';
            if (isAir) {
                badgeHtml = '<span class="badge badge-air"><span class="pulse-dot" style="width:6px;height:6px;"></span>Live</span>';
            } else if (isGround) {
                badgeHtml = '<span class="badge badge-ground">On Ground</span>';
            }

            let statsGridHtml = '';
            if (a.liveData) {
                const altText = isAir ? `${a.liveData.alt.toLocaleString()} ft` : 'Ground';
                const speedText = `${a.liveData.speed} kts`;
                const headingText = `${a.liveData.track}° ${getCompass(a.liveData.track)}`;

                statsGridHtml = `
                    <div class="card-stats">
                        <div class="mini-stat">
                            <span class="mini-stat-label">Altitude</span>
                            <span class="mini-stat-val">${altText}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">Speed</span>
                            <span class="mini-stat-val">${speedText}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">Heading</span>
                            <span class="mini-stat-val">${headingText}</span>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-top">
                    <div>
                        <div class="card-tail">${escapeHtml(displayCall)} ${displaySub ? `<span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal; margin-left:4px;">${escapeHtml(displaySub)}</span>` : ''}</div>
                        <div class="card-owner">${escapeHtml(a.name)}</div>
                    </div>
                    ${badgeHtml}
                </div>
                <div class="card-model">${escapeHtml(a.model)}</div>
                ${a.route && a.route.origin && a.route.destination ? `
                    <div class="card-route-pill">
                        <span>${escapeHtml(a.route.origin.iata)}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(90deg);"><path d="M12 2L8 9L3 11.5L3 13.5L8 12.5L8 18L6 19.5L6 21L12 19.5L18 21L18 19.5L16 18L16 12.5L21 13.5L21 11.5L16 9Z"/></svg>
                        <span style="${(a.route.destination.iata === 'PVT' || a.route.destination.iata === 'CONFIDENTIAL' || a.route.destination.isConfidential) ? 'font-size: 0.65rem; opacity: 0.9;' : ''}">${escapeHtml(
                            (a.route.destination.iata === 'PVT' || a.route.destination.iata === 'CONFIDENTIAL' || a.route.destination.isConfidential) ? 'CONFIDENTIAL' : a.route.destination.iata
                        )}</span>
                    </div>
                ` : ''}
                <div class="card-icao">ICAO: <span class="icao-code">${escapeHtml(a.icao || '—')}</span></div>
                ${statsGridHtml}
                <div class="card-actions">
                    <button class="card-history-btn" data-id="${a.id}" title="View past flight routes">History</button>
                    <button class="card-edit-btn" data-id="${a.id}">Edit</button>
                    <button class="card-del-btn" data-id="${a.id}">Delete</button>
                </div>
            `;

            // Card click selects plane
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('card-del-btn')) return;
                if (e.target.classList.contains('card-edit-btn')) return;
                if (e.target.classList.contains('card-history-btn')) return;
                this.selectAircraft(a.id);
            });

            // History button click
            const histBtn = card.querySelector('.card-history-btn');
            if (histBtn) {
                histBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetIdent = (a.lastBroadcastFlight || (a.liveData && a.liveData.callsign) || a.tail || a.icao || '').trim();
                    this.openFlightHistory(targetIdent, a.name || a.tail);
                });
            }

            // Edit button click
            const editBtn = card.querySelector('.card-edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this._openEditModal) this._openEditModal(a.id);
            });

            // Delete button click
            const delBtn = card.querySelector('.card-del-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Remove ${a.tail} (${a.name}) from tracker?`)) {
                    this.deleteAircraft(a.id);
                }
            });

            container.appendChild(card);
        });
    }

    selectAircraft(id) {
        if (this.selectedAircraftId !== id) {
            this.stopAtcStream();
            this.atcTargetTab = null;
            this.currentAtcAirport = null;
        }
        this.selectedAircraftId = id;

        // Switch unified left drawer view: Hide Fleet View, Show Flight Detail View
        const fleetView = document.getElementById('fleet-view');
        const selectedCard = document.getElementById('selected-card');
        if (fleetView) fleetView.style.display = 'none';
        if (selectedCard) {
            selectedCard.hidden = false;
            selectedCard.style.display = 'flex';
            selectedCard.scrollTop = 0;
        }

        // Ensure sidebar is open so the user sees the flight details drawer
        const appLayout = document.querySelector('.app-layout');
        if (appLayout && appLayout.classList.contains('sidebar-collapsed')) {
            appLayout.classList.remove('sidebar-collapsed');
            localStorage.setItem('jetwatch_sidebar_hidden', 'false');
            const toggle = document.getElementById('sidebar-edge-toggle');
            if (toggle) toggle.classList.remove('collapsed');
        }

        // Always collapse Recent Flights accordion by default when opening any aircraft
        const accHistBtn = document.getElementById('acc-btn-history');
        const accHistBody = document.getElementById('acc-body-history');
        if (accHistBtn && accHistBody) {
            accHistBtn.classList.remove('active');
            accHistBody.classList.add('collapsed');
        }

        this.renderAircraftList();
        this.updateSelectedCard();

        if (this.map) {
            this.map.updateAircraftMarkers(this.aircraft, this.selectedAircraftId);
        }

        const plane = this.aircraft.find(a => a.id === id);
        if (plane && plane.liveData && plane.liveData.lat && plane.liveData.lon) {
            this.map.flyToAircraft(plane.liveData.lat, plane.liveData.lon, 9);
        }
    }

    deselectAircraft() {
        this.stopAtcStream();
        this.atcTargetTab = null;
        this.currentAtcAirport = null;
        this.selectedAircraftId = null;

        // Switch unified left drawer view: Show Fleet View, Hide Flight Detail View
        const fleetView = document.getElementById('fleet-view');
        const selectedCard = document.getElementById('selected-card');
        if (selectedCard) {
            selectedCard.hidden = true;
            selectedCard.style.display = 'none';
        }
        if (fleetView) {
            fleetView.style.display = 'flex';
        }

        this.renderAircraftList();
        if (this.map) {
            this.map.updateAircraftMarkers(this.aircraft, null);
            this.map.renderFlightTrail(null);
        }
    }

    getCountryCode(tail) {
        const t = (tail || '').toUpperCase();
        if (t.startsWith('4X-') || t.startsWith('4X')) return 'ISR';
        if (t.startsWith('N') && /^[A-Z0-9]+$/.test(t)) return 'USA';
        if (t.startsWith('9H-')) return 'MLT';
        if (t.startsWith('G-')) return 'GBR';
        if (t.startsWith('C-') || t.startsWith('CF-')) return 'CAN';
        if (t.startsWith('D-')) return 'DEU';
        if (t.startsWith('F-')) return 'FRA';
        if (t.startsWith('OE-')) return 'AUT';
        if (t.startsWith('HB-')) return 'CHE';
        if (t.startsWith('VP-C') || t.startsWith('VQ-B')) return 'BMU';
        if (t.startsWith('XA-') || t.startsWith('XB-')) return 'MEX';
        if (t.startsWith('VH-')) return 'AUS';
        if (t.startsWith('B-')) return 'CHN';
        if (t.startsWith('EC-')) return 'ESP';
        if (t.startsWith('I-')) return 'ITA';
        if (t.startsWith('EI-')) return 'IRL';
        if (t.startsWith('OO-')) return 'BEL';
        if (t.startsWith('PH-')) return 'NLD';
        return 'INTL';
    }

    getCountryFlag(tail) {
        return this.getCountryCode(tail);
    }

    getFallbackAircraftPhoto(plane) {
        if (!plane) return null;
        const text = `${plane.tail || ''} ${plane.actualTail || ''} ${plane.model || ''} ${plane.name || ''} ${(plane.liveData && plane.liveData.callsign) || ''} ${(plane.liveData && plane.liveData.desc) || ''}`.toUpperCase();

        // 1. United Airlines / UA85 Stars & Stripes special livery (America250)
        if (text.includes('UA85') || text.includes('UAL85') || text.includes('N91007') || text.includes('UNITED') || text.includes('UAL')) {
            return {
                url: 'https://t.plnspttrs.net/36104/1988759_2904d5f6c9_280.jpg',
                photographer: 'Niclas Karich · United Airlines Boeing 787-10 (Stars & Stripes Livery)'
            };
        }

        // 2. Air France (must precede generic 777/airliner checks)
        if (text.includes('AIR FRANCE') || text.includes('AFR') || text.includes('AIRFRANCE') || /\bAF\b/.test(text) || text.startsWith('AF')) {
            return {
                url: 'https://t.plnspttrs.net/08166/1913619_98689d2321_280.jpg',
                photographer: 'Felix Sourek · Air France Boeing 777-300ER'
            };
        }

        // 3. El Al Israeli Airlines (must precede generic 777 checks)
        if (text.includes('EL AL') || text.includes('ELY') || text.includes('LY4') || text.includes('LY7') || text.includes('LY10')) {
            if (text.includes('777')) {
                return {
                    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/El_Al_Boeing_777-200ER_Monty.jpg/960px-El_Al_Boeing_777-200ER_Monty.jpg',
                    photographer: 'Monty · El Al Boeing 777-200ER'
                };
            }
            return {
                url: 'https://t.plnspttrs.net/17730/1981831_b6712ea2fc_280.jpg',
                photographer: 'Planespotters.net · El Al 787-9'
            };
        }

        // 4. Delta Air Lines
        if (text.includes('DELTA') || text.includes('DAL') || text.includes('517DN')) {
            return {
                url: 'https://t.plnspttrs.net/02822/1982016_fcaa8a8124_280.jpg',
                photographer: 'Planespotters.net · Delta A321neo'
            };
        }

        // 5. N787FZ (Joel Landau / Maxsip Telecom Global 7500 - NOT VistaJet)
        if (text.includes('787FZ') || text.includes('AAA856')) {
            return {
                url: 'https://t.plnspttrs.net/01048/1739585_3e9898ea21_280.jpg',
                photographer: 'Jonas Evrard · Maxsip Telecom Global 7500 (N787FZ)'
            };
        }

        // 6. Flexjet Praetor 500 (N429FX / LXJ429)
        if (text.includes('429FX') || text.includes('LXJ429') || text.includes('A51DA1')) {
            return {
                url: 'https://t.plnspttrs.net/40926/1931056_046c3dcac6_280.jpg',
                photographer: 'Tran Nguyen An Binh · Flexjet Praetor 500 (N429FX)'
            };
        }

        // 7. Flexjet Praetor 500 (N327FX / LXJ327 / E545)
        if (text.includes('327FX') || text.includes('LXJ327') || text.includes('A388E4') || text.includes('PRAETOR') || text.includes('P500') || text.includes('500PR') || text.includes('E545')) {
            return {
                url: 'https://t.plnspttrs.net/40004/1678189_9cf8d20aa8_280.jpg',
                photographer: 'Joshua Bully · Flexjet Praetor 500 (N327FX)'
            };
        }

        // 8. Flexjet Phenom 300 (N379FX / LXJ379 / E55P)
        if (text.includes('379FX') || text.includes('LXJ379') || text.includes('A455CD') || text.includes('PHENOM') || text.includes('E55P') || text.includes('FLEXJET') || text.includes('LXJ')) {
            return {
                url: 'https://t.plnspttrs.net/19005/1534346_f5ac334126_280.jpg',
                photographer: 'Jacob Reppert · Flexjet Phenom 300 (N379FX)'
            };
        }

        // 9. VistaJet (ONLY if VJT callsign or VistaJet operator)
        if (text.includes('VISTAJET') || text.includes('VJT') || text.includes('9H-VISTA') || text.includes('9HVISTA') || text.includes('4D23AB')) {
            return {
                url: 'https://t.plnspttrs.net/20655/1553270_3cf079f4cd_280.jpg',
                photographer: 'Planespotters.net · VistaJet Global 7500'
            };
        }

        // 10. Gulfstream VIP Jets
        if (text.includes('G800') || text.includes('380EE')) {
            return {
                url: 'https://t.plnspttrs.net/01817/1956068_0924971417_280.jpg',
                photographer: 'Planespotters.net · Gulfstream'
            };
        }
        if (text.includes('G-V') || text.includes('223A') || text.includes('GLF5')) {
            return {
                url: 'https://t.plnspttrs.net/30223/1675726_5c332c29d1_280.jpg',
                photographer: 'Planespotters.net · Gulfstream G-V'
            };
        }
        if (text.includes('G650') || text.includes('GLF6') || text.includes('650GF')) {
            return {
                url: 'https://t.plnspttrs.net/47373/1015232_3577405127_280.jpg',
                photographer: 'Planespotters.net · Gulfstream G650'
            };
        }

        // 11. Generic Bombardier Global 7500 (Executive factory livery C-GLBR, NOT VistaJet)
        if (text.includes('GLOBAL') || text.includes('7500') || text.includes('GL75') || text.includes('GL7T') || text.includes('117TF') || text.includes('185QS')) {
            return {
                url: 'https://t.plnspttrs.net/17182/865141_d9eb45384c_280.jpg',
                photographer: 'CJMoeser · Bombardier Global 7500 (Executive)'
            };
        }

        // 12. Generic Boeing 787 (Clean airliner, never N787FZ)
        if ((text.includes('787') || text.includes('DREAMLINER') || text.includes('B78')) && !text.includes('FZ')) {
            return {
                url: 'https://t.plnspttrs.net/36104/1988759_2904d5f6c9_280.jpg',
                photographer: 'Niclas Karich · Boeing 787'
            };
        }

        // 10. Generic Boeing 777 (neutral house colors, never El Al!)
        if (text.includes('777')) {
            return {
                url: 'https://t.plnspttrs.net/46197/1982702_5a3c777897_280.jpg',
                photographer: 'PEK.SkyDreamer · Boeing 777'
            };
        }

        // 11. Generic Airbus / Commercial Airliner
        if (text.includes('A321') || text.includes('AIRBUS')) {
            return {
                url: 'https://t.plnspttrs.net/02822/1982016_fcaa8a8124_280.jpg',
                photographer: 'Planespotters.net · Airbus A321'
            };
        }
        if (text.includes('AIRLINER') || text.includes('BOEING')) {
            return {
                url: 'https://t.plnspttrs.net/01048/1739585_3e9898ea21_280.jpg',
                photographer: 'Planespotters.net · Boeing Airliner'
            };
        }

        // Universal executive VIP jet fallback
        return {
            url: 'https://t.plnspttrs.net/47373/1015232_3577405127_280.jpg',
            photographer: 'Planespotters.net · Executive Jet'
        };
    }

    async loadAircraftPhoto(plane) {
        const container = document.getElementById('sel-photo-container');
        const img = document.getElementById('sel-photo-img');
        const cred = document.getElementById('sel-photo-photographer');
        if (!container || !img || !cred) return;

        // Guaranteed fallback so EVERY aircraft always has a verified photo displayed
        const fallback = this.getFallbackAircraftPhoto(plane);
        img.onerror = () => {
            if (fallback && img.src !== fallback.url) {
                img.src = fallback.url;
                cred.textContent = `© ${fallback.photographer || 'Aviation Photography'}`;
            }
        };

        // Display fallback photo immediately so user NEVER sees a missing or empty photo box
        if (fallback) {
            img.src = fallback.url;
            cred.textContent = `© ${fallback.photographer || 'Planespotters.net'}`;
            container.style.display = 'block';
        }

        const queryKey = (plane.actualTail || plane.tail || plane.icao || '').toUpperCase();
        if (!queryKey) return;

        if (!this.photoCache) {
            this.photoCache = new Map();
        }

        if (this.photoCache.has(queryKey)) {
            const p = this.photoCache.get(queryKey);
            if (p && p.url) {
                img.src = p.url;
                cred.textContent = `© ${p.photographer || 'Planespotters.net'}`;
                container.style.display = 'block';
            }
            return;
        }

        try {
            const apiBase = getAppApiBase();
            const res = await fetch(`${apiBase}/api/photo/${encodeURIComponent(queryKey)}`);
            const json = await res.json();
            if (json && json.success && json.photo && json.photo.url) {
                this.photoCache.set(queryKey, json.photo);
                if (this.selectedAircraftId === plane.id) {
                    img.src = json.photo.url;
                    cred.textContent = `© ${json.photo.photographer || 'Planespotters.net'}`;
                    container.style.display = 'block';
                }
            } else {
                if (fallback) {
                    this.photoCache.set(queryKey, fallback);
                    if (this.selectedAircraftId === plane.id) {
                        img.src = fallback.url;
                        cred.textContent = `© ${fallback.photographer || 'Planespotters.net'}`;
                        container.style.display = 'block';
                    }
                }
            }
        } catch (e) {
            if (fallback && this.selectedAircraftId === plane.id) {
                img.src = fallback.url;
                cred.textContent = `© ${fallback.photographer || 'Planespotters.net'}`;
                container.style.display = 'block';
            }
        }
    }

    resolveAirportIanaTz(airport) {
        if (!airport) return null;
        if (airport.tz && typeof airport.tz === 'string') {
            const clean = airport.tz.replace(/^:/, '').trim();
            if (clean) return clean;
        }
        const code = (airport.iata || airport.iata_code || airport.icao || airport.icao_code || '').toUpperCase().trim();
        if (code && AIRPORT_IANA_MAP[code]) {
            return AIRPORT_IANA_MAP[code];
        }
        const lon = airport.lon ?? airport.longitude;
        const lat = airport.lat ?? airport.latitude;
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
            if (lon >= -85 && lon <= -65 && lat >= 24 && lat <= 50) return 'America/New_York';
            if (lon >= -105 && lon < -85 && lat >= 24 && lat <= 50) return 'America/Chicago';
            if (lon >= -115 && lon < -105 && lat >= 31 && lat <= 50) return 'America/Denver';
            if (lon >= -125 && lon < -115 && lat >= 31 && lat <= 50) return 'America/Los_Angeles';
            if (lon >= -10 && lon <= 5 && lat >= 48 && lat <= 60) return 'Europe/London';
            if (lon > 5 && lon <= 25 && lat >= 35 && lat <= 65) return 'Europe/Paris';
            if (lon >= 33 && lon <= 37 && lat >= 29 && lat <= 34) return 'Asia/Jerusalem';
        }
        return null;
    }

    formatAirportTz(lat, lon, customTz, airportCode) {
        const pref = this.timeDisplayPref || 'airport';
        if (pref === 'utc') {
            return 'UTC (Zulu)';
        }
        if (pref === 'device') {
            try {
                const d = new Date();
                const shortName = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value;
                return shortName ? `Device (${shortName})` : 'Device Time';
            } catch (e) {
                return 'Device Time';
            }
        }

        // Airport Local Time (Default)
        let tz = customTz ? customTz.replace(/^:/, '').trim() : null;
        if (!tz && airportCode && AIRPORT_IANA_MAP[airportCode.toUpperCase().trim()]) {
            tz = AIRPORT_IANA_MAP[airportCode.toUpperCase().trim()];
        }
        if (!tz && Number.isFinite(lon) && Number.isFinite(lat)) {
            tz = this.resolveAirportIanaTz({ lat, lon });
        }

        if (tz) {
            try {
                const d = new Date();
                const shortName = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value;
                const offsetPart = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value;
                const cleanOffset = offsetPart ? offsetPart.replace('GMT', 'UTC ').replace(/UTC\s*([+-])/, 'UTC $1') : '';
                let abbr = shortName;
                if (tz === 'Asia/Jerusalem') abbr = 'IDT';
                else if (tz === 'Asia/Tokyo') abbr = 'JST';
                else if (tz === 'Asia/Dubai') abbr = 'GST';
                return cleanOffset ? `${abbr} (${cleanOffset})` : tz;
            } catch (e) {
                return tz;
            }
        }

        if (!Number.isFinite(lon)) return 'UTC';
        // Compute approximate local timezone abbreviation and offset
        if (lon >= -85 && lon <= -65 && lat >= 24 && lat <= 50) return 'EDT (UTC -04:00)';
        if (lon >= -105 && lon < -85 && lat >= 24 && lat <= 50) return 'CDT (UTC -05:00)';
        if (lon >= -115 && lon < -105 && lat >= 31 && lat <= 50) return 'MDT (UTC -06:00)';
        if (lon >= -125 && lon < -115 && lat >= 31 && lat <= 50) return 'PDT (UTC -07:00)';
        if (lon >= -10 && lon <= 5 && lat >= 48 && lat <= 60) return 'BST (UTC +01:00)';
        if (lon > 5 && lon <= 25 && lat >= 35 && lat <= 65) return 'CEST (UTC +02:00)';
        if (lon >= 33 && lon <= 37 && lat >= 29 && lat <= 34) return 'IDT (UTC +03:00)';

        const rawOffset = Math.round(lon / 15);
        const sign = rawOffset >= 0 ? '+' : '-';
        const absOff = Math.abs(rawOffset);
        const padOff = String(absOff).padStart(2, '0');
        return `UTC ${sign}${padOff}:00`;
    }

    findNearestAirport(lat, lon, maxDistanceNm = 80) {
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        let bestApt = null;
        let minDistance = Infinity;

        for (const apt of MAJOR_VIP_AIRPORTS) {
            const dLat = (apt.lat - lat) * 60; // 1 deg lat = 60 nm
            const dLon = (apt.lon - lon) * Math.cos(lat * Math.PI / 180) * 60;
            const dist = Math.hypot(dLat, dLon);
            if (dist < minDistance && dist <= maxDistanceNm) {
                minDistance = dist;
                bestApt = apt;
            }
        }
        return bestApt;
    }

    inferRouteForAircraft(plane) {
        if (!plane) return null;
        const cleanTail = (plane.actualTail || plane.tail || '').toUpperCase().trim();
        const callsign = (plane.liveData && plane.liveData.callsign ? plane.liveData.callsign.toUpperCase().trim() : '');

        // 1. Direct match in pre-seeded known routes
        if (cleanTail && KNOWN_ROUTES[cleanTail]) {
            return JSON.parse(JSON.stringify(KNOWN_ROUTES[cleanTail]));
        }
        if (callsign && KNOWN_ROUTES[callsign]) {
            return JSON.parse(JSON.stringify(KNOWN_ROUTES[callsign]));
        }

        // 2. Trajectory-based Departure Airport Inference (from live ADS-B radar trail)
        const trackKey = (plane.icao || plane.tail || '').toLowerCase();
        const trail = this.trailHistory && this.trailHistory.get(trackKey);
        let departureApt = null;

        if (trail && Array.isArray(trail) && trail.length > 0) {
            const startPoint = trail[0]; // [lon, lat, alt]
            if (Array.isArray(startPoint) && Number.isFinite(startPoint[1]) && Number.isFinite(startPoint[0])) {
                departureApt = this.findNearestAirport(startPoint[1], startPoint[0], 90);
            }
        }

        // 3. Reverse vector along flight heading
        if (!departureApt && plane.liveData && Number.isFinite(plane.liveData.lat) && Number.isFinite(plane.liveData.lon)) {
            const heading = Number.isFinite(plane.liveData.track) ? plane.liveData.track : null;
            if (heading !== null) {
                const backHeading = (heading + 180) % 360;
                const rad = backHeading * Math.PI / 180;
                for (const distDeg of [0.8, 1.8, 2.8, 3.8]) {
                    const estLat = plane.liveData.lat + distDeg * Math.cos(rad);
                    const estLon = plane.liveData.lon + distDeg * Math.sin(rad);
                    const candApt = this.findNearestAirport(estLat, estLon, 70);
                    if (candApt) {
                        departureApt = candApt;
                        break;
                    }
                }
            }
            if (!departureApt) {
                departureApt = this.findNearestAirport(plane.liveData.lat, plane.liveData.lon, 300);
            }
        }

        if (departureApt) {
            return {
                origin: {
                    iata: departureApt.iata,
                    city: departureApt.city,
                    name: departureApt.name,
                    lat: departureApt.lat,
                    lon: departureApt.lon
                },
                destination: {
                    iata: 'VIP',
                    city: 'CONFIDENTIAL',
                    isConfidential: true
                },
                inferred: true
            };
        }

        return null;
    }

    updateSelectedCard() {
        const card = document.getElementById('selected-card');
        const plane = this.aircraft.find(a => a.id === this.selectedAircraftId);

        if (!plane || !plane.liveData) {
            this.deselectAircraft();
            return;
        }

        const fleetView = document.getElementById('fleet-view');
        if (fleetView) fleetView.style.display = 'none';
        card.hidden = false;
        card.style.display = 'flex';
        const displayCall = this.getDisplayCallsign(plane);
        const tailReg = (plane.tail || displayCall).toUpperCase();

        // 1. Flightradar24 Ident Header
        const tailEl = document.getElementById('sel-tail');
        if (tailEl) tailEl.textContent = displayCall;

        const actualReg = (plane.actualTail || plane.tail || displayCall).toUpperCase();
        const countryBadge = document.getElementById('sel-country-badge');
        if (countryBadge) countryBadge.textContent = this.getCountryCode(actualReg);
        const flagEl = document.getElementById('sel-country-flag');
        if (flagEl) flagEl.textContent = this.getCountryFlag(actualReg);

        const callsignPill = document.getElementById('sel-callsign-pill');
        if (callsignPill) {
            callsignPill.textContent = (plane.liveData.callsign || tailReg);
        }

        const typePill = document.getElementById('sel-type-pill');
        if (typePill) {
            let typeCode = '';
            if (plane.model) {
                const m = plane.model.match(/\(([A-Z0-9]{3,4})\)/i);
                if (m) typeCode = m[1].toUpperCase();
            }
            if (!typeCode && plane.typeCode) typeCode = plane.typeCode.toUpperCase();
            if (!typeCode && plane.liveData.t) typeCode = plane.liveData.t.toUpperCase();
            if (!typeCode) {
                if (/phenom/i.test(plane.model)) typeCode = 'E55P';
                else if (/787/i.test(plane.model)) typeCode = 'B789';
                else if (/777/i.test(plane.model)) typeCode = 'B772';
                else if (/global/i.test(plane.model)) typeCode = 'GL75';
                else if (/challenger/i.test(plane.model)) typeCode = 'CL35';
                else if (/citation/i.test(plane.model)) typeCode = 'C680';
                else if (/gulfstream|g650/i.test(plane.model)) typeCode = 'GLF6';
                else typeCode = 'JET';
            }
            typePill.textContent = typeCode;
        }

        const nameEl = document.getElementById('sel-name');
        if (nameEl) nameEl.textContent = plane.name || 'Private Aircraft';

        const modelShortEl = document.getElementById('sel-model-short');
        if (modelShortEl) {
            let shortModel = (plane.model || 'Business Jet')
                .replace(/\s*\([A-Z0-9]+\)/i, '')
                .replace(/^Embraer\s+/i, '')
                .replace(/^Bombardier\s+/i, '')
                .replace(/^Gulfstream\s+/i, '')
                .replace(/^Cessna\s+/i, '')
                .trim();
            modelShortEl.textContent = shortModel || plane.model;
        }
        document.getElementById('sel-model').textContent = plane.model;

        const regValEl = document.getElementById('sel-reg-val');
        if (regValEl) regValEl.textContent = actualReg;

        // Fetch & display authentic aircraft photo (Planespotters.net)
        this.loadAircraftPhoto(plane);

        const isAir = plane.liveData.status === 'air';
        const badge = document.getElementById('sel-badge');
        badge.className = `badge ${isAir ? 'badge-air' : 'badge-ground'}`;
        badge.textContent = isAir ? 'Live' : 'On Ground';

        document.getElementById('sel-alt').textContent = isAir ? `${plane.liveData.alt.toLocaleString()} ft` : 'On Ground';
        document.getElementById('sel-speed').textContent = `${plane.liveData.speed} kts (${Math.round(plane.liveData.speed * 1.15078)} mph)`;
        document.getElementById('sel-heading').textContent = `${plane.liveData.track}° ${getCompass(plane.liveData.track)}`;

        let vrateText = 'Level (0 fpm)';
        if (plane.liveData.vrate > 100) vrateText = `+${plane.liveData.vrate.toLocaleString()} fpm (Climb)`;
        else if (plane.liveData.vrate < -100) vrateText = `${plane.liveData.vrate.toLocaleString()} fpm (Descent)`;
        document.getElementById('sel-vrate').textContent = vrateText;

        document.getElementById('sel-callsign').textContent = plane.liveData.callsign || 'N/A';

        const squawkEl = document.getElementById('sel-squawk');
        if (squawkEl) squawkEl.textContent = (plane.liveData && plane.liveData.squawk) ? plane.liveData.squawk : (isAir ? '7000' : 'GND');

        // 2. Route info & Flightradar24 display
        const routeContainer = document.getElementById('sel-route-container');
        if ((!plane.route || !plane.route.origin || !plane.route.destination) && isAir) {
            const inferred = this.inferRouteForAircraft(plane);
            if (inferred) plane.route = inferred;
        }

        if (plane.route && plane.route.origin && plane.route.destination) {
            routeContainer.hidden = false;
            document.getElementById('sel-orig-code').textContent = plane.route.origin.iata || 'ORIG';
            document.getElementById('sel-orig-city').textContent = (plane.route.origin.city || 'ORIGIN').toUpperCase();

            const isConf = plane.route.destination.iata === 'PVT' || plane.route.destination.iata === 'CONFIDENTIAL' || plane.route.destination.isConfidential;
            document.getElementById('sel-dest-code').textContent = isConf ? 'VIP' : (plane.route.destination.iata || 'DEST');
            document.getElementById('sel-dest-city').textContent = (isConf ? 'CONFIDENTIAL' : (plane.route.destination.city || 'DESTINATION')).toUpperCase();

            // Timezones
            const origTzEl = document.getElementById('sel-orig-tz');
            if (origTzEl) {
                origTzEl.textContent = this.formatAirportTz(plane.route.origin.lat, plane.route.origin.lon, plane.route.origin.tz, plane.route.origin.iata);
            }
            const destTzEl = document.getElementById('sel-dest-tz');
            if (destTzEl) {
                destTzEl.textContent = this.formatAirportTz(plane.route.destination.lat, plane.route.destination.lon, plane.route.destination.tz, plane.route.destination.iata);
            }

            // Dynamic Pitch & Landing Tilt for the circular badge airplane icon
            const tiltIcon = document.getElementById('route-plane-tilt-icon');
            const tiltBadge = document.getElementById('route-tilt-badge');
            if (tiltIcon) {
                const vrate = plane.liveData.vrate || 0;
                let pitchDeg = 0;
                if (vrate < -150) {
                    pitchDeg = 25; // Nose tilts downwards towards destination on landing/descent
                    if (tiltBadge) tiltBadge.title = `Descending towards destination (${vrate.toLocaleString()} ft/m)`;
                } else if (vrate > 150) {
                    pitchDeg = -25; // Nose tilts upwards on climb
                    if (tiltBadge) tiltBadge.title = `Climbing (+${vrate.toLocaleString()} ft/m)`;
                } else {
                    pitchDeg = 0; // Cruising level
                    if (tiltBadge) tiltBadge.title = 'Level Cruise (0 ft/m)';
                }
                tiltIcon.style.transform = `rotate(${90 + pitchDeg}deg)`;
            }

            // Calculate flight timeline progress & 2x2 times grid
            this.updateFlightTimeline(plane);
        } else {
            routeContainer.hidden = true;
        }

        // 3. FR24 Recent Flights Accordion (Directly inside drawer)
        const histTitle = document.getElementById('acc-history-title');
        if (histTitle) {
            histTitle.textContent = `Recent ${actualReg} flights`;
        }
        this.loadRecentFlightsAccordion(plane);

        // 4. Live ATC Radio Tuner Panel (Option A)
        this.updateAtcPanel(plane);

        // Draw trail and route line on map
        this.updateMapTrailForSelected();
    }

    async loadRecentFlightsAccordion(plane) {
        const listEl = document.getElementById('acc-history-list');
        const yearEl = document.getElementById('acc-history-year');
        const moreWrap = document.getElementById('acc-history-more-wrap');
        if (!listEl) return;

        const actualReg = (plane.actualTail || plane.tail || '').toUpperCase();
        const ident = (actualReg || plane.lastBroadcastFlight || (plane.liveData && plane.liveData.callsign) || plane.icao || '').trim().toUpperCase();
        if (!ident) {
            listEl.innerHTML = '<div class="hist-empty-state">No flight identifier available</div>';
            if (moreWrap) moreWrap.innerHTML = '';
            return;
        }

        const currentYear = new Date().getFullYear();
        if (yearEl) yearEl.textContent = `Year ${currentYear}`;

        if (!this.recentFlightsCache) this.recentFlightsCache = new Map();
        if (this.recentFlightsCache.has(ident)) {
            this.renderHistoryRows(this.recentFlightsCache.get(ident), listEl, actualReg || ident);
            return;
        }

        listEl.innerHTML = `
            <div class="hist-empty-state">
                <span class="pulse-dot" style="margin: 0 auto 6px; width: 7px; height: 7px; background: var(--color-gold);"></span>
                Loading recent flights for ${escapeHtml(ident)}...
            </div>
        `;
        if (moreWrap) moreWrap.innerHTML = '';

        try {
            const apiBase = getAppApiBase();
            const res = await fetch(`${apiBase}/api/history/${encodeURIComponent(ident)}`);
            if (res.ok) {
                const data = await res.json();
                const flights = (data && data.flights) || [];
                this.recentFlightsCache.set(ident, flights);
                this.renderHistoryRows(flights, listEl, actualReg || ident);
            } else {
                listEl.innerHTML = '<div class="hist-empty-state">No recent flights recorded in the last 7 days</div>';
                if (moreWrap) moreWrap.innerHTML = '';
            }
        } catch (err) {
            listEl.innerHTML = '<div class="hist-empty-state">No recent flights recorded in the last 7 days</div>';
            if (moreWrap) moreWrap.innerHTML = '';
        }
    }

    renderHistoryRows(flights, listEl, tailIdent) {
        const moreWrap = document.getElementById('acc-history-more-wrap');
        if (!flights || flights.length === 0) {
            listEl.innerHTML = '<div class="hist-empty-state">No past flights logged in the last 7 days</div>';
            if (moreWrap) moreWrap.innerHTML = '';
            return;
        }

        const nowSec = Math.floor(Date.now() / 1000);
        // Exclude future scheduled legs from the historical log
        const pastFlights = flights.filter(f => {
            if (f.takeoff && f.takeoff > (nowSec + 1800)) return false;
            return true;
        });

        if (pastFlights.length === 0) {
            listEl.innerHTML = '<div class="hist-empty-state">No past flights logged in the last 7 days</div>';
            if (moreWrap) moreWrap.innerHTML = '';
            return;
        }

        const cleanCityName = (raw, code) => {
            if (!raw) return code || '---';
            let c = raw.replace(/\(.*?\)/g, '').trim();
            c = c.split(',')[0].trim();
            c = c.replace(/\s+(International|Intl|Airport|Municipal|Regional)\b/gi, '').trim();
            return c || raw || code;
        };

        listEl.innerHTML = pastFlights.slice(0, 6).map((f, idx) => {
            const isAir = f.status === 'airborne';
            const isArrived = f.status === 'arrived';
            const dotClass = isAir ? 'hist-date-dot' : 'hist-date-dot arrived';
            const displayDate = f.date ? f.date.replace(/^[A-Z][a-z]{2},\s*/, '') : 'Recent';

            const origCode = (f.origin && f.origin.iata) || '---';
            const origCity = cleanCityName(f.origin && (f.origin.city || f.origin.friendlyLocation || f.origin.name), origCode);
            const destCode = (f.destination && f.destination.iata) || '---';
            const destCity = cleanCityName(f.destination && (f.destination.city || f.destination.friendlyLocation || f.destination.name), destCode);

            const raw = (f.rawIdent || '').trim();
            const clean = (f.callsign || '').trim();
            const hasBoth = raw && clean && raw !== clean;
            const callsignDisplay = hasBoth 
                ? `${escapeHtml(raw)}<span class="hist-iata-pill">${escapeHtml(clean)}</span>` 
                : escapeHtml(clean || raw || tailIdent || '---');

            const depTz = this.resolveAirportIanaTz(f.origin);
            const destTz = this.resolveAirportIanaTz(f.destination);

            const formatFlightTime = (timestamp, targetTz) => {
                if (!timestamp) return null;
                const d = typeof timestamp === 'number' 
                    ? (timestamp > 1e11 ? new Date(timestamp) : new Date(timestamp * 1000)) 
                    : new Date(timestamp);
                if (isNaN(d.getTime())) return null;

                const pref = this.timeDisplayPref || 'airport';
                if (pref === 'utc') {
                    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
                } else if (pref === 'device') {
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                } else {
                    // Airport Local Time (Default)
                    if (targetTz) {
                        try {
                            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: targetTz });
                            const shortName = new Intl.DateTimeFormat('en-US', { timeZone: targetTz, timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value;
                            let abbr = shortName;
                            if (targetTz === 'Asia/Jerusalem') abbr = 'IDT';
                            else if (targetTz === 'Asia/Tokyo') abbr = 'JST';
                            return abbr ? `${timeStr} (${abbr})` : timeStr;
                        } catch (e) {}
                    }
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                }
            };

            const depTimeFormatted = formatFlightTime(f.takeoff, depTz) || (f.time ? `${f.time} UTC` : '');
            const arrTimeFormatted = formatFlightTime(f.landing, destTz) || '';

            return `
                <div class="fr24-history-card" data-idx="${idx}">
                    <div class="hist-card-main">
                        <div class="hist-card-top">
                            <div class="hist-top-left">
                                <span class="${dotClass}" title="${isAir ? 'Live Airborne' : 'Arrived'}"></span>
                                <span class="hist-card-date">${escapeHtml(displayDate)}</span>
                                <span class="hist-card-ident">${callsignDisplay}</span>
                            </div>
                            <button type="button" class="hist-expand-btn" aria-label="Toggle flight details">
                                <svg class="hist-chevron-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <path d="m6 9 6 6 6-6"/>
                                </svg>
                            </button>
                        </div>
                        <div class="hist-card-legs">
                            <div class="hist-route-leg dep">
                                <svg class="hist-leg-svg dep" viewBox="0 0 26 12" width="15" height="11" fill="currentColor" aria-hidden="true">
                                    <path d="M5.48511 10.93L22.2371 6.46552C24.1067 5.96286 25.5115 4.57839 25.0111 3.18336C24.5357 1.92119 22.6451 1.60544 20.975 2.17463L15.1085 4.1716C14.6955 4.31269 14.407 4.30234 13.9341 4.08246L5.7503 0.223188C5.48269 0.0945587 5.19649 0.0717471 4.92677 0.152643L4.2587 0.351818C4.02406 0.424473 3.9514 0.700524 4.16304 0.930751L9.74916 6.87131L9.93778 5.94085L4.99892 7.63282L6.92385 7.69282L1.19402 5.66671C0.920082 5.57124 0.698095 5.61475 0.434506 5.85553L0.154636 6.1147C-0.0445391 6.28895-0.0466493 6.51918 0.121473 6.69976L3.54019 10.5441C4.00064 11.0501 4.65776 11.1456 5.48511 10.93Z"/>
                                </svg>
                                <span class="hist-airport-name">${escapeHtml(origCity)}</span>
                                <span class="hist-airport-code">${escapeHtml(origCode)}</span>
                            </div>
                            <div class="hist-route-leg arr">
                                <svg class="hist-leg-svg arr" viewBox="0 0 24 15" width="15" height="11" fill="currentColor" aria-hidden="true">
                                    <path d="M2.55223 9.77971L19.2751 14.28C21.1529 14.7869 23.0559 14.2906 23.3216 12.8457C23.5396 11.4984 22.0725 10.28 20.3193 9.93717L14.2452 8.7373C13.8219 8.6543 13.579 8.50075 13.2783 8.07135L8.12498 0.649756C7.95073 0.407068 7.73085 0.247386 7.45289 0.176841L6.76201 0.0108285C6.52736-0.0514762 6.33432 0.16227 6.40486 0.467262L8.2742 8.40559L8.89796 7.67621L3.76816 6.67552L5.4092 7.6928L1.45647 3.08617C1.26553 2.85996 1.06636 2.78942 0.707302 2.86207L0.338295 2.94086C0.078926 2.99894-0.0372426 3.20214 0.010491 3.43256L1.04495 8.4898C1.18393 9.13696 1.71453 9.55159 2.55223 9.77971Z"/>
                                </svg>
                                <span class="hist-airport-name">${escapeHtml(destCity)}</span>
                                <span class="hist-airport-code">${escapeHtml(destCode)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="hist-card-expanded" hidden>
                        <div class="hist-expanded-grid">
                            <div class="hist-exp-item">
                                <span class="hist-exp-lbl">Status</span>
                                <span class="hist-exp-val ${isAir ? 'air' : ''}">${isAir ? 'Live Airborne' : (isArrived ? 'Arrived / Landed' : 'Scheduled')}</span>
                            </div>
                            ${f.duration ? `
                            <div class="hist-exp-item">
                                <span class="hist-exp-lbl">Flight Time</span>
                                <span class="hist-exp-val">${escapeHtml(f.duration)}</span>
                            </div>` : ''}
                            ${depTimeFormatted ? `
                            <div class="hist-exp-item">
                                <span class="hist-exp-lbl">Departure</span>
                                <span class="hist-exp-val">${escapeHtml(depTimeFormatted)}</span>
                            </div>` : ''}
                            ${arrTimeFormatted ? `
                            <div class="hist-exp-item">
                                <span class="hist-exp-lbl">Arrival</span>
                                <span class="hist-exp-val">${escapeHtml(arrTimeFormatted)}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach interactive accordion expand/collapse per card
        listEl.querySelectorAll('.hist-card-main').forEach(mainEl => {
            mainEl.addEventListener('click', () => {
                const card = mainEl.closest('.fr24-history-card');
                if (!card) return;
                const expanded = card.querySelector('.hist-card-expanded');
                if (!expanded) return;
                const isOpen = card.classList.contains('open');
                if (isOpen) {
                    card.classList.remove('open');
                    expanded.hidden = true;
                } else {
                    card.classList.add('open');
                    expanded.hidden = false;
                }
            });
        });

        // Set "More <ident> flights" link at the bottom
        if (moreWrap) {
            const cleanTail = (tailIdent || '').replace(/[^A-Za-z0-9-]/g, '');
            moreWrap.innerHTML = `
                <a class="fr24-history-more-link" href="https://www.flightradar24.com/data/aircraft/${encodeURIComponent(cleanTail.toLowerCase())}" target="_blank" rel="noopener noreferrer">
                    More ${escapeHtml(tailIdent || 'aircraft')} flights
                </a>
            `;
        }
    }

    updateMapTrailForSelected() {
        if (!this.map || !this.selectedAircraftId) return;
        const plane = this.aircraft.find(a => a.id === this.selectedAircraftId);
        if (!plane || !plane.liveData) {
            this.map.renderFlightTrail(null);
            return;
        }

        const hexKey = plane.icao.toLowerCase();
        let coords = (this.trailHistory.get(hexKey) || []).slice();

        const currentLon = plane.liveData.lon;
        const currentLat = plane.liveData.lat;
        const currentAlt = Number.isFinite(plane.liveData.alt) ? plane.liveData.alt : 25000;

        // Ensure trail ends EXACTLY at the live aircraft position
        if (coords.length >= 2) {
            const last = coords[coords.length - 1];
            // If the last trail point is not at the current aircraft location, connect it!
            if (Math.hypot(last[0] - currentLon, last[1] - currentLat) > 0.0001) {
                coords.push([currentLon, currentLat, currentAlt]);
            } else {
                coords[coords.length - 1] = [currentLon, currentLat, currentAlt];
            }
        } else if (Number.isFinite(plane.liveData.track)) {
            const headingRad = (plane.liveData.track * Math.PI) / 180;
            const distDeg = 0.5; // ~55 km
            const prevLon = currentLon - Math.sin(headingRad) * distDeg;
            const prevLat = currentLat - Math.cos(headingRad) * distDeg;

            coords = [[prevLon, prevLat, currentAlt], [currentLon, currentLat, currentAlt]];
        } else {
            coords = [[currentLon, currentLat, currentAlt]];
        }

        // Projected line to destination (Chopped / dashed line)
        let projectedCoords = null;
        let originInfo = null;
        let destInfo = null;

        if (plane.route) {
            if (plane.route.origin && Number.isFinite(plane.route.origin.lon) && Number.isFinite(plane.route.origin.lat)) {
                originInfo = {
                    iata: plane.route.origin.iata || 'DEP',
                    city: plane.route.origin.city || '',
                    coords: [plane.route.origin.lon, plane.route.origin.lat]
                };
                // Connect origin to start of flight path if not already connected
                if (coords.length > 0 && Math.hypot(coords[0][0] - plane.route.origin.lon, coords[0][1] - plane.route.origin.lat) > 0.05) {
                    coords = [[plane.route.origin.lon, plane.route.origin.lat, 0], ...coords];
                }
            }

            if (plane.route.destination && Number.isFinite(plane.route.destination.lon) && Number.isFinite(plane.route.destination.lat)) {
                destInfo = {
                    iata: plane.route.destination.iata || 'ARR',
                    city: plane.route.destination.city || '',
                    coords: [plane.route.destination.lon, plane.route.destination.lat]
                };

                // Projected route: Chopped dashed line directly from plane to arrival airport!
                projectedCoords = [
                    [currentLon, currentLat],
                    [plane.route.destination.lon, plane.route.destination.lat]
                ];
            }
        }

        this.map.renderFlightTrail(coords, [], projectedCoords, originInfo, destInfo);
    }

    /**
     * Compute real-time flight timeline progress, 2x2 times matrix, elapsed flight duration, and ETA remaining
     */
    updateFlightTimeline(plane) {
        const fillEl = document.getElementById('timeline-progress-fill');
        const planeInd = document.getElementById('timeline-plane-indicator');
        const elapsedEl = document.getElementById('timeline-elapsed');
        const remainEl = document.getElementById('timeline-remaining');

        const depSchedEl = document.getElementById('sel-dep-sched');
        const depActEl = document.getElementById('sel-dep-act');
        const arrSchedEl = document.getElementById('sel-arr-sched');
        const arrEstEl = document.getElementById('sel-arr-est');

        if (!plane.route || !plane.route.origin || !plane.route.destination || !plane.liveData) {
            return;
        }

        const origLat = plane.route.origin.lat;
        const origLon = plane.route.origin.lon;
        const destLat = plane.route.destination.lat;
        const destLon = plane.route.destination.lon;
        const curLat = plane.liveData.lat;
        const curLon = plane.liveData.lon;
        const speedKts = Math.max(plane.liveData.speed || 380, 80);

        // Resolve exact IANA timezones for departure (origin) and arrival (destination)
        const origTz = this.resolveAirportIanaTz(plane.route.origin);
        const destTz = this.resolveAirportIanaTz(plane.route.destination);

        // Haversine distance in nautical miles
        const toRad = (deg) => (deg * Math.PI) / 180;
        const haversineNm = (lat1, lon1, lat2, lon2) => {
            const R = 3440.065; // Earth radius in nautical miles
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const formatClock = (timestamp, targetTz) => {
            if (!timestamp) return null;
            const d = typeof timestamp === 'number' 
                ? (timestamp > 1e11 ? new Date(timestamp) : new Date(timestamp * 1000)) 
                : new Date(timestamp);
            if (isNaN(d.getTime())) return null;

            const pref = this.timeDisplayPref || 'airport';
            if (pref === 'utc') {
                return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
            } else if (pref === 'device') {
                return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            } else {
                // Airport Local Time (Flightradar24 default)
                if (targetTz) {
                    try {
                        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: targetTz });
                    } catch (e) {
                        // ignore and fallback
                    }
                }
                return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            }
        };

        const formatDurationHhMm = (hoursDec) => {
            const totalMins = Math.max(0, Math.round(hoursDec * 60));
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        if (Number.isFinite(origLat) && Number.isFinite(destLat) && Number.isFinite(curLat)) {
            const totalDistNm = haversineNm(origLat, origLon, destLat, destLon);
            const distFlownNm = haversineNm(origLat, origLon, curLat, curLon);
            const distRemainNm = haversineNm(curLat, curLon, destLat, destLon);

            // Compute progress percentage along the flight journey cleanly
            const effectiveTotal = (distFlownNm + distRemainNm > 0)
                ? (distFlownNm + distRemainNm)
                : Math.max(totalDistNm, 1);
            let pct = Math.round((distFlownNm / effectiveTotal) * 100);
            pct = Math.max(2, Math.min(98, pct)); // clamp between 2% and 98%

            if (fillEl) fillEl.style.width = `${pct}%`;
            if (planeInd) planeInd.style.left = `${pct}%`;

            // Calculate flight hours & minutes
            const elapsedHours = distFlownNm / speedKts;
            const remainHours = distRemainNm / speedKts;

            // Flightradar24 Subtext Format: "262 NM, 00:41 ago" and "47 NM, in 00:15"
            if (elapsedEl) elapsedEl.textContent = `${Math.round(distFlownNm)} NM, ${formatDurationHhMm(elapsedHours)} ago`;
            if (remainEl) remainEl.textContent = `${Math.round(distRemainNm)} NM, in ${formatDurationHhMm(remainHours)}`;

            // Populate 2x2 Flight Timing Matrix (Origin Airport Local for Dep, Dest Airport Local for Arr)
            const now = Date.now();
            let schedDep = null;
            let actDep = null;
            let schedArr = null;
            let estArr = null;

            if (plane.route.times) {
                schedDep = formatClock(plane.route.times.scheduledDep, origTz);
                actDep = formatClock(plane.route.times.actualDep, origTz);
                schedArr = formatClock(plane.route.times.scheduledArr, destTz);
                estArr = formatClock(plane.route.times.estimatedArr, destTz);
            }

            if (!actDep) {
                const actDepMs = now - (elapsedHours * 3600 * 1000);
                actDep = formatClock(actDepMs, origTz);
            }
            if (!estArr) {
                const estArrMs = now + (remainHours * 3600 * 1000);
                estArr = formatClock(estArrMs, destTz);
            }
            if (!schedDep) {
                const actDepMs = now - (elapsedHours * 3600 * 1000);
                const schedDepMs = Math.round((actDepMs - (12 * 60 * 1000)) / (5 * 60 * 1000)) * (5 * 60 * 1000);
                schedDep = formatClock(schedDepMs, origTz);
            }
            if (!schedArr) {
                const estArrMs = now + (remainHours * 3600 * 1000);
                const schedArrMs = Math.round((estArrMs + (8 * 60 * 1000)) / (5 * 60 * 1000)) * (5 * 60 * 1000);
                schedArr = formatClock(schedArrMs, destTz);
            }

            if (depSchedEl) depSchedEl.textContent = schedDep || '8:00 AM';
            if (depActEl) depActEl.textContent = actDep || '8:14 AM';
            if (arrSchedEl) arrSchedEl.textContent = schedArr || '9:20 AM';
            if (arrEstEl) arrEstEl.innerHTML = `<span class="pulse-dot-green"></span>${estArr || '9:11 AM'}`;
        } else {
            // Destination airport is unlisted/confidential
            if (Number.isFinite(origLat) && Number.isFinite(curLat)) {
                const distFlownNm = haversineNm(origLat, origLon, curLat, curLon);
                const elapsedHours = distFlownNm / speedKts;

                if (fillEl) fillEl.style.width = '65%';
                if (planeInd) planeInd.style.left = '65%';
                if (elapsedEl) elapsedEl.textContent = `${Math.round(distFlownNm)} NM, ${formatDurationHhMm(elapsedHours)} ago`;
                if (remainEl) remainEl.textContent = 'Confidential VIP Arrival';

                const now = Date.now();
                const actDep = formatClock(now - (elapsedHours * 3600 * 1000), origTz);
                if (depSchedEl) depSchedEl.textContent = formatClock(now - ((elapsedHours + 0.2) * 3600 * 1000), origTz);
                if (depActEl) depActEl.textContent = actDep || '--:--';
                if (arrSchedEl) arrSchedEl.textContent = 'CONFIDENTIAL';
                if (arrEstEl) arrEstEl.innerHTML = `<span class="pulse-dot-green"></span>EN ROUTE`;
            } else {
                if (fillEl) fillEl.style.width = '50%';
                if (planeInd) planeInd.style.left = '50%';
                if (elapsedEl) elapsedEl.textContent = plane.route.origin.city ? `Departed: ${plane.route.origin.city}` : 'Airborne · En Route';
                if (remainEl) remainEl.textContent = plane.route.destination.city || 'Confidential VIP Arrival';
            }
        }
    }

    deleteAircraft(id) {
        this.aircraft = this.aircraft.filter(a => a.id !== id);
        if (this.selectedAircraftId === id) {
            this.deselectAircraft();
        }
        this.saveAircraft();
        this.renderStats();
        this.renderAircraftList();
        if (this.map) this.map.updateAircraftMarkers(this.aircraft);
    }

    fitAllActivePlanes() {
        const activeCoords = this.aircraft
            .filter(a => a.liveData && a.liveData.lat && a.liveData.lon)
            .map(a => [a.liveData.lon, a.liveData.lat]);

        if (activeCoords.length > 0) {
            this.map.fitAllPlanes(activeCoords);
        } else {
            alert('No aircraft currently transmitting live positions.');
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.getElementById('theme-icon');
        if (icon) {
            if (theme === 'light') {
                // Moon icon
                icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
            } else {
                // Sun icon
                icon.innerHTML = `<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>`;
            }
        }
        if (this.map && this.map.setMapTheme) {
            this.map.setMapTheme(theme);
        }
    }

    /**
     * Authentic Airplane Seatbelt Sign / Cabin Announcement Chime
     * Loads and decodes the user's authentic Airbus PA chime MP3 file into Web Audio buffer.
     */
    async loadChimeBuffer() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const res = await fetch('cabin_chime.mp3');
            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                this.chimeAudioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                console.log('[Audio] Authentic Airbus PA chime buffer loaded and decoded successfully.');
            }
        } catch (e) {
            console.warn('[Audio] Failed to pre-decode chime buffer:', e);
        }
    }

    /**
     * Authentic Airplane Seatbelt Sign / Cabin Announcement Chime
     * Plays the authentic Airbus passenger announcement chime MP3 via Web Audio API.
     */
    playChime(force = false) {
        if (!force && localStorage.getItem('jetwatch_sound') === 'false') {
            return;
        }
        let played = false;
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(() => {});
            }
            if (this.chimeAudioBuffer && this.audioCtx.state === 'running') {
                const src = this.audioCtx.createBufferSource();
                src.buffer = this.chimeAudioBuffer;
                const gain = this.audioCtx.createGain();
                gain.gain.value = 1.0;
                src.connect(gain);
                gain.connect(this.audioCtx.destination);
                src.start(0);
                played = true;
            }
        } catch (e) {
            console.warn('[Audio] Web Audio buffer error:', e);
        }

        // HTML5 Audio fallback / parallel backup
        const audioEl = document.getElementById('seatbelt-audio');
        if (audioEl && (!played || audioEl.paused)) {
            audioEl.currentTime = 0;
            audioEl.volume = 1.0;
            audioEl.play().catch(() => {});
        }
    }

    triggerTakeoffAlert(plane) {
        this.playChime();
        if (this.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            const displayCall = this.getDisplayCallsign(plane);
            const regNote = (plane.tail && plane.tail !== displayCall) ? ` (${plane.tail})` : '';
            new Notification(`🛫 TAKEOFF: ${displayCall}${regNote}`, {
                body: `${plane.name || plane.model} is now airborne! Speed: ${plane.liveData ? plane.liveData.speed : 0} kts, Alt: ${plane.liveData ? plane.liveData.alt.toLocaleString() : 0} ft.`,
                icon: 'manifest.webmanifest',
                silent: true
            });
        }
    }

    triggerLandingAlert(plane) {
        this.playChime();
        if (this.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            const displayCall = this.getDisplayCallsign(plane);
            const regNote = (plane.tail && plane.tail !== displayCall) ? ` (${plane.tail})` : '';
            new Notification(`🛬 LANDED: ${displayCall}${regNote}`, {
                body: `${plane.name || plane.model} has touched down.`,
                icon: 'manifest.webmanifest',
                silent: true
            });
        }
    }

    // ==========================================
    // Live ATC Radio Tuner Controller (Option A)
    // ==========================================

    /**
     * Updates the ATC Radio Tuner Panel in the Selected Aircraft card
     */
    updateAtcPanel(plane) {
        const atcPanel = document.getElementById('atc-radio-panel');
        if (!atcPanel) return;

        let origCode = null;
        let destCode = null;
        if (plane.route) {
            if (plane.route.origin) origCode = plane.route.origin.iata || plane.route.origin.icao || null;
            if (plane.route.destination) destCode = plane.route.destination.iata || plane.route.destination.icao || null;
        }

        const isDestConf = destCode === 'PVT' || destCode === 'CONFIDENTIAL' || (plane.route && plane.route.destination && plane.route.destination.isConfidential);

        // Auto-tuning: if user hasn't explicitly clicked a tab for this aircraft session,
        // auto-tune to Destination if descending (vrate < -150) and not confidential; otherwise Departure
        if (!this.atcTargetTab) {
            const vrate = (plane.liveData && plane.liveData.vrate) || 0;
            if (vrate < -150 && destCode && !isDestConf) {
                this.atcTargetTab = 'dest';
            } else if (origCode) {
                this.atcTargetTab = 'orig';
            } else if (destCode && !isDestConf) {
                this.atcTargetTab = 'dest';
            } else {
                this.atcTargetTab = 'orig';
            }
        }

        // Update tab buttons
        const origTab = document.getElementById('atc-tab-orig');
        const destTab = document.getElementById('atc-tab-dest');
        const origCodeEl = document.getElementById('atc-tab-orig-code');
        const destCodeEl = document.getElementById('atc-tab-dest-code');

        if (origCodeEl) origCodeEl.textContent = origCode || '---';
        if (destCodeEl) destCodeEl.textContent = isDestConf ? 'VIP' : (destCode || '---');

        if (origTab) origTab.classList.toggle('active', this.atcTargetTab === 'orig');
        if (destTab) destTab.classList.toggle('active', this.atcTargetTab === 'dest');

        // Determine airport to load
        const targetAirport = this.atcTargetTab === 'dest' ? destCode : origCode;
        if (!targetAirport || (isDestConf && this.atcTargetTab === 'dest')) {
            this.renderAtcRestrictedOrEmpty(isDestConf && this.atcTargetTab === 'dest' ? 'Confidential VIP Arrival Airport' : 'Awaiting Flight Plan Frequencies');
            return;
        }

        // If already tuned to this airport, do not re-fetch or restart playback
        if (this.currentAtcAirport === targetAirport && this.currentAtcData) {
            return;
        }

        this.loadAtcRadio(targetAirport);
    }

    switchAtcAirportTab(tabTarget) {
        if (this.atcTargetTab === tabTarget) return;
        this.atcTargetTab = tabTarget;
        const plane = this.aircraft.find(a => a.id === this.selectedAircraftId);
        if (!plane) return;

        if (this.isAtcPlaying) {
            this.stopAtcStream();
        }

        let origCode = plane.route && plane.route.origin ? (plane.route.origin.iata || plane.route.origin.icao) : null;
        let destCode = plane.route && plane.route.destination ? (plane.route.destination.iata || plane.route.destination.icao) : null;
        const isDestConf = destCode === 'PVT' || destCode === 'CONFIDENTIAL' || (plane.route && plane.route.destination && plane.route.destination.isConfidential);

        const origTab = document.getElementById('atc-tab-orig');
        const destTab = document.getElementById('atc-tab-dest');
        if (origTab) origTab.classList.toggle('active', tabTarget === 'orig');
        if (destTab) destTab.classList.toggle('active', tabTarget === 'dest');

        const targetAirport = tabTarget === 'dest' ? destCode : origCode;
        if (!targetAirport || (isDestConf && tabTarget === 'dest')) {
            this.renderAtcRestrictedOrEmpty(isDestConf && tabTarget === 'dest' ? 'Confidential VIP Arrival Airport' : 'No Departure Airport Available');
            return;
        }

        this.loadAtcRadio(targetAirport);
    }

    async loadAtcRadio(airportCode) {
        if (!airportCode || airportCode === '---') {
            this.renderAtcRestrictedOrEmpty('Awaiting Flight Plan Frequencies');
            return;
        }

        this.currentAtcAirport = airportCode;
        const badge = document.getElementById('atc-status-badge');
        if (badge && !this.isAtcPlaying) {
            badge.textContent = 'TUNING';
            badge.className = 'atc-status-badge connecting';
        }

        let atcData = this.atcFreqCache.get(airportCode);
        if (!atcData) {
            try {
                const apiBase = getAppApiBase();
                const res = await fetch(`${apiBase}/api/atc/frequencies/${encodeURIComponent(airportCode)}`);
                const json = await res.json();
                if (json && json.success && json.data) {
                    atcData = json.data;
                    this.atcFreqCache.set(airportCode, atcData);
                }
            } catch (e) {
                console.warn('[ATC] Error fetching ATC frequencies:', e);
            }
        }

        if (this.currentAtcAirport !== airportCode) return; // Stale request guard

        if (!atcData) {
            this.renderAtcRestrictedOrEmpty(`ATC data unavailable for ${airportCode}`);
            return;
        }

        this.currentAtcData = atcData;
        this.renderAtcPanelData(atcData);
    }

    renderAtcPanelData(atcData) {
        // Notice banner (e.g. for restricted airspaces like TLV, LHR)
        const noticeBanner = document.getElementById('atc-notice-banner');
        const noticeText = document.getElementById('atc-notice-text');
        if (noticeBanner && noticeText) {
            if (atcData.note) {
                noticeText.textContent = atcData.note;
                noticeBanner.style.display = 'flex';
            } else {
                noticeBanner.style.display = 'none';
            }
        }

        // Render Channel Pills
        const channelsList = document.getElementById('atc-channels-list');
        if (channelsList && atcData.frequencies) {
            channelsList.innerHTML = atcData.frequencies.map(f => `
                <button class="atc-channel-pill ${f.type === this.currentAtcChannelType ? 'active' : ''}" data-type="${escapeHtml(f.type)}" title="${escapeHtml(f.label || f.type)}">
                    <span class="channel-type">${escapeHtml(f.type)}</span>
                    <span class="channel-freq">${escapeHtml(f.freq)}</span>
                    ${f.live ? '<span class="channel-live-dot" title="Live audio stream available"></span>' : ''}
                </button>
            `).join('');

            channelsList.querySelectorAll('.atc-channel-pill').forEach(pill => {
                pill.addEventListener('click', () => {
                    const type = pill.dataset.type;
                    this.selectAtcChannel(type);
                });
            });
        }

        // Select channel
        let selectedChannel = atcData.frequencies && atcData.frequencies.find(f => f.type === this.currentAtcChannelType);
        if (!selectedChannel && atcData.frequencies && atcData.frequencies.length > 0) {
            selectedChannel = atcData.frequencies[0];
            this.currentAtcChannelType = selectedChannel.type;
        }

        // Update active class on pills
        if (channelsList) {
            channelsList.querySelectorAll('.atc-channel-pill').forEach(pill => {
                pill.classList.toggle('active', pill.dataset.type === this.currentAtcChannelType);
            });
        }

        this.updateAtcLcd(selectedChannel);
    }

    selectAtcChannel(channelType) {
        if (!this.currentAtcData || !this.currentAtcData.frequencies) return;
        this.currentAtcChannelType = channelType;
        const selectedChannel = this.currentAtcData.frequencies.find(f => f.type === channelType);
        if (!selectedChannel) return;

        // Update active pill
        document.querySelectorAll('#atc-channels-list .atc-channel-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.type === channelType);
        });

        this.updateAtcLcd(selectedChannel);

        // If currently playing, retune stream to newly selected channel
        if (this.isAtcPlaying) {
            const mount = (selectedChannel && selectedChannel.live) ? selectedChannel.mount : null;
            if (mount) {
                this.playAtcStream(mount);
            } else {
                this.stopAtcStream();
            }
        }
    }

    updateAtcLcd(channel) {
        if (!channel) return;
        const labelEl = document.getElementById('atc-active-channel-label');
        const freqEl = document.getElementById('atc-active-freq-val');
        const playBtn = document.getElementById('atc-play-btn');
        const badge = document.getElementById('atc-status-badge');

        if (labelEl) {
            const typeLabels = { TWR: 'TOWER', GND: 'GROUND', APP: 'APPROACH', ATIS: 'ATIS', DEP: 'DEPARTURE', METRO: 'METRO TWR' };
            labelEl.textContent = typeLabels[channel.type] || channel.type;
        }
        if (freqEl) {
            freqEl.textContent = channel.freq || '---.---';
        }

        const hasLive = !!(channel && channel.live && channel.mount);
        if (playBtn) {
            playBtn.disabled = !hasLive;
            playBtn.title = hasLive ? `Listen live to ${channel.label || channel.type}` : (channel.note || 'Live audio stream unavailable for this channel/airspace');
        }

        if (badge && !this.isAtcPlaying) {
            if (hasLive) {
                badge.textContent = 'TUNED';
                badge.className = 'atc-status-badge standby';
            } else {
                badge.textContent = (channel && channel.note) ? 'OFFLINE' : ((this.currentAtcData && (this.currentAtcData.restricted || this.currentAtcData.note)) ? 'OFFICIAL FREQS' : 'OFFLINE');
                badge.className = 'atc-status-badge standby';
            }
        }
    }

    toggleAtcStream() {
        if (this.isAtcPlaying) {
            this.stopAtcStream();
        } else {
            if (!this.currentAtcData || !this.currentAtcData.frequencies) return;
            const channel = this.currentAtcData.frequencies.find(f => f.type === this.currentAtcChannelType) || this.currentAtcData.frequencies[0];
            const mount = (channel && channel.live) ? channel.mount : null;
            if (mount) {
                this.playAtcStream(mount);
            }
        }
    }

    getAtcAudio() {
        let audio = document.getElementById('atc-stream-audio');
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = 'atc-stream-audio';
            audio.preload = 'none';
            document.body.appendChild(audio);
        }
        if (!audio._hasAtcListeners) {
            audio._hasAtcListeners = true;
            audio.volume = this.atcVolume;
            audio.addEventListener('playing', () => {
                this.isAtcPlaying = true;
                this.updateAtcPlayUi(true);
            });
            audio.addEventListener('pause', () => {
                if (this.isAtcPlaying) {
                    this.isAtcPlaying = false;
                    this.updateAtcPlayUi(false);
                }
            });
            audio.addEventListener('error', (e) => {
                console.warn('[ATC] Audio stream error:', e);
                this.stopAtcStream();
                const badge = document.getElementById('atc-status-badge');
                if (badge) {
                    badge.textContent = 'OFFLINE';
                    badge.className = 'atc-status-badge standby';
                }
            });
        }
        return audio;
    }

    playAtcStream(mount) {
        const audio = this.getAtcAudio();
        if (!audio || !mount) return;

        const badge = document.getElementById('atc-status-badge');
        const playText = document.getElementById('atc-play-text');
        const playIcon = document.getElementById('atc-play-icon');
        const playBtn = document.getElementById('atc-play-btn');

        if (badge) {
            badge.textContent = 'CONNECTING';
            badge.className = 'atc-status-badge connecting';
        }
        if (playText) playText.textContent = 'CONNECTING...';
        if (playIcon) {
            playIcon.innerHTML = '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" fill="none" stroke-dasharray="28" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle>';
        }
        if (playBtn) playBtn.disabled = false;

        const apiBase = getAppApiBase();
        audio.src = `${apiBase}/api/atc/stream/${encodeURIComponent(mount)}?t=${Date.now()}`;
        audio.volume = this.atcVolume;
        audio.play().catch(err => {
            console.warn('[ATC] Stream playback interrupted or blocked:', err);
            this.stopAtcStream();
        });
    }

    stopAtcStream() {
        const audio = this.getAtcAudio();
        if (audio) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        }
        this.isAtcPlaying = false;
        this.updateAtcPlayUi(false);
    }

    updateAtcPlayUi(isPlaying) {
        const panel = document.getElementById('atc-radio-panel');
        const playBtn = document.getElementById('atc-play-btn');
        const playIcon = document.getElementById('atc-play-icon');
        const playText = document.getElementById('atc-play-text');
        const badge = document.getElementById('atc-status-badge');

        if (panel) {
            panel.classList.toggle('playing', isPlaying);
        }
        if (playBtn) {
            playBtn.classList.toggle('playing', isPlaying);
        }
        if (playIcon) {
            if (isPlaying) {
                // Pause icon: two vertical bars
                playIcon.innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>';
            } else {
                // Play icon: right-pointing triangle
                playIcon.innerHTML = '<path d="M5 3l14 9-14 9V3z" fill="currentColor"/>';
            }
        }
        if (playText) {
            playText.textContent = isPlaying ? 'PAUSE' : 'LISTEN LIVE';
        }
        if (badge) {
            if (isPlaying) {
                badge.textContent = 'LIVE';
                badge.className = 'atc-status-badge live';
            } else {
                badge.textContent = 'STANDBY';
                badge.className = 'atc-status-badge standby';
            }
        }
    }

    renderAtcRestrictedOrEmpty(message) {
        this.currentAtcAirport = null;
        this.currentAtcData = null;
        const labelEl = document.getElementById('atc-active-channel-label');
        const freqEl = document.getElementById('atc-active-freq-val');
        const channelsList = document.getElementById('atc-channels-list');
        const playBtn = document.getElementById('atc-play-btn');
        const badge = document.getElementById('atc-status-badge');
        const noticeBanner = document.getElementById('atc-notice-banner');
        const noticeText = document.getElementById('atc-notice-text');

        if (labelEl) labelEl.textContent = 'ATC';
        if (freqEl) freqEl.textContent = '---.---';
        if (channelsList) channelsList.innerHTML = `<span style="font-size: 0.72rem; color: var(--text-muted); padding: 4px 6px;">${escapeHtml(message)}</span>`;
        if (playBtn) {
            playBtn.disabled = true;
            playBtn.title = message;
        }
        if (badge) {
            badge.textContent = 'STANDBY';
            badge.className = 'atc-status-badge standby';
        }
        if (noticeBanner) {
            noticeBanner.style.display = 'none';
        }
    }
}

// ==========================================
// Utility Helpers
// ==========================================
function getCompass(deg) {
    if (!Number.isFinite(deg)) return '';
    const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return points[idx];
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    new JetWatchApp();
});
