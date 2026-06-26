import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Trash2, Plus, MessageCircle, X, Send, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { showConfirm } from '../lib/confirm';
import { Skeleton } from '../components/ui/Skeleton';
import { format } from 'date-fns';
import { downloadFile, getViewerUrl } from '../lib/cloudinary';
import PDFViewerModal from '../components/PDFViewerModal';

const NOTE_TYPES = ['Notes', 'PYQ', 'Assignment', 'Task'];

const SubjectPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [subject, setSubject] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Notes');
  const [isLoadingSubject, setIsLoadingSubject] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    type: 'Notes',
    file: null as File | null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchSubjectDetails();
    fetchNotes();
  }, [id]);

  useEffect(() => {
    if (isChatOpen) {
      fetchChats();
      const interval = setInterval(fetchChats, 5000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const fetchSubjectDetails = async () => {
    setIsLoadingSubject(true);
    try {
      const { data } = await axios.get(`/api/subjects/${id}`);
      setSubject(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSubject(false);
    }
  };

  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const { data } = await axios.get(`/api/notes/subject/${id}`);
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load notes');
      setNotes([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const fetchChats = async () => {
    try {
      const { data } = await axios.get(`/api/chats/${id}`);
      setChats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return toast.error('Please select a file');

    const formData = new FormData();
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('type', uploadData.type);
    formData.append('subjectId', id!);
    formData.append('file', uploadData.file);

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
      await axios.post('/api/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Wait 600ms so the user can see 100% upload complete status
      await new Promise((resolve) => setTimeout(resolve, 600));

      toast.success('Uploaded successfully');
      setIsUploadModalOpen(false);
      setActiveTab(uploadData.type);
      setUploadData({ title: '', description: '', type: 'Notes', file: null });
      fetchNotes();
    } catch (error: any) {
      clearInterval(progressInterval);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (noteId: string) => {
    showConfirm({
      message: 'Are you sure you want to delete this content?',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/notes/${noteId}`);
          fetchNotes();
        } catch (error) {
          toast.error('Failed to delete');
        }
      }
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = newMessage.trim();
    if (!messageToSend) return;

    setNewMessage('');

    let studentId = undefined;
    let fallbackStudentData = null;

    if (user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN') {
      const lastStudentMsg = [...chats].reverse().find(c => c.senderRole === 'STUDENT');
      if (lastStudentMsg) {
        studentId = lastStudentMsg.studentId._id;
        fallbackStudentData = lastStudentMsg.studentId;
      } else {
        return toast.error('No student to reply to');
      }
    }

    const tempId = Date.now().toString();
    const optimisticChat = {
      _id: tempId,
      senderRole: user?.role === 'STUDENT' ? 'STUDENT' : 'TEACHER',
      message: messageToSend,
      createdAt: new Date().toISOString(),
      studentId: user?.role === 'STUDENT' ? { _id: user._id, name: user.name } : fallbackStudentData,
      teacherId: (user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN') ? { _id: user._id, name: user.name } : null,
      isOptimistic: true
    };

    setChats(prev => [...prev, optimisticChat]);

    try {
      await axios.post('/api/chats', {
        subjectId: id,
        message: messageToSend,
        studentId,
      });
      fetchChats();
    } catch (error: any) {
      setChats(prev => prev.filter(chat => chat._id !== tempId));
      setNewMessage(messageToSend);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const filteredNotes = notes.filter(n => n.type === activeTab);

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-full sm:w-auto">
          {isLoadingSubject ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{subject?.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{subject?.description}</p>
            </>
          )}
        </div>
        <div className="flex space-x-3 sm:space-x-4 w-full sm:w-auto">
          {user?.role === 'STUDENT' && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 p-3 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors flex-shrink-0"
              title="Ask Doubt"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          )}
          {(user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Upload
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {NOTE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === type
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingNotes ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800/50 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-3 w-2/3 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              ))
            ) : (
              filteredNotes.map(note => (
              <div key={note._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{note.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">By {note.uploadedBy?.name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingPdf({ url: note.fileUrl, title: note.title })}
                      title="View"
                      className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => downloadFile(note.fileUrl, note.title)}
                      title="Download"
                      className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    {(user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN' || user?._id === note.uploadedBy?._id) && (
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                {note.description && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{note.description}</p>
                )}
                <p className="mt-3 text-xs text-gray-400">{format(new Date(note.createdAt), 'MMM d, yyyy')}</p>
              </div>
            ))
          )}
            {!isLoadingNotes && filteredNotes.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                No {activeTab} found for this subject.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Upload Material</h2>
            <form onSubmit={handleUpload} className="space-y-4">
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
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select
                      value={uploadData.type}
                      onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload File</label>
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
                      onClick={() => setIsUploadModalOpen(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Upload
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

      {/* Chat Popup */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto w-auto sm:w-96 h-[500px] max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold">Doubt Chat</h3>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-indigo-700 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {chats.map((chat, idx) => {
              const isMe = user?.role === 'STUDENT' ? chat.senderRole === 'STUDENT' : chat.senderRole !== 'STUDENT';
              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-500 mb-1">
                    {chat.senderRole === 'STUDENT' ? chat.studentId?.name : chat.teacherId?.name}
                  </span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-tl-none'
                  }`}>
                    <p className="text-sm">{chat.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">
                    {format(new Date(chat.createdAt), 'HH:mm')}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your doubt..."
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
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

export default SubjectPage;
