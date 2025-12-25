import { useMemo } from 'react';
import { getMonthDays, WEEKDAYS, CalculationMethod, GREGORIAN_MONTHS } from '@/lib/hijriUtils';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  hijriYear: number;
  hijriMonth: number;
  method: CalculationMethod;
  timezoneOffset?: number;
}

export function CalendarGrid({ hijriYear, hijriMonth, method, timezoneOffset }: CalendarGridProps) {
  const days = useMemo(() => {
    return getMonthDays(hijriYear, hijriMonth, method, timezoneOffset);
  }, [hijriYear, hijriMonth, method, timezoneOffset]);

  // Calculate the starting day of the week
  const firstDayOfWeek = useMemo(() => {
    if (days.length === 0) return 0;
    return days[0].gregorianDate.getDay();
  }, [days]);

  // Get Gregorian month span info
  const gregorianMonthSpan = useMemo(() => {
    if (days.length === 0) return '';
    const firstDate = days[0].gregorianDate;
    const lastDate = days[days.length - 1].gregorianDate;
    const firstMonth = GREGORIAN_MONTHS[firstDate.getMonth()];
    const lastMonth = GREGORIAN_MONTHS[lastDate.getMonth()];
    const firstYear = firstDate.getFullYear();
    const lastYear = lastDate.getFullYear();
    
    if (firstMonth === lastMonth && firstYear === lastYear) {
      return `${firstMonth} ${firstYear}`;
    } else if (firstYear === lastYear) {
      return `${firstMonth} - ${lastMonth} ${firstYear}`;
    }
    return `${firstMonth} ${firstYear} - ${lastMonth} ${lastYear}`;
  }, [days]);

  // Create empty cells for alignment
  const emptyCells = Array(firstDayOfWeek).fill(null);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/20 rounded-3xl shadow-card border border-border/50 p-5 sm:p-7 animate-scale-in">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 islamic-pattern opacity-30" />
      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-gold/5 to-transparent rounded-tl-full" />
      
      <div className="relative">
        {/* Gregorian month indicator */}
        <div className="text-center mb-5 pb-4 border-b border-border/30">
          <p className="text-sm text-muted-foreground font-medium tracking-wide bg-secondary/50 inline-block px-4 py-1.5 rounded-full">
            {gregorianMonthSpan}
          </p>
        </div>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-center py-2.5 text-sm font-bold rounded-xl",
                index === 5 
                  ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary" 
                  : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty cells for alignment */}
          {emptyCells.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          
          {/* Actual days */}
          {days.map((day, index) => {
            const isFriday = day.gregorianDate.getDay() === 5;
            
            return (
              <div
                key={index}
                className={cn(
                  "aspect-square p-1.5 sm:p-2.5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-0.5 group cursor-default",
                  day.isToday
                    ? "bg-gradient-to-br from-primary via-primary to-emerald-dark text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                    : isFriday
                    ? "bg-gradient-to-br from-gold/15 to-gold/5 hover:from-gold/25 hover:to-gold/10"
                    : "hover:bg-secondary/80"
                )}
              >
                <span
                  className={cn(
                    "text-lg sm:text-2xl font-bold font-display transition-transform duration-300 group-hover:scale-110",
                    day.isToday 
                      ? "text-primary-foreground" 
                      : isFriday 
                      ? "text-primary" 
                      : "text-foreground"
                  )}
                >
                  {day.hijriDay}
                </span>
                <span
                  className={cn(
                    "text-[9px] sm:text-xs font-medium",
                    day.isToday ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {day.gregorianDate.getDate()} {GREGORIAN_MONTHS[day.gregorianDate.getMonth()].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-primary to-emerald-dark shadow-sm" />
            <span className="font-medium">Today</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-gold/30 to-gold/10" />
            <span className="font-medium">Friday (Jumu'ah)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
