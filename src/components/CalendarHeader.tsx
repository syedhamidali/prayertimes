import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HIJRI_MONTHS, HIJRI_MONTHS_ARABIC } from '@/lib/hijriUtils';

interface CalendarHeaderProps {
  hijriYear: number;
  hijriMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  hijriYear,
  hijriMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevMonth}
          className="h-11 w-11 rounded-xl border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center min-w-[280px]">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-emerald-light bg-clip-text text-transparent">
            {HIJRI_MONTHS[hijriMonth - 1]}
          </h2>
          <p className="font-display text-xl text-gold mt-1 flex items-center justify-center gap-2">
            <span className="text-muted-foreground text-lg">{hijriYear} AH</span>
            <span className="text-2xl">{HIJRI_MONTHS_ARABIC[hijriMonth - 1]}</span>
          </p>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          className="h-11 w-11 rounded-xl border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <Button
        variant="secondary"
        onClick={onToday}
        className="font-medium rounded-xl px-5 hover:bg-gold hover:text-foreground transition-all duration-300 shadow-sm gap-2"
      >
        <CalendarDays className="h-4 w-4" />
        Today
      </Button>
    </div>
  );
}
