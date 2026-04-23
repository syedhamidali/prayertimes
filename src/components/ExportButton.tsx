import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, Calendar, Clock, Plus, Trash2, Bold, Italic, Type } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { HIJRI_MONTHS, CalculationMethod, CALCULATION_METHODS, getMonthDays, WEEKDAYS, GREGORIAN_MONTHS } from '@/lib/hijriUtils';
import { fetchPrayerTimesFromAladhan, AladhanHijriDate } from '@/lib/aladhanApi';
import { PRAYER_METHODS, type PrayerMethod } from '@/lib/prayerTimes';
import { getEventsForDay } from '@/lib/islamicEvents';
import { initArabicSupport, addArabicText, containsArabic } from '@/lib/arabicPdf';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  hijriYear: number;
  hijriMonth: number;
  method: CalculationMethod;
  userLocation?: { latitude: number; longitude: number; cityName: string };
  prayerMethod?: PrayerMethod;
  cityLabel?: string;
  apiHijriDate?: AladhanHijriDate;
}

interface PdfLine {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  position: 'header' | 'footer';
}

const PRESET_COLORS = [
  { label: 'Green', value: '#1a4737' },
  { label: 'Black', value: '#1e1e1e' },
  { label: 'Gray', value: '#505050' },
  { label: 'Gold', value: '#8B6914' },
  { label: 'Red', value: '#991B1B' },
  { label: 'Blue', value: '#1e3a5f' },
];

const FONT_SIZES = [8, 9, 10, 12, 14, 16, 18, 20, 24, 28];

let lineIdCounter = 0;
function newId() {
  return `line-${++lineIdCounter}`;
}

function to12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

async function getLocationInfo(providedLocation?: { latitude: number; longitude: number; cityName: string }): Promise<{ latitude: number; longitude: number; cityName: string }> {
  if (providedLocation && providedLocation.latitude && providedLocation.longitude) {
    return providedLocation;
  }

  let latitude = 21.4225;
  let longitude = 39.8262;
  let cityName = 'Makkah';

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
    });
    latitude = pos.coords.latitude;
    longitude = pos.coords.longitude;

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const geoData = await geoRes.json();
      cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || 'Unknown Location';
    } catch {
      cityName = 'Unknown Location';
    }
  } catch {
    // Use default location
  }

  return { latitude, longitude, cityName };
}

type ExportType = 'calendar' | 'prayer';

// --- Preview component ---
function PdfPreview({ lines, exportType }: { lines: PdfLine[]; exportType: ExportType }) {
  const headerLines = lines.filter(l => l.position === 'header');
  const footerLines = lines.filter(l => l.position === 'footer');

  return (
    <div className="border border-border/50 rounded-xl bg-white shadow-inner overflow-hidden">
      <div className="aspect-[8.5/11] w-full flex flex-col p-3 text-center" style={{ minHeight: 280 }}>
        {/* Header area */}
        <div className="flex-shrink-0 space-y-0.5 mb-2">
          {headerLines.map(line => (
            <p
              key={line.id}
              style={{
                fontSize: Math.max(line.fontSize * 0.45, 5),
                color: line.color,
                fontWeight: line.bold ? 700 : 400,
                fontStyle: line.italic ? 'italic' : 'normal',
                fontFamily: containsArabic(line.text) ? "'Amiri', serif" : 'sans-serif',
                direction: containsArabic(line.text) ? 'rtl' : 'ltr',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {line.text || ' '}
            </p>
          ))}
        </div>

        {/* Content placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-[90%] h-[85%] rounded border border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-[8px] text-gray-400 uppercase tracking-wider">
              {exportType === 'calendar' ? 'Calendar Grid' : 'Prayer Times Table'}
            </span>
          </div>
        </div>

        {/* Footer area */}
        <div className="flex-shrink-0 space-y-0.5 mt-2 pt-1 border-t border-gray-200">
          {footerLines.map(line => (
            <p
              key={line.id}
              style={{
                fontSize: Math.max(line.fontSize * 0.4, 4),
                color: line.color,
                fontWeight: line.bold ? 700 : 400,
                fontStyle: line.italic ? 'italic' : 'normal',
                fontFamily: containsArabic(line.text) ? "'Amiri', serif" : 'sans-serif',
                direction: containsArabic(line.text) ? 'rtl' : 'ltr',
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {line.text || ' '}
            </p>
          ))}
          <p style={{ fontSize: 4, color: '#999' }}>
            Prayer times data provided by AlAdhan API &middot; syedha.com/prayertimes
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Line editor row ---
function LineEditor({
  line,
  onChange,
  onRemove,
  canRemove,
}: {
  line: PdfLine;
  onChange: (updated: PdfLine) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const update = (patch: Partial<PdfLine>) => onChange({ ...line, ...patch });

  return (
    <div className="space-y-2 p-3 rounded-xl bg-secondary/40 border border-border/30">
      <div className="flex gap-2">
        <Input
          value={line.text}
          onChange={e => update({ text: e.target.value })}
          placeholder="Enter text..."
          className="flex-1 bg-background/80 rounded-lg text-sm h-8"
          dir={containsArabic(line.text) ? 'rtl' : 'ltr'}
        />
        {canRemove && (
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Font size */}
        <Select value={String(line.fontSize)} onValueChange={v => update({ fontSize: Number(v) })}>
          <SelectTrigger className="w-[68px] h-7 text-xs bg-background/80 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card rounded-lg">
            {FONT_SIZES.map(s => (
              <SelectItem key={s} value={String(s)} className="text-xs">{s}pt</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Color */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={line.color}
            onChange={e => update({ color: e.target.value })}
            className="w-7 h-7 rounded-lg border border-border/50 cursor-pointer p-0.5"
          />
          <Select value={PRESET_COLORS.find(c => c.value === line.color)?.value ?? 'custom'} onValueChange={v => { if (v !== 'custom') update({ color: v }); }}>
            <SelectTrigger className="w-[72px] h-7 text-xs bg-background/80 rounded-lg">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent className="bg-card rounded-lg">
              {PRESET_COLORS.map(c => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bold / Italic toggles */}
        <Button
          variant={line.bold ? 'default' : 'outline'}
          size="icon"
          onClick={() => update({ bold: !line.bold })}
          className={cn("h-7 w-7 rounded-lg", line.bold && "bg-primary text-primary-foreground")}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={line.italic ? 'default' : 'outline'}
          size="icon"
          onClick={() => update({ italic: !line.italic })}
          className={cn("h-7 w-7 rounded-lg", line.italic && "bg-primary text-primary-foreground")}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>

        {/* Position */}
        <Select value={line.position} onValueChange={(v: 'header' | 'footer') => update({ position: v })}>
          <SelectTrigger className="w-[80px] h-7 text-xs bg-background/80 rounded-lg ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card rounded-lg">
            <SelectItem value="header" className="text-xs">Header</SelectItem>
            <SelectItem value="footer" className="text-xs">Footer</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}


export function ExportButton({ hijriYear, hijriMonth, method, userLocation, prayerMethod, cityLabel, apiHijriDate }: ExportButtonProps) {
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);
  const [isExportingPrayer, setIsExportingPrayer] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('calendar');
  const [lines, setLines] = useState<PdfLine[]>([]);

  const monthName = HIJRI_MONTHS[hijriMonth - 1];

  const openDialog = (type: ExportType) => {
    const prayerMethodToUse = prayerMethod ?? (method as any);
    const methodLabel = type === 'prayer'
      ? (PRAYER_METHODS[prayerMethodToUse as PrayerMethod]?.name ??
         CALCULATION_METHODS.find(m => m.value === method)?.label ?? String(prayerMethodToUse))
      : (CALCULATION_METHODS.find(m => m.value === method)?.label || method);

    const defaultTitle = type === 'calendar'
      ? `${monthName} ${hijriYear} AH`
      : `Prayer Times - ${monthName} ${hijriYear} AH`;

    const displayCity = cityLabel || userLocation?.cityName || 'Makkah';

    setExportType(type);
    setLines([
      { id: newId(), text: defaultTitle, fontSize: 20, color: '#1a4737', bold: true, italic: false, position: 'header' },
      { id: newId(), text: `${displayCity} | ${methodLabel}`, fontSize: 10, color: '#505050', bold: false, italic: false, position: 'header' },
      { id: newId(), text: '', fontSize: 9, color: '#505050', bold: false, italic: false, position: 'footer' },
    ]);
    setDialogOpen(true);
  };

  const updateLine = useCallback((id: string, updated: PdfLine) => {
    setLines(prev => prev.map(l => l.id === id ? updated : l));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
  }, []);

  const addLine = useCallback((position: 'header' | 'footer') => {
    setLines(prev => {
      const newLine: PdfLine = {
        id: newId(),
        text: '',
        fontSize: position === 'header' ? 12 : 9,
        color: '#505050',
        bold: false,
        italic: false,
        position,
      };
      if (position === 'header') {
        const lastHeaderIdx = prev.reduce((acc, l, i) => l.position === 'header' ? i : acc, -1);
        const arr = [...prev];
        arr.splice(lastHeaderIdx + 1, 0, newLine);
        return arr;
      }
      return [...prev, newLine];
    });
  }, []);

  const handleExport = () => {
    setDialogOpen(false);
    if (exportType === 'calendar') {
      doExportCalendar();
    } else {
      doExportPrayerTimes();
    }
  };

  const getAdjustedDays = (days: ReturnType<typeof getMonthDays>) => {
    if (!apiHijriDate?.gregorian) return days;
    if (apiHijriDate.year !== hijriYear || apiHijriDate.month !== hijriMonth) return days;
    const target = days.find((d) => d.hijriDay === apiHijriDate.day);
    if (!target) return days;
    const apiG = new Date(apiHijriDate.gregorian.year, apiHijriDate.gregorian.month - 1, apiHijriDate.gregorian.day);
    apiG.setHours(0, 0, 0, 0);
    const computedG = new Date(target.gregorianDate);
    computedG.setHours(0, 0, 0, 0);
    const deltaMs = apiG.getTime() - computedG.getTime();
    return days.map((d) => {
      const g = new Date(d.gregorianDate.getTime() + deltaMs);
      g.setHours(0, 0, 0, 0);
      return { ...d, gregorianDate: g, isToday: g.getTime() === apiG.getTime() };
    });
  };

  // --- PDF drawing helpers ---

  const drawLines = async (pdf: jsPDF, pdfWidth: number, linesList: PdfLine[], startY: number) => {
    let yPos = startY;
    for (const line of linesList) {
      if (!line.text) continue;
      const fontStyle = line.bold && line.italic ? 'bolditalic' : line.bold ? 'bold' : line.italic ? 'italic' : 'normal';

      if (containsArabic(line.text)) {
        yPos = addArabicText(pdf, line.text, pdfWidth / 2, yPos, line.fontSize, {
          bold: line.bold, color: line.color, maxWidthMm: pdfWidth - 30,
        });
        yPos += 2;
      } else {
        pdf.setFont('helvetica', fontStyle);
        pdf.setFontSize(line.fontSize);
        const [r, g, b] = hexToRgb(line.color);
        pdf.setTextColor(r, g, b);
        const wrapped = pdf.splitTextToSize(line.text, pdfWidth - 40);
        for (const wl of wrapped) {
          pdf.text(wl, pdfWidth / 2, yPos, { align: 'center' });
          yPos += line.fontSize * 0.45;
        }
        yPos += 1;
      }
    }
    return yPos;
  };

  const drawCredits = (pdf: jsPDF, pdfWidth: number, pdfHeight: number) => {
    let yPos = pdfHeight - 14;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Prayer times data provided by AlAdhan API (aladhan.com)', pdfWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    pdf.setTextColor(26, 71, 55);
    pdf.textWithLink('syedha.com/prayertimes', pdfWidth / 2 - 12, yPos, { url: 'https://syedha.com/prayertimes' });
    yPos += 4;
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, yPos, { align: 'center' });
  };

  const doExportCalendar = async () => {
    setIsExportingCalendar(true);
    toast.loading('Generating Calendar PDF...', { id: 'export-calendar' });

    try {
      const rawDays = getMonthDays(hijriYear, hijriMonth, method);
      const days = getAdjustedDays(rawDays);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      await initArabicSupport();

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const headerLines = lines.filter(l => l.position === 'header');
      const footerLines = lines.filter(l => l.position === 'footer');

      let contentTop = await drawLines(pdf, pdfWidth, headerLines, 16);

      // Gregorian span
      if (days.length > 0) {
        const firstDate = days[0].gregorianDate;
        const lastDate = days[days.length - 1].gregorianDate;
        const firstMonth = GREGORIAN_MONTHS[firstDate.getMonth()];
        const lastMonth = GREGORIAN_MONTHS[lastDate.getMonth()];
        const span = firstMonth === lastMonth ? `${firstMonth} ${firstDate.getFullYear()}` : `${firstMonth} - ${lastMonth} ${firstDate.getFullYear()}`;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(span, pdfWidth / 2, contentTop, { align: 'center' });
        contentTop += 6;
      }

      const marginLeft = 15;
      const marginTop = contentTop + 2;
      const cellWidth = (pdfWidth - 30) / 7;
      const cellHeight = 18;

      pdf.setFillColor(240, 240, 235);
      pdf.rect(marginLeft, marginTop, pdfWidth - 30, 10, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      WEEKDAYS.forEach((day, i) => {
        pdf.text(day, marginLeft + i * cellWidth + cellWidth / 2, marginTop + 7, { align: 'center' });
      });

      const firstDayOfWeek = days.length > 0 ? days[0].gregorianDate.getDay() : 0;
      let row = 0;
      let col = firstDayOfWeek;
      const eventsForLegend: { day: number; name: string; type: string }[] = [];

      days.forEach((day) => {
        const x = marginLeft + col * cellWidth;
        const y = marginTop + 12 + row * cellHeight;
        const isFriday = day.gregorianDate.getDay() === 5;
        const events = getEventsForDay(hijriMonth, day.hijriDay);

        if (day.isToday) {
          pdf.setFillColor(26, 71, 55);
          pdf.roundedRect(x + 1, y, cellWidth - 2, cellHeight - 2, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
        } else if (isFriday) {
          pdf.setFillColor(252, 248, 230);
          pdf.roundedRect(x + 1, y, cellWidth - 2, cellHeight - 2, 2, 2, 'F');
          pdf.setTextColor(26, 71, 55);
        } else {
          pdf.setTextColor(30, 30, 30);
        }

        if (events.length > 0) {
          const evType = events[0].type;
          if (evType === 'wiladat') pdf.setFillColor(16, 185, 129);
          else if (evType === 'victory') pdf.setFillColor(251, 191, 36);
          else pdf.setFillColor(220, 38, 38);
          pdf.circle(x + cellWidth - 4, y + 3, 1.2, 'F');
          for (const ev of events) eventsForLegend.push({ day: day.hijriDay, name: ev.name, type: ev.type });
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(String(day.hijriDay), x + cellWidth / 2, y + 8, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        if (day.isToday) pdf.setTextColor(220, 220, 220);
        else pdf.setTextColor(120, 120, 120);
        pdf.text(`${day.gregorianDate.getDate()} ${GREGORIAN_MONTHS[day.gregorianDate.getMonth()].slice(0, 3)}`, x + cellWidth / 2, y + 14, { align: 'center' });

        col++;
        if (col > 6) { col = 0; row++; }
      });

      if (eventsForLegend.length > 0) {
        const eventsTop = marginTop + 12 + (row + 1) * cellHeight + 4;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(26, 71, 55);
        pdf.text('Events this month:', marginLeft, eventsTop);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        let ey = eventsTop + 5;
        for (const ev of eventsForLegend) {
          if (ev.type === 'wiladat') pdf.setFillColor(16, 185, 129);
          else if (ev.type === 'victory') pdf.setFillColor(251, 191, 36);
          else pdf.setFillColor(220, 38, 38);
          pdf.circle(marginLeft + 2, ey - 1, 1, 'F');
          pdf.setTextColor(50, 50, 50);
          pdf.text(`${ev.day} ${monthName} — ${ev.name}`, marginLeft + 6, ey);
          ey += 4;
        }
      }

      // Footer lines
      const footerStartY = pdfHeight - 30 - footerLines.filter(l => l.text).length * 6;
      await drawLines(pdf, pdfWidth, footerLines, footerStartY);
      drawCredits(pdf, pdfWidth, pdfHeight);

      pdf.save(`hijri-calendar-${monthName.toLowerCase()}-${hijriYear}.pdf`);
      toast.success('Calendar PDF downloaded!', { id: 'export-calendar' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate PDF', { id: 'export-calendar' });
    } finally {
      setIsExportingCalendar(false);
    }
  };

  const doExportPrayerTimes = async () => {
    setIsExportingPrayer(true);
    toast.loading('Generating Prayer Times PDF...', { id: 'export-prayer' });

    try {
      const rawDays = getMonthDays(hijriYear, hijriMonth, method);
      const days = getAdjustedDays(rawDays);
      const prayerMethodToUse = prayerMethod ?? (method as any);
      const { latitude, longitude } = await getLocationInfo(userLocation);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      await initArabicSupport();

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const headerLines = lines.filter(l => l.position === 'header');
      const footerLines = lines.filter(l => l.position === 'footer');

      let contentTop = await drawLines(pdf, pdfWidth, headerLines, 16);
      contentTop += 4;

      const tableMarginLeft = 12;
      const colWidths = [26, 22, 26, 26, 26, 26, 26, 26];
      const rowHeight = 7;
      const headers = ['Gregorian', 'Hijri', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

      pdf.setFillColor(26, 71, 55);
      pdf.rect(tableMarginLeft, contentTop, colWidths.reduce((a, b) => a + b, 0), rowHeight + 1, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      let xPos = tableMarginLeft;
      headers.forEach((header, i) => {
        pdf.text(header, xPos + colWidths[i] / 2, contentTop + 5, { align: 'center' });
        xPos += colWidths[i];
      });

      const prayerTimesData: { date: Date; hijriDay: number; times: any }[] = [];
      for (const day of days) {
        try {
          const times = await fetchPrayerTimesFromAladhan({ date: day.gregorianDate, location: { latitude, longitude }, method: prayerMethodToUse as any });
          prayerTimesData.push({ date: day.gregorianDate, hijriDay: day.hijriDay, times });
        } catch {
          prayerTimesData.push({ date: day.gregorianDate, hijriDay: day.hijriDay, times: null });
        }
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      prayerTimesData.forEach((dayData, index) => {
        const y = contentTop + rowHeight + 1 + index * rowHeight;
        const isFriday = dayData.date.getDay() === 5;
        if (isFriday) { pdf.setFillColor(252, 248, 230); pdf.rect(tableMarginLeft, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F'); }
        else if (index % 2 === 0) { pdf.setFillColor(245, 245, 245); pdf.rect(tableMarginLeft, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F'); }

        pdf.setTextColor(30, 30, 30);
        let x = tableMarginLeft;
        pdf.text(`${dayData.date.getDate()} ${GREGORIAN_MONTHS[dayData.date.getMonth()].slice(0, 3)} ${dayData.date.getFullYear()}`, x + colWidths[0] / 2, y + 5, { align: 'center' });
        x += colWidths[0];
        pdf.text(`${dayData.hijriDay} ${HIJRI_MONTHS[hijriMonth - 1].slice(0, 3)}`, x + colWidths[1] / 2, y + 5, { align: 'center' });
        x += colWidths[1];

        if (dayData.times) {
          const keys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
          keys.forEach((k, ki) => {
            pdf.text(to12Hour(dayData.times[k]), x + colWidths[ki + 2] / 2, y + 5, { align: 'center' });
            x += colWidths[ki + 2];
          });
        }
      });

      const footerStartY = pdfHeight - 26 - footerLines.filter(l => l.text).length * 5;
      await drawLines(pdf, pdfWidth, footerLines, footerStartY);
      drawCredits(pdf, pdfWidth, pdfHeight);

      pdf.save(`prayer-times-${monthName.toLowerCase()}-${hijriYear}.pdf`);
      toast.success('Prayer Times PDF downloaded!', { id: 'export-prayer' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate PDF', { id: 'export-prayer' });
    } finally {
      setIsExportingPrayer(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => openDialog('calendar')}
          disabled={isExportingCalendar || isExportingPrayer}
          variant="outline"
          className="gap-2 border-primary/30 hover:bg-primary/10 transition-all duration-300"
        >
          {isExportingCalendar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
          Calendar
        </Button>
        <Button
          onClick={() => openDialog('prayer')}
          disabled={isExportingCalendar || isExportingPrayer}
          className="bg-primary hover:bg-emerald-dark text-primary-foreground gap-2 shadow-soft hover:shadow-gold transition-all duration-300"
        >
          {isExportingPrayer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          Prayer Times
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl bg-card/95 backdrop-blur-md border-border/50 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary text-xl flex items-center gap-2">
              <Type className="h-5 w-5" />
              Customize {exportType === 'calendar' ? 'Calendar' : 'Prayer Times'} PDF
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 pt-2">
            {/* Left: Line editors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">Lines</Label>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => addLine('header')} className="h-7 text-xs gap-1 rounded-lg">
                    <Plus className="h-3 w-3" /> Header Line
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addLine('footer')} className="h-7 text-xs gap-1 rounded-lg">
                    <Plus className="h-3 w-3" /> Footer Line
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {lines.map(line => (
                  <LineEditor
                    key={line.id}
                    line={line}
                    onChange={updated => updateLine(line.id, updated)}
                    onRemove={() => removeLine(line.id)}
                    canRemove={lines.length > 1}
                  />
                ))}
              </div>

              <Button
                onClick={handleExport}
                className="w-full bg-gradient-to-r from-primary to-emerald-dark hover:opacity-90 rounded-xl shadow-lg gap-2 h-10"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>

            {/* Right: Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Preview</Label>
              <PdfPreview lines={lines} exportType={exportType} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) || 0,
    parseInt(h.substring(2, 4), 16) || 0,
    parseInt(h.substring(4, 6), 16) || 0,
  ];
}
