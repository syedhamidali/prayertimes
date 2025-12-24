import { useMemo } from 'react';
import { getMonthDays, WEEKDAYS, CalculationMethod, hijriToGregorian, GREGORIAN_MONTHS } from '@/lib/hijriUtils';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  hijriYear: number;
  hijriMonth: number;
  method: CalculationMethod;
}

export function CalendarGrid({ hijriYear, hijriMonth, method }: CalendarGridProps) {
  const days = useMemo(() => {
    return getMonthDays(hijriYear, hijriMonth, method);
  }, [hijriYear, hijriMonth, method]);

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
    <div className="bg-card rounded-2xl shadow-card p-4 sm:p-6 animate-scale-in">
      {/* Gregorian month indicator */}
      <div className="text-center mb-4 pb-4 border-b border-border">
        <p className="text-sm text-muted-foreground font-medium tracking-wide">
          {gregorianMonthSpan}
        </p>
      </div>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              "text-center py-2 text-sm font-semibold",
              index === 5 ? "text-primary" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
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
                "aspect-square p-1 sm:p-2 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                day.isToday
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : isFriday
                  ? "bg-gold/10 hover:bg-gold/20"
                  : "hover:bg-secondary"
              )}
            >
              <span
                className={cn(
                  "text-lg sm:text-xl font-bold font-display",
                  day.isToday ? "text-primary-foreground" : isFriday ? "text-primary" : "text-foreground"
                )}
              >
                {day.hijriDay}
              </span>
              <span
                className={cn(
                  "text-[10px] sm:text-xs",
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
      <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gold/30" />
          <span>Friday (Jumu'ah)</span>
        </div>
      </div>
    </div>
  );
}
