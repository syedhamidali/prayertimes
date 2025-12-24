import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { HIJRI_MONTHS, CalculationMethod, CALCULATION_METHODS, getMonthDays, WEEKDAYS, GREGORIAN_MONTHS } from '@/lib/hijriUtils';

interface ExportButtonProps {
  hijriYear: number;
  hijriMonth: number;
  method: CalculationMethod;
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
