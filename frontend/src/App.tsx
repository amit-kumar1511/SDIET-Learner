/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotesPage from './pages/NotesPage';
import SubjectPage from './pages/SubjectPage';
import EventsPage from './pages/EventsPage';
import NoticesPage from './pages/NoticesPage';
import RemindersPage from './pages/RemindersPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import DoubtsPage from './pages/DoubtsPage';
import AchievementsPage from './pages/AchievementsPage';
import CareerGuidancePage from './pages/CareerGuidancePage';
import StudentPlansPage from './pages/StudentPlansPage';
import CreatePlanPage from './pages/CreatePlanPage';
import StudentsPage from './pages/StudentsPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 1500,
              style: {
                borderRadius: '1rem',
                fontSize: '14px',
                fontWeight: '600',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="subject/:id" element={<SubjectPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="notices" element={<NoticesPage />} />
                <Route path="reminders" element={<RemindersPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="gallery" element={<AchievementsPage />} />
                <Route path="career" element={<CareerGuidancePage />} />
                <Route path="career/category/:categoryId" element={<CareerGuidancePage />} />
                <Route path="career/category/:categoryId/guide/:guideId" element={<CareerGuidancePage />} />
              </Route>

              {/* Student Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route path="student-plans" element={<StudentPlansPage />} />
                <Route path="student-plans/create-plan" element={<CreatePlanPage />} />
              </Route>

              {/* Admin Only Routesg */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TEACHER']} />}>
                <Route path="doubts" element={<DoubtsPage />} />
                <Route path="students" element={<StudentsPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
