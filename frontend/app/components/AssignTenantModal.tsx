'use client';

import { useState } from 'react';
import { Flat, createTenant, CreateTenantInput } from '../services/api';

interface AssignTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  flats: Flat[];
}

export default function AssignTenantModal({
  isOpen,
  onClose,
  onSuccess,
  flats,
}: AssignTenantModalProps) {
  const vacantFlats = flats.filter((f) => f.status === 0);

  const [formData, setFormData] = useState<CreateTenantInput>({
    fullName: '',
    phoneNumber: '',
    nidNumber: '',
    securityDeposit: 20000,
    flatId: vacantFlats[0]?.id || 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMsg("");

  if (!formData.flatId || Number(formData.flatId) === 0) {
    setErrorMsg("Please select a vacant flat.");
    return;
  }

  setSubmitting(true);

  try {
    // DTO-র সাথে হুবহু মিলিয়ে পেলোড তৈরি:
    const payload = {
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      nidNumber: formData.nidNumber ? formData.nidNumber.trim() : "",
      securityDeposit: Number(formData.securityDeposit) || 0,
      flatId: Number(formData.flatId),
      moveInDate: new Date().toISOString(), // ভ্যালিড UTC ISO স্ট্রিং
      isActive: true,
    };

    const token = localStorage.getItem("smartrent_token") || localStorage.getItem("token");

    const res = await fetch("http://127.0.0.1:5075/api/tenants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || "Failed to assign tenant. Please verify inputs.");
    }

    onSuccess(); // ড্যাশবোর্ড রিফ্রেশ
    onClose();   // মোডাল বন্ধ
  } catch (err: any) {
    setErrorMsg(err.message || "Failed to assign tenant.");
  } 
  finally {
    setSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-100">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-slate-800">Assign New Tenant</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        {vacantFlats.length === 0 ? (
          <div className="py-6 text-center text-slate-500">
            <p className="font-medium text-slate-700">No Vacant Flats Available</p>
            <p className="text-sm mt-1">Please add a new flat first to assign a tenant.</p>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Flat
            </label>
              <select
                value={formData.flatId || ""}
                onChange={(e) => setFormData({ ...formData, flatId: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
                required
              >
                <option value="">-- Choose a Vacant Flat --</option>
                {flats
                  ?.filter((flat: any) => flat.status === 0 || flat.status === "Available")
                  .map((flat: any) => (
                    <option key={flat.id} value={flat.id}>
                      Flat {flat.flatNumber} (Floor {flat.floor}) - ৳{flat.baseRent.toLocaleString()}
                    </option>
                  ))}
              </select>
        </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Shakil Mahmud"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                placeholder="01XXXXXXXXX"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NID Number</label>
                <input
                  type="text"
                  required
                  placeholder="NID Digits"
                  value={formData.nidNumber}
                  onChange={(e) => setFormData({ ...formData, nidNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Security Deposit (৳)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.securityDeposit}
                  onChange={(e) =>
                    setFormData({ ...formData, securityDeposit: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                {submitting ? 'Assigning...' : 'Assign Tenant'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}