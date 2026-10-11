'use client';

import { Invoice } from '../services/api';

interface InvoiceReceiptModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceReceiptModal({
  invoice,
  isOpen,
  onClose,
}: InvoiceReceiptModalProps) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-printable-area');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Please allow popups to print receipt.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Flat ${invoice.flatNumber}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: #ffffff !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
          </style>
        </head>
        <body class="bg-white flex justify-center p-0 m-0">
          <div class="w-full max-w-2xl min-h-[255mm] flex flex-col justify-between py-2">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col">
        
        {/* Top Header - House Title & Overview (No buttons here) */}
        <div className="sticky top-0 z-10 px-6 py-3.5 bg-slate-100 border-b border-slate-200 shadow-sm text-center">
          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
            Green Villa Residential Apartment &bull; Flat {invoice.flatNumber}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Official monthly house rent and utility maintenance bill collection acknowledgment voucher
          </p>
        </div>

        {/* Printable Area */}
        <div
          id="receipt-printable-area"
          className="p-8 md:p-10 flex flex-col justify-between min-h-[560px] bg-white text-slate-900"
        >
          {/* Top Info */}
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">SMART RENT</h1>
                <p className="text-sm text-slate-600 font-medium mt-1">Automated Property Management</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-sm uppercase tracking-wider rounded-full border border-emerald-300">
                  PAID RECEIPT
                </span>
                <p className="text-base text-slate-800 font-bold mt-2">Flat: {invoice.flatNumber}</p>
              </div>
            </div>

            {/* Tenant Box */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <p className="text-slate-500 uppercase font-bold text-xs tracking-wider">Billed To</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{invoice.tenantName}</p>
                <p className="text-sm text-slate-700 font-medium mt-0.5">Flat Number: {invoice.flatNumber}</p>
              </div>
              <div className="text-right space-y-1.5">
                <div>
                  <span className="text-sm text-slate-500 font-medium">Billing Month: </span>
                  <span className="text-base font-bold text-slate-900">{invoice.billingMonth}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-500 font-medium">Paid On: </span>
                  <span className="text-base font-bold text-emerald-700">
                    {invoice.paidDate
                      ? new Date(invoice.paidDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Paid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Charges */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
                Breakdown of Charges
              </h3>
              <div className="divide-y divide-slate-200 text-base">
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Base Apartment Rent</span>
                  <span className="font-bold text-slate-900">৳{invoice.baseRent.toLocaleString()}</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Electricity Bill</span>
                  <span className="font-bold text-slate-900">৳{invoice.electricityBill.toLocaleString()}</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Gas Utility Bill</span>
                  <span className="font-bold text-slate-900">৳{invoice.gasBill.toLocaleString()}</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Water Utility Bill</span>
                  <span className="font-bold text-slate-900">৳{invoice.waterBill.toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Info: Total Amount & Signature */}
          <div className="pt-10 space-y-8">
            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-baseline">
              <div>
                <span className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  Total Amount Paid
                </span>
                <p className="text-xs text-slate-500 mt-0.5">All dues cleared for this billing period</p>
              </div>
              <span className="text-3xl font-black text-slate-900">
                ৳{invoice.totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="pt-12 border-t border-dashed border-slate-300 flex justify-between items-end text-xs text-slate-500">
              <div className="space-y-1">
                <p className="font-semibold text-slate-600">Generated electronically by Smart Rent System.</p>
                <p>No manual seal or physical signature strictly required.</p>
              </div>
              <div className="text-right">
                <div className="w-44 border-b-2 border-slate-800 pb-1 mb-1.5 ml-auto"></div>
                <p className="text-slate-800 font-bold text-sm">Authorized Signature</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow transition flex items-center gap-1.5"
          >
            <span>🖨️</span> Print / Save PDF
          </button>
        </div>

      </div>
    </div>
  );
}