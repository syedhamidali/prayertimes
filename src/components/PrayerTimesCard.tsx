import { useState, useEffect } from 'react';
import { Clock, MapPin, Loader2, Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calculatePrayerTimes,
  formatTime12h,
  getUserLocation,
  DEFAULT_LOCATIONS,
  Location,
  PrayerTimes,
  PRAYER_METHODS,
} from '@/lib/prayerTimes';
import { CalculationMethod } from '@/lib/hijriUtils';
import { cn } from '@/lib/utils';

interface PrayerTimesCardProps {
  method: CalculationMethod;
  selectedDate: Date;
}

const PRAYER_INFO = [
  { key: 'fajr', name: 'Fajr', arabic: 'الفجر', icon: Moon },
  { key: 'sunrise', name: 'Sunrise', arabic: 'الشروق', icon: Sunrise },
  { key: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر', icon: Sun },
  { key: 'asr', name: 'Asr', arabic: 'العصر', icon: Sun },
  { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', icon: Sunset },
  { key: 'isha', name: 'Isha', arabic: 'العشاء', icon: Moon },
] as const;

export function PrayerTimesCard({ method, selectedDate }: PrayerTimesCardProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);

  // Detect user location on mount
  useEffect(() => {
    const detectLocation = async () => {
      setIsLoading(true);
      try {
        const loc = await getUserLocation();
        setLocation(loc);
        setError(null);
      } catch {
        // Default to Mecca if location detection fails
        setLocation(DEFAULT_LOCATIONS['Mecca']);
        setSelectedCity('Mecca');
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  // Calculate prayer times when location or date changes
  useEffect(() => {
    if (location) {
      const times = calculatePrayerTimes(
        selectedDate,
        location,
        method as keyof typeof PRAYER_METHODS
      );
      setPrayerTimes(times);
    }
  }, [location, selectedDate, method]);

  // Determine current prayer
  useEffect(() => {
    if (!prayerTimes) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const times = [
      { name: 'fajr', minutes: timeToMinutes(prayerTimes.fajr) },
      { name: 'sunrise', minutes: timeToMinutes(prayerTimes.sunrise) },
      { name: 'dhuhr', minutes: timeToMinutes(prayerTimes.dhuhr) },
      { name: 'asr', minutes: timeToMinutes(prayerTimes.asr) },
      { name: 'maghrib', minutes: timeToMinutes(prayerTimes.maghrib) },
      { name: 'isha', minutes: timeToMinutes(prayerTimes.isha) },
    ];

    let current = 'isha'; // Default to isha (after all prayers)
    for (let i = times.length - 1; i >= 0; i--) {
      if (currentTime >= times[i].minutes) {
        current = times[i].name;
        break;
      }
    }
    if (currentTime < times[0].minutes) {
      current = 'isha'; // Before fajr, still isha from previous night
    }

    setCurrentPrayer(current);
  }, [prayerTimes]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setLocation(DEFAULT_LOCATIONS[city]);
  };

  const handleDetectLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loc = await getUserLocation();
      setLocation(loc);
      setSelectedCity('');
    } catch {
      setError('Could not detect location. Please select a city.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold text-primary flex items-center gap-2">
          <Clock className="h-5 w-5 text-gold" />
          Prayer Times
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDetectLocation}
          disabled={isLoading}
          className="text-muted-foreground hover:text-primary"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span className="ml-1 text-xs">Detect</span>
        </Button>
      </div>

      {/* Location selector */}
      <div className="mb-4">
        <Select value={selectedCity} onValueChange={handleCityChange}>
          <SelectTrigger className="w-full bg-secondary/50 border-primary/10">
            <SelectValue placeholder={location?.city || 'Select a city or detect location'} />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {Object.keys(DEFAULT_LOCATIONS).map((city) => (
              <SelectItem key={city} value={city} className="cursor-pointer">
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {location && !selectedCity && (
          <p className="text-xs text-muted-foreground mt-1">
            📍 Using detected location ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
          </p>
        )}
      </div>

      {error && (
        <p className="text-destructive text-sm mb-4">{error}</p>
      )}

      {/* Prayer times grid */}
      {prayerTimes && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRAYER_INFO.map(({ key, name, arabic, icon: Icon }) => {
            const isCurrentPrayer = currentPrayer === key;
            const isSunrise = key === 'sunrise';
            
            return (
              <div
                key={key}
                className={cn(
                  "relative p-3 rounded-xl text-center transition-all duration-300",
                  isCurrentPrayer && !isSunrise
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : isSunrise
                    ? "bg-gold/10"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 mx-auto mb-1",
                  isCurrentPrayer && !isSunrise ? "text-gold" : "text-gold"
                )} />
                <p className={cn(
                  "text-xs font-medium",
                  isCurrentPrayer && !isSunrise ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {name}
                </p>
                <p className={cn(
                  "text-lg font-bold font-display",
                  isCurrentPrayer && !isSunrise ? "text-primary-foreground" : "text-foreground"
                )}>
                  {formatTime12h(prayerTimes[key as keyof PrayerTimes])}
                </p>
                <p className={cn(
                  "text-xs font-display",
                  isCurrentPrayer && !isSunrise ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {arabic}
                </p>
                {isCurrentPrayer && !isSunrise && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Method indicator */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Calculated using {PRAYER_METHODS[method as keyof typeof PRAYER_METHODS]?.name || method} method
      </p>
    </div>
  );
}
