'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; 
import {
  getFlats,
  getInvoices,
  getExpenses,
  payInvoice,
  vacateFlat,
  Flat,
  Invoice,
  Expense,
} from './services/api';
import { useRouter } from 'next/navigation';
import AddFlatModal from './components/AddFlatModal';
import AssignTenantModal from './components/AssignTenantModal';
import GenerateInvoiceModal from './components/GenerateInvoiceModal';
import InvoiceReceiptModal from './components/InvoiceReceiptModal';
import BulkInvoiceModal from './components/BulkInvoiceModal';
import AddExpenseModal from './components/AddExpenseModal';
import FinancialReportModal from './components/FinancialReportModal';
import FinancialChart from './components/FinancialChart';

export default function HomePage() {
  // login create
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

 useEffect(() => {
  const token = localStorage.getItem("smartrent_token") || localStorage.getItem("token");
  const rawUser = localStorage.getItem("smartrent_user") || localStorage.getItem("user");

  // টোকেন না থাকলে সরাসরি লগইনে পাঠিয়ে দেওয়া
  if (!token) {
    router.push("/login");
    return;
  }

  // নিরাপদভাবে JSON পার্স করার চেক
  if (rawUser && rawUser !== "undefined" && rawUser !== "null") {
    try {
      setCurrentUser(JSON.parse(rawUser));
    } catch (err) {
      console.error("Failed to parse user data from localStorage:", err);
      localStorage.removeItem("smartrent_user");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }
}, [router]);

  const handleLogout = () => {
    localStorage.removeItem('smartrent_token');
    localStorage.removeItem('smartrent_user');
    router.push('/login');
  };

  const [flats, setFlats] = useState<Flat[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // রসিদের জন্য স্টেট
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // ডিফল্ট মান হিসেবে 'ALL' থাকবে (প্রি-রেন্ডারিং এরর এড়াতে)
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // ক্লায়েন্ট ব্রাউজারে পেজ মাউন্ট হওয়ার পর বর্তমান মাস সেট করা
  useEffect(() => {
    const currentMonth = new Date().toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    setSelectedMonth(currentMonth);
  }, []);


  const loadData = async () => {
    setLoading(true);
    try {
      const [flatsData, invoicesData, expensesData] = await Promise.all([
        getFlats(),
        getInvoices().catch(() => []),
        getExpenses().catch(() => []),
      ]);
      setFlats(flatsData);
      setInvoices(invoicesData);
      setExpenses(expensesData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePayInvoice = async (id: number) => {
    try {
      await payInvoice(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update invoice payment status.');
    }
  };

  const handleVacateFlat = async (id: number, flatNumber: string) => {
    if (confirm(`Are you sure you want to vacate Flat ${flatNumber}?`)) {
      try {
        await vacateFlat(id);
        loadData();
      } catch (err) {
        console.error(err);
        alert('Failed to vacate flat.');
      }
    }
  };

  // --- Analytics Calculations (সঠিকভাবে Occupied কাউন্ট) ---
  const totalFlats = flats.length;
  const occupiedFlats = flats.filter(
    (f) => Boolean(f.currentTenantName || f.status === 1 || String(f.status).toLowerCase() === 'occupied')
  ).length;
  const vacantFlats = totalFlats - occupiedFlats;
  const occupancyRate = totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0;

// ড্রপডাউনের জন্য সব অনন্য (Unique) মাসের তালিকা তৈরি
  const availableMonths = Array.from(
    new Set([
      ...invoices.map((inv) => inv.billingMonth),
      ...expenses.map((exp) =>
        new Date(exp.expenseDate).toLocaleString('en-US', { month: 'long', year: 'numeric' })
      ),
    ])
  ).filter(Boolean);

  // সিলেক্ট করা মাসের ভিত্তিতে ইনভয়েস ও খরচ ফিল্টার করা
  const filteredInvoices = selectedMonth === 'ALL'
    ? invoices
    : invoices.filter((inv) => inv.billingMonth?.toLowerCase() === selectedMonth.toLowerCase());

  const filteredExpenses = selectedMonth === 'ALL'
    ? expenses
    : expenses.filter((exp) => {
        const expMonth = new Date(exp.expenseDate).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        return expMonth.toLowerCase() === selectedMonth.toLowerCase();
      });

  // ফিল্টার করা ডাটা থেকে আর্থিক হিসাব
  const totalCollected = filteredInvoices
    .filter((inv) => inv.isPaid)
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const unpaidInvoices = filteredInvoices.filter((inv) => !inv.isPaid);
  const totalPending = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // ফিল্টার করা খরচ ও নিট লাভ
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalCollected - totalExpenses;

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
       {/* Header Section */}
<header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
  <div>
    <h1 className="text-3xl font-bold text-slate-800">Smart Rent Dashboard</h1>
    <p className="text-slate-500 text-sm mt-1">Real-time overview of apartments, dues, revenue, and expenses</p>
  </div>

  <div className="flex flex-wrap items-center gap-3">
    {/* Tenants Directory Link */}
    <Link
      href="/tenants"
      className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition"
    >
      👥 View Tenants
    </Link>

    {/* Add Flat Button */}
    <button
      onClick={() => setIsFlatModalOpen(true)}
      className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition"
    >
      + Add Flat
    </button>

    {/* Assign Tenant Button */}
    <button
      onClick={() => setIsTenantModalOpen(true)}
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition"
    >
      + Assign Tenant
    </button>

    {/* Single Bill Button */}
    <button
      onClick={() => setIsInvoiceModalOpen(true)}
      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition"
    >
      + Generate Bill
    </button>

    {/* Bulk Bill Button */}
    <button
      onClick={() => setIsBulkModalOpen(true)}
      className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition"
    >
      ⚡ Bulk Bills
    </button>

    {/* Add Expense Button */}
    <button
      onClick={() => setIsExpenseModalOpen(true)}
      className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition"
    >
      - Add Expense
    </button>

    {/* User Info & Logout Button */}
    <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-300 ml-1">
      {currentUser && (
        <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-2 rounded-xl hidden md:inline-flex items-center gap-1">
          👤 {currentUser.fullName || currentUser.username}
        </span>
      )}
      <button
        onClick={handleLogout}
        className="bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1 shadow-sm"
        title="Sign out"
      >
        🚪 Logout
        </button>
      </div>
    </div>
  </header>

        {error && (
          <div className="p-4 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            {error} (Make sure .NET backend is running on port 5075)
          </div>
        )}

        {/* Month & Period Filter Bar */}
      {/* Month & Period Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">📅 Filter Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Time (সব সময়ের মোট হিসাব)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Showing: <strong className="text-slate-800">{selectedMonth === 'ALL' ? 'Lifetime Records' : selectedMonth}</strong>
            </span>

            {/* PDF Report Button */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>📄</span> Export PDF Report
            </button>
          </div>
        </div>

        {/* 1. Quick Stats & Analytics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Total Apartments (আপনার চাওয়া অংশ) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Apartments</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalFlats}</h3>
              </div>
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">🏢</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <span className="text-emerald-600 font-semibold">{occupiedFlats} Occupied</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{vacantFlats} Vacant</span>
            </div>
          </div>

          {/* Collected Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Revenue</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">৳{totalCollected.toLocaleString()}</h3>
              </div>
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm">✓</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Pending: <span className="font-semibold text-rose-600">৳{totalPending.toLocaleString()}</span>
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-1">৳{totalExpenses.toLocaleString()}</h3>
              </div>
              <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm">📉</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Total logs: <span className="font-semibold text-slate-700">{expenses.length} records</span>
            </p>
          </div>

          {/* Net Profit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Profit</p>
                <h3 className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  ৳{netProfit.toLocaleString()}
                </h3>
              </div>
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm">💰</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Revenue minus expenses
            </p>
          </div>

        </div>
        {/* 1.5 Financial Trends Visual Analytics */}
        <FinancialChart invoices={invoices} expenses={expenses} />

        {/* 2. Apartments Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Apartments ({flats.length})</h2>
          </div>

          {loading && flats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              Loading apartments...
            </div>
          ) : flats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              No flats added yet. Click &apos;+ Add Flat&apos; to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flats.map((flat) => (
                <div
                  key={flat.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-4">
                    <Link
                      href={`/flats/${flat.id}`}
                      className="text-xl font-bold text-slate-800 hover:text-blue-600 transition flex items-center gap-1 group"
                    >
                      Flat {flat.flatNumber}
                      <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </Link>

                    {/* কার্ডের ভেতরে ফ্ল্যাট স্ট্যাটাস ব্যাজ (আপনার দেওয়া অংশ) */}
                    {(() => {
                      const isOccupied = Boolean(
                        flat.currentTenantName ||
                        flat.status === 1 ||
                        String(flat.status).toLowerCase() === 'occupied'
                      );
                      return (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            isOccupied
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isOccupied ? 'Occupied' : 'Vacant'}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-600 mb-4">
                    <p>Floor: <span className="font-medium text-slate-800">{flat.floor}</span></p>
                    <p>Layout: <span className="font-medium text-slate-800">{flat.bedrooms} Bed, {flat.bathrooms} Bath</span></p>
                    <p>Rent: <span className="font-bold text-slate-900">৳{flat.baseRent.toLocaleString()}</span> / month</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    {flat.currentTenantName ? (
                      <>
                        <p className="text-sm font-medium text-blue-600">
                          Tenant: <span className="text-slate-800">{flat.currentTenantName}</span>
                        </p>
                        <button
                          onClick={() => handleVacateFlat(flat.id, flat.flatNumber)}
                          className="text-xs px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-md transition"
                        >
                          Vacate
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No tenant assigned</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Invoices Section */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Invoices &amp; Billing History</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No invoices generated yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Flat</th>
                      <th className="px-6 py-4">Tenant</th>
                      <th className="px-6 py-4">Month</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4">Paid On</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-slate-800">{inv.flatNumber}</td>
                        <td className="px-6 py-4">{inv.tenantName}</td>
                        <td className="px-6 py-4">{inv.billingMonth}</td>
                        
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(inv.dueDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="px-6 py-4 text-xs font-medium">
                          {inv.paidDate ? (
                            <span className="text-emerald-700">
                              {new Date(inv.paidDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pending</span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-bold text-slate-900">৳{inv.totalAmount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              inv.isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inv.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.isPaid ? (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setIsReceiptOpen(true);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/60 rounded-lg transition"
                              >
                                Receipt
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePayInvoice(inv.id)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 4. Expenses Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Property Expenses Log</h2>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition"
            >
              + New Expense
            </button>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No expenses logged yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Flat / Scope</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(exp.expenseDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">{exp.description}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{exp.flatNumber}</td>
                        <td className="px-6 py-4 font-bold text-rose-600 text-right">
                          -৳{exp.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AddFlatModal
          isOpen={isFlatModalOpen}
          onClose={() => setIsFlatModalOpen(false)}
          onSuccess={loadData}
        />
        <AssignTenantModal
          isOpen={isTenantModalOpen}
          onClose={() => setIsTenantModalOpen(false)}
          onSuccess={loadData}
          flats={flats}
        />
        <GenerateInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          onSuccess={loadData}
          flats={flats}
        />
        <InvoiceReceiptModal
          invoice={selectedInvoice}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
        <BulkInvoiceModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={loadData}
        />
        <AddExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={loadData}
          flats={flats}
        />
        <FinancialReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          selectedMonth={selectedMonth}
          invoices={filteredInvoices}
          expenses={filteredExpenses}
          totalCollected={totalCollected}
          totalPending={totalPending}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
        />
      </div>
    </main>
  );
}