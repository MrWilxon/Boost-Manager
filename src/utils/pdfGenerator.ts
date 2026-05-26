import jsPDF from 'jspdf';
import { BoostRequest, BalanceRequest } from '@/src/types';

// Brand colors
const PRIMARY_COLOR: [number, number, number] = [99, 102, 241]; // Indigo 500
const DARK_BG: [number, number, number] = [22, 24, 28]; // Dark surface
const TEXT_MAIN: [number, number, number] = [40, 40, 40]; // Dark gray text
const TEXT_MUTED: [number, number, number] = [120, 120, 120];
const SUCCESS: [number, number, number] = [16, 185, 129];
const PENDING: [number, number, number] = [245, 158, 11];
const REJECTED: [number, number, number] = [244, 63, 94];

// Helper to draw rounded rect
const drawRoundedBox = (doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: string) => {
  doc.roundedRect(x, y, w, h, r, r, style);
};

export const generateBoostInvoice = (request: BoostRequest) => {
  const doc = new jsPDF();
  const date = new Date(request.createdAt || request.date || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const invoiceId = `INV-BST-${request.id.slice(0, 8).toUpperCase()}`;

  // ── HEADER BACKGROUND ──
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, 210, 50, 'F');
  
  // ── BRANDING ──
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('BOOST', 15, 32);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('MANAGER', 58, 32);

  // ── INVOICE TITLE ──
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('CAMPAIGN RECEIPT', 195, 26, { align: 'right' });
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text(`Ref: ${invoiceId}`, 195, 34, { align: 'right' });

  // ── CUSTOMER & META DETAILS ──
  let startY = 70;
  
  // Left side: Billed To
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO', 15, startY);
  
  doc.setTextColor(...TEXT_MAIN);
  doc.setFontSize(12);
  doc.text(request.username, 15, startY + 8);
  
  // Status Badge
  const isApproved = request.status === 'Approved';
  const isPending = request.status === 'Pending';
  const statusColor = isApproved ? SUCCESS : isPending ? PENDING : REJECTED;
  
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  drawRoundedBox(doc, 15, startY + 12, 24, 6, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(request.status.toUpperCase(), 27, startY + 16.5, { align: 'center' });

  // Right side: Invoice Info
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.text('ISSUE DATE', 195, startY, { align: 'right' });
  doc.setTextColor(...TEXT_MAIN);
  doc.setFontSize(11);
  doc.text(date, 195, startY + 8, { align: 'right' });

  // ── TABLE HEADER ──
  let tableY = 110;
  doc.setFillColor(248, 250, 252); // Very light slate
  doc.setDrawColor(226, 232, 240); // Slate 200
  drawRoundedBox(doc, 15, tableY, 180, 12, 2, 'FD');
  
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIPTION', 20, tableY + 8);
  doc.text('QTY', 140, tableY + 8, { align: 'center' });
  doc.text('AMOUNT (NPR)', 190, tableY + 8, { align: 'right' });

  // ── TABLE CONTENT ──
  doc.setTextColor(...TEXT_MAIN);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const description = `${request.platform} Campaign - ${request.adGoal}`;
  const subDescription = `Budget: $${request.budget} for ${request.duration} days`;
  
  doc.setFont('helvetica', 'bold');
  doc.text(description, 20, tableY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.text(subDescription, 20, tableY + 28);
  
  doc.setTextColor(...TEXT_MAIN);
  doc.setFontSize(10);
  doc.text('1', 140, tableY + 22, { align: 'center' });
  doc.text(`${(request.amountNpr || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, tableY + 22, { align: 'right' });

  // ── TOTALS SECTION ──
  let totalY = 160;
  doc.setDrawColor(226, 232, 240);
  doc.line(130, totalY, 195, totalY);
  
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(10);
  doc.text('Subtotal', 130, totalY + 8);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(`${(request.amountNpr || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, totalY + 8, { align: 'right' });
  
  // Total Box
  doc.setFillColor(248, 250, 252);
  drawRoundedBox(doc, 125, totalY + 14, 70, 16, 2, 'F');
  
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL PAID', 130, totalY + 24.5);
  doc.text(`NPR ${(request.amountNpr || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, totalY + 24.5, { align: 'right' });

  // ── FOOTER ──
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('This is an electronically generated receipt and does not require a physical signature.', 105, 275, { align: 'center' });
  doc.text('Thank you for trusting Boost Manager.', 105, 281, { align: 'center' });

  doc.save(`${invoiceId}.pdf`);
};

export const generateTopupInvoice = (request: BalanceRequest) => {
  const doc = new jsPDF();
  const date = new Date(request.date || request.timestamp || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const invoiceId = `INV-TOP-${request.id.slice(0, 8).toUpperCase()}`;

  // ── HEADER BACKGROUND ──
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, 210, 50, 'F');
  
  // ── BRANDING ──
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('BOOST', 15, 32);
  doc.setTextColor(16, 185, 129); // Emerald for Topup
  doc.text('MANAGER', 58, 32);

  // ── INVOICE TITLE ──
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('TOP-UP RECEIPT', 195, 26, { align: 'right' });
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text(`Ref: ${invoiceId}`, 195, 34, { align: 'right' });

  // ── CUSTOMER & META DETAILS ──
  let startY = 70;
  
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER', 15, startY);
  
  doc.setTextColor(...TEXT_MAIN);
  doc.setFontSize(12);
  doc.text(request.username, 15, startY + 8);
  
  // Status Badge
  const isApproved = request.status === 'Approved';
  const isPending = request.status === 'Pending';
  const statusColor = isApproved ? SUCCESS : isPending ? PENDING : REJECTED;
  
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  drawRoundedBox(doc, 15, startY + 12, 24, 6, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(request.status.toUpperCase(), 27, startY + 16.5, { align: 'center' });

  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.text('ISSUE DATE', 195, startY, { align: 'right' });
  doc.setTextColor(...TEXT_MAIN);
  doc.setFontSize(11);
  doc.text(date, 195, startY + 8, { align: 'right' });
  
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.text('PAYMENT METHOD', 195, startY + 16, { align: 'right' });
  doc.setTextColor(...TEXT_MAIN);
  doc.setFontSize(11);
  doc.text(request.method || 'N/A', 195, startY + 24, { align: 'right' });

  // ── TABLE HEADER ──
  let tableY = 120;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  drawRoundedBox(doc, 15, tableY, 180, 12, 2, 'FD');
  
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIPTION', 20, tableY + 8);
  doc.text('AMOUNT CREDITED', 190, tableY + 8, { align: 'right' });

  // ── TABLE CONTENT ──
  doc.setTextColor(...TEXT_MAIN);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  
  doc.text('Wallet Balance Top-up', 20, tableY + 22);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${request.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, tableY + 22, { align: 'right' });

  // ── TOTALS SECTION ──
  let totalY = 150;
  doc.setDrawColor(226, 232, 240);
  doc.line(130, totalY, 195, totalY);
  
  // Total Box
  doc.setFillColor(248, 250, 252);
  drawRoundedBox(doc, 125, totalY + 8, 70, 16, 2, 'F');
  
  doc.setTextColor(16, 185, 129); // Emerald
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL ADDED', 130, totalY + 18.5);
  doc.text(`NPR ${request.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, totalY + 18.5, { align: 'right' });

  // ── FOOTER ──
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('This is an electronically generated receipt and does not require a physical signature.', 105, 275, { align: 'center' });
  doc.text('Thank you for trusting Boost Manager.', 105, 281, { align: 'center' });

  doc.save(`${invoiceId}.pdf`);
};
