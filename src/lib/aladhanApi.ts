// Client-side wrapper for the AlAdhan Prayer Times API
// Docs: https://api.aladhan.com/v1/methods

import type { Location, PrayerMethod, PrayerTimes } from "@/lib/prayerTimes";

function formatDateForAladhan(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function stripTime(t: string) {
  // API returns e.g. "05:12" or "05:12 (+05)"; keep HH:MM
  return t.split(" ")[0];
}

export function toAladhanMethodId(method: PrayerMethod): number {
  switch (method) {
    case "jafari":
    case "leva-qom":
      return 0; // Shia Ithna-Ashari
    case "tehran":
      return 7;
    case "mwl":
    case "shafi":
    case "maliki":
    case "hanbali":
      return 3;
    case "hanafi":
      return 3; // MWL + school=1
    case "isna":
      return 2;
    case "egypt":
      return 5;
    case "umm-al-qura":
      return 4;
    case "gulf":
      return 8;
    case "kuwait":
      return 9;
    case "qatar":
      return 10;
    case "singapore":
      return 11;
    case "france":
      return 12;
    case "turkey":
      return 13;
    case "russia":
      return 14;
    case "jafari-karachi":
      return 1; // Karachi
    default:
      return 3;
  }
}

export async function fetchPrayerTimesFromAladhan(opts: {
  date: Date;
  location: Location;
  method: PrayerMethod;
}): Promise<PrayerTimes> {
  const { date, location, method } = opts;

  const methodId = toAladhanMethodId(method);
  const school = method === "hanafi" ? 1 : 0;

  const url = new URL(`https://api.aladhan.com/v1/timings/${formatDateForAladhan(date)}`);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("method", String(methodId));
  url.searchParams.set("school", String(school));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`AlAdhan request failed: ${res.status}`);
  }

  const json = await res.json();
  const timings = json?.data?.timings;
  if (!timings) {
    throw new Error("AlAdhan response missing timings");
  }

  return {
    fajr: stripTime(timings.Fajr),
    sunrise: stripTime(timings.Sunrise),
    dhuhr: stripTime(timings.Dhuhr),
    asr: stripTime(timings.Asr),
    maghrib: stripTime(timings.Maghrib),
    isha: stripTime(timings.Isha),
  };
}
