import { useState, useEffect } from 'react';
import { Clock, MapPin, Loader2, Sun, Sunrise, Sunset, Moon, Map, Edit3, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatTime12h,
  getUserLocation,
  DEFAULT_LOCATIONS,
  Location,
  PrayerTimes,
  PRAYER_METHODS,
  PRAYER_METHOD_GROUPS,
  PrayerMethod,
  getTimezoneFromLongitude,
  formatTimezone,
} from '@/lib/prayerTimes';
import { fetchPrayerTimesFromAladhan } from '@/lib/aladhanApi';
import { LocationMap } from '@/components/LocationMap';
import { cn } from '@/lib/utils';

interface PrayerTimesCardProps {
  selectedDate: Date;
  onPreferencesChange?: (prefs: { location: Location; cityLabel: string; method: PrayerMethod }) => void;
}

const PRAYER_INFO = [
  { key: 'fajr', name: 'Fajr', arabic: 'الفجر', icon: Moon, gradient: 'from-indigo-500/20 to-purple-500/20' },
  { key: 'sunrise', name: 'Sunrise', arabic: 'الشروق', icon: Sunrise, gradient: 'from-orange-500/20 to-yellow-500/20' },
  { key: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر', icon: Sun, gradient: 'from-yellow-500/20 to-amber-500/20' },
  { key: 'asr', name: 'Asr', arabic: 'العصر', icon: Sun, gradient: 'from-amber-500/20 to-orange-500/20' },
  { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', icon: Sunset, gradient: 'from-rose-500/20 to-pink-500/20' },
  { key: 'isha', name: 'Isha', arabic: 'العشاء', icon: Moon, gradient: 'from-purple-500/20 to-indigo-500/20' },
] as const;

export function PrayerTimesCard({ selectedDate, onPreferencesChange }: PrayerTimesCardProps) {
  const [location, setLocation] = useState<Location>({ latitude: 21.4225, longitude: 39.8262, city: 'Mecca', timezone: 3 });
  const [selectedCity, setSelectedCity] = useState<string>('Mecca');
  const [resolvedCity, setResolvedCity] = useState<string>('');
  const [prayerMethod, setPrayerMethod] = useState<PrayerMethod>('shafi');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  
  // Manual lat/lon input state
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualTz, setManualTz] = useState('');

  // Detect user location on mount
  useEffect(() => {
    const detectLocation = async () => {
      setIsLoading(true);
      try {
        const loc = await getUserLocation();
        setLocation(loc);
        setSelectedCity('');
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

  // Resolve a human-friendly city label for coordinates-only locations (map/manual/GPS)
  useEffect(() => {
    let cancelled = false;

    // If a preset city is selected, we already have a label
    if (selectedCity) {
      setResolvedCity('');
      return;
    }

    // If the location already carries a city name, use it
    if (location?.city) {
      setResolvedCity('');
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`
        );
        const data = await res.json();
        const name = data.city || data.locality || data.principalSubdivision || data.countryName;
        if (!cancelled) setResolvedCity(typeof name === 'string' ? name : '');
      } catch {
        if (!cancelled) setResolvedCity('');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.latitude, location.longitude, location.city, selectedCity]);

  // Notify parent when preferences change (for PDF export, etc.)
  useEffect(() => {
    const cityLabel =
      selectedCity ||
      location.city ||
      resolvedCity ||
      `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`;

    onPreferencesChange?.({
      location,
      cityLabel,
      method: prayerMethod,
    });
  }, [location, selectedCity, resolvedCity, prayerMethod, onPreferencesChange]);

  // Fetch prayer times when location, date, or method changes
  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    (async () => {
      try {
        const times = await fetchPrayerTimesFromAladhan({
          date: selectedDate,
          location,
          method: prayerMethod,
        });
        if (!cancelled) setPrayerTimes(times);
      } catch {
        // If API is unavailable, keep the last known times.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location, selectedDate, prayerMethod]);

  // Determine current prayer (based on location's local time)
  useEffect(() => {
    if (!prayerTimes || !location) return;

    // Calculate current time in the location's timezone
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const tz = location.timezone ?? getTimezoneFromLongitude(location.longitude);
    const localMinutes = (utcHours * 60 + utcMinutes + tz * 60 + 1440) % 1440;

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

    let current = 'isha';
    for (let i = times.length - 1; i >= 0; i--) {
      if (localMinutes >= times[i].minutes) {
        current = times[i].name;
        break;
      }
    }
    if (localMinutes < times[0].minutes) {
      current = 'isha';
    }

    setCurrentPrayer(current);
  }, [prayerTimes, location]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setLocation(DEFAULT_LOCATIONS[city]);
  };

  const handleDetectLocation = async () => {
    setIsLoading(true);
    try {
      const loc = await getUserLocation();
      setLocation(loc);
      setSelectedCity('');
    } catch {
      // Keep current location
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    const tz = manualTz ? parseFloat(manualTz) : getTimezoneFromLongitude(lon);
    
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setLocation({ latitude: lat, longitude: lon, timezone: tz });
      setSelectedCity('');
      setIsLocationDialogOpen(false);
    }
  };

  const handleMapLocationChange = (newLocation: Location) => {
    const tz = getTimezoneFromLongitude(newLocation.longitude);
    setLocation({ ...newLocation, timezone: tz });
    setSelectedCity('');
    setManualLat(newLocation.latitude.toFixed(4));
    setManualLon(newLocation.longitude.toFixed(4));
    setManualTz(tz.toString());
  };

  const currentTimezone = location.timezone ?? getTimezoneFromLongitude(location.longitude);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/30 rounded-3xl shadow-card border border-border/50 animate-slide-up" style={{ animationDelay: '0.15s' }}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/10 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-full" />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-emerald-dark shadow-lg">
              <Clock className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Prayer Times
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {formatTimezone(currentTimezone)} Local Time
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDetectLocation}
            disabled={isLoading}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Prayer Method Selector */}
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-1.5 block font-medium">Calculation Method</Label>
          <Select value={prayerMethod} onValueChange={(v) => setPrayerMethod(v as PrayerMethod)}>
            <SelectTrigger className="w-full bg-background/60 backdrop-blur-sm border-border/50 rounded-xl focus:ring-gold/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-md border-border/50 rounded-xl max-h-[300px]">
              {Object.entries(PRAYER_METHOD_GROUPS).map(([group, methods]) => (
                <SelectGroup key={group}>
                  <SelectLabel className="text-gold font-display font-semibold px-2">{group}</SelectLabel>
                  {methods.map((method) => (
                    <SelectItem key={method} value={method} className="cursor-pointer rounded-lg mx-1">
                      <div className="flex flex-col py-0.5">
                        <span className="font-medium">{PRAYER_METHODS[method].name}</span>
                        {PRAYER_METHODS[method].region && (
                          <span className="text-xs text-muted-foreground">
                            {PRAYER_METHODS[method].region}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location selector */}
        <div className="mb-5">
          <Label className="text-xs text-muted-foreground mb-1.5 block font-medium">Location</Label>
          <div className="flex gap-2">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="flex-1 bg-background/60 backdrop-blur-sm border-border/50 rounded-xl focus:ring-gold/50">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-md border-border/50 rounded-xl max-h-[300px]">
                {Object.keys(DEFAULT_LOCATIONS).sort().map((city) => (
                  <SelectItem key={city} value={city} className="cursor-pointer rounded-lg mx-1">
                    <div className="flex items-center justify-between w-full">
                      <span>{city}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatTimezone(DEFAULT_LOCATIONS[city].timezone!)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 border-border/50 rounded-xl hover:bg-primary/10 hover:border-primary/50">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/50 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-primary text-xl">Set Location</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="map" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-secondary/50 rounded-xl p-1">
                    <TabsTrigger value="map" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background">
                      <Map className="h-4 w-4" />
                      Map
                    </TabsTrigger>
                    <TabsTrigger value="coordinates" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background">
                      <Edit3 className="h-4 w-4" />
                      Manual
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="map" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Click on the map or drag the marker to set your location.
                    </p>
                    <LocationMap 
                      location={location} 
                      onLocationChange={handleMapLocationChange}
                    />
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground bg-secondary/30 rounded-xl p-3">
                      <span>📍 {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°</span>
                      <span className="text-gold font-medium">{formatTimezone(currentTimezone)}</span>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="coordinates" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude" className="text-sm font-medium">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.0001"
                          min="-90"
                          max="90"
                          placeholder="e.g., 21.4225"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          className="bg-background/60 rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground mt-1">-90 to 90</p>
                      </div>
                      <div>
                        <Label htmlFor="longitude" className="text-sm font-medium">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.0001"
                          min="-180"
                          max="180"
                          placeholder="e.g., 39.8262"
                          value={manualLon}
                          onChange={(e) => setManualLon(e.target.value)}
                          className="bg-background/60 rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground mt-1">-180 to 180</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="timezone" className="text-sm font-medium">Timezone (UTC offset)</Label>
                      <Input
                        id="timezone"
                        type="number"
                        step="0.5"
                        min="-12"
                        max="14"
                        placeholder="e.g., 3 for UTC+3"
                        value={manualTz}
                        onChange={(e) => setManualTz(e.target.value)}
                        className="bg-background/60 rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-calculate from longitude</p>
                    </div>
                    <Button 
                      onClick={handleManualLocationSubmit}
                      className="w-full bg-gradient-to-r from-primary to-emerald-dark hover:opacity-90 rounded-xl shadow-lg"
                    >
                      Apply Location
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          
          {location && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-gold" />
              {selectedCity || location.city || resolvedCity || `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}
            </p>
          )}
        </div>

        {/* Prayer times grid */}
        {prayerTimes && (
          <div className="grid grid-cols-2 gap-3">
            {PRAYER_INFO.map(({ key, name, arabic, icon: Icon, gradient }) => {
              const isCurrentPrayer = currentPrayer === key;
              const isSunrise = key === 'sunrise';
              
              return (
                <div
                  key={key}
                  className={cn(
                    "relative p-4 rounded-2xl text-center transition-all duration-500 group overflow-hidden",
                    isCurrentPrayer && !isSunrise
                      ? "bg-gradient-to-br from-primary via-primary to-emerald-dark text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                      : `bg-gradient-to-br ${gradient} hover:scale-[1.02]`
                  )}
                >
                  {/* Decorative glow for current prayer */}
                  {isCurrentPrayer && !isSunrise && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent animate-pulse" />
                  )}
                  
                  <div className="relative">
                    <div className={cn(
                      "mx-auto mb-2 p-2 rounded-xl w-fit transition-all duration-300",
                      isCurrentPrayer && !isSunrise 
                        ? "bg-gold/20" 
                        : "bg-background/50 group-hover:bg-background/70"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isCurrentPrayer && !isSunrise ? "text-gold" : "text-gold"
                      )} />
                    </div>
                    <p className={cn(
                      "text-xs font-semibold uppercase tracking-wider mb-1",
                      isCurrentPrayer && !isSunrise ? "text-gold" : "text-muted-foreground"
                    )}>
                      {name}
                    </p>
                    <p className={cn(
                      "text-2xl font-bold font-display tracking-tight",
                      isCurrentPrayer && !isSunrise ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {formatTime12h(prayerTimes[key as keyof PrayerTimes])}
                    </p>
                    <p className={cn(
                      "text-sm font-display mt-1",
                      isCurrentPrayer && !isSunrise ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {arabic}
                    </p>
                  </div>
                  
                  {isCurrentPrayer && !isSunrise && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gold rounded-full animate-pulse shadow-lg shadow-gold/50" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Method indicator */}
        <div className="mt-5 pt-4 border-t border-border/30">
          <p className="text-xs text-center text-muted-foreground font-medium">
            {PRAYER_METHODS[prayerMethod]?.name}
          </p>
        </div>
      </div>
    </div>
  );
}
