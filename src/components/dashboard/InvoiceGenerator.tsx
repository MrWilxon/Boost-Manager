import React from 'react';
import { Rocket, CheckCircle2 } from 'lucide-react';
import { BoostRequest } from '../../types';

interface InvoiceGeneratorProps {
  selectedInvoiceReq: BoostRequest | null;
  invoiceConfig: {
    companyName: string;
    companySubtitle: string;
    billToLocation: string;
  };
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  selectedInvoiceReq,
  invoiceConfig
}) => {
  if (!selectedInvoiceReq) return null;

  return (
    <div 
      id="invoice-generator-container" 
      style={{ position: 'fixed', left: '-2000px', top: '0', display: 'block', pointerEvents: 'none' }}
    >
      <div 
        className="invoice-container bg-white text-zinc-900 font-sans shadow-none" 
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          margin: '0 auto', 
          position: 'relative',
          backgroundColor: '#ffffff',
          color: '#1a1a1a'
        }}
      >
        {/* Header Section */}
        <div 
          className="header" 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '48px 56px 40px', 
            color: '#ffffff', 
            position: 'relative', 
            overflow: 'hidden',
            textAlign: 'left'
          }}
        >
          {/* Decorative circle */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          <div className="header-top flex justify-between items-start mb-12 relative z-10" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="logo-section flex items-center gap-3.5" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="logo-icon w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg" style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Rocket style={{ color: '#667eea' }} size={28} />
              </div>
              <div className="company-info">
                <h1 className="text-[26px] font-bold tracking-tight mb-0.5 leading-none" style={{ color: '#ffffff' }}>{invoiceConfig.companyName}</h1>
                <p className="text-[14px] opacity-90 font-normal" style={{ color: '#ffffff' }}>{invoiceConfig.companySubtitle}</p>
              </div>
            </div>
            
            <div className="invoice-meta text-right" style={{ textAlign: 'right' }}>
              <div className="label text-[12px] uppercase tracking-[1px] opacity-80 font-semibold mb-1" style={{ color: '#ffffff' }}>Issue Date</div>
              <div className="date text-[16px] font-semibold" style={{ color: '#ffffff' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <span className="status-badge inline-block mt-3 px-5 py-2 rounded-full text-[13px] font-semibold border" style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#10b981', borderColor: 'rgba(52, 211, 153, 0.3)', display: 'inline-block' }}>
                PAID & VERIFIED
              </span>
            </div>
          </div>
          
          <div className="invoice-title relative z-10">
            <h2 className="text-[52px] font-extrabold tracking-[-1.5px] mb-1.5 leading-none" style={{ color: '#ffffff' }}>INVOICE</h2>
            <p className="invoice-number text-[16px] opacity-85 font-medium tracking-[0.5px]" style={{ color: '#ffffff' }}>Invoice #{String(selectedInvoiceReq.id).toUpperCase().slice(0, 12)}</p>
          </div>
        </div>
        
        <div className="content" style={{ padding: '48px 56px' }}>
          <div className="billing-section mb-14 text-left" style={{ textAlign: 'left' }}>
            <div className="billing-block max-w-[400px]">
              <h3 className="text-[12px] uppercase tracking-[1.2px] text-slate-500 font-bold mb-4" style={{ color: '#6b7280' }}>Billed To</h3>
              <div className="billing-details bg-slate-50 p-6 rounded-xl border border-slate-200" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '24px', borderRadius: '12px' }}>
                <p className="name font-bold text-lg mb-2 text-slate-900" style={{ color: '#111827', fontSize: '18px', fontWeight: '700' }}>{selectedInvoiceReq.username}</p>
                <p className="address text-[14px] text-slate-500 font-mono leading-relaxed" style={{ color: '#6b7280', fontSize: '14px' }}>{selectedInvoiceReq.location || invoiceConfig.billToLocation}</p>
                <p className="address text-[12px] text-slate-400 font-mono mt-2" style={{ color: '#9ca3af' }}>ID: {selectedInvoiceReq.userId}</p>
              </div>
            </div>
          </div>
          
          <div className="items-section mb-12">
            <table className="items-table w-full border-collapse bg-white rounded-xl overflow-hidden border border-slate-200" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
              <thead className="bg-slate-50" style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th className="p-4 text-left text-[12px] uppercase tracking-widest font-bold text-slate-500 border-b-2 border-slate-200" style={{ padding: '16px 20px', textAlign: 'left', color: '#6b7280' }}>Service / Item</th>
                  <th className="p-4 text-left text-[12px] uppercase tracking-widest font-bold text-slate-500 border-b-2 border-slate-200" style={{ padding: '16px 20px', textAlign: 'left', color: '#6b7280' }}>Budget</th>
                  <th className="p-4 text-left text-[12px] uppercase tracking-widest font-bold text-slate-500 border-b-2 border-slate-200" style={{ padding: '16px 20px', textAlign: 'left', color: '#6b7280' }}>Term</th>
                  <th className="p-4 text-right text-[12px] uppercase tracking-widest font-bold text-slate-500 border-b-2 border-slate-200" style={{ padding: '16px 20px', textAlign: 'right', color: '#6b7280' }}>Total (NPR)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td className="p-5 text-left" style={{ padding: '32px 24px' }}>
                    <div className="service-name font-semibold text-slate-900 mb-3 text-base" style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Boost Campaign: {selectedInvoiceReq.adGoal}</div>
                    <div className="service-url text-[13px] text-slate-500 font-mono break-all" style={{ color: '#6b7280', maxWidth: '400px', lineHeight: '1.5' }}>{selectedInvoiceReq.url}</div>
                    <div className="mt-5 text-slate-400 text-[13px] font-bold uppercase" style={{ color: '#9ca3af' }}>
                      {selectedInvoiceReq.platforms?.join(', ') || 'ALL'}
                    </div>
                  </td>
                  <td className="p-5 text-left" style={{ padding: '32px 20px' }}><span className="quantity-badge bg-slate-100 px-3 py-1.5 rounded-md font-semibold text-slate-600 text-sm" style={{ backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '6px', color: '#4b5563', fontWeight: '600' }}>${selectedInvoiceReq.allocatedBudget}</span></td>
                  <td className="p-5 text-left" style={{ padding: '32px 20px' }}><span className="quantity-badge bg-slate-100 px-3 py-1.5 rounded-md font-semibold text-slate-600 text-sm" style={{ backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '6px', color: '#4b5563', fontWeight: '600' }}>{selectedInvoiceReq.duration}D</span></td>
                  <td className="p-5 text-right font-bold text-slate-900 text-base" style={{ textAlign: 'right', padding: '32px 20px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>रू{selectedInvoiceReq.amountNpr?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="summary-section flex justify-end mb-14 text-left" style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'left' }}>
            <div className="summary-box w-[380px] bg-slate-50 rounded-xl p-8 border border-slate-200" style={{ width: '380px', backgroundColor: '#f9fafb', padding: '32px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div className="summary-row flex justify-between mb-4 text-[15px]" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="label text-slate-500 font-medium" style={{ color: '#6b7280' }}>Item subtotal</span>
                <span className="value font-semibold text-zinc-900" style={{ color: '#1f2937', fontWeight: '600' }}>रू{selectedInvoiceReq.amountNpr?.toLocaleString()}</span>
              </div>
              <div className="summary-row flex justify-between mb-4 text-[15px]" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="label text-slate-500 font-medium" style={{ color: '#6b7280' }}>Platform surcharges (0%)</span>
                <span className="value font-semibold text-zinc-900" style={{ color: '#1f2937', fontWeight: '600' }}>रू0</span>
              </div>
              
              <div className="summary-divider h-[1px] bg-slate-200 mb-6" style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '24px 0' }}></div>
              
              <div className="summary-total flex justify-between items-center pt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label text-[16px] font-bold text-slate-900 uppercase tracking-wide" style={{ color: '#111827', fontWeight: '700' }}>Grand Total</span>
                <span className="amount text-[32px] font-extrabold" style={{ color: '#4f46e5', fontWeight: '800' }}>रू{selectedInvoiceReq.amountNpr?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer bg-slate-50 p-12 border-t border-slate-200 mt-auto text-left" style={{ padding: '32px 56px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
          <div className="verification flex items-center gap-3 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="verify-icon w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shrink-0" style={{ width: '28px', height: '28px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 style={{ color: '#ffffff' }} size={16} />
            </div>
            <div className="verify-text">
              <h4 className="text-[14px] font-bold text-slate-900 mb-0.5 uppercase" style={{ color: '#111827' }}>VERIFIED BY BOOST MANAGER</h4>
              <p className="text-[12px] text-slate-500" style={{ color: '#6b7280' }}>Transaction and service provision confirmed</p>
            </div>
          </div>
          
          <div className="footer-meta flex justify-between items-center mt-5 pt-5 border-t border-slate-200 text-[12px] text-slate-400" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', padding: '20px 0', fontSize: '12px', color: '#9ca3af' }}>
            <span className="invoice-id font-mono font-semibold" style={{ fontWeight: '600' }}>ID: SN-{String(selectedInvoiceReq.id).toUpperCase().slice(0, 10)}</span>
            <span>© {new Date().getFullYear()} BOOST MANAGER - Kathmandu, Nepal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
