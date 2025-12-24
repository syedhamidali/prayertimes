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
export const PRAYER_METHOD_GROUPS = {
  'Shia Methods': ['jafari', 'jafari-karachi', 'leva-qom', 'tehran'] as PrayerMethod[],
  'Sunni Schools': ['shafi', 'hanafi', 'maliki', 'hanbali'] as PrayerMethod[],
  'Regional/Organizational': ['mwl', 'isna', 'egypt', 'umm-al-qura', 'gulf', 'kuwait', 'qatar', 'singapore', 'france', 'turkey', 'russia'] as PrayerMethod[],
};

// Convert degrees to radians
const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

// Calculate timezone offset from longitude (approximate)
export function getTimezoneFromLongitude(longitude: number): number {
  return Math.round(longitude / 15);
}

// Calculate prayer times for a given date and location
export function calculatePrayerTimes(
  date: Date,
  location: Location,
  method: PrayerMethod = 'shafi'
): PrayerTimes {
  const { latitude, longitude } = location;
  const config = PRAYER_METHODS[method];
  
  // Use location's timezone or calculate from longitude
  const timezone = location.timezone ?? getTimezoneFromLongitude(longitude);
  
  // Julian date calculation
  const jd = julianDate(date);
  
  // Sun position calculations
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(toRadians(g)) + 0.020 * Math.sin(toRadians(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = toDegrees(Math.atan2(Math.cos(toRadians(e)) * Math.sin(toRadians(L)), Math.cos(toRadians(L)))) / 15;
  const decl = toDegrees(Math.asin(Math.sin(toRadians(e)) * Math.sin(toRadians(L))));
  const EqT = q / 15 - fixHour(RA);
  
  // Calculate Dhuhr time using the location's timezone
  const dhuhr = 12 + timezone - longitude / 15 - EqT;
  
  // Calculate sunrise and sunset
  const sunrise = dhuhr - hourAngle(0.833, decl, latitude);
  const sunset = dhuhr + hourAngle(0.833, decl, latitude);
  
  // Calculate Fajr
  const fajr = dhuhr - hourAngle(config.fajrAngle, decl, latitude);
  
  // Calculate Asr (Standard: shadow = object + 1, Hanafi: shadow = object + 2)
  const asrFactor = config.asrFactor || 1;
  const asrAngle = toDegrees(Math.atan(1 / (asrFactor + Math.tan(toRadians(Math.abs(latitude - decl))))));
  const asr = dhuhr + hourAngle(90 - asrAngle, decl, latitude);
  
  // Calculate Maghrib (sunset + optional minutes)
  const maghribMinutes = config.maghribMinutes || 0;
  const maghrib = sunset + maghribMinutes / 60;
  
  // Calculate Isha
  let isha: number;
  if (config.ishaMinutes) {
    isha = maghrib + config.ishaMinutes / 60;
  } else if (config.ishaAngle) {
    isha = dhuhr + hourAngle(config.ishaAngle, decl, latitude);
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

// Helper functions
function julianDate(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let y = year;
  let m = month;
  
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function fixAngle(a: number): number {
  return a - 360 * Math.floor(a / 360);
}

function fixHour(a: number): number {
  return a - 24 * Math.floor(a / 24);
}

function hourAngle(angle: number, decl: number, lat: number): number {
  const cos = (Math.sin(toRadians(angle)) - Math.sin(toRadians(lat)) * Math.sin(toRadians(decl))) /
    (Math.cos(toRadians(lat)) * Math.cos(toRadians(decl)));
  return toDegrees(Math.acos(Math.max(-1, Math.min(1, cos)))) / 15;
}

function formatTime(time: number): string {
  if (isNaN(time)) return '--:--';
  
  time = fixHour(time);
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  
  return `${h}:${m}`;
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
