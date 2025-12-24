// Hijri date utilities and calculation methods

export type CalculationMethod = 
  | 'leva'
  | 'jafari' 
  | 'shafi' 
  | 'hanafi' 
  | 'maliki' 
  | 'hanbali'
  | 'umm-al-qura'
  | 'isna';

export const CALCULATION_METHODS: { value: CalculationMethod; label: string; description: string }[] = [
  { value: 'leva', label: 'Leva Institute, Qum', description: 'Shia Ithna-Ashari method from Qum' },
  { value: 'jafari', label: 'Jafari (Ithna Ashari)', description: 'Shia Ithna Ashari method' },
  { value: 'shafi', label: "Shafi'i", description: "Shafi'i school of jurisprudence" },
  { value: 'hanafi', label: 'Hanafi', description: 'Hanafi school of jurisprudence' },
  { value: 'maliki', label: 'Maliki', description: 'Maliki school of jurisprudence' },
  { value: 'hanbali', label: 'Hanbali', description: 'Hanbali school of jurisprudence' },
  { value: 'umm-al-qura', label: 'Umm al-Qura', description: 'Saudi Arabia calendar' },
  { value: 'isna', label: 'ISNA', description: 'Islamic Society of North America' },
];

export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul Qadah',
  'Dhul Hijjah',
];

export const HIJRI_MONTHS_ARABIC = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

export const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Method adjustments for different calculation methods (in days)
const METHOD_ADJUSTMENTS: Record<CalculationMethod, number> = {
  'leva': 0,
  'jafari': 0,
  'shafi': 0,
  'hanafi': 0,
  'maliki': 0,
  'hanbali': 0,
  'umm-al-qura': 1,
  'isna': 0,
};

// Convert Gregorian to Hijri
export function gregorianToHijri(date: Date, method: CalculationMethod = 'leva'): { year: number; month: number; day: number } {
  const adjustment = METHOD_ADJUSTMENTS[method];
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + adjustment);
  
  const jd = gregorianToJulian(adjustedDate);
  return julianToHijri(jd);
}

// Convert Hijri to Gregorian
export function hijriToGregorian(year: number, month: number, day: number, method: CalculationMethod = 'leva'): Date {
  const adjustment = METHOD_ADJUSTMENTS[method];
  const jd = hijriToJulian(year, month, day);
  const date = julianToGregorian(jd);
  date.setDate(date.getDate() - adjustment);
  return date;
}

// Get number of days in a Hijri month
export function getHijriMonthDays(year: number, month: number): number {
  // In the Islamic calendar, months alternate between 29 and 30 days
  // The 12th month (Dhul Hijjah) has 30 days in leap years
  if (month === 12 && isHijriLeapYear(year)) {
    return 30;
  }
  return month % 2 === 1 ? 30 : 29;
}

// Check if a Hijri year is a leap year
export function isHijriLeapYear(year: number): boolean {
  return ((11 * year + 14) % 30) < 11;
}

// Get all days in a Hijri month with their Gregorian equivalents
export function getMonthDays(hijriYear: number, hijriMonth: number, method: CalculationMethod): {
  hijriDay: number;
  gregorianDate: Date;
  isToday: boolean;
}[] {
  const days: { hijriDay: number; gregorianDate: Date; isToday: boolean }[] = [];
  const numDays = getHijriMonthDays(hijriYear, hijriMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let day = 1; day <= numDays; day++) {
    const gregorianDate = hijriToGregorian(hijriYear, hijriMonth, day, method);
    gregorianDate.setHours(0, 0, 0, 0);
    days.push({
      hijriDay: day,
      gregorianDate,
      isToday: gregorianDate.getTime() === today.getTime(),
    });
  }
  
  return days;
}

// Get current Hijri date
export function getCurrentHijriDate(method: CalculationMethod = 'leva'): { year: number; month: number; day: number } {
  return gregorianToHijri(new Date(), method);
}

// Helper functions for calendar calculations
function gregorianToJulian(date: Date): number {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function julianToGregorian(jd: number): Date {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  
  let A: number;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  
  return new Date(year, month - 1, Math.floor(day));
}

function julianToHijri(jd: number): { year: number; month: number; day: number } {
  const L = Math.floor(jd - 1948440 + 10632);
  const N = Math.floor((L - 1) / 10631);
  const L2 = L - 10631 * N + 354;
  const J = Math.floor((10985 - L2) / 5316) * Math.floor((50 * L2) / 17719) + Math.floor(L2 / 5670) * Math.floor((43 * L2) / 15238);
  const L3 = L2 - Math.floor((30 - J) / 15) * Math.floor((17719 * J) / 50) - Math.floor(J / 16) * Math.floor((15238 * J) / 43) + 29;
  const month = Math.floor((24 * L3) / 709);
  const day = L3 - Math.floor((709 * month) / 24);
  const year = 30 * N + J - 30;
  
  return { year, month, day };
}

function hijriToJulian(year: number, month: number, day: number): number {
  return Math.floor((11 * year + 3) / 30) + 354 * year + 30 * month - Math.floor((month - 1) / 2) + day - 385 + 1948440 - 1;
}

// Format date for display
export function formatHijriDate(year: number, month: number, day: number): string {
  return `${day} ${HIJRI_MONTHS[month - 1]} ${year} AH`;
}

export function formatGregorianDate(date: Date): string {
  return `${date.getDate()} ${GREGORIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
