import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import adminService from '../../services/adminService';
import { DashboardSkeleton } from '../ui/Skeleton';

const SocialMediaDashboard = () => {
  const [gaData, setGaData] = useState(null);
  const [igData, setIgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        setLoading(true);
        const [gaRes, igRes] = await Promise.all([
          adminService.getGoogleAnalytics().catch(() => null),
          adminService.getInstagramStats().catch(() => null),
        ]);

        if (gaRes?.data) setGaData(gaRes.data.data);
        if (igRes?.data) setIgData(igRes.data.data);
      } catch (err) {
        setError('Failed to load social media metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchSocialData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="space-y-6 mt-8">
      <div>
        <h2 className="text-2xl font-black text-heading flex items-center gap-2">
          <Activity className="text-primary" />
          Social & Traffic Analytics
        </h2>
        <p className="text-muted text-sm mt-1">Monitor your website traffic and social media presence.</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Google Analytics Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 blur-xl"></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Globe className="text-blue-500" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-heading">Google Analytics</h3>
                <p className="text-xs text-muted">Website Traffic (Last 30 Days)</p>
              </div>
            </div>
            {!gaData?.totalUsers && (
              <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-md font-medium">Setup Required</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium mb-1">Total Users</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-heading">{formatNumber(gaData?.totalUsers || 0)}</p>
                <Users size={16} className="text-muted mb-1" />
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium mb-1">Page Views</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-heading">{formatNumber(gaData?.pageViews || 0)}</p>
                <Eye size={16} className="text-muted mb-1" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium mb-1">Active Users</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-heading">{formatNumber(gaData?.activeUsers || 0)}</p>
                <Activity size={16} className="text-success mb-1" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium mb-1">Total Sessions</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-heading">{formatNumber(gaData?.sessions || 0)}</p>
                <MousePointerClick size={16} className="text-muted mb-1" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Instagram Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-full -z-10 blur-xl"></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center p-0.5">
                <div className="bg-card w-full h-full rounded-[10px] flex items-center justify-center">
                  <FaInstagram className="text-pink-500" size={20} />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-heading">Instagram Insights</h3>
                <p className="text-xs text-muted">Account Performance</p>
              </div>
            </div>
            {!igData?.followersCount && (
              <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-md font-medium">Setup Required</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium mb-1">Followers</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-heading">{formatNumber(igData?.followersCount || 0)}</p>
                <Users size={16} className="text-muted mb-1" />
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium mb-1">Account Reach</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-heading">{formatNumber(igData?.reach || 0)}</p>
                <TrendingUp size={16} className="text-success mb-1" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium mb-1">Profile Views</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-heading">{formatNumber(igData?.profileViews || 0)}</p>
                <Eye size={16} className="text-muted mb-1" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium mb-1">Website Clicks</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-heading">{formatNumber(igData?.websiteClicks || 0)}</p>
                <MousePointerClick size={16} className="text-primary mb-1" />
              </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SocialMediaDashboard;
