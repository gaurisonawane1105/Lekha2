import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { FileText, Calendar, CheckCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import FilesPage from './student/FilesPage';
import MeetingsPage from './student/MeetingsPage';

const StudentDashboard = () => {
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
          Student Dashboard
        </h1>
        <p className="text-slate-600">Manage your project submissions and meetings</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : stats?.group_info ? (
        <>
          {/* Project Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-1" data-testid="project-name">
                  {stats.group_info.group_name}
                </h3>
                <p className="text-slate-600 mb-2" data-testid="project-topic">
                  {stats.group_info.project_topic}
                </p>
                <p className="text-sm text-slate-500">
                  Guide: <span className="font-medium text-slate-700">{stats.group_info.guide_name || 'Not assigned'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Files"
              value={stats.total_files}
              icon={FileText}
              description="Uploaded documents"
            />
            <StatCard
              title="Verified Files"
              value={stats.verified_files}
              icon={CheckCircle}
              description="Approved by guide"
            />
            <StatCard
              title="Total Meetings"
              value={stats.total_meetings}
              icon={Calendar}
              description="Logged meetings"
            />
            <StatCard
              title="Verified Meetings"
              value={stats.verified_meetings}
              icon={CheckCircle}
              description="Approved logs"
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Group Assigned</h3>
          <p className="text-slate-600">You haven't been assigned to a project group yet.</p>
        </div>
      )}
    </div>
  );

  return (
    <Layout role="Student">
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
      </Routes>
    </Layout>
  );
};

export default StudentDashboard;
