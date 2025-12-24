import { useState, useEffect } from 'react';
import { Clock, MapPin, Loader2, Sun, Sunrise, Sunset, Moon, Map, Edit3 } from 'lucide-react';
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
  calculatePrayerTimes,
  formatTime12h,
  getUserLocation,
  DEFAULT_LOCATIONS,
  Location,
  PrayerTimes,
  PRAYER_METHODS,
  PRAYER_METHOD_GROUPS,
  PrayerMethod,
} from '@/lib/prayerTimes';
import { LocationMap } from '@/components/LocationMap';
import { cn } from '@/lib/utils';

interface PrayerTimesCardProps {
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

export function PrayerTimesCard({ selectedDate }: PrayerTimesCardProps) {
  const [location, setLocation] = useState<Location>({ latitude: 21.4225, longitude: 39.8262, city: 'Mecca' });
  const [selectedCity, setSelectedCity] = useState<string>('Mecca');
  const [prayerMethod, setPrayerMethod] = useState<PrayerMethod>('shafi');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  
  // Manual lat/lon input state
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

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

  // Calculate prayer times when location, date, or method changes
  useEffect(() => {
    if (location) {
      const times = calculatePrayerTimes(selectedDate, location, prayerMethod);
      setPrayerTimes(times);
    }
  }, [location, selectedDate, prayerMethod]);

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

    let current = 'isha';
    for (let i = times.length - 1; i >= 0; i--) {
      if (currentTime >= times[i].minutes) {
        current = times[i].name;
        break;
      }
    }
    if (currentTime < times[0].minutes) {
      current = 'isha';
    }

    setCurrentPrayer(current);
  }, [prayerTimes]);

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
    
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setLocation({ latitude: lat, longitude: lon });
      setSelectedCity('');
      setIsLocationDialogOpen(false);
    }
  };

  const handleMapLocationChange = (newLocation: Location) => {
    setLocation(newLocation);
    setSelectedCity('');
    setManualLat(newLocation.latitude.toFixed(4));
    setManualLon(newLocation.longitude.toFixed(4));
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

      {/* Prayer Method Selector */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground mb-1 block">Calculation Method</Label>
        <Select value={prayerMethod} onValueChange={(v) => setPrayerMethod(v as PrayerMethod)}>
          <SelectTrigger className="w-full bg-secondary/50 border-primary/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20 max-h-[300px]">
            {Object.entries(PRAYER_METHOD_GROUPS).map(([group, methods]) => (
              <SelectGroup key={group}>
                <SelectLabel className="text-gold font-display">{group}</SelectLabel>
                {methods.map((method) => (
                  <SelectItem key={method} value={method} className="cursor-pointer">
                    <div className="flex flex-col">
                      <span>{PRAYER_METHODS[method].name}</span>
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
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground mb-1 block">Location</Label>
        <div className="flex gap-2">
          <Select value={selectedCity} onValueChange={handleCityChange}>
            <SelectTrigger className="flex-1 bg-secondary/50 border-primary/10">
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/20 max-h-[300px]">
              {Object.keys(DEFAULT_LOCATIONS).sort().map((city) => (
                <SelectItem key={city} value={city} className="cursor-pointer">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 border-primary/20">
                <Edit3 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card">
              <DialogHeader>
                <DialogTitle className="font-display text-primary">Set Location</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="map" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="map" className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Map
                  </TabsTrigger>
                  <TabsTrigger value="coordinates" className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Coordinates
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
                  <div className="text-center text-sm text-muted-foreground">
                    {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                  </div>
                </TabsContent>
                
                <TabsContent value="coordinates" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude" className="text-sm">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.0001"
                        min="-90"
                        max="90"
                        placeholder="e.g., 21.4225"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        className="bg-secondary/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">-90 to 90</p>
                    </div>
                    <div>
                      <Label htmlFor="longitude" className="text-sm">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.0001"
                        min="-180"
                        max="180"
                        placeholder="e.g., 39.8262"
                        value={manualLon}
                        onChange={(e) => setManualLon(e.target.value)}
                        className="bg-secondary/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">-180 to 180</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleManualLocationSubmit}
                    className="w-full bg-primary hover:bg-emerald-dark"
                  >
                    Apply Coordinates
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
        
        {location && (
          <p className="text-xs text-muted-foreground mt-1">
            📍 {selectedCity || `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}
          </p>
        )}
      </div>

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
        {PRAYER_METHODS[prayerMethod]?.name}
      </p>
    </div>
  );
}
