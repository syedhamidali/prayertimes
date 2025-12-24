import { useState, useRef, useEffect, useMemo } from 'react';
import { CalendarHeader } from '@/components/CalendarHeader';
import { CalendarGrid } from '@/components/CalendarGrid';
import { MethodSelector } from '@/components/MethodSelector';
import { YearSelector } from '@/components/YearSelector';
import { ExportButton } from '@/components/ExportButton';
import { PrayerTimesCard } from '@/components/PrayerTimesCard';
import { getCurrentHijriDate, CalculationMethod, formatHijriDate, hijriToGregorian } from '@/lib/hijriUtils';
import { Moon } from 'lucide-react';

const Index = () => {
  const [method, setMethod] = useState<CalculationMethod>('shafi');
  const [hijriYear, setHijriYear] = useState(1446);
  const [hijriMonth, setHijriMonth] = useState(6);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Initialize with current Hijri date
  useEffect(() => {
    const current = getCurrentHijriDate(method);
    setHijriYear(current.year);
    setHijriMonth(current.month);
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
    <div className="min-h-screen bg-background islamic-pattern">
      {/* Header */}
      <header className="emerald-gradient text-primary-foreground py-8 sm:py-12 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
            <Moon className="h-8 w-8 text-gold" />
            <h1 className="font-display text-3xl sm:text-5xl font-bold">
              Hijri Calendar
            </h1>
            <Moon className="h-8 w-8 text-gold" />
          </div>
          <p className="text-primary-foreground/80 text-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Islamic Calendar Generator with Prayer Times
          </p>
          <div className="mt-4 text-gold font-display text-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Today: {formatHijriDate(currentHijri.year, currentHijri.month, currentHijri.day)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="bg-card rounded-2xl shadow-card p-4 sm:p-6 mb-6 animate-slide-up">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <MethodSelector value={method} onChange={setMethod} />
              <YearSelector
                year={hijriYear}
                month={hijriMonth}
                onYearChange={setHijriYear}
                onMonthChange={setHijriMonth}
              />
            </div>
            <ExportButton
              hijriYear={hijriYear}
              hijriMonth={hijriMonth}
              method={method}
              calendarRef={calendarRef}
            />
          </div>
        </div>

        {/* Two column layout for calendar and prayer times */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar - takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div ref={calendarRef} className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
          <div className="lg:col-span-1">
            <PrayerTimesCard selectedDate={selectedDate} />
            
            {/* Info Section */}
            <div className="mt-6 bg-card rounded-2xl shadow-card p-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <h3 className="font-display text-lg font-bold text-primary mb-3">
                About Methods
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Different Islamic schools and research institutes use slightly different methods for determining prayer times.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Leva Research (Qom)</strong> - Shia method from Iran</li>
                <li>• <strong>Jafari (Karachi)</strong> - Shia method for Pakistan</li>
                <li>• <strong>Umm al-Qura</strong> - Official Saudi calendar</li>
                <li>• <strong>ISNA</strong> - North American standard</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 mt-12">
        <div className="container max-w-6xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p className="font-display text-lg">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="mt-2">
            Hijri Calendar & Prayer Times • Export calendars as PDF
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
