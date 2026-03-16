import React, { useState, useEffect } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const AllProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading tracking-tight text-slate-900 mb-2" data-testid="all-projects-title">
          All Projects
        </h1>
        <p className="text-slate-600">Overview of all ongoing projects</p>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Projects</h3>
          <p className="text-slate-600">No projects have been created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.group_id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow" data-testid={`project-card-${project.group_id}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {project.group_name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-2">{project.project_topic}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-600">
                  <span className="font-medium">Guide:</span> {project.guide_name || 'Not assigned'}
                </p>
                <p className="text-slate-500">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProjects;
