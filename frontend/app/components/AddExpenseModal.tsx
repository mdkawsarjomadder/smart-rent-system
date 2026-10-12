'use client';

import { useState } from 'react';
import { createExpense, Flat } from '../services/api';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  flats: Flat[];
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  flats,
}: AddExpenseModalProps) {
  const [category, setCategory] = useState('Maintenance');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [flatId, setFlatId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      await createExpense({
        category,
        description,
        amount: Number(amount),
        flatId: flatId ? Number(flatId) : null,
      });
      setDescription('');
      setAmount('');
      setFlatId('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Record Property Expense</h2>
        <p className="text-slate-500 text-xs mt-1 mb-5">Log maintenance, repair, or staff payments.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              <option value="Maintenance">Maintenance & Repair</option>
              <option value="Guard Salary">Security Guard Salary</option>
              <option value="Cleaning">Cleaning & Waste Disposal</option>
              <option value="Electricity / Lift">Common Electricity / Lift Service</option>
              <option value="Other">Other Expenses</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description / Note</label>
            <input
              type="text"
              placeholder="e.g. Water motor repair, Guard October pay"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Amount (৳)</label>
              <input
                type="number"
                min="1"
                placeholder="৳ Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Assigned Flat (Optional)</label>
              <select
                value={flatId}
                onChange={(e) => setFlatId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="">Building Common</option>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>Flat {f.flatNumber}</option>
                ))}
              </select>
            </div>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {loading ? 'Recording...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}