import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Bell, 
  MessageCircle, 
  ChevronRight, 
  GraduationCap, 
  Briefcase,
  Trophy,
  ArrowRight,
  ListTodo,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'motion/react';

const Dashboard = () => {
  const { user } = useAuth();
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    materials: 12,
    doubts: 8,
    events: 5,
    achievements: 14,
    pendingReminders: 3
  });

  useEffect(() => {
    if (user?.role === 'TEACHER') {
      fetchAssignedSubjects();
    }
    fetchStats();
  }, [user]);

  const fetchAssignedSubjects = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`/api/assignments/teacher/${user?._id}`);
      const sorted = (data || []).sort((a: any, b: any) => a.semester - b.semester);
      setAssignedSubjects(sorted);
    } catch (error) {
      console.error('Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const eventsRes = await axios.get('/api/info/events');
      const achievementsRes = await axios.get('/api/achievements');
      const remindersRes = await axios.get('/api/reminders');
      
      setStats(prev => ({
        ...prev,
        events: Array.isArray(eventsRes.data) ? eventsRes.data.length : prev.events,
        achievements: achievementsRes.data?.count || (Array.isArray(achievementsRes.data?.achievements) ? achievementsRes.data.achievements.length : prev.achievements),
        pendingReminders: Array.isArray(remindersRes.data) ? remindersRes.data.length : prev.pendingReminders
      }));
    } catch (err) {
      console.error('Failed to fetch counts, using default values', err);
    }
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* AI Teacher Banner */}
      <div className="bg-gradient-to-r from-[#e2dcfe] to-[#f4f2ff] dark:from-[#2a175c] dark:to-[#171133] rounded-[2rem] shadow-sm relative overflow-hidden p-8 border border-[#dcd6ff] dark:border-[#382673]">
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="font-extrabold text-2xl sm:text-3xl text-[#2b1875] dark:text-[#c7d2fe] tracking-tight">AI Teacher Session</h2>
            <p className="text-sm sm:text-base text-[#5b21b6] dark:text-[#a5b4fc] font-medium max-w-2xl leading-relaxed">
              Your personal AI mentor for doubt solving, notes, MCQs, and more.
            </p>
          </div>
          <div>
            <Link 
              to="/ai-teacher" 
              className="inline-flex items-center space-x-2 bg-white text-[#6366f1] px-6 py-3 rounded-full font-bold text-sm shadow-md hover:bg-slate-50 transition-all active:scale-95"
            >
              <span>Start Session</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5-6 Action Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Materials Card */}
        <Link to="/notes" className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[220px] relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Materials</h3>
              <p className="hidden md:block text-sm text-gray-500 mt-1 leading-relaxed max-w-[180px]">Access your lecture notes, PYQs & more</p>
            </div>
          </div>
          <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors mt-6" />
          <img src="/books-3d.png" alt="Books" className="hidden md:block absolute bottom-4 right-4 w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none" />
        </Link>

        {/* Student Todo / Plan Notes Card */}
        {(user?.role?.toUpperCase() === 'STUDENT' || user?.role?.toUpperCase() === 'USER') && (
          <Link to="/student-plans" className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[220px] relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Student Todo / Plan Notes</h3>
                <p className="hidden md:block text-sm text-gray-500 mt-1 leading-relaxed max-w-[180px]">Organize your study plans, goals, and todo targets</p>
              </div>
            </div>
            <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors mt-6" />
          </Link>
        )}

        {/* Announcements Card */}
        <Link to="/notices" className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[220px] relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Announcements</h3>
              <p className="hidden md:block text-sm text-gray-500 mt-1 leading-relaxed max-w-[180px]">Stay updated with the latest college circulars & notices</p>
            </div>
          </div>
          <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors mt-6" />
        </Link>

        {/* Doubts Card (Visible only to teachers and admins) */}
        {user?.role !== 'STUDENT' && (
          <Link to="/doubts" className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[220px] relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Doubts</h3>
                <p className="hidden md:block text-sm text-gray-500 mt-1 leading-relaxed max-w-[180px]">Ask questions and get answers from peers and mentors</p>
              </div>
            </div>
            <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-pink-600 transition-colors mt-6" />
            <img src="/chat-3d.png" alt="Chat" className="hidden md:block absolute bottom-4 right-4 w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none" />
          </Link>
        )}

        {/* Upcoming Events Card */}
        <Link to="/events" className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[220px] relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Upcoming Events</h3>
              <p className="hidden md:block text-sm text-gray-500 mt-1 leading-relaxed max-w-[180px]">Don't miss out on college festivals & seminars</p>
            </div>
          </div>
          <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors mt-6" />
          <img src="/calendar-3d.png" alt="Calendar" className="hidden md:block absolute bottom-4 right-4 w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none" />
        </Link>

        {/* Achievement Gallery Card */}
        <Link to="/gallery" className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[220px] relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Achievement Gallery</h3>
              <p className="hidden md:block text-sm text-gray-500 mt-1 leading-relaxed max-w-[180px]">Glance at our institutional milestones and success</p>
            </div>
          </div>
          <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors mt-6" />
          <img src="/trophy-3d.png" alt="Trophy" className="hidden md:block absolute bottom-4 right-4 w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none" />
        </Link>

        {/* Career Guidance Card */}
        <Link to="/career" className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[220px] relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Career Guidance</h3>
              <p className="hidden md:block text-sm text-gray-500 mt-1 leading-relaxed max-w-[180px]">Explore branch-wise career paths & professional roadmaps</p>
            </div>
          </div>
          <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors mt-6" />
          <img src="/signpost-3d.png" alt="Signpost" className="hidden md:block absolute bottom-4 right-4 w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none" />
        </Link>

        {/* Reminders Card */}
        <Link to="/reminders" className="col-span-2 md:col-span-1 group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[220px] relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Reminders</h3>
              <p className="hidden md:block text-sm text-gray-500 mt-1 leading-relaxed max-w-[180px]">Important tasks and deadlines to complete</p>
            </div>
          </div>
          <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors mt-6" />
          <img src="/bell-3d.png" alt="Bell" className="hidden md:block absolute bottom-4 right-4 w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none" />
        </Link>
      </div>

      {/* Bottom Pending Tasks Bar */}
      <div className="bg-violet-50 dark:bg-violet-950/20 rounded-3xl p-6 border border-violet-100 dark:border-violet-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 dark:text-white text-base">
              You have {stats.pendingReminders} {stats.pendingReminders === 1 ? 'task' : 'tasks'} pending
            </h4>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">Complete your tasks and stay ahead.</p>
          </div>
        </div>
        <Link 
          to="/reminders" 
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-full font-bold flex items-center justify-center space-x-2 text-sm shadow-md transition-all active:scale-95"
        >
          <span>View Reminders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Teacher Specific: Assigned Subjects Section */}
      {user?.role === 'TEACHER' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-transparent">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <GraduationCap className="w-5 h-5 mr-3 text-indigo-600" />
              Your Assigned Subjects
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center">
                    <Skeleton className="w-10 h-10 rounded-lg mr-4" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : assignedSubjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedSubjects.map((assignment) => (
                  <Link 
                    key={assignment._id}
                    to={`/subject/${assignment.subjectId?._id}`}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex items-center group"
                  >
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm">
                        {assignment.subjectId?.name}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-2">{assignment.branch}</span>
                        <span>Sem {assignment.semester}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 ml-2" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <GraduationCap className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Subjects Assigned</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-xs mx-auto">
                  Please contact the administrator to assign subjects for your account.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
