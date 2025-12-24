// NOAA-based solar calculations used for prayer times

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type SunCalc = {
  declinationRad: number; // radians
  equationOfTimeMin: number; // minutes
};

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
export function solarPositionNOAA(date: Date): SunCalc {
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

export function hourAngleForAltitude(
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

export function solarNoonLocalHours(opts: {
  longitude: number;
  timezoneHours: number;
  equationOfTimeMin: number;
}): number {
  const { longitude, timezoneHours, equationOfTimeMin } = opts;
  return (720 - 4 * longitude - equationOfTimeMin + timezoneHours * 60) / 60;
}

export function toDegreesFromRadians(rad: number) {
  return toDegrees(rad);
}

export function toRadiansFromDegrees(deg: number) {
  return toRadians(deg);
}
