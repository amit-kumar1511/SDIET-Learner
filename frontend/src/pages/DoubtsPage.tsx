import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Send, User as UserIcon, CheckCheck, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const BRANCHES = ['BTECH', 'BBA', 'BCA', 'MBA', 'MCA', 'BCOM', 'MTECH', 'DIPLOMA'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const DoubtsPage = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(
    user?.role === 'TEACHER' && user?.authorizedBranches?.length 
      ? user.authorizedBranches[0] 
      : user?.branch || 'BTECH'
  );
  const [selectedSemester, setSelectedSemester] = useState(
    user?.role === 'TEACHER' && user?.authorizedSemesters?.length 
      ? user.authorizedSemesters[0] 
      : user?.semester || 1
  );
  
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSubjects();
    setSelectedSubject(null);
  }, [selectedBranch, selectedSemester, user]);

  useEffect(() => {
    if (selectedSubject) {
      fetchChats();
      const interval = setInterval(fetchChats, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedSubject]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const fetchSubjects = async () => {
    try {
      let url = '/api/subjects';
      if (user?.role === 'SUPER_ADMIN') {
        url += `?branch=${selectedBranch}&semester=${selectedSemester}`;
      }
      const { data } = await axios.get(url);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load subjects');
      setSubjects([]);
    }
  };

  const fetchChats = async () => {
    if (!selectedSubject) return;
    try {
      const { data } = await axios.get(`/api/chats/${selectedSubject._id}`);
      setChats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = newMessage.trim();
    if (!messageToSend) return;

    // Reset input immediately for instant feedback
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

    // Optimistic Update
    const tempId = Date.now().toString();
    const optimisticChat = {
      _id: tempId,
      senderRole: user?.role === 'STUDENT' ? 'STUDENT' : 'TEACHER',
      message: messageToSend,
      createdAt: new Date().toISOString(),
      studentId: user?.role === 'STUDENT' ? { _id: user._id, name: user.name } : fallbackStudentData,
      teacherId: (user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN') ? { _id: user._id, name: user.name } : null,
      isRead: false,
      isOptimistic: true 
    };

    setChats(prev => [...prev, optimisticChat]);

    try {
      await axios.post('/api/chats', {
        subjectId: selectedSubject._id,
        message: messageToSend,
        studentId,
      });
      // After success, sync with server
      fetchChats();
    } catch (error: any) {
      // Rollback optimistic update on error
      setChats(prev => prev.filter(chat => chat._id !== tempId));
      setNewMessage(messageToSend); // Put message back in input for retry
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Doubts</h1>
      </div>

      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
            <Filter className="w-5 h-5" />
            <h2 className="text-lg font-bold">Admin Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Select Branch
              </label>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map(branch => (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedBranch === branch
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Select Semester
              </label>
              <div className="flex flex-wrap gap-2">
                {SEMESTERS.map(sem => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedSemester === sem
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'TEACHER' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
          <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
             Showing doubts for your explicitly assigned subjects.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subjects</h2>
          <div className="space-y-2">
            {subjects.map(subject => (
              <button
                key={subject._id}
                onClick={() => setSelectedSubject(subject)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selectedSubject?._id === subject._id
                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800'
                    : 'bg-white border-gray-100 hover:border-indigo-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-indigo-900'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{subject.name}</div>
              </button>
            ))}
            {subjects.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No subjects found.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedSubject ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Doubts for {selectedSubject.name}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chats.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No doubts asked yet.
                  </div>
                ) : (
                  chats.map((chat, idx) => (
                    <div key={idx} className={`flex flex-col ${chat.senderRole === 'STUDENT' ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {chat.senderRole === 'STUDENT' ? chat.studentId?.name : chat.teacherId?.name || 'Teacher'}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          {format(new Date(chat.createdAt), 'HH:mm')}
                          {chat.senderRole === 'STUDENT' && user?.role === 'STUDENT' && (
                            <CheckCheck 
                              className={`w-4 h-4 ml-0.5 ${chat.isRead ? 'text-blue-500' : 'text-gray-400'}`} 
                              strokeWidth={3}
                            />
                          )}
                        </span>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                        chat.senderRole === 'STUDENT'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
                          : 'bg-indigo-600 text-white rounded-tr-none'
                      }`}>
                        {chat.message}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-gray-700 flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Reply to the latest doubt..."
                  className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[600px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a subject to view doubts
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoubtsPage;
