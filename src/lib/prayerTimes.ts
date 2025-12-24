// Prayer time calculation utilities with extended methods

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  timezone?: number; // UTC offset in hours
}

export type PrayerMethod = 
  | 'jafari'
  | 'jafari-karachi'
  | 'leva-qom'
  | 'shafi'
  | 'hanafi'
  | 'maliki'
  | 'hanbali'
  | 'umm-al-qura'
  | 'isna'
  | 'mwl'
  | 'egypt'
  | 'tehran'
  | 'gulf'
  | 'kuwait'
  | 'qatar'
  | 'singapore'
  | 'france'
  | 'turkey'
  | 'russia';

// Extended calculation method configurations
export const PRAYER_METHODS: Record<PrayerMethod, {
  name: string;
  fajrAngle: number;
  ishaAngle?: number;
  ishaMinutes?: number;
  maghribMinutes?: number;
  asrFactor?: number;
  region?: string;
}> = {
  // Shia Methods
  'jafari': { 
    name: 'Jafari (Ithna Ashari)', 
    fajrAngle: 16, 
    ishaAngle: 14,
    maghribMinutes: 4,
    region: 'Shia'
  },
  'jafari-karachi': { 
    name: 'Jafari (Karachi)', 
    fajrAngle: 18, 
    ishaAngle: 18,
    maghribMinutes: 4,
    region: 'Shia - Pakistan'
  },
  'leva-qom': { 
    name: 'Leva Research Institute (Qom)', 
    fajrAngle: 16, 
    ishaAngle: 14,
    maghribMinutes: 4,
    region: 'Shia - Iran'
  },
  'tehran': { 
    name: 'Institute of Geophysics (Tehran)', 
    fajrAngle: 17.7, 
    ishaAngle: 14,
    maghribMinutes: 4,
    region: 'Iran'
  },
  
  // Sunni Methods
  'shafi': { 
    name: "Shafi'i / Standard", 
    fajrAngle: 18, 
    ishaAngle: 18,
    region: 'Sunni'
  },
  'hanafi': { 
    name: 'Hanafi', 
    fajrAngle: 18, 
    ishaAngle: 18, 
    asrFactor: 2,
    region: 'Sunni'
  },
  'maliki': { 
    name: 'Maliki', 
    fajrAngle: 18, 
    ishaAngle: 17,
    region: 'Sunni'
  },
  'hanbali': { 
    name: 'Hanbali', 
    fajrAngle: 18, 
    ishaAngle: 17,
    region: 'Sunni'
  },
  
  // Regional/Organizational Methods
  'mwl': { 
    name: 'Muslim World League', 
    fajrAngle: 18, 
    ishaAngle: 17,
    region: 'Global'
  },
  'isna': { 
    name: 'ISNA (North America)', 
    fajrAngle: 15, 
    ishaAngle: 15,
    region: 'North America'
  },
  'egypt': { 
    name: 'Egyptian General Authority', 
    fajrAngle: 19.5, 
    ishaAngle: 17.5,
    region: 'Egypt'
  },
  'umm-al-qura': { 
    name: 'Umm al-Qura (Makkah)', 
    fajrAngle: 18.5, 
    ishaMinutes: 90,
    region: 'Saudi Arabia'
  },
  'gulf': { 
    name: 'Gulf Region', 
    fajrAngle: 19.5, 
    ishaMinutes: 90,
    region: 'UAE/Oman'
  },
  'kuwait': { 
    name: 'Kuwait', 
    fajrAngle: 18, 
    ishaAngle: 17.5,
    region: 'Kuwait'
  },
  'qatar': { 
    name: 'Qatar', 
    fajrAngle: 18, 
    ishaMinutes: 90,
    region: 'Qatar'
  },
  'singapore': { 
    name: 'MUIS (Singapore)', 
    fajrAngle: 20, 
    ishaAngle: 18,
    region: 'Singapore/Malaysia'
  },
  'france': { 
    name: 'UOIF (France)', 
    fajrAngle: 12, 
    ishaAngle: 12,
    region: 'France'
  },
  'turkey': { 
    name: 'Diyanet (Turkey)', 
    fajrAngle: 18, 
    ishaAngle: 17,
    region: 'Turkey'
  },
  'russia': { 
    name: 'Spiritual Administration (Russia)', 
    fajrAngle: 16, 
    ishaAngle: 15,
    region: 'Russia'
  },
};

// Group methods by category for UI
export const PRAYER_METHOD_GROUPS: Record<string, PrayerMethod[]> = {
  'Shia Methods': ['jafari', 'jafari-karachi', 'leva-qom', 'tehran'],
  'Sunni Schools': ['shafi', 'hanafi', 'maliki', 'hanbali'],
  'Regional/Organizational': [
    'mwl',
    'isna',
    'egypt',
    'umm-al-qura',
    'gulf',
    'kuwait',
    'qatar',
    'singapore',
    'france',
    'turkey',
    'russia',
  ],
};

// Calculate timezone offset from longitude (very approximate)
export function getTimezoneFromLongitude(longitude: number): number {
  // Round to nearest 0.5 hour
  return Math.round((longitude / 15) * 2) / 2;
}

// --- Solar & prayer time calculations (NOAA-based for accuracy) ---

type SunCalc = {
  declinationRad: number; // radians
  equationOfTimeMin: number; // minutes
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Julian Day at 0:00 UTC for the provided date (calendar day)
function julianDayUTC(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  let yy = y;
  let mm = m;
  if (mm <= 2) {
    yy -= 1;
    mm += 12;
  }

  const A = Math.floor(yy / 100);
  const B = 2 - A + Math.floor(A / 4);

  return (
    Math.floor(365.25 * (yy + 4716)) +
    Math.floor(30.6001 * (mm + 1)) +
    d +
    B -
    1524.5
  );
}

// NOAA solar calculations for declination + equation of time
function solarPositionNOAA(date: Date): SunCalc {
  const JD = julianDayUTC(date);
  const T = (JD - 2451545.0) / 36525.0;

  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360; // deg
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T); // deg
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  const Mrad = toRadians(M);
  const C =
    Math.sin(Mrad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mrad) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mrad) * 0.000289;

  const trueLong = L0 + C; // deg

  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(toRadians(omega)); // deg

  const epsilon0 =
    23 +
    (26 +
      (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) /
      60;
  const epsilon = epsilon0 + 0.00256 * Math.cos(toRadians(omega)); // deg

  const epsilonRad = toRadians(epsilon);
  const lambdaRad = toRadians(lambda);

  const declinationRad = Math.asin(Math.sin(epsilonRad) * Math.sin(lambdaRad));

  // Equation of time (minutes)
  const y = Math.tan(epsilonRad / 2);
  const y2 = y * y;
  const L0rad = toRadians(L0);

  const eqTimeRad =
    y2 * Math.sin(2 * L0rad) -
    2 * e * Math.sin(Mrad) +
    4 * e * y2 * Math.sin(Mrad) * Math.cos(2 * L0rad) -
    0.5 * y2 * y2 * Math.sin(4 * L0rad) -
    1.25 * e * e * Math.sin(2 * Mrad);

  const equationOfTimeMin = 4 * toDegrees(eqTimeRad); // deg*4 = minutes

  return { declinationRad, equationOfTimeMin };
}

function hourAngleForAltitude(
  altitudeDeg: number,
  latitudeDeg: number,
  declinationRad: number
): number {
  const latRad = toRadians(latitudeDeg);
  const altRad = toRadians(altitudeDeg);

  const cosH =
    (Math.sin(altRad) - Math.sin(latRad) * Math.sin(declinationRad)) /
    (Math.cos(latRad) * Math.cos(declinationRad));

  // Return hour angle in degrees
  return toDegrees(Math.acos(clamp(cosH, -1, 1)));
}

function fixHour(a: number): number {
  return a - 24 * Math.floor(a / 24);
}

function formatTime(time: number): string {
  if (isNaN(time)) return '--:--';

  time = fixHour(time);
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);

  let h = hours;
  let m = minutes;
  if (m === 60) {
    m = 0;
    h = (h + 1) % 24;
  }

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Calculate prayer times for a given date and location
export function calculatePrayerTimes(
  date: Date,
  location: Location,
  method: PrayerMethod = 'shafi'
): PrayerTimes {
  const { latitude, longitude } = location;
  const config = PRAYER_METHODS[method];

  // Use location's timezone, otherwise fall back to a rough longitude-based estimate
  // (accurate timezone-by-coordinates requires a timezone database).
  const timezone = location.timezone ?? getTimezoneFromLongitude(longitude);

  const { declinationRad, equationOfTimeMin } = solarPositionNOAA(date);

  // Solar noon (local time, in hours)
  const solarNoon = (720 - 4 * longitude - equationOfTimeMin + timezone * 60) / 60;

  // Sunrise/Sunset: use standard refraction-corrected altitude -0.833°
  const haSunriseDeg = hourAngleForAltitude(-0.833, latitude, declinationRad);
  const sunrise = solarNoon - (haSunriseDeg * 4) / 60;
  const sunset = solarNoon + (haSunriseDeg * 4) / 60;

  // Fajr: sun altitude = -fajrAngle
  const haFajrDeg = hourAngleForAltitude(-config.fajrAngle, latitude, declinationRad);
  const fajr = solarNoon - (haFajrDeg * 4) / 60;

  // Dhuhr
  const dhuhr = solarNoon;

  // Asr: altitude computed from shadow factor
  const asrFactor = config.asrFactor ?? 1;
  const latRad = toRadians(latitude);
  const declDeg = toDegrees(declinationRad);
  const angleRad = Math.atan(1 / (asrFactor + Math.tan(toRadians(Math.abs(latitude - declDeg)))));
  const asrAltitudeDeg = toDegrees(angleRad);
  const haAsrDeg = hourAngleForAltitude(asrAltitudeDeg, latitude, declinationRad);
  const asr = solarNoon + (haAsrDeg * 4) / 60;

  // Maghrib
  const maghribMinutes = config.maghribMinutes ?? 0;
  const maghrib = sunset + maghribMinutes / 60;

  // Isha
  let isha: number;
  if (config.ishaMinutes) {
    isha = maghrib + config.ishaMinutes / 60;
  } else if (config.ishaAngle) {
    const haIshaDeg = hourAngleForAltitude(-config.ishaAngle, latitude, declinationRad);
    isha = solarNoon + (haIshaDeg * 4) / 60;
  } else {
    isha = maghrib + 1.5;
  }

  return {
    fajr: formatTime(fajr),
    sunrise: formatTime(sunrise),
    dhuhr: formatTime(dhuhr),
    asr: formatTime(asr),
    maghrib: formatTime(maghrib),
    isha: formatTime(isha),
  };
}


// Format time to 12-hour format
export function formatTime12h(time24: string): string {
  if (time24 === '--:--') return time24;
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Get user's location using Geolocation API
export function getUserLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        resolve({
          latitude: lat,
          longitude: lon,
          timezone: getTimezoneFromLongitude(lon),
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Default locations for common cities with proper timezones
export const DEFAULT_LOCATIONS: Record<string, Location> = {
  'Mecca': { latitude: 21.4225, longitude: 39.8262, city: 'Mecca', timezone: 3 },
  'Medina': { latitude: 24.5247, longitude: 39.5692, city: 'Medina', timezone: 3 },
  'Qom': { latitude: 34.6416, longitude: 50.8746, city: 'Qom', timezone: 3.5 },
  'Najaf': { latitude: 32.0000, longitude: 44.3360, city: 'Najaf', timezone: 3 },
  'Karbala': { latitude: 32.6160, longitude: 44.0249, city: 'Karbala', timezone: 3 },
  'Tehran': { latitude: 35.6892, longitude: 51.3890, city: 'Tehran', timezone: 3.5 },
  'Cairo': { latitude: 30.0444, longitude: 31.2357, city: 'Cairo', timezone: 2 },
  'Istanbul': { latitude: 41.0082, longitude: 28.9784, city: 'Istanbul', timezone: 3 },
  'Dubai': { latitude: 25.2048, longitude: 55.2708, city: 'Dubai', timezone: 4 },
  'Srinagar': { latitude: 34.0837, longitude: 74.7973, city: 'Srinagar', timezone: 5.5 },
  'Delhi': { latitude: 28.6139, longitude: 77.2090, city: 'Delhi', timezone: 5.5 },
  'Mumbai': { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', timezone: 5.5 },
  'London': { latitude: 51.5074, longitude: -0.1278, city: 'London', timezone: 0 },
  'New York': { latitude: 40.7128, longitude: -74.0060, city: 'New York', timezone: -5 },
  'Los Angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', timezone: -8 },
  'Toronto': { latitude: 43.6532, longitude: -79.3832, city: 'Toronto', timezone: -5 },
  'Karachi': { latitude: 24.8607, longitude: 67.0011, city: 'Karachi', timezone: 5 },
  'Lahore': { latitude: 31.5204, longitude: 74.3587, city: 'Lahore', timezone: 5 },
  'Islamabad': { latitude: 33.6844, longitude: 73.0479, city: 'Islamabad', timezone: 5 },
  'Jakarta': { latitude: -6.2088, longitude: 106.8456, city: 'Jakarta', timezone: 7 },
  'Kuala Lumpur': { latitude: 3.1390, longitude: 101.6869, city: 'Kuala Lumpur', timezone: 8 },
  'Baghdad': { latitude: 33.3152, longitude: 44.3661, city: 'Baghdad', timezone: 3 },
  'Riyadh': { latitude: 24.7136, longitude: 46.6753, city: 'Riyadh', timezone: 3 },
  'Jeddah': { latitude: 21.4858, longitude: 39.1925, city: 'Jeddah', timezone: 3 },
  'Doha': { latitude: 25.2867, longitude: 51.5333, city: 'Doha', timezone: 3 },
  'Kuwait City': { latitude: 29.3759, longitude: 47.9774, city: 'Kuwait City', timezone: 3 },
  'Muscat': { latitude: 23.5880, longitude: 58.3829, city: 'Muscat', timezone: 4 },
  'Ankara': { latitude: 39.9334, longitude: 32.8597, city: 'Ankara', timezone: 3 },
  'Paris': { latitude: 48.8566, longitude: 2.3522, city: 'Paris', timezone: 1 },
  'Berlin': { latitude: 52.5200, longitude: 13.4050, city: 'Berlin', timezone: 1 },
  'Sydney': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', timezone: 11 },
  'Melbourne': { latitude: -37.8136, longitude: 144.9631, city: 'Melbourne', timezone: 11 },
};

// Format timezone for display
export function formatTimezone(tz: number): string {
  const sign = tz >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(tz));
  const minutes = (Math.abs(tz) % 1) * 60;
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}
