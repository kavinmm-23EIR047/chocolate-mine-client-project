import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, PieChart as PieChartIcon, Calendar, 
  ArrowUpRight, ArrowDownRight, IndianRupee, Users, ShoppingBag, Activity, ChevronDown
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import { formatCurrency } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#D4A017', '#7A4A44', '#3D1F1A', '#B99E98', '#E5D1CD'];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await analyticsService.getDashboard(timeRange);
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  if (loading) return <div className="space-y-8"><TableSkeleton rows={10} cols={4} /></div>;

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(data?.revenue?.totalRevenue || 0), icon: IndianRupee, trend: '+12.5%', isUp: true },
    { label: 'Total Orders', value: data?.ordersCount || 0, icon: ShoppingBag, trend: '+8.2%', isUp: true },
    { label: 'Active Users', value: data?.usersCount || 0, icon: Users, trend: '-2.4%', isUp: false },
    { label: 'Avg Order Value', value: formatCurrency(data?.revenue?.avgOrderValue || 0), icon: TrendingUp, trend: '+5.1%', isUp: true },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-4 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-xs font-black text-muted uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-bold text-heading">
              {entry.name}: <span className="text-primary">{entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading">Analytics Dashboard</h2>
          <p className="text-sm text-muted">Deep dive into your business performance</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-xl">
           <Calendar size={16} className="text-muted" />
           <select 
             value={timeRange} 
             onChange={(e) => setTimeRange(e.target.value)}
             className="text-xs font-black text-heading uppercase tracking-widest bg-transparent outline-none cursor-pointer"
           >
             <option value="7days" className="bg-card text-heading">Last 7 Days</option>
             <option value="30days" className="bg-card text-heading">Last 30 Days</option>
             <option value="month" className="bg-card text-heading">Last Month</option>
             <option value="year" className="bg-card text-heading">Last Year</option>
             <option value="all" className="bg-card text-heading">All Time</option>
           </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center">
                  <stat.icon size={24} />
               </div>
               <div className={`flex items-center gap-1 text-xs font-black ${stat.isUp ? 'text-success' : 'text-error'}`}>
                  {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
               </div>
            </div>
            <p className="text-xs font-black text-muted uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-heading">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-8">
           <h3 className="font-black text-heading uppercase tracking-widest text-sm">Revenue Trend</h3>
           <Activity size={18} className="text-muted" />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.salesChart || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.2 }} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Popular Products */}
         <div className="lg:col-span-2 card-premium overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
               <h3 className="font-black text-heading uppercase tracking-widest text-sm">Top Selling Products</h3>
               <BarChart3 size={18} className="text-muted" />
            </div>
            <div className="p-0 flex-1 overflow-x-auto overflow-y-hidden">
               <>
               {/* Desktop Table */}
               <table className="hidden md:table w-full min-w-[500px]">
                  <thead className="bg-border/20">
                     <tr>
                        <th className="text-left px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Product</th>
                        <th className="text-left px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Category</th>
                        <th className="text-left px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Sales</th>
                        <th className="text-right px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Revenue</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                     {(data?.topProducts || []).map((p, i) => (
                       <tr key={i} className="hover:bg-border/10 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs shrink-0">🍰</div>
                                <span className="font-bold text-heading text-sm break-words">{p.name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-muted uppercase">{p.category}</td>
                          <td className="px-6 py-4 font-black text-sm">{p.salesCount}</td>
                          <td className="px-6 py-4 text-right font-black text-primary">{formatCurrency(p.revenue)}</td>
                       </tr>
                     ))}
                     {(!data?.topProducts || data?.topProducts.length === 0) && (
                       <tr>
                         <td colSpan="4" className="px-6 py-8 text-center text-muted font-bold text-sm">
                           No sales data available
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>

               {/* Mobile Accordion */}
               <div className="md:hidden flex flex-col gap-2 p-4">
                 {(data?.topProducts || []).map((p, i) => (
                   <details key={`mobile-top-${i}`} className="bg-card border border-border rounded-xl overflow-hidden group">
                     <summary className="p-4 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-border/5">
                       <div className="flex items-center gap-3 w-full pr-4">
                         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs shrink-0">🍰</div>
                         <div className="min-w-0">
                           <p className="font-bold text-heading text-sm break-words">{p.name}</p>
                           <p className="text-[10px] font-bold text-muted uppercase mt-0.5 break-words">{p.category}</p>
                         </div>
                       </div>
                       <ChevronDown size={20} className="text-muted group-open:rotate-180 transition-transform shrink-0" />
                     </summary>
                     
                     <div className="px-4 pb-4 pt-1 space-y-3 bg-border/5">
                       <div className="h-px w-full bg-border/50 mb-3" />
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-muted uppercase tracking-widest">Sales</span>
                         <span className="font-black text-sm">{p.salesCount}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-muted uppercase tracking-widest">Revenue</span>
                         <span className="font-black text-primary">{formatCurrency(p.revenue)}</span>
                       </div>
                     </div>
                   </details>
                 ))}
                 {(!data?.topProducts || data?.topProducts.length === 0) && (
                   <div className="text-center py-8 text-muted font-bold text-sm">
                     No sales data available
                   </div>
                 )}
               </div>
               </>
            </div>
         </div>

         {/* Sales by Category */}
         <div className="card-premium p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-black text-heading uppercase tracking-widest text-sm">Category Split</h3>
               <PieChartIcon size={18} className="text-muted" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
              {data?.categorySplit && data.categorySplit.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.categorySplit}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                    >
                      {data.categorySplit.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value, entry) => (
                        <span className="text-xs font-black uppercase tracking-widest text-heading ml-1">
                          {entry.payload.name} ({entry.payload.percentage}%)
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted font-bold text-sm">No category data</p>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
