import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import api from '../../utils/api';

const MeetingsPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    meet_date: '',
    topic: '',
    suggestions: '',
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.group_id) {
      fetchMeetings();
    } else {
      setLoading(false);
    }
  }, [user.group_id]);

  const fetchMeetings = async () => {
    try {
      const response = await api.get(`/api/meetings/group/${user.group_id}`);
      setMeetings(response.data);
    } catch (error) {
      toast.error('Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/meetings', {
        ...formData,
        group_id: user.group_id,
      });
      toast.success('Meeting log added successfully');
      setIsDialogOpen(false);
      setFormData({ meet_date: '', topic: '', suggestions: '' });
      fetchMeetings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add meeting');
    }
  };

  if (!user.group_id) {
    return (
      <div className="p-8">
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Group Assigned</h3>
          <p className="text-slate-600">You need to be assigned to a project group first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-slate-900 mb-2" data-testid="meetings-title">
            Meeting Logs
          </h1>
          <p className="text-slate-600">Track your guide meetings and discussions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-meeting-button">
              <Plus size={16} />
              Add Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meeting Log</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meet_date">Meeting Date</Label>
                <Input
                  id="meet_date"
                  type="date"
                  value={formData.meet_date}
                  onChange={(e) => setFormData({ ...formData, meet_date: e.target.value })}
                  required
                  data-testid="meeting-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="Discussion topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required
                  data-testid="meeting-topic-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suggestions">Suggestions/Notes</Label>
                <Textarea
                  id="suggestions"
                  placeholder="What was discussed and suggested..."
                  value={formData.suggestions}
                  onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                  rows={4}
                  data-testid="meeting-suggestions-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-meeting-button">
                Add Meeting Log
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-600 bg-white rounded-xl border border-slate-200">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="p-8 text-center text-slate-600 bg-white rounded-xl border border-slate-200">No meetings logged yet</div>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.meet_id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow" data-testid={`meeting-item-${meeting.meet_id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{meeting.topic}</h3>
                    <p className="text-sm text-slate-500">{new Date(meeting.meet_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {meeting.is_verified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                    <CheckCircle size={14} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-sm font-medium">
                    <Clock size={14} /> Pending
                  </span>
                )}
              </div>
              
              {meeting.suggestions && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700 mb-1">Discussion Points:</p>
                  <p className="text-sm text-slate-600">{meeting.suggestions}</p>
                </div>
              )}
              
              {meeting.comment_from_guide && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Guide's Comment:</p>
                  <p className="text-sm text-blue-700">{meeting.comment_from_guide}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;
