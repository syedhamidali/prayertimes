import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HIJRI_MONTHS } from '@/lib/hijriUtils';
import { Calendar } from 'lucide-react';

interface YearSelectorProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export function YearSelector({ year, month, onYearChange, onMonthChange }: YearSelectorProps) {
  // Generate year options (current ± 10 years)
  const currentHijriYear = year;
  const years = Array.from({ length: 21 }, (_, i) => currentHijriYear - 10 + i);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">Jump to:</span>
      </div>
      
      <Select value={month.toString()} onValueChange={(v) => onMonthChange(parseInt(v))}>
        <SelectTrigger className="w-[160px] bg-card border-primary/20 focus:ring-gold">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent className="bg-card border-primary/20">
          {HIJRI_MONTHS.map((monthName, index) => (
            <SelectItem
              key={index}
              value={(index + 1).toString()}
              className="cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              {monthName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
        <SelectTrigger className="w-[100px] bg-card border-primary/20 focus:ring-gold">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="bg-card border-primary/20 max-h-[300px]">
          {years.map((y) => (
            <SelectItem
              key={y}
              value={y.toString()}
              className="cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              {y} AH
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
