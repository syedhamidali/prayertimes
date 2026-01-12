
import { calculatePrayerTimes, PRAYER_METHODS } from './prayerTimes';
import { expect, test, describe } from 'bun:test';

const srinagar = { latitude: 34.0837, longitude: 74.7973, city: 'Srinagar', timezone: 5.5 };
const date = new Date('2026-01-13T12:00:00Z'); // Midday UTC, doesn't matter much as calculation uses date components

describe('Prayer Times Calculation', () => {
  test('Leva Qom (Method 0) matches corrected expectation for Srinagar', () => {
    // Expected: Maghrib around 17:59
    const times = calculatePrayerTimes(date, srinagar, 'leva-qom');
    expect(times.maghrib).toBe('17:59');

    // Check if Fajr/Isha are reasonable
    // Fajr (16 deg)
    expect(times.fajr).not.toBe('--:--');
    // Isha (14 deg)
    expect(times.isha).not.toBe('--:--');
  });

  test('Sunni Method (MWL) matches approximate expectation', () => {
    // MWL: Maghrib is Sunset (approx 17:42)
    const times = calculatePrayerTimes(date, srinagar, 'mwl');

    // Sunset calculation:
    // With 17:59 being Sunset + ~17 mins, Sunset is ~17:42.
    // MWL Maghrib = Sunset.
    // So we expect ~17:42.
    // Allow small margin
    const [h, m] = times.maghrib.split(':').map(Number);
    const mins = h * 60 + m;
    const expected = 17 * 60 + 42;
    expect(Math.abs(mins - expected)).toBeLessThanOrEqual(2);
  });

  test('Tehran Method uses 4.5 degree maghrib', () => {
      // Tehran uses 4.5 degrees. Leva uses 4 degrees.
      // So Tehran Maghrib should be slightly later than Leva.
      const leva = calculatePrayerTimes(date, srinagar, 'leva-qom');
      const tehran = calculatePrayerTimes(date, srinagar, 'tehran');

      const [levaH, levaM] = leva.maghrib.split(':').map(Number);
      const [tehranH, tehranM] = tehran.maghrib.split(':').map(Number);

      const levaMins = levaH * 60 + levaM;
      const tehranMins = tehranH * 60 + tehranM;

      // 4.5 degrees > 4 degrees (depression), so sun takes longer to go down.
      // So Tehran time > Leva time.
      expect(tehranMins).toBeGreaterThan(levaMins);
  });
});
