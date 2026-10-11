'use client';

import { useState } from 'react';
import { generateBulkInvoices } from '../services/api';

interface BulkInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkInvoiceModal({ isOpen, onClose, onSuccess }: BulkInvoiceModalProps) {
  const [billingMonth, setBillingMonth] = useState('');
  const [electricityBill, setElectricityBill] = useState(0);
  const [gasBill, setGasBill] = useState(1080);
  const [waterBill, setWaterBill] = useState(500);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingMonth || !dueDate) {
      setError('Please select both a billing month and due date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateBulkInvoices({
        billingMonth,
        defaultElectricityBill: Number(electricityBill),
        defaultGasBill: Number(gasBill),
        defaultWaterBill: Number(waterBill),
        dueDate: new Date(dueDate).toISOString(),
      });

      alert(result.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong during bulk generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">⚡ Bulk Generate Bills</h2>
        <p className="text-slate-500 text-xs mt-1 mb-5">
          Generate bills simultaneously for all occupied apartments with active tenants.
        </p>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Billing Month</label>
            <input
              type="text"
              placeholder="e.g. November 2026"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Electricity (৳)</label>
              <input
                type="number"
                min="0"
                value={electricityBill}
                onChange={(e) => setElectricityBill(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Gas (৳)</label>
              <input
                type="number"
                min="0"
                value={gasBill}
                onChange={(e) => setGasBill(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Water (৳)</label>
              <input
                type="number"
                min="0"
                value={waterBill}
                onChange={(e) => setWaterBill(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {loading ? 'Generating...' : 'Generate All'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}