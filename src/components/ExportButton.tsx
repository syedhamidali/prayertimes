import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { HIJRI_MONTHS, CalculationMethod, CALCULATION_METHODS } from '@/lib/hijriUtils';

interface ExportButtonProps {
  hijriYear: number;
  hijriMonth: number;
  method: CalculationMethod;
  calendarRef: React.RefObject<HTMLDivElement>;
}

export function ExportButton({ hijriYear, hijriMonth, method, calendarRef }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!calendarRef.current) {
      toast.error('Calendar not found');
      return;
    }

    setIsExporting(true);
    toast.loading('Generating PDF...', { id: 'export' });

    try {
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2,
        backgroundColor: '#f9f7f4',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add header
      const methodLabel = CALCULATION_METHODS.find(m => m.value === method)?.label || method;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(26, 71, 55); // Emerald color
      pdf.text(`${HIJRI_MONTHS[hijriMonth - 1]} ${hijriYear} AH`, pdfWidth / 2, 15, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Calculation Method: ${methodLabel}`, pdfWidth / 2, 22, { align: 'center' });

      // Calculate image dimensions
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yPosition = 28;

      // Add calendar image
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, Math.min(imgHeight, pdfHeight - yPosition - 15));

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, pdfHeight - 8, { align: 'center' });

      // Save PDF
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
