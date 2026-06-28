import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import StudentChatbot from '../components/StudentChatbot';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      {isLandingPage ? (
        <main className="w-full">
          <Outlet />
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">
          <Outlet />
        </main>
      )}
      {/* Show bottom nav only when user is logged in & not on landing page */}
      {user && !isLandingPage && <MobileBottomNav />}

      {/* Student-only Academic Resource Assistant Chatbot */}
      {user && user.role === 'STUDENT' && location.pathname === '/dashboard' && <StudentChatbot />}
    </div>
  );
};

export default MainLayout;
