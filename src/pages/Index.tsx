import { useState, useRef, useEffect } from 'react';
import { CalendarHeader } from '@/components/CalendarHeader';
import { CalendarGrid } from '@/components/CalendarGrid';
import { MethodSelector } from '@/components/MethodSelector';
import { YearSelector } from '@/components/YearSelector';
import { ExportButton } from '@/components/ExportButton';
import { getCurrentHijriDate, CalculationMethod, formatHijriDate } from '@/lib/hijriUtils';
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
        <div className="container max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
            <Moon className="h-8 w-8 text-gold" />
            <h1 className="font-display text-3xl sm:text-5xl font-bold">
              Hijri Calendar
            </h1>
            <Moon className="h-8 w-8 text-gold" />
          </div>
          <p className="text-primary-foreground/80 text-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Islamic Calendar Generator with Multiple Calculation Methods
          </p>
          <div className="mt-4 text-gold font-display text-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Today: {formatHijriDate(currentHijri.year, currentHijri.month, currentHijri.day)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
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

        {/* Calendar */}
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

        {/* Info Section */}
        <div className="mt-8 bg-card rounded-2xl shadow-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-display text-xl font-bold text-primary mb-3">
            About Calculation Methods
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Different Islamic schools of jurisprudence and regions may use slightly different methods 
            for determining the start of each lunar month. The Umm al-Qura calendar is the official 
            calendar used in Saudi Arabia, while other methods are based on traditional astronomical 
            calculations used by different madhabs (schools of thought).
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 mt-12">
        <div className="container max-w-5xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p className="font-display">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="mt-2">
            Hijri Calendar Generator • Export calendars as PDF
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
