import jsPDF from 'jspdf';
import { BoostRequest, BalanceRequest } from '@/src/types';

export const generateBoostInvoice = (request: BoostRequest) => {
  const doc = new jsPDF();
  const date = new Date(request.createdAt || request.date || Date.now()).toLocaleDateString();
  const invoiceId = `INV-BST-${request.id.slice(0, 8).toUpperCase()}`;

  // Header
  doc.setFillColor(26, 28, 30); // #1A1C1E
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('BOOST MANAGER', 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Invoice & Receipt', 160, 25);

  // Invoice Details
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.text('Invoice ID:', 14, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceId, 50, 60);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', 14, 70);
  doc.text(date, 50, 70);
  
  doc.text('Customer:', 14, 80);
  doc.text(request.username, 50, 80);
  
  doc.text('Status:', 14, 90);
  doc.setTextColor(request.status === 'Approved' ? 16 : 220, request.status === 'Approved' ? 185 : 38, request.status === 'Approved' ? 129 : 38);
  doc.text(request.status, 50, 90);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 100, 196, 100);

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(14, 110, 182, 10, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text('Description', 18, 117);
  doc.text('Amount (NPR)', 160, 117);

  // Table Content
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  const description = `${request.platform} Campaign - ${request.adGoal}: Budget NPR ${request.budget}`;
  doc.text(description, 18, 130);
  doc.text(`NPR ${request.amountNpr?.toLocaleString() || 0}`, 160, 130);

  // Total
  doc.line(14, 140, 196, 140);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Paid:', 120, 150);
  doc.setTextColor(99, 102, 241); // Indigo
  doc.text(`NPR ${request.amountNpr?.toLocaleString() || 0}`, 160, 150);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for using Boost Manager. This is an electronically generated receipt.', 105, 280, { align: 'center' });

  doc.save(`${invoiceId}.pdf`);
};

export const generateTopupInvoice = (request: BalanceRequest) => {
  const doc = new jsPDF();
  const date = new Date(request.date || request.timestamp || Date.now()).toLocaleDateString();
  const invoiceId = `INV-TOP-${request.id.slice(0, 8).toUpperCase()}`;

  // Header
  doc.setFillColor(26, 28, 30); // #1A1C1E
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('BOOST MANAGER', 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Top-up Receipt', 160, 25);

  // Invoice Details
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.text('Receipt ID:', 14, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceId, 50, 60);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', 14, 70);
  doc.text(date, 50, 70);
  
  doc.text('Customer:', 14, 80);
  doc.text(request.username, 50, 80);
  
  doc.text('Method:', 14, 90);
  doc.text(request.method || 'N/A', 50, 90);

  doc.text('Status:', 14, 100);
  doc.setTextColor(request.status === 'Approved' ? 16 : 220, request.status === 'Approved' ? 185 : 38, request.status === 'Approved' ? 129 : 38);
  doc.text(request.status, 50, 100);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 110, 196, 110);

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(14, 120, 182, 10, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text('Description', 18, 127);
  doc.text('Amount Credited', 160, 127);

  // Table Content
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.text('Wallet Balance Top-up', 18, 140);
  doc.text(`NPR ${request.amount.toLocaleString()}`, 160, 140);

  // Total
  doc.line(14, 150, 196, 150);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Top-up:', 120, 160);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`NPR ${request.amount.toLocaleString()}`, 160, 160);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for using Boost Manager. This is an electronically generated receipt.', 105, 280, { align: 'center' });

  doc.save(`${invoiceId}.pdf`);
};
