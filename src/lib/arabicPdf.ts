import jsPDF from 'jspdf';

const ARABIC_RANGE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

export function containsArabic(text: string): boolean {
  return ARABIC_RANGE.test(text);
}

let browserFontsLoaded = false;

async function loadBrowserFonts(): Promise<void> {
  if (browserFontsLoaded) return;

  const base = import.meta.env.BASE_URL ?? '/';
  try {
    const regular = new FontFace('Amiri', `url(${base}fonts/Amiri-Regular.ttf)`);
    const bold = new FontFace('Amiri', `url(${base}fonts/Amiri-Bold.ttf)`, { weight: 'bold' });
    const [r, b] = await Promise.all([regular.load(), bold.load()]);
    document.fonts.add(r);
    document.fonts.add(b);
  } catch {
    // Local fonts failed — Amiri is loaded from Google Fonts CDN via index.html <link>
  }

  await document.fonts.ready;
  browserFontsLoaded = true;
}

function renderArabicLine(
  text: string,
  fontSize: number,
  bold: boolean,
  color: string,
): { dataUrl: string; pxWidth: number; pxHeight: number } {
  const scale = 6;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const weight = bold ? 'bold' : 'normal';
  const font = `${weight} ${fontSize * scale}px Amiri, serif`;
  ctx.font = font;

  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width) + 20;
  const lineHeight = Math.ceil(fontSize * scale * 1.8);

  canvas.width = textWidth;
  canvas.height = lineHeight;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    pxWidth: canvas.width,
    pxHeight: canvas.height,
  };
}

export async function initArabicSupport(): Promise<void> {
  await loadBrowserFonts();
}

export function addArabicText(
  pdf: jsPDF,
  text: string,
  centerX: number,
  y: number,
  fontSize: number,
  options?: { bold?: boolean; color?: string; maxWidthMm?: number },
): number {
  const bold = options?.bold ?? false;
  const color = options?.color ?? '#1a4737';
  const maxW = options?.maxWidthMm ?? 250;

  const { dataUrl, pxWidth, pxHeight } = renderArabicLine(text, fontSize, bold, color);

  const scale = 6;
  let imgWidthMm = pxWidth / scale * 0.264583;
  let imgHeightMm = pxHeight / scale * 0.264583;

  if (imgWidthMm > maxW) {
    const ratio = maxW / imgWidthMm;
    imgWidthMm = maxW;
    imgHeightMm *= ratio;
  }

  const imgX = centerX - imgWidthMm / 2;
  pdf.addImage(dataUrl, 'PNG', imgX, y - imgHeightMm * 0.55, imgWidthMm, imgHeightMm);

  return y + imgHeightMm * 0.5;
}
