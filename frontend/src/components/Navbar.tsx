import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { LogOut, User as UserIcon, Settings, Moon, Sun, MessageCircle, GraduationCap, Bell, Image as ImageIcon } from 'lucide-react';
import { InstallPWAButton } from './InstallPWAButton';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md transition-colors duration-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg overflow-hidden">
                {!imageError ? (
                  <img 
                    src="https://www.satyug.edu.in/wp-content/uploads/2023/05/SDIET-Logo-1.png" 
                    alt="SDIET Logo" 
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.src === 'https://www.satyug.edu.in/wp-content/uploads/2023/05/SDIET-Logo-1.png') {
                        img.src = 'https://www.satyug.edu.in/wp-content/uploads/2019/04/logo.png';
                      } else {
                        setImageError(true);
                      }
                    }}
                  />
                ) : (
                  <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div className="flex flex-col leading-[0.8]">
                <span className="text-2xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">SDIET</span>
                <span className="text-[10px] uppercase tracking-[0.4em] font-extrabold text-gray-400 dark:text-gray-500 ml-0.5">Learner</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <InstallPWAButton />
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-80 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 transform origin-top sm:origin-top-right transition-all z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n._id}
                            onClick={() => {
                              markAsRead(n._id);
                              if (n.type === 'REMINDER_CREATED' || n.type === 'REMINDER_UPDATED' || n.reminderId) {
                                navigate('/reminders');
                              } else if (n.subjectId) {
                                // If it's an object, get _id, else it's a string
                                const sid = typeof n.subjectId === 'object' && n.subjectId !== null ? n.subjectId._id : n.subjectId;
                                navigate(`/subject/${sid}`);
                              }
                              setIsNotificationsOpen(false);
                            }}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 ${!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                          >
                            <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    {user.email ? user.email.charAt(0).toUpperCase() : user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block font-medium">{user.name}</span>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 transform origin-top-right transition-all">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 sm:hidden">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link 
                      to="/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <UserIcon className="w-4 h-4 mr-2" /> Profile
                    </Link>
                    {(user.role === 'TEACHER' || user.role === 'SUPER_ADMIN') && (
                      <>
                        <Link 
                          to="/doubts" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" /> Doubts
                        </Link>
                        <Link 
                          to="/students" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <GraduationCap className="w-4 h-4 mr-2" /> Students
                        </Link>
                      </>
                    )}
                    {user.role === 'SUPER_ADMIN' && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-4 h-4 mr-2" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm sm:text-base">
                  Login
                </Link>
                <Link to="/register" className="bg-indigo-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
