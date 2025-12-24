import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CALCULATION_METHODS, CalculationMethod } from '@/lib/hijriUtils';
import { Settings2 } from 'lucide-react';

interface MethodSelectorProps {
  value: CalculationMethod;
  onChange: (value: CalculationMethod) => void;
}

export function MethodSelector({ value, onChange }: MethodSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Settings2 className="h-4 w-4" />
        <span className="text-sm font-medium">Method:</span>
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as CalculationMethod)}>
        <SelectTrigger className="w-[200px] bg-card border-primary/20 focus:ring-gold">
          <SelectValue placeholder="Select method" />
        </SelectTrigger>
        <SelectContent className="bg-card border-primary/20">
          {CALCULATION_METHODS.map((method) => (
            <SelectItem
              key={method.value}
              value={method.value}
              className="cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <div className="flex flex-col">
                <span className="font-medium">{method.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
