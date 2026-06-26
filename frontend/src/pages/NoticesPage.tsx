import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bell, Download, Plus, Eye, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { showConfirm } from '../lib/confirm';
import { Skeleton } from '../components/ui/Skeleton';
import { format } from 'date-fns';
import { getDownloadUrl, getViewerUrl } from '../lib/cloudinary';
import PDFViewerModal from '../components/PDFViewerModal';

const NoticesPage = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', description: '', file: null as File | null });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/info/notices');
      setNotices(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load notices');
      setNotices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      message: 'Are you sure you want to delete this notice?',
      confirmText: 'Delete Notice',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/info/notices/${id}`);
          fetchNotices();
        } catch (error) {
          toast.error('Failed to delete notice');
        }
      }
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    if (uploadData.file) formData.append('attachment', uploadData.file);

    setIsUploading(true);
    setUploadProgress(0);

    // Smoothly animate progress up to 95%
    let progressVal = 0;
    const progressInterval = setInterval(() => {
      progressVal += Math.random() * 12 + 3; // increment by 3-15%
      if (progressVal >= 95) {
        progressVal = 95;
        clearInterval(progressInterval);
      }
      setUploadProgress(Math.round(progressVal));
    }, 150);

    try {
      await axios.post('/api/info/notices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Wait 600ms so the user can see 100% upload complete status
      await new Promise((resolve) => setTimeout(resolve, 600));

      toast.success('Notice created');
      setIsModalOpen(false);
      setUploadData({ title: '', description: '', file: null });
      fetchNotices();
    } catch (error: any) {
      clearInterval(progressInterval);
      toast.error(error.response?.data?.message || 'Failed to create notice');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notices</h1>
        {(user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Notice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
              </div>
            </div>
          ))
        ) : (
          notices.map(notice => (
          <div key={notice._id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/50 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{notice.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(notice.createdAt), 'MMMM d, yyyy')} • By {notice.createdBy?.name}
                  </p>
                </div>
              </div>
              {notice.attachmentUrl && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingPdf({ url: notice.attachmentUrl, title: notice.title })}
                    title="View"
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <a
                    href={getDownloadUrl(notice.attachmentUrl)}
                    download
                    title="Download"
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER' || user?._id === notice.createdBy?._id) && (
                    <button
                      onClick={() => handleDelete(notice._id)}
                      title="Delete"
                      className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              {(!notice.attachmentUrl && (user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER' || user?._id === notice.createdBy?._id)) && (
                <button
                  onClick={() => handleDelete(notice._id)}
                  title="Delete"
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{notice.description}</p>
          </div>
        ))
        )}
        {!isLoading && notices.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No notices found.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Add Notice</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {!isUploading ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachment (Optional)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="cursor-pointer flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-indigo-200 border-dashed rounded-xl bg-indigo-50/50 hover:bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 transition-colors">
                          <span className="text-sm font-semibold">Select PDF</span>
                          <span className="text-xs text-indigo-500/.70 mt-1 hidden sm:block">.pdf documents</span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setUploadData({ ...uploadData, file: e.target.files[0] });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <label className="cursor-pointer flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-emerald-200 border-dashed rounded-xl bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-colors">
                          <span className="text-sm font-semibold">Select Image</span>
                          <span className="text-xs text-emerald-500/.70 mt-1 hidden sm:block">.jpg, .png, etc</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setUploadData({ ...uploadData, file: e.target.files[0] });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    {uploadData.file && (
                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
                        <div>
                          Selected: <span className="font-semibold text-gray-900 dark:text-white">{uploadData.file.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setUploadData({ ...uploadData, file: null })}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </>
              ) : (
                uploadProgress !== null && (
                  <div className="space-y-4 py-8">
                    <div className="flex justify-between text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      <span>
                        {uploadProgress === 100 
                          ? 'Upload complete!' 
                          : uploadProgress === 95 
                          ? 'Processing on server...' 
                          : 'Uploading file...'}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-150 ${
                          uploadProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </form>
          </div>
        </div>
      )}
      {/* PDF Viewer */}
      {viewingPdf && (
        <PDFViewerModal
          url={viewingPdf.url}
          title={viewingPdf.title}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
  );
};

export default NoticesPage;
