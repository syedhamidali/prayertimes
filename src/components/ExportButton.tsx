import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Loader2, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { HIJRI_MONTHS, CalculationMethod, CALCULATION_METHODS, getMonthDays, WEEKDAYS, GREGORIAN_MONTHS } from '@/lib/hijriUtils';
import { fetchPrayerTimesFromAladhan, AladhanHijriDate } from '@/lib/aladhanApi';
import { PRAYER_METHODS, type PrayerMethod } from '@/lib/prayerTimes';

interface ExportButtonProps {
  hijriYear: number;
  hijriMonth: number;
  method: CalculationMethod;
  userLocation?: { latitude: number; longitude: number; cityName: string };
  prayerMethod?: PrayerMethod;
  cityLabel?: string;
  apiHijriDate?: AladhanHijriDate;
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

export function ExportButton({ hijriYear, hijriMonth, method, userLocation, prayerMethod, cityLabel, apiHijriDate }: ExportButtonProps) {
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);
  const [isExportingPrayer, setIsExportingPrayer] = useState(false);

  // Customization dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('calendar');
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customFooter, setCustomFooter] = useState('');

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
    const defaultSubtitle = `Location: ${displayCity} | Method: ${methodLabel}`;

    setExportType(type);
    setCustomTitle(defaultTitle);
    setCustomSubtitle(defaultSubtitle);
    setCustomFooter('');
    setDialogOpen(true);
  };

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

    const apiG = new Date(
      apiHijriDate.gregorian.year,
      apiHijriDate.gregorian.month - 1,
      apiHijriDate.gregorian.day
    );
    apiG.setHours(0, 0, 0, 0);

    const computedG = new Date(target.gregorianDate);
    computedG.setHours(0, 0, 0, 0);

    const deltaMs = apiG.getTime() - computedG.getTime();

    return days.map((d) => {
      const g = new Date(d.gregorianDate.getTime() + deltaMs);
      g.setHours(0, 0, 0, 0);
      return {
        ...d,
        gregorianDate: g,
        isToday: g.getTime() === apiG.getTime(),
      };
    });
  };

  const drawCustomHeader = (pdf: jsPDF, pdfWidth: number) => {
    let yPos = 18;

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(26, 71, 55);
    pdf.text(customTitle, pdfWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Subtitle
    if (customSubtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      const lines = pdf.splitTextToSize(customSubtitle, pdfWidth - 40);
      for (const line of lines) {
        pdf.text(line, pdfWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }
    }

    return yPos;
  };

  const drawCustomFooter = (pdf: jsPDF, pdfWidth: number, pdfHeight: number) => {
    let yPos = pdfHeight - 20;

    if (customFooter) {
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      const lines = pdf.splitTextToSize(customFooter, pdfWidth - 40);
      for (const line of lines) {
        pdf.text(line, pdfWidth / 2, yPos, { align: 'center' });
        yPos += 4;
      }
      yPos += 2;
    }

    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Prayer times data provided by AlAdhan API (aladhan.com)', pdfWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    pdf.setTextColor(26, 71, 55);
    pdf.textWithLink('syedha.com/prayertimes', pdfWidth / 2 - 12, yPos, { url: 'https://syedha.com/prayertimes' });
    yPos += 5;
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, yPos, { align: 'center' });
  };

  const doExportCalendar = async () => {
    setIsExportingCalendar(true);
    toast.loading('Generating Calendar PDF...', { id: 'export-calendar' });

    try {
      const rawDays = getMonthDays(hijriYear, hijriMonth, method);
      const days = getAdjustedDays(rawDays);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Custom header
      let contentTop = drawCustomHeader(pdf, pdfWidth);

      // Gregorian span
      if (days.length > 0) {
        const firstDate = days[0].gregorianDate;
        const lastDate = days[days.length - 1].gregorianDate;
        const firstMonth = GREGORIAN_MONTHS[firstDate.getMonth()];
        const lastMonth = GREGORIAN_MONTHS[lastDate.getMonth()];
        const span = firstMonth === lastMonth ? `${firstMonth} ${firstDate.getFullYear()}` : `${firstMonth} - ${lastMonth} ${firstDate.getFullYear()}`;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(span, pdfWidth / 2, contentTop, { align: 'center' });
        contentTop += 6;
      }

      // Calendar grid settings
      const marginLeft = 15;
      const marginTop = contentTop + 2;
      const cellWidth = (pdfWidth - 30) / 7;
      const cellHeight = 18;

      // Weekday headers
      pdf.setFillColor(240, 240, 235);
      pdf.rect(marginLeft, marginTop, pdfWidth - 30, 10, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      WEEKDAYS.forEach((day, i) => {
        const x = marginLeft + i * cellWidth + cellWidth / 2;
        pdf.text(day, x, marginTop + 7, { align: 'center' });
      });

      // Draw days
      const firstDayOfWeek = days.length > 0 ? days[0].gregorianDate.getDay() : 0;
      let row = 0;
      let col = firstDayOfWeek;

      pdf.setFont('helvetica', 'normal');

      days.forEach((day) => {
        const x = marginLeft + col * cellWidth;
        const y = marginTop + 12 + row * cellHeight;
        const isFriday = day.gregorianDate.getDay() === 5;

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

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(String(day.hijriDay), x + cellWidth / 2, y + 8, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        if (day.isToday) {
          pdf.setTextColor(220, 220, 220);
        } else {
          pdf.setTextColor(120, 120, 120);
        }
        const gregText = `${day.gregorianDate.getDate()} ${GREGORIAN_MONTHS[day.gregorianDate.getMonth()].slice(0, 3)}`;
        pdf.text(gregText, x + cellWidth / 2, y + 14, { align: 'center' });

        col++;
        if (col > 6) {
          col = 0;
          row++;
        }
      });

      // Custom footer
      drawCustomFooter(pdf, pdfWidth, pdfHeight);

      const fileName = `hijri-calendar-${monthName.toLowerCase()}-${hijriYear}.pdf`;
      pdf.save(fileName);

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

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Custom header
      let contentTop = drawCustomHeader(pdf, pdfWidth);
      contentTop += 4;

      // Table settings
      const tableMarginLeft = 12;
      const tableTop = contentTop;
      const colWidths = [26, 22, 26, 26, 26, 26, 26, 26];
      const rowHeight = 7;
      const headers = ['Gregorian', 'Hijri', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

      // Draw header row
      pdf.setFillColor(26, 71, 55);
      pdf.rect(tableMarginLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight + 1, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);

      let xPos = tableMarginLeft;
      headers.forEach((header, i) => {
        pdf.text(header, xPos + colWidths[i] / 2, tableTop + 5, { align: 'center' });
        xPos += colWidths[i];
      });

      // Fetch prayer times for each day
      const prayerTimesData: { date: Date; hijriDay: number; times: any }[] = [];

      for (const day of days) {
        try {
          const times = await fetchPrayerTimesFromAladhan({
            date: day.gregorianDate,
            location: { latitude, longitude },
            method: prayerMethodToUse as any,
          });
          prayerTimesData.push({ date: day.gregorianDate, hijriDay: day.hijriDay, times });
        } catch {
          prayerTimesData.push({ date: day.gregorianDate, hijriDay: day.hijriDay, times: null });
        }
      }

      // Draw data rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);

      prayerTimesData.forEach((dayData, index) => {
        const y = tableTop + rowHeight + 1 + index * rowHeight;
        const isFriday = dayData.date.getDay() === 5;

        if (isFriday) {
          pdf.setFillColor(252, 248, 230);
          pdf.rect(tableMarginLeft, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        } else if (index % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(tableMarginLeft, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        }

        pdf.setTextColor(30, 30, 30);
        let x = tableMarginLeft;

        const gregDate = `${dayData.date.getDate()} ${GREGORIAN_MONTHS[dayData.date.getMonth()].slice(0, 3)} ${dayData.date.getFullYear()}`;
        pdf.text(gregDate, x + colWidths[0] / 2, y + 5, { align: 'center' });
        x += colWidths[0];

        pdf.text(`${dayData.hijriDay} ${HIJRI_MONTHS[hijriMonth - 1].slice(0, 3)}`, x + colWidths[1] / 2, y + 5, { align: 'center' });
        x += colWidths[1];

        if (dayData.times) {
          pdf.text(to12Hour(dayData.times.fajr), x + colWidths[2] / 2, y + 5, { align: 'center' });
          x += colWidths[2];
          pdf.text(to12Hour(dayData.times.sunrise), x + colWidths[3] / 2, y + 5, { align: 'center' });
          x += colWidths[3];
          pdf.text(to12Hour(dayData.times.dhuhr), x + colWidths[4] / 2, y + 5, { align: 'center' });
          x += colWidths[4];
          pdf.text(to12Hour(dayData.times.asr), x + colWidths[5] / 2, y + 5, { align: 'center' });
          x += colWidths[5];
          pdf.text(to12Hour(dayData.times.maghrib), x + colWidths[6] / 2, y + 5, { align: 'center' });
          x += colWidths[6];
          pdf.text(to12Hour(dayData.times.isha), x + colWidths[7] / 2, y + 5, { align: 'center' });
        } else {
          pdf.setTextColor(150, 150, 150);
          pdf.text('—', x + colWidths[2] / 2, y + 5, { align: 'center' });
        }
      });

      // Custom footer
      drawCustomFooter(pdf, pdfWidth, pdfHeight);

      const fileName = `prayer-times-${monthName.toLowerCase()}-${hijriYear}.pdf`;
      pdf.save(fileName);

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
          {isExportingCalendar ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          Calendar
        </Button>
        <Button
          onClick={() => openDialog('prayer')}
          disabled={isExportingCalendar || isExportingPrayer}
          className="bg-primary hover:bg-emerald-dark text-primary-foreground gap-2 shadow-soft hover:shadow-gold transition-all duration-300"
        >
          {isExportingPrayer ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          Prayer Times
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/50 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-primary text-xl">
              Customize {exportType === 'calendar' ? 'Calendar' : 'Prayer Times'} PDF
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="pdf-title" className="text-sm font-medium">Title</Label>
              <Input
                id="pdf-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="PDF title"
                className="bg-background/60 rounded-xl mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="pdf-subtitle" className="text-sm font-medium">Subtitle</Label>
              <Input
                id="pdf-subtitle"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                placeholder="Location, method, or other details"
                className="bg-background/60 rounded-xl mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="pdf-footer" className="text-sm font-medium">
                Custom Footer <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="pdf-footer"
                value={customFooter}
                onChange={(e) => setCustomFooter(e.target.value)}
                placeholder="e.g. Mosque name, organization, notes..."
                rows={2}
                className="bg-background/60 rounded-xl mt-1.5 resize-none"
              />
            </div>

            <Button
              onClick={handleExport}
              className="w-full bg-gradient-to-r from-primary to-emerald-dark hover:opacity-90 rounded-xl shadow-lg gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
