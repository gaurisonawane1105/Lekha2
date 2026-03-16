import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { BookOpen, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import GuideProjects from './guide/GuideProjects';
import GuideVerifications from './guide/GuideVerifications';

const GuideDashboard = () => {
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
          Guide Dashboard
        </h1>
        <p className="text-slate-600">Monitor and verify student submissions</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Projects"
            value={stats?.total_projects || 0}
            icon={BookOpen}
            description="Assigned to you"
          />
          <StatCard
            title="Pending Files"
            value={stats?.pending_file_verifications || 0}
            icon={FileText}
            description="Awaiting verification"
          />
          <StatCard
            title="Pending Meetings"
            value={stats?.pending_meeting_verifications || 0}
            icon={Calendar}
            description="Awaiting verification"
          />
        </div>
      )}
    </div>
  );

  return (
    <Layout role="Guide">
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/projects" element={<GuideProjects />} />
        <Route path="/verifications" element={<GuideVerifications />} />
      </Routes>
    </Layout>
  );
};

export default GuideDashboard;
