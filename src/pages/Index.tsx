import { useState, useEffect, useMemo } from 'react';
import { CalendarHeader } from '@/components/CalendarHeader';
import { CalendarGrid } from '@/components/CalendarGrid';
import { YearSelector } from '@/components/YearSelector';
import { ExportButton } from '@/components/ExportButton';
import { PrayerTimesCard } from '@/components/PrayerTimesCard';
import { getCurrentHijriDate, CalculationMethod, formatHijriDate, hijriToGregorian } from '@/lib/hijriUtils';
import type { Location as PrayerLocation, PrayerMethod } from '@/lib/prayerTimes';
import { Moon, Star, MapPin } from 'lucide-react';

interface LocationInfo {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  loading: boolean;
}

const Index = () => {
  const method: CalculationMethod = 'leva';
  const [hijriYear, setHijriYear] = useState(1446);
  const [hijriMonth, setHijriMonth] = useState(6);
  const [location, setLocation] = useState<LocationInfo>({ loading: true });
  const [exportPrefs, setExportPrefs] = useState<{
    location: PrayerLocation;
    cityLabel: string;
    method: PrayerMethod;
  }>({
    location: { latitude: 21.4225, longitude: 39.8262, city: 'Mecca', timezone: 3 },
    cityLabel: 'Mecca',
    method: 'leva-qom',
  });

  // Get location and initialize with current Hijri date
  useEffect(() => {
    const current = getCurrentHijriDate(method);
    setHijriYear(current.year);
    setHijriMonth(current.month);

    // Try to get device location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            setLocation({
              city: data.city || data.locality,
              country: data.countryName,
              latitude,
              longitude,
              loading: false
            });
          } catch {
            setLocation({ loading: false });
          }
        },
        async () => {
          // Fallback to IP-based location
          try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            setLocation({
              city: data.city,
              country: data.country_name,
              latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
              longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
              loading: false
            });
          } catch {
            setLocation({ loading: false });
          }
        }
      );
    } else {
      // No geolocation, use IP-based
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          setLocation({
            city: data.city,
            country: data.country_name,
            latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
            longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
            loading: false
          });
        })
        .catch(() => setLocation({ loading: false }));
    }
  }, []);

  // Get the first day of the currently selected Hijri month as Gregorian date
  const selectedDate = useMemo(() => {
    return hijriToGregorian(hijriYear, hijriMonth, 1, method);
  }, [hijriYear, hijriMonth, method]);

  const handlePrevMonth = () => {
    if (hijriMonth === 1) {
      setHijriMonth(12);
      setHijriYear(hijriYear - 1);
    } else {
      setHijriMonth(hijriMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (hijriMonth === 12) {
      setHijriMonth(1);
      setHijriYear(hijriYear + 1);
    } else {
      setHijriMonth(hijriMonth + 1);
    }
  };

  const handleToday = () => {
    const current = getCurrentHijriDate(method);
    setHijriYear(current.year);
    setHijriMonth(current.month);
  };

  const currentHijri = getCurrentHijriDate(method);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Decorative background */}
      <div className="fixed inset-0 islamic-pattern opacity-40 pointer-events-none" />
      
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-emerald-dark" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M30%200L60%2030L30%2060L0%2030z%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%220.05%22%20stroke-width%3D%220.5%22%2F%3E%3C%2Fsvg%3E')] bg-[length:30px_30px]" />
        
        {/* Floating decorative elements */}
        <div className="absolute top-10 left-10 opacity-20 animate-pulse">
          <Star className="h-8 w-8 text-gold" />
        </div>
        <div className="absolute top-20 right-20 opacity-15 animate-pulse" style={{ animationDelay: '1s' }}>
          <Moon className="h-12 w-12 text-gold" />
        </div>
        <div className="absolute bottom-10 left-1/4 opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <Star className="h-6 w-6 text-gold" />
        </div>
        
        <div className="relative container max-w-6xl mx-auto text-center py-12 sm:py-16 px-4">
          <div className="flex items-center justify-center gap-4 mb-5 animate-fade-in">
            <div className="p-3 rounded-2xl bg-gold/20 backdrop-blur-sm">
              <Moon className="h-8 w-8 text-gold" />
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-primary-foreground drop-shadow-lg" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </h1>
            <div className="p-3 rounded-2xl bg-gold/20 backdrop-blur-sm">
              <Moon className="h-8 w-8 text-gold" />
            </div>
          </div>
          <p className="text-primary-foreground/80 text-lg sm:text-xl animate-fade-in max-w-2xl mx-auto flex items-center justify-center gap-2" style={{ animationDelay: '0.1s' }}>
            <MapPin className="h-5 w-5" />
            {location.loading ? 'Detecting location...' : location.city && location.country ? `${location.city}, ${location.country}` : 'Islamic Calendar & Prayer Times'}
          </p>
          <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-primary-foreground/20">
              <Moon className="h-5 w-5 text-gold" />
              <span className="text-gold font-display text-xl sm:text-2xl font-semibold">
                {formatHijriDate(currentHijri.year, currentHijri.month, currentHijri.day)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container max-w-6xl mx-auto px-4 py-8 -mt-4">
        {/* Controls */}
        <div className="bg-card/80 backdrop-blur-md rounded-3xl shadow-card border border-border/50 p-5 sm:p-7 mb-6 animate-slide-up">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <YearSelector
              year={hijriYear}
              month={hijriMonth}
              onYearChange={setHijriYear}
              onMonthChange={setHijriMonth}
            />
            <ExportButton
              hijriYear={hijriYear}
              hijriMonth={hijriMonth}
              method={method}
              prayerMethod={exportPrefs.method}
              userLocation={{
                latitude: exportPrefs.location.latitude,
                longitude: exportPrefs.location.longitude,
                cityName: exportPrefs.cityLabel,
              }}
            />
          </div>
        </div>

        {/* Two column layout for calendar and prayer times */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar - takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CalendarHeader
                hijriYear={hijriYear}
                hijriMonth={hijriMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
              />
              <CalendarGrid
                hijriYear={hijriYear}
                hijriMonth={hijriMonth}
                method={method}
              />
            </div>
          </div>

          {/* Prayer Times - takes 1 column on large screens */}
          <div className="lg:col-span-1 space-y-6">
            <PrayerTimesCard selectedDate={selectedDate} onPreferencesChange={setExportPrefs} />
            
            {/* Info Section */}
            <div className="bg-gradient-to-br from-card via-card to-secondary/30 rounded-3xl shadow-card border border-border/50 p-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <h3 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" />
                About Methods
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Different Islamic schools and research institutes use varying methods for prayer time calculations.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-1">•</span>
                  <span><strong className="text-foreground">Leva (Qom)</strong> - Shia method from Iran</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-1">•</span>
                  <span><strong className="text-foreground">Jafari (Karachi)</strong> - Shia method for Pakistan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-1">•</span>
                  <span><strong className="text-foreground">Umm al-Qura</strong> - Official Saudi calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-1">•</span>
                  <span><strong className="text-foreground">ISNA</strong> - North American standard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-transparent to-card border-t border-border/30 py-8 mt-12">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <p className="font-display text-2xl text-foreground/80 mb-2">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="text-muted-foreground text-sm">
            Hijri Calendar & Prayer Times • Export calendars as PDF
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
