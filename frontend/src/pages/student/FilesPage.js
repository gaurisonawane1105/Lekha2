import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import api from '../../utils/api';

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.group_id) {
      fetchFiles();
    } else {
      setLoading(false);
    }
  }, [user.group_id]);

  const fetchFiles = async () => {
    try {
      const response = await api.get(`/api/files/group/${user.group_id}`);
      setFiles(response.data);
    } catch (error) {
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('group_id', user.group_id);

    setUploading(true);
    try {
      await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('File uploaded successfully');
      setSelectedFile(null);
      fetchFiles();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`/api/files/download/${fileId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Download failed');
    }
  };

  if (!user.group_id) {
    return (
      <div className="p-8">
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Group Assigned</h3>
          <p className="text-slate-600">You need to be assigned to a project group first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading tracking-tight text-slate-900 mb-2" data-testid="files-title">
          Project Files
        </h1>
        <p className="text-slate-600">Upload and manage your black book documents</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload New File</h2>
        <form onSubmit={handleFileUpload} className="flex gap-4">
          <Input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
            className="flex-1"
            data-testid="file-input"
          />
          <Button
            type="submit"
            disabled={uploading || !selectedFile}
            className="gap-2"
            data-testid="upload-button"
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </form>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Uploaded Files</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-600">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-slate-600">No files uploaded yet</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {files.map((file) => (
              <div key={file.file_id} className="p-6 hover:bg-slate-50 transition-colors" data-testid={`file-item-${file.file_id}`}>
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
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-1">
                      Uploaded by {file.uploaded_by_name} on {new Date(file.upload_date).toLocaleDateString()}
                    </p>
                    {file.comment_from_guide && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Guide's Comment:</p>
                        <p className="text-sm text-blue-700">{file.comment_from_guide}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDownload(file.file_id, file.file_name)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    data-testid={`download-button-${file.file_id}`}
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesPage;
