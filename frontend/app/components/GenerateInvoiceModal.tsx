'use client';

import { useEffect, useState } from 'react';
import { Flat, generateInvoice, GenerateInvoiceInput } from '../services/api';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  flats: Flat[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GenerateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  flats,
}: GenerateInvoiceModalProps) {
  const occupiedFlats = flats.filter((f) => f.status === 1);

  // স্ট্যাটিক ডিফল্ট মান (প্রিরেন্ডারিং ব্লকিং এড়াতে)
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [dueDate, setDueDate] = useState('');

  const [formData, setFormData] = useState({
    flatId: occupiedFlats[0]?.id || 0,
    electricityBill: 1200,
    gasBill: 1080,
    waterBill: 500,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ক্লায়েন্টে মাউন্ট হওয়ার পর বর্তমান তারিখ ও ১০ দিন পরের ডিউ ডেট সেট করা
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setSelectedMonth(MONTHS[now.getMonth()]);
      setSelectedYear(now.getFullYear());

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 10);
      setDueDate(nextDate.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const flatId = formData.flatId || occupiedFlats[0]?.id;

    if (!flatId) {
      setErrorMsg('Please select an occupied flat.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const invoicePayload: GenerateInvoiceInput = {
      flatId,
      billingMonth: `${selectedMonth} ${selectedYear}`,
      electricityBill: Number(formData.electricityBill),
      gasBill: Number(formData.gasBill),
      waterBill: Number(formData.waterBill),
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
    };

    try {
      await generateInvoice(invoicePayload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate invoice. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-100">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-slate-800">Generate Monthly Bill</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        {occupiedFlats.length === 0 ? (
          <div className="py-6 text-center text-slate-500">
            <p className="font-medium text-slate-700">No Occupied Flats</p>
            <p className="text-sm mt-1">Assign a tenant first to generate an invoice.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Flat</label>
              <select
                required
                value={formData.flatId || occupiedFlats[0]?.id}
                onChange={(e) => setFormData({ ...formData, flatId: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {occupiedFlats.map((flat) => (
                  <option key={flat.id} value={flat.id}>
                    Flat {flat.flatNumber} (Tenant: {flat.currentTenantName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Billing Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Electricity (৳)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.electricityBill}
                  onChange={(e) => setFormData({ ...formData, electricityBill: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gas (৳)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.gasBill}
                  onChange={(e) => setFormData({ ...formData, gasBill: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Water (৳)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.waterBill}
                  onChange={(e) => setFormData({ ...formData, waterBill: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg shadow-sm"
              >
                {submitting ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}