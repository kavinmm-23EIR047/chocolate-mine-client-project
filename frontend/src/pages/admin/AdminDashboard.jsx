import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  Package,
  TrendingUp,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGoogleReviews } from '../../hooks/useGoogleReviews';
import adminService from '../../services/adminService';
import analyticsService from '../../services/analyticsService';
import { formatCurrency } from '../../utils/helpers';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import SocialMediaDashboard from '../../components/admin/SocialMediaDashboard';
import toast from 'react-hot-toast';

const statCards = [
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
  { key: 'revenue', label: 'Revenue', icon: DollarSign, color: 'from-emerald-500 to-emerald-600', isCurrency: true },
  { key: 'pendingOrders', label: 'Pending', icon: Clock, color: 'from-amber-500 to-amber-600' },
  { key: 'deliveredOrders', label: 'Delivered', icon: CheckCircle, color: 'from-green-500 to-green-600' },
  { key: 'totalUsers', label: 'Customers', icon: Users, color: 'from-purple-500 to-purple-600' },
  { key: 'totalProducts', label: 'Products', icon: Package, color: 'from-rose-500 to-rose-600' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [exporting, setExporting] = useState(false);
  const { stats: googleReviewsStats } = useGoogleReviews({ type: 'stats' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, analyticsRes] = await Promise.all([
          adminService.getDashboard(),
          analyticsService.getDashboard(timeRange).catch(() => null),
        ]);
        setStats(dashRes.data.data);
        if (analyticsRes) setAnalytics(analyticsRes.data.data);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  if (loading) return <DashboardSkeleton />;

  const chartData = analytics?.salesChart || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading">Dashboard Overview</h2>
          <p className="text-muted text-sm mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            try {
              setExporting(true);
              const response = await adminService.downloadMasterExport();
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Master_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              toast.success('Export downloaded successfully!');
            } catch (err) {
              console.error(err);
              toast.error('Failed to download export');
            } finally {
              setExporting(false);
            }
          }}
          disabled={exporting}
          className="flex items-center gap-2 bg-primary text-primary-content px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} />
          {exporting ? 'Exporting...' : 'Export All Data'}
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-black text-heading">
              {card.isCurrency ? formatCurrency(stats?.[card.key] || 0) : (stats?.[card.key] || 0)}
            </p>
            <p className="text-xs text-muted font-medium mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Google Reviews Summary */}
      {googleReviewsStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
            <p className="text-sm text-muted font-medium">Google Average</p>
            <p className="text-3xl font-black text-heading mt-2">{googleReviewsStats.averageRating} ⭐</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
            <p className="text-sm text-muted font-medium">Total Google Reviews</p>
            <p className="text-3xl font-black text-heading mt-2">{googleReviewsStats.totalReviews}</p>
          </div>
        </motion.div>
      )}

      {/* Sales Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-heading">Sales Overview</h3>
              <p className="text-sm text-muted">Revenue trend analysis</p>
            </div>
            <div className="flex items-center gap-3">
               <select 
                 value={timeRange} 
                 onChange={(e) => setTimeRange(e.target.value)}
                 className="text-xs font-black text-heading uppercase tracking-widest bg-card border border-border px-3 py-1.5 rounded-lg outline-none cursor-pointer"
               >
                 <option value="7days" className="bg-card text-heading">Last 7 Days</option>
                 <option value="30days" className="bg-card text-heading">Last 30 Days</option>
                 <option value="month" className="bg-card text-heading">Last Month</option>
                 <option value="year" className="bg-card text-heading">Last Year</option>
                 <option value="all" className="bg-card text-heading">All Time</option>
               </select>
              <div className="flex items-center gap-2 text-success text-sm font-bold bg-success/10 px-3 py-1.5 rounded-lg">
                <TrendingUp size={16} />
                <span>Active</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
              <XAxis dataKey="date" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} dx={-10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
                cursor={{ fill: 'var(--border)', opacity: 0.2 }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Payment Stats */}
      {analytics?.payments && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Successful', value: analytics.payments.successful, color: 'text-success' },
            { label: 'Pending', value: analytics.payments.pending, color: 'text-yellow-500' },
            { label: 'Failed', value: analytics.payments.failed, color: 'text-error' },
            { label: 'Refunded', value: analytics.payments.refunded, color: 'text-purple-500' },
          ].map((p) => (
            <div key={p.label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className={`text-3xl font-black ${p.color}`}>{p.value}</p>
              <p className="text-xs text-muted font-medium mt-1">{p.label} Payments</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Revenue Summary */}
      {analytics?.revenue && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 rounded-2xl p-6">
            <p className="text-sm text-muted font-medium">Total Revenue</p>
            <p className="text-3xl font-black text-heading mt-2">{formatCurrency(analytics.revenue.totalRevenue)}</p>
            <div className="flex items-center gap-1 mt-2 text-success text-sm">
              <ArrowUpRight size={16} />
              <span className="font-medium">All time earnings</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
            <p className="text-sm text-muted font-medium">Monthly Revenue</p>
            <p className="text-3xl font-black text-heading mt-2">{formatCurrency(analytics.revenue.monthlyRevenue)}</p>
            <div className="flex items-center gap-1 mt-2 text-blue-500 text-sm">
              <ArrowUpRight size={16} />
              <span className="font-medium">This month</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Social Media & Analytics Dashboard */}
      <SocialMediaDashboard />
    </div>
  );
};

export default AdminDashboard;
