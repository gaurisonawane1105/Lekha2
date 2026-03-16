import React, { useState, useEffect } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import api from '../../utils/api';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    group_name: '',
    project_topic: '',
    guide_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, guidesRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/admin/guides'),
      ]);
      setProjects(projectsRes.data);
      setGuides(guidesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/projects', formData);
      toast.success('Project created successfully');
      setIsDialogOpen(false);
      setFormData({ group_name: '', project_topic: '', guide_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create project');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-slate-900 mb-2" data-testid="admin-projects-title">
            Project Management
          </h1>
          <p className="text-slate-600">Create and manage all projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="create-project-button">
              <Plus size={16} />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group_name">Group Name</Label>
                <Input
                  id="group_name"
                  placeholder="Group A"
                  value={formData.group_name}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  required
                  data-testid="group-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_topic">Project Topic</Label>
                <Input
                  id="project_topic"
                  placeholder="AI-based System"
                  value={formData.project_topic}
                  onChange={(e) => setFormData({ ...formData, project_topic: e.target.value })}
                  required
                  data-testid="project-topic-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guide">Assign Guide</Label>
                <Select
                  value={formData.guide_id}
                  onValueChange={(value) => setFormData({ ...formData, guide_id: value })}
                >
                  <SelectTrigger data-testid="guide-select">
                    <SelectValue placeholder="Select guide" />
                  </SelectTrigger>
                  <SelectContent>
                    {guides.map((guide) => (
                      <SelectItem key={guide.user_id} value={guide.user_id.toString()}>
                        {guide.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" data-testid="submit-project-button">
                Create Project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Projects</h3>
          <p className="text-slate-600">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.group_id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow" data-testid={`admin-project-card-${project.group_id}`}>
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

export default AdminProjects;
