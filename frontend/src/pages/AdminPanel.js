import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { BookOpen, Users, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import AdminUsers from './admin/AdminUsers';
import AdminProjects from './admin/AdminProjects';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const DashboardHome = () => (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-heading tracking-tight text-slate-900 mb-2" data-testid="dashboard-title">
          Admin Panel
        </h1>
        <p className="text-slate-600">System administration and management</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Projects"
            value={stats?.total_projects || 0}
            icon={BookOpen}
          />
          <StatCard
            title="Students"
            value={stats?.total_students || 0}
            icon={Users}
          />
          <StatCard
            title="Guides"
            value={stats?.total_guides || 0}
            icon={Users}
          />
          <StatCard
            title="Files"
            value={stats?.total_files || 0}
            icon={FileText}
          />
          <StatCard
            title="Meetings"
            value={stats?.total_meetings || 0}
            icon={Calendar}
          />
        </div>
      )}
    </div>
  );

  return (
    <Layout role="Admin">
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/projects" element={<AdminProjects />} />
        <Route path="/settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p className="text-slate-600 mt-2">Settings page coming soon...</p></div>} />
      </Routes>
    </Layout>
  );
};

export default AdminPanel;
