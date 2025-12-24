import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevMonth}
          className="h-10 w-10 rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center min-w-[280px]">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary">
            {HIJRI_MONTHS[hijriMonth - 1]}
          </h2>
          <p className="font-display text-xl text-gold mt-1">
            {HIJRI_MONTHS_ARABIC[hijriMonth - 1]} {hijriYear} AH
          </p>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          className="h-10 w-10 rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <Button
        variant="secondary"
        onClick={onToday}
        className="font-medium hover:bg-gold hover:text-foreground transition-all duration-300"
      >
        Today
      </Button>
    </div>
  );
}
