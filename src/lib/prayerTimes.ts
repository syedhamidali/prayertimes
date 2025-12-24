// Prayer time calculation utilities

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
}

// Calculation method configurations
export const PRAYER_METHODS = {
  'jafari': { fajrAngle: 16, ishaAngle: 14, name: 'Jafari' },
  'shafi': { fajrAngle: 18, ishaAngle: 18, name: "Shafi'i" },
  'hanafi': { fajrAngle: 18, ishaAngle: 18, asrFactor: 2, name: 'Hanafi' },
  'maliki': { fajrAngle: 18, ishaAngle: 17, name: 'Maliki' },
  'hanbali': { fajrAngle: 18, ishaAngle: 17, name: 'Hanbali' },
  'umm-al-qura': { fajrAngle: 18.5, ishaMinutes: 90, name: 'Umm al-Qura' },
  'isna': { fajrAngle: 15, ishaAngle: 15, name: 'ISNA' },
} as const;

// Convert degrees to radians
const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

// Calculate prayer times for a given date and location
export function calculatePrayerTimes(
  date: Date,
  location: Location,
  method: keyof typeof PRAYER_METHODS = 'shafi'
): PrayerTimes {
  const { latitude, longitude } = location;
  const config = PRAYER_METHODS[method];
  
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
  
  // Timezone offset in hours
  const timezone = -date.getTimezoneOffset() / 60;
  
  // Calculate Dhuhr time
  const dhuhr = 12 + timezone - longitude / 15 - EqT;
  
  // Calculate sunrise and sunset
  const sunrise = dhuhr - hourAngle(0.833, decl, latitude);
  const sunset = dhuhr + hourAngle(0.833, decl, latitude);
  
  // Calculate Fajr
  const fajr = dhuhr - hourAngle(config.fajrAngle, decl, latitude);
  
  // Calculate Asr (Shafi: shadow = object + 1, Hanafi: shadow = object + 2)
  const asrFactor = 'asrFactor' in config ? config.asrFactor : 1;
  const asrAngle = toDegrees(Math.atan(1 / (asrFactor + Math.tan(toRadians(Math.abs(latitude - decl))))));
  const asr = dhuhr + hourAngle(90 - asrAngle, decl, latitude);
  
  // Calculate Maghrib (sunset)
  const maghrib = sunset;
  
  // Calculate Isha
  let isha: number;
  if ('ishaMinutes' in config) {
    isha = maghrib + config.ishaMinutes / 60;
  } else {
    isha = dhuhr + hourAngle(config.ishaAngle, decl, latitude);
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
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Default locations for common cities
export const DEFAULT_LOCATIONS: Record<string, Location> = {
  'Mecca': { latitude: 21.4225, longitude: 39.8262, city: 'Mecca' },
  'Medina': { latitude: 24.5247, longitude: 39.5692, city: 'Medina' },
  'Cairo': { latitude: 30.0444, longitude: 31.2357, city: 'Cairo' },
  'Istanbul': { latitude: 41.0082, longitude: 28.9784, city: 'Istanbul' },
  'Dubai': { latitude: 25.2048, longitude: 55.2708, city: 'Dubai' },
  'London': { latitude: 51.5074, longitude: -0.1278, city: 'London' },
  'New York': { latitude: 40.7128, longitude: -74.0060, city: 'New York' },
  'Karachi': { latitude: 24.8607, longitude: 67.0011, city: 'Karachi' },
  'Jakarta': { latitude: -6.2088, longitude: 106.8456, city: 'Jakarta' },
  'Kuala Lumpur': { latitude: 3.1390, longitude: 101.6869, city: 'Kuala Lumpur' },
};
