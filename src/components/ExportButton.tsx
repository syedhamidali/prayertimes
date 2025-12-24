import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { HIJRI_MONTHS, CalculationMethod, CALCULATION_METHODS, getMonthDays, WEEKDAYS, GREGORIAN_MONTHS } from '@/lib/hijriUtils';
import { fetchPrayerTimesFromAladhan } from '@/lib/aladhanApi';

interface ExportButtonProps {
  hijriYear: number;
  hijriMonth: number;
  method: CalculationMethod;
}

// Convert 24h time to 12h format
function to12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function ExportButton({ hijriYear, hijriMonth, method }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    toast.loading('Generating PDF...', { id: 'export' });

    try {
      const days = getMonthDays(hijriYear, hijriMonth, method);
      const methodLabel = CALCULATION_METHODS.find(m => m.value === method)?.label || method;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // ===== PAGE 1: Calendar =====
      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(26, 71, 55);
      pdf.text(`${HIJRI_MONTHS[hijriMonth - 1]} ${hijriYear} AH`, pdfWidth / 2, 18, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Calculation Method: ${methodLabel}`, pdfWidth / 2, 26, { align: 'center' });

      // Gregorian span
      if (days.length > 0) {
        const firstDate = days[0].gregorianDate;
        const lastDate = days[days.length - 1].gregorianDate;
        const firstMonth = GREGORIAN_MONTHS[firstDate.getMonth()];
        const lastMonth = GREGORIAN_MONTHS[lastDate.getMonth()];
        let span = firstMonth === lastMonth ? `${firstMonth} ${firstDate.getFullYear()}` : `${firstMonth} - ${lastMonth} ${firstDate.getFullYear()}`;
        pdf.setFontSize(9);
        pdf.text(span, pdfWidth / 2, 32, { align: 'center' });
      }

      // Calendar grid settings
      const marginLeft = 15;
      const marginTop = 40;
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

        // Cell background
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

        // Hijri day
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(String(day.hijriDay), x + cellWidth / 2, y + 8, { align: 'center' });

        // Gregorian date
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

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, pdfHeight - 8, { align: 'center' });

      // ===== PAGE 2: Prayer Times Table =====
      pdf.addPage();

      // Get user location for prayer times
      let latitude = 21.4225; // Default to Makkah
      let longitude = 39.8262;
      
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // Use default location
      }

      // Header for prayer times page
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(26, 71, 55);
      pdf.text(`Prayer Times - ${HIJRI_MONTHS[hijriMonth - 1]} ${hijriYear} AH`, pdfWidth / 2, 15, { align: 'center' });

      // Table settings
      const tableMarginLeft = 10;
      const tableTop = 25;
      const colWidths = [32, 28, 28, 28, 28, 28, 28, 28, 28]; // Gregorian, Hijri, Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha
      const rowHeight = 6;
      const headers = ['Gregorian', 'Hijri', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Sunset', 'Maghrib', 'Isha'];

      // Draw header row
      pdf.setFillColor(26, 71, 55);
      pdf.rect(tableMarginLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight + 2, 'F');
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
            method: method as any,
          });
          prayerTimesData.push({ date: day.gregorianDate, hijriDay: day.hijriDay, times });
        } catch {
          prayerTimesData.push({ date: day.gregorianDate, hijriDay: day.hijriDay, times: null });
        }
      }

      // Draw data rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);

      prayerTimesData.forEach((dayData, index) => {
        const y = tableTop + rowHeight + 2 + index * rowHeight;
        const isFriday = dayData.date.getDay() === 5;

        // Alternate row background
        if (isFriday) {
          pdf.setFillColor(252, 248, 230);
          pdf.rect(tableMarginLeft, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        } else if (index % 2 === 0) {
          pdf.setFillColor(248, 248, 248);
          pdf.rect(tableMarginLeft, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        }

        pdf.setTextColor(30, 30, 30);
        let x = tableMarginLeft;

        // Gregorian date
        const gregDate = `${dayData.date.getDate()} ${GREGORIAN_MONTHS[dayData.date.getMonth()].slice(0, 3)} ${dayData.date.getFullYear()}`;
        pdf.text(gregDate, x + colWidths[0] / 2, y + 4.5, { align: 'center' });
        x += colWidths[0];

        // Hijri date
        pdf.text(`${dayData.hijriDay} ${HIJRI_MONTHS[hijriMonth - 1].slice(0, 3)}`, x + colWidths[1] / 2, y + 4.5, { align: 'center' });
        x += colWidths[1];

        if (dayData.times) {
          // Fajr
          pdf.text(to12Hour(dayData.times.fajr), x + colWidths[2] / 2, y + 4.5, { align: 'center' });
          x += colWidths[2];

          // Sunrise
          pdf.text(to12Hour(dayData.times.sunrise), x + colWidths[3] / 2, y + 4.5, { align: 'center' });
          x += colWidths[3];

          // Dhuhr
          pdf.text(to12Hour(dayData.times.dhuhr), x + colWidths[4] / 2, y + 4.5, { align: 'center' });
          x += colWidths[4];

          // Asr
          pdf.text(to12Hour(dayData.times.asr), x + colWidths[5] / 2, y + 4.5, { align: 'center' });
          x += colWidths[5];

          // Sunset (calculate from maghrib - a few mins typically)
          pdf.text(to12Hour(dayData.times.maghrib), x + colWidths[6] / 2, y + 4.5, { align: 'center' });
          x += colWidths[6];

          // Maghrib
          pdf.text(to12Hour(dayData.times.maghrib), x + colWidths[7] / 2, y + 4.5, { align: 'center' });
          x += colWidths[7];

          // Isha
          pdf.text(to12Hour(dayData.times.isha), x + colWidths[8] / 2, y + 4.5, { align: 'center' });
        } else {
          pdf.setTextColor(150, 150, 150);
          pdf.text('—', x + colWidths[2] / 2, y + 4.5, { align: 'center' });
        }
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Prayer times based on coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, pdfWidth / 2, pdfHeight - 8, { align: 'center' });

      const fileName = `hijri-calendar-${HIJRI_MONTHS[hijriMonth - 1].toLowerCase()}-${hijriYear}.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate PDF', { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-primary hover:bg-emerald-dark text-primary-foreground gap-2 shadow-soft hover:shadow-gold transition-all duration-300"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Export PDF
    </Button>
  );
}
