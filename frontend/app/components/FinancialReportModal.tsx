'use client';

import { Invoice, Expense } from '../services/api';

interface FinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  invoices: Invoice[];
  expenses: Expense[];
  totalCollected: number;
  totalPending: number;
  totalExpenses: number;
  netProfit: number;
}

export default function FinancialReportModal({
  isOpen,
  onClose,
  selectedMonth,
  invoices,
  expenses,
  totalCollected,
  totalPending,
  totalExpenses,
  netProfit,
}: FinancialReportModalProps) {
  if (!isOpen) return null;

  // ব্রাউজারের আলাদা ক্লিন উইন্ডোতে পাঠিয়ে ১টি মাত্র A4 পেজে প্রিন্ট করা
  const handlePrint = () => {
    const reportElement = document.getElementById('printable-report-area');
    if (!reportElement) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Please allow popups for printing.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SmartRent_Financial_Report_${selectedMonth.replace(/\s+/g, '_')}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 14mm;
            }
            body {
              background: #fff;
              color: #0f172a;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0;
              padding: 0;
            }
            .a4-wrapper {
              min-height: 275mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="a4-wrapper">
            ${reportElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden mt-6 mb-8 flex flex-col">
        
        {/* Printable Document Area */}
        <div id="printable-report-area" className="p-6 sm:p-8 space-y-4 text-slate-800 bg-white flex flex-col justify-between min-h-[720px]">
          
          <div className="space-y-4">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">SMART RENT RESIDENCES</h1>
                <p className="text-[11px] text-slate-500">Property Management &amp; Financial Analytics Statement</p>
                <p className="text-[11px] text-slate-700 mt-1">
                  Report Period: <strong className="text-slate-900">{selectedMonth === 'ALL' ? 'All Time (Full Summary)' : selectedMonth}</strong>
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                <p>Generated: <span className="text-slate-800 font-semibold">{new Date().toLocaleDateString('en-GB')}</span></p>
                <p className="inline-block bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  Official Statement
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <p className="text-[9px] font-bold uppercase text-emerald-800 tracking-wider">Total Revenue</p>
                <p className="text-base font-black text-emerald-700 mt-0.5">৳{totalCollected.toLocaleString()}</p>
                <p className="text-[9px] text-emerald-600">{invoices.filter((i) => i.isPaid).length} paid bills</p>
              </div>

              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg">
                <p className="text-[9px] font-bold uppercase text-rose-800 tracking-wider">Total Expenses</p>
                <p className="text-base font-black text-rose-700 mt-0.5">৳{totalExpenses.toLocaleString()}</p>
                <p className="text-[9px] text-rose-600">{expenses.length} records</p>
              </div>

              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                <p className="text-[9px] font-bold uppercase text-amber-800 tracking-wider">Pending Dues</p>
                <p className="text-base font-black text-amber-700 mt-0.5">৳{totalPending.toLocaleString()}</p>
                <p className="text-[9px] text-amber-600">{invoices.filter((i) => !i.isPaid).length} unpaid bills</p>
              </div>

              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                <p className="text-[9px] font-bold uppercase text-indigo-800 tracking-wider">Net Profit</p>
                <p className={`text-base font-black mt-0.5 ${netProfit >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                  ৳{netProfit.toLocaleString()}
                </p>
                <p className="text-[9px] text-indigo-600">Revenue - Expenses</p>
              </div>
            </div>

            {/* Section 1: Invoices Summary */}
            <div className="space-y-1.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                <span>Rental Invoices ({invoices.length})</span>
                <span className="text-[10px] font-normal text-slate-500 normal-case">Paid &amp; Pending Invoices</span>
              </h2>

              {invoices.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-2 text-center italic">No invoices in this period.</p>
              ) : (
                <table className="w-full text-left text-[11px] border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[9px]">
                    <tr>
                      <th className="p-1.5 border-b">Invoice #</th>
                      <th className="p-1.5 border-b">Flat</th>
                      <th className="p-1.5 border-b">Tenant</th>
                      <th className="p-1.5 border-b">Month</th>
                      <th className="p-1.5 border-b">Status</th>
                      <th className="p-1.5 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="p-1.5 font-mono text-slate-600">INV-{String(inv.id).padStart(4, '0')}</td>
                        <td className="p-1.5 font-semibold text-slate-800">{inv.flatNumber}</td>
                        <td className="p-1.5 text-slate-700">{inv.tenantName}</td>
                        <td className="p-1.5 text-slate-600">{inv.billingMonth}</td>
                        <td className="p-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              inv.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inv.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="p-1.5 font-bold text-slate-900 text-right">৳{inv.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Section 2: Expenses Summary */}
            <div className="space-y-1.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                <span>Expenses Breakdown ({expenses.length})</span>
                <span className="text-[10px] font-normal text-slate-500 normal-case">Maintenance, Salaries &amp; Utilities</span>
              </h2>

              {expenses.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-1.5 text-center italic">No expenses logged in this period.</p>
              ) : (
                <table className="w-full text-left text-[11px] border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[9px]">
                    <tr>
                      <th className="p-1.5 border-b">Date</th>
                      <th className="p-1.5 border-b">Category</th>
                      <th className="p-1.5 border-b">Description</th>
                      <th className="p-1.5 border-b">Scope</th>
                      <th className="p-1.5 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="p-1.5 text-slate-600">
                          {new Date(exp.expenseDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-1.5 font-semibold text-slate-700">{exp.category}</td>
                        <td className="p-1.5 text-slate-600">{exp.description}</td>
                        <td className="p-1.5 text-slate-500">{exp.flatNumber}</td>
                        <td className="p-1.5 font-bold text-rose-600 text-right">-৳{exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Footer Signature */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
            <div>
              <p className="font-medium text-slate-600">Generated automatically by SmartRent Management System.</p>
              <p className="text-[9px] text-slate-400">Confidential Financial Document.</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="font-semibold text-slate-700">Authorized Signature</p>
            </div>
          </div>

        </div>

        {/* Bottom Action Footer Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Period: </span>
            <strong className="text-slate-800">{selectedMonth === 'ALL' ? 'Lifetime Records' : selectedMonth}</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer shadow-sm"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="w-1/2 sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className=''>🖨️</span>  Print
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}