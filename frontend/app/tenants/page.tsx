'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTenants, Tenant } from '../services/api';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const fetchTenantList = async () => {
      try {
        const data = await getTenants();
        setTenants(data);
      } catch (err) {
        console.error('Error fetching tenants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantList();
  }, []);

  // সার্চ ও ফিল্টার লজিক
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phoneNumber.includes(searchTerm) ||
      (tenant.flatNumber && tenant.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'active') return matchesSearch && tenant.isActive;
    if (statusFilter === 'inactive') return matchesSearch && !tenant.isActive;
    return matchesSearch;
  });

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.isActive).length;
  const totalDeposit = tenants
    .filter((t) => t.isActive)
    .reduce((sum, t) => sum + t.securityDeposit, 0);

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* হেডার ও ব্যাক লিংক */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mt-1">Tenant Directory</h1>
            <p className="text-slate-500 text-sm">Overview of current and previous tenants</p>
          </div>
        </div>

        {/* কুইক সামারি কার্ড */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalTenants}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tenants</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeTenants}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Held Deposits</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">৳{totalDeposit.toLocaleString()}</h3>
          </div>
        </div>

        {/* ফিল্টার ও সার্চ বার */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name, flat, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {(['all', 'active', 'inactive'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  statusFilter === filter
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Ex-Tenants'}
              </button>
            ))}
          </div>
        </div>

        {/* ভাড়াটিয়াদের টেবিল */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading tenant records...</div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No tenants matched your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Tenant Name</th>
                    <th className="px-6 py-4">Assigned Flat</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4">NID</th>
                    <th className="px-6 py-4">Move-in Date</th>
                    <th className="px-6 py-4">Security Deposit</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">{tenant.fullName}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">Flat {tenant.flatNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{tenant.phoneNumber}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{tenant.nidNumber}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(tenant.moveInDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        ৳{tenant.securityDeposit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            tenant.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {tenant.isActive ? 'Active' : 'Vacated'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}