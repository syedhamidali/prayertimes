import { useState, useEffect, useMemo } from 'react';
import { CalendarHeader } from '@/components/CalendarHeader';
import { CalendarGrid } from '@/components/CalendarGrid';
import { YearSelector } from '@/components/YearSelector';
import { ExportButton } from '@/components/ExportButton';
import { PrayerTimesCard } from '@/components/PrayerTimesCard';
import { getCurrentHijriDate, CalculationMethod, formatHijriDate, hijriToGregorian, HIJRI_MONTHS } from '@/lib/hijriUtils';
import type { Location as PrayerLocation, PrayerMethod } from '@/lib/prayerTimes';
import { getTimezoneFromLongitude } from '@/lib/prayerTimes';
import type { AladhanHijriDate } from '@/lib/aladhanApi';
import { Moon, Star, MapPin, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logVisit } from '@/lib/visitorLog';

function parseUtcOffset(offset: string): number {
  const sign = offset[0] === '-' ? -1 : 1;
  const abs = offset.replace(/^[+-]/, '');
  const hours = parseInt(abs.slice(0, 2), 10) || 0;
  const minutes = parseInt(abs.slice(2, 4), 10) || 0;
  return sign * (hours + minutes / 60);
}

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
  const [timezoneOffset, setTimezoneOffset] = useState<number | undefined>(undefined);
  const [apiHijriDate, setApiHijriDate] = useState<AladhanHijriDate | undefined>(undefined);
  const [dateAdjustment, setDateAdjustment] = useState(0);
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
    // Try to get device location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            logVisit({ latitude, longitude, accuracy });
            const tz = getTimezoneFromLongitude(longitude);
            setTimezoneOffset(tz);
            
            // Initialize Hijri date with detected timezone
            const current = getCurrentHijriDate(method, tz);
            setHijriYear(current.year);
            setHijriMonth(current.month);
            
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
            const current = getCurrentHijriDate(method);
            setHijriYear(current.year);
            setHijriMonth(current.month);
            setLocation({ loading: false });
          }
        },
        async () => {
          logVisit();
          // Fallback to IP-based location
          try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            const tz = data.utc_offset ? parseUtcOffset(data.utc_offset) : 
                       (typeof data.longitude === 'number' ? getTimezoneFromLongitude(data.longitude) : undefined);
            if (tz !== undefined) setTimezoneOffset(tz);
            
            const current = getCurrentHijriDate(method, tz);
            setHijriYear(current.year);
            setHijriMonth(current.month);
            
            setLocation({
              city: data.city,
              country: data.country_name,
              latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
              longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
              loading: false
            });
          } catch {
            const current = getCurrentHijriDate(method);
            setHijriYear(current.year);
            setHijriMonth(current.month);
            setLocation({ loading: false });
          }
        }
      );
    } else {
      logVisit();
      // No geolocation, use IP-based
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          const tz = data.utc_offset ? parseUtcOffset(data.utc_offset) : 
                     (typeof data.longitude === 'number' ? getTimezoneFromLongitude(data.longitude) : undefined);
          if (tz !== undefined) setTimezoneOffset(tz);
          
          const current = getCurrentHijriDate(method, tz);
          setHijriYear(current.year);
          setHijriMonth(current.month);
          
          setLocation({
            city: data.city,
            country: data.country_name,
            latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
            longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
            loading: false
          });
        })
        .catch(() => {
          const current = getCurrentHijriDate(method);
          setHijriYear(current.year);
          setHijriMonth(current.month);
          setLocation({ loading: false });
        });
    }
  }, []);

  // Get the correct Gregorian date for prayer times card
  // If apiHijriDate is available, use it for accurate alignment; otherwise use today's date
  const selectedDate = useMemo(() => {
    if (apiHijriDate?.gregorian) {
      return new Date(
        apiHijriDate.gregorian.year,
        apiHijriDate.gregorian.month - 1,
        apiHijriDate.gregorian.day
      );
    }
    // Fallback to today's date
    return new Date();
  }, [apiHijriDate]);

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
    // Use API date if available, otherwise fall back to calculated date
    if (apiHijriDate) {
      setHijriYear(apiHijriDate.year);
      setHijriMonth(apiHijriDate.month);
    } else {
      const current = getCurrentHijriDate(method, timezoneOffset);
      setHijriYear(current.year);
      setHijriMonth(current.month);
    }
  };

  // Handle preferences change from PrayerTimesCard (includes timezone and Hijri date from API)
  const handlePreferencesChange = (prefs: { 
    location: PrayerLocation; 
    cityLabel: string; 
    method: PrayerMethod;
    currentHijriDate?: AladhanHijriDate;
  }) => {
    setExportPrefs(prefs);
    // Update timezone when location changes
    const tz = prefs.location.timezone ?? getTimezoneFromLongitude(prefs.location.longitude);
    setTimezoneOffset(tz);
    // Store the API Hijri date
    if (prefs.currentHijriDate) {
      setApiHijriDate(prefs.currentHijriDate);
    }
  };

  // Use API date for header display, fall back to calculated date
  const currentHijri = apiHijriDate
    ? { year: apiHijriDate.year, month: apiHijriDate.month, day: apiHijriDate.day }
    : getCurrentHijriDate(method, timezoneOffset);

  // Apply date adjustment to the Gregorian date passed to CalendarGrid
  const adjustedGregorianDate = useMemo(() => {
    if (!apiHijriDate?.gregorian) return undefined;
    if (dateAdjustment === 0) return apiHijriDate.gregorian;
    const d = new Date(apiHijriDate.gregorian.year, apiHijriDate.gregorian.month - 1, apiHijriDate.gregorian.day);
    d.setDate(d.getDate() + dateAdjustment);
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }, [apiHijriDate, dateAdjustment]);

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
            <div className="flex flex-wrap items-center gap-4">
              <YearSelector
                year={hijriYear}
                month={hijriMonth}
                onYearChange={setHijriYear}
                onMonthChange={setHijriMonth}
              />
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/30">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Date Adj.</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDateAdjustment(prev => prev - 1)}
                  className="h-7 w-7 rounded-lg"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className={cn(
                  "w-8 text-center text-sm font-mono font-semibold",
                  dateAdjustment === 0 ? "text-muted-foreground" : dateAdjustment > 0 ? "text-primary" : "text-destructive"
                )}>
                  {dateAdjustment > 0 ? `+${dateAdjustment}` : dateAdjustment}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDateAdjustment(prev => prev + 1)}
                  className="h-7 w-7 rounded-lg"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <ExportButton
              hijriYear={hijriYear}
              hijriMonth={hijriMonth}
              method={method}
              prayerMethod={exportPrefs.method}
              cityLabel={exportPrefs.cityLabel}
              userLocation={{
                latitude: exportPrefs.location.latitude,
                longitude: exportPrefs.location.longitude,
                cityName: exportPrefs.cityLabel,
              }}
              apiHijriDate={apiHijriDate}
              dateAdjustment={dateAdjustment}
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
                timezoneOffset={timezoneOffset}
                currentHijriDay={apiHijriDate?.day}
                currentHijriMonth={apiHijriDate?.month}
                currentHijriYear={apiHijriDate?.year}
                currentGregorianDate={adjustedGregorianDate}
              />
            </div>
          </div>

          {/* Prayer Times - takes 1 column on large screens */}
          <div className="lg:col-span-1 space-y-6">
            <PrayerTimesCard selectedDate={selectedDate} onPreferencesChange={handlePreferencesChange} />
            
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
