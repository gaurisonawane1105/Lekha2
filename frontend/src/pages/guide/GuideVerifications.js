import React, { useState, useEffect } from 'react';
import { FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import api from '../../utils/api';

const GuideVerifications = () => {
  const [files, setFiles] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [comment, setComment] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyType, setVerifyType] = useState(''); // 'file' or 'meeting'
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const projectsRes = await api.get(`/api/projects/guide/${user.user_id}`);
      const groupIds = projectsRes.data.map(p => p.group_id);
      
      const filesPromises = groupIds.map(id => api.get(`/api/files/group/${id}`));
      const meetingsPromises = groupIds.map(id => api.get(`/api/meetings/group/${id}`));
      
      const filesResults = await Promise.all(filesPromises);
      const meetingsResults = await Promise.all(meetingsPromises);
      
      const allFiles = filesResults.flatMap(r => r.data);
      const allMeetings = meetingsResults.flatMap(r => r.data);
      
      setFiles(allFiles);
      setMeetings(allMeetings);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (isVerified) => {
    try {
      if (verifyType === 'file') {
        await api.put(`/api/files/verify/${selectedItem.file_id}`, {
          is_verified: isVerified,
          comment_from_guide: comment,
        });
      } else {
        await api.put(`/api/meetings/verify/${selectedItem.meet_id}`, {
          is_verified: isVerified,
          comment_from_guide: comment,
        });
      }
      toast.success(`${verifyType === 'file' ? 'File' : 'Meeting'} ${isVerified ? 'approved' : 'rejected'} successfully`);
      setDialogOpen(false);
      setComment('');
      fetchData();
    } catch (error) {
      toast.error('Verification failed');
    }
  };

  const openVerifyDialog = (item, type) => {
    setSelectedItem(item);
    setVerifyType(type);
    setComment(item.comment_from_guide || '');
    setDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading tracking-tight text-slate-900 mb-2" data-testid="verifications-title">
          Verifications
        </h1>
        <p className="text-slate-600">Review and verify student submissions</p>
      </div>

      <Tabs defaultValue="files" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="files" data-testid="files-tab">Files ({files.filter(f => !f.is_verified).length})</TabsTrigger>
          <TabsTrigger value="meetings" data-testid="meetings-tab">Meetings ({meetings.filter(m => !m.is_verified).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">No files to verify</div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.file_id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm" data-testid={`file-verification-${file.file_id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <h3 className="font-medium text-slate-900">{file.file_name}</h3>
                        {file.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        Uploaded by {file.uploaded_by_name} on {new Date(file.upload_date).toLocaleDateString()}
                      </p>
                      {file.comment_from_guide && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">{file.comment_from_guide}</p>
                        </div>
                      )}
                    </div>
                    {!file.is_verified && (
                      <Button
                        onClick={() => openVerifyDialog(file, 'file')}
                        size="sm"
                        data-testid={`verify-file-button-${file.file_id}`}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meetings">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">No meetings to verify</div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.meet_id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm" data-testid={`meeting-verification-${meeting.meet_id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-slate-600" />
                        <h3 className="font-medium text-slate-900">{meeting.topic}</h3>
                        {meeting.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-2">
                        Date: {new Date(meeting.meet_date).toLocaleDateString()}
                      </p>
                      {meeting.suggestions && (
                        <p className="text-sm text-slate-600 mb-2">{meeting.suggestions}</p>
                      )}
                      {meeting.comment_from_guide && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">{meeting.comment_from_guide}</p>
                        </div>
                      )}
                    </div>
                    {!meeting.is_verified && (
                      <Button
                        onClick={() => openVerifyDialog(meeting, 'meeting')}
                        size="sm"
                        data-testid={`verify-meeting-button-${meeting.meet_id}`}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify {verifyType === 'file' ? 'File' : 'Meeting'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Add Comment (Optional)</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your feedback or comments..."
                rows={4}
                data-testid="verification-comment-input"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleVerify(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid="approve-button"
              >
                <CheckCircle className="mr-2" size={16} />
                Approve
              </Button>
              <Button
                onClick={() => handleVerify(false)}
                variant="destructive"
                className="flex-1"
                data-testid="reject-button"
              >
                <XCircle className="mr-2" size={16} />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuideVerifications;
