'use client';

import { use, useEffect, useState, useCallback } from 'react';
import EditFlatModal from '../../components/EditFlatModal';
import Link from 'next/link';
import { getFlatDetails, FlatDetails } from '../../services/api';

interface Props {
  params: Promise<{ id: string }>;
}

export default function FlatDetailsContent({ params }: Props) {
  // Suspense এর ভেতরে React.use() দিয়ে প্রমিজ আনর‍্যাপ করা
  const { id } = use(params);
  const flatId = Number(id);

  const [details, setDetails] = useState<FlatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const data = await getFlatDetails(flatId);
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [flatId]);

  useEffect(() => {
    if (!flatId) return;
    fetchDetails();
  }, [flatId, fetchDetails]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 flex justify-center items-center">
        <p className="text-slate-500 font-medium">Loading apartment details...</p>
      </main>
    );
  }

  if (error || !details) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 flex flex-col justify-center items-center">
        <p className="text-rose-600 font-medium">{error || 'Flat not found'}</p>
        <Link href="/" className="mt-4 text-blue-600 underline text-sm">
          Return to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation */}
        <Link
          href="/"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>

        {/* Flat Summary Header (এখানে এডিট বাটনটি যোগ করা হয়েছে) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-800">Flat {details.flatNumber}</h1>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  details.status.toLowerCase() === 'occupied'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {details.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Floor Level: {details.floor}th Floor</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold uppercase text-slate-400">Monthly Rent</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">৳{details.baseRent.toLocaleString()}</p>
            </div>

            {/* Edit Flat Button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <span>✏️</span> Edit Flat
            </button>
          </div>
        </div>

        {/* Two Columns: Current Tenant & Previous Tenants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Active Tenant Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Current Active Tenant
            </h2>
            {details.currentTenant ? (
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-800">{details.currentTenant.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800">{details.currentTenant.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NID:</span>
                  <span className="font-mono text-slate-700">{details.currentTenant.nidNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Move-in Date:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(details.currentTenant.moveInDate).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-bold text-emerald-600">
                    ৳{details.currentTenant.securityDeposit.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">This flat is currently vacant.</p>
            )}
          </div>

          {/* Past Tenants */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Tenant History
            </h2>
            {details.tenantHistory.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No tenant records found.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {details.tenantHistory.map((t) => (
                  <div key={t.id} className="py-2.5 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{t.fullName}</p>
                      <p className="text-xs text-slate-400">{t.phoneNumber}</p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.isActive ? 'Active' : 'Vacated'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Flat Billing & Payment History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Billing & Payment History</h2>
          </div>
          {details.billingHistory.length === 0 ? (
            <p className="text-sm text-slate-400 p-8 text-center">No invoices issued for this flat yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Paid On</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.billingHistory.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{inv.billingMonth}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">৳{inv.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {inv.paidDate ? new Date(inv.paidDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            inv.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Flat Modal Render */}
        {details && (
          <EditFlatModal
            flat={details}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={fetchDetails}
          />
        )}

      </div>
    </main>
  );
}