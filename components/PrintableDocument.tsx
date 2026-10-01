import React from 'react';
import { BillingDocument, Company } from '../types';

interface PrintableDocumentProps {
  data: BillingDocument;
  mode?: 'quote' | 'invoice';
  company?: Company;
}

const PrintableDocument: React.FC<PrintableDocumentProps> = ({ data, mode, company }) => {
  const docMode = mode || (data.type === 'QUOTE' ? 'quote' : 'invoice');

  const compName = company?.name || 'Universal Field & Labour Services';
  const compReg = company?.registrationNumber || '';
  const compVat = company?.vatNumber || '';
  const compPhone = company?.phone || '';
  const compEmail = company?.email || '';
  const compWebsite = company?.website || '';
  const compAddress = company?.address || 'Operational Headquarters & Service Centre';
  const compBrandColor = company?.brandColor || '#2563eb';
  const compLogo = company?.logoUrl;
  const currencySymbol = company?.currencySymbol || 'R';

  const subtotalMaterials = data.materials?.reduce((sum, item) => sum + (item.amount || (Number(item.qty) * Number(item.unitPrice)) || 0), 0) || 0;
  const subtotalLabour = data.labour?.reduce((sum, item) => sum + (item.amount || (Number(item.hours) * Number(item.rate)) || 0), 0) || 0;
  const subtotal = data.subtotal ?? (subtotalMaterials + subtotalLabour);
  const discount = data.discount || 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const vatRate = data.vatRate || company?.taxRate || 15;
  const vatAmount = data.vatAmount ?? (data.includeVat ? discountedSubtotal * (vatRate / 100) : 0);
  const grandTotal = data.total ?? (discountedSubtotal + vatAmount);

  const docDate = data.date?.toDate 
    ? data.date.toDate().toLocaleDateString('en-ZA') 
    : (data.date instanceof Date ? data.date.toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA'));

  return (
    <div className="print-page text-slate-900 bg-white flex flex-col min-h-screen p-6 font-sans">
      {/* Header Section with Dynamic Company White-Label */}
      <div className="flex justify-between items-start mb-4 border-b-2 border-slate-900 pb-4">
        <div className="flex gap-4 items-start">
          <div className="shrink-0">
            {compLogo ? (
              <img 
                src={compLogo} 
                alt={compName} 
                className="h-16 w-auto object-contain max-w-[180px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = `<div class="w-32 h-14 text-white flex flex-col items-center justify-center rounded p-1 shadow" style="background-color: ${compBrandColor}"><span class="font-black text-xs uppercase">${compName.split(' ')[0]}</span><span class="text-[8px] tracking-widest uppercase">SERVICES</span></div>`;
                  }
                }}
              />
            ) : (
              <div 
                className="w-32 h-14 text-white flex flex-col items-center justify-center rounded p-1 shadow"
                style={{ backgroundColor: compBrandColor }}
              >
                <span className="font-black text-xs uppercase">{compName.split(' ')[0]}</span>
                <span className="text-[8px] tracking-widest uppercase">SERVICES</span>
              </div>
            )}
          </div>
          <div className="text-[10px] leading-tight font-medium pt-1">
            <p className="font-black text-[13px] text-slate-900">{compName}</p>
            <p>{compPhone} | {compEmail}</p>
            <p>{compWebsite} • {compAddress}</p>
            <p className="text-slate-500 text-[9px] mt-0.5">
              {compReg ? `Reg: ${compReg} • ` : ''}{compVat ? `VAT: ${compVat} • ` : ''}Professional Service Standard
            </p>
          </div>
        </div>

        <div className="text-right">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">
            {docMode === 'quote' ? 'Quotation' : 'Tax Invoice'}
          </h1>
          <div className="space-y-0.5 text-[10px] font-bold">
            <div className="flex justify-end gap-2">
              <span className="text-slate-400 uppercase">{docMode === 'quote' ? 'Quote #' : 'Invoice #'}</span>
              <span className="font-mono text-slate-900">{data.invoiceNumber || data.documentNumber || 'DRAFT'}</span>
            </div>
            <div className="flex justify-end gap-2">
              <span className="text-slate-400 uppercase">DATE</span>
              <span className="font-mono text-slate-900">{docDate}</span>
            </div>
            {data.isPaid && (
              <div className="mt-1">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                  PAID IN FULL
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Details */}
      <div className="grid grid-cols-2 gap-8 mb-4">
        <div className="space-y-1">
          <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-0.5">CLIENT / BILL TO:</h2>
          <div className="space-y-0.5">
            <p className="font-black text-[13px] text-slate-900 uppercase leading-none">{data.clientId || 'Client Name'}</p>
            <p className="text-[10px] text-slate-600 font-medium whitespace-pre-line leading-tight">{data.address || 'Address not specified'}</p>
            <p className="text-[10px] text-slate-900 font-bold">{data.contactDetails}</p>
            {data.customerVat && (
              <p className="text-[9px] text-slate-600">VAT No: {data.customerVat}</p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-0.5">SCOPE / DESCRIPTION:</h2>
          <p className="text-[9px] text-slate-700 leading-tight whitespace-pre-line max-h-24 overflow-hidden">
            {data.narrative || 'Professional field services, quality labour, and operations delivery.'}
          </p>
        </div>
      </div>

      {/* Tables Section */}
      <div className="flex-grow space-y-4">
        {/* Materials Table */}
        {data.materials && data.materials.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Materials &amp; Components</h3>
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-1">Description</th>
                  <th className="py-1 text-center w-16">Qty</th>
                  <th className="py-1 text-right w-24">Rate ({currencySymbol})</th>
                  <th className="py-1 text-right w-24">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.materials.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1 font-medium">{item.description}</td>
                    <td className="py-1 text-center font-mono">{item.qty}</td>
                    <td className="py-1 text-right font-mono">{Number(item.unitPrice || 0).toFixed(2)}</td>
                    <td className="py-1 text-right font-mono font-bold">
                      {Number(item.amount || (Number(item.qty) * Number(item.unitPrice))).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Labour & Services Table */}
        {data.labour && data.labour.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Labour &amp; Professional Services</h3>
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-1">Service Description</th>
                  <th className="py-1 text-center w-16">Units / Hrs</th>
                  <th className="py-1 text-right w-24">Rate ({currencySymbol})</th>
                  <th className="py-1 text-right w-24">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.labour.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1 font-medium">{item.description}</td>
                    <td className="py-1 text-center font-mono">{item.hours}</td>
                    <td className="py-1 text-right font-mono">{Number(item.rate || 0).toFixed(2)}</td>
                    <td className="py-1 text-right font-mono font-bold">
                      {Number(item.amount || (Number(item.hours) * Number(item.rate))).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals Section */}
      <div className="border-t border-slate-900 pt-3 mt-auto">
        <div className="flex justify-between items-start">
          <div className="space-y-2 text-[9px] text-slate-600 max-w-sm">
            <div>
              <p className="font-bold text-slate-900 uppercase">Payment Terms &amp; Banking Details:</p>
              <p>Bank: First National Bank (FNB)</p>
              <p>Account Name: {compName}</p>
              <p>Branch Code: 250655 • Cheque Account</p>
              <p>Reference: {data.invoiceNumber || data.documentNumber}</p>
            </div>
            <p className="italic">Thank you for your business. Quality service and workmanship guaranteed.</p>
          </div>

          <div className="w-64 space-y-1 text-right text-[10px]">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 font-bold uppercase">Subtotal</span>
              <span className="font-mono text-slate-900">{currencySymbol} {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-0.5 text-amber-600 font-bold">
                <span>Discount</span>
                <span className="font-mono">-{currencySymbol} {discount.toFixed(2)}</span>
              </div>
            )}
            {data.includeVat && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500 font-bold uppercase">VAT ({vatRate}%)</span>
                <span className="font-mono text-slate-900">{currencySymbol} {vatAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-t-2 border-slate-900 font-black text-sm">
              <span className="uppercase">Total Due</span>
              <span className="font-mono" style={{ color: compBrandColor }}>{currencySymbol} {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableDocument;
