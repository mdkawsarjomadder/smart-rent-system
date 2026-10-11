'use client';

import { useState } from 'react';
import { updateFlat, FlatDetails } from '../services/api';

interface EditFlatModalProps {
  flat: FlatDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditFlatModal({
  flat,
  isOpen,
  onClose,
  onSuccess,
}: EditFlatModalProps) {
  const [flatNumber, setFlatNumber] = useState(flat.flatNumber);
  const [floor, setFloor] = useState(flat.floor);
  const [baseRent, setBaseRent] = useState(flat.baseRent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateFlat(flat.id, {
        flatNumber,
        floor: Number(floor),
        bedrooms: 3, // ডিফল্ট বা প্রয়োজনমতো ফিল্ড রাখা যায়
        bathrooms: 2,
        baseRent: Number(baseRent),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update flat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Edit Flat {flat.flatNumber}</h2>
        <p className="text-slate-500 text-xs mt-1 mb-5">
          Update the apartment identifier, floor, or monthly rent.
        </p>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Flat Number / Name
            </label>
            <input
              type="text"
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Floor
              </label>
              <input
                type="number"
                min="0"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Base Rent (৳)
              </label>
              <input
                type="number"
                min="0"
                value={baseRent}
                onChange={(e) => setBaseRent(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                required
              />
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}