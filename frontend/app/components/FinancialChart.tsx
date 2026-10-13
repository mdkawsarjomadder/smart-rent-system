'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Sector,
} from 'recharts';
import { Invoice, Expense } from '../services/api';

interface FinancialChartProps {
  invoices: Invoice[];
  expenses: Expense[];
}

export default function FinancialChart({ invoices, expenses }: FinancialChartProps) {
  // হোভার করা স্লাইসের ইনডেক্স ট্র্যাক করার স্টেট
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // ১. সকল ইউনিক মাস বের করা
  const allMonths = Array.from(
    new Set([
      ...invoices.map((inv) => inv.billingMonth),
      ...expenses.map((exp) =>
        new Date(exp.expenseDate).toLocaleString('en-US', { month: 'long', year: 'numeric' })
      ),
    ])
  ).filter(Boolean);

  // ২. প্রতি মাসের জন্য Income ও Expense হিসাব
  const chartData = allMonths.map((month) => {
    const monthlyIncome = invoices
      .filter((inv) => inv.billingMonth?.toLowerCase() === month.toLowerCase() && inv.isPaid)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const monthlyExpense = expenses
      .filter((exp) => {
        const expMonth = new Date(exp.expenseDate).toLocaleString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        return expMonth.toLowerCase() === month.toLowerCase();
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    return {
      month,
      Income: monthlyIncome,
      Expense: monthlyExpense,
      Profit: monthlyIncome - monthlyExpense,
    };
  });

  // ৩. ডোনাট চার্টের ডাটা ও প্রতিটি স্লাইসের পারসেন্টেজ হিসাব
  const totalInvoices = invoices.length;
  const paidCount = invoices.filter((i) => i.isPaid).length;
  const unpaidCount = totalInvoices - paidCount;
  const expenseCount = expenses.length;

  // সব আইটেমের মোট যোগফল (শতকরা হার বের করার জন্য)
  const totalItems = (unpaidCount > 0 ? unpaidCount : 1) + 
                     (paidCount > 0 ? paidCount : 1) + 
                     1 + 
                     (expenseCount > 0 ? expenseCount : 1);

  const rawDonutData = [
    { name: 'In Progress (Unpaid)', count: unpaidCount > 0 ? unpaidCount : 1, color: '#0284c7' }, // Blue
    { name: 'Completed (Paid)', count: paidCount > 0 ? paidCount : 1, color: '#10b981' }, // Green
    { name: 'Need Review', count: 1, color: '#f59e0b' }, // Yellow
    { name: 'Backlog (Expenses)', count: expenseCount > 0 ? expenseCount : 1, color: '#ef4444' }, // Red
  ];

  // প্রতিটির নির্দিষ্ট শতাংশ (%) যুক্ত করা
  const donutData = rawDonutData.map((item) => ({
    ...item,
    percentage: Math.round((item.count / totalItems) * 100),
  }));

  // হোভার করলে যে স্লাইসে কার্সর আছে সেটি সামান্য বড় এবং হাইলাইট হবে
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))' }}
        />
      </g>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* বাম পাশের কার্ড: ইন্টারঅ্যাক্টিভ ডোনাট চার্ট */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Chart</h3>
            <span className="text-slate-400 text-sm font-black cursor-pointer hover:text-slate-600 transition">•••</span>
          </div>

          {/* New Feature Pill Banner */}
          <div className="bg-[#eff6ff] text-[#2563eb] text-[11px] px-3 py-1.5 rounded-full w-fit mb-4 flex items-center gap-1.5 font-medium border border-[#dbeafe]">
            <span className="bg-[#2563eb] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              NEW FEATURE
            </span>
            <span className="hover:underline cursor-pointer">We just released this new feature →</span>
          </div>

          {/* Donut & Legend Container */}
          <div className="flex items-center justify-between py-1">
            {/* Donut Chart with Dynamic Hover Text */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* হোভার টুলটিপ যা ক্যাটাগরি ও % দেখাবে */}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-700 pointer-events-none">
                            <span className="font-semibold block">{data.name}</span>
                            <span className="text-emerald-400 font-bold text-sm">{data.percentage}%</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                 <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={64}
                    paddingAngle={3}
                    dataKey="count"
                    {...({
                        activeIndex: activeIndex !== null ? activeIndex : undefined,
                        activeShape: renderActiveShape,
                        onMouseEnter: (_: any, index: number) => setActiveIndex(index),
                        onMouseLeave: () => setActiveIndex(null),
                    } as any)}
                    >
                    {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* সেন্টারের টেক্সট: হোভার করলে সেই স্লাইসের %, না থাকলে ডিফল্ট দেখাবে */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
                <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                  {activeIndex !== null ? `${donutData[activeIndex].percentage}%` : '100%'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-[85px] text-center">
                  {activeIndex !== null ? donutData[activeIndex].name.split(' ')[0] : 'Calculations'}
                </span>
              </div>
            </div>

            {/* ডান পাশের ক্যাটাগরি লেজেন্ড (প্রতিটির পাশে % সহ) */}
            <div className="space-y-2 pl-3">
              <h4 className="text-xs font-bold text-slate-800 mb-1">Categories</h4>
              {donutData.map((item, index) => (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between gap-3 text-[11px] font-medium p-1 rounded-lg cursor-pointer transition ${
                    activeIndex === index ? 'bg-slate-50 text-slate-950 font-bold' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-400 font-bold ml-1">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Status Banner */}
        <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-2.5 flex items-center gap-3 mt-4">
          <span className="bg-[#10b981] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
            ✓
          </span>
          <div>
            <p className="text-xs font-bold text-[#15803d]">Ended exactly as planned</p>
            <p className="text-[10px] text-[#16a34a] font-medium">Sun, 1 Des - Wed, 20 Des</p>
          </div>
        </div>
      </div>

      {/* ডান পাশের কার্ড: ট্রেন্ড বার চার্ট */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Financial Trends (Income vs Expense)</h2>
            <p className="text-[11px] text-slate-400">Monthly breakdown of collected revenue and logged expenses</p>
          </div>
          <span className="text-slate-400 text-sm font-black cursor-pointer hover:text-slate-600 transition">•••</span>
        </div>
           {/* /*{bar Chart----------------}/* */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={65} // পর্যাপ্ত জায়গা রাখা হলো যাতে লেখা কেটে না যায়
                tickFormatter={(val) => {
                  if (val >= 1000) return `৳${(val / 1000).toFixed(0)}k`;
                  return `৳${val}`;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                }}
                formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, '']}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                iconType="circle"
              />
              
              {/* স্মুথ লোডিং অ্যানিমেশনসহ বার */}
              <Bar
                dataKey="Expense"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                barSize={20}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="Income"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                barSize={20}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}