import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Book, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const BRANCHES = ['BTECH', 'BBA', 'BCA', 'MBA', 'MCA', 'BCOM', 'MTECH', 'DIPLOMA'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const NotesPage = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(
    user?.role === 'STUDENT' ? user.branch : 'BTECH'
  );
  const [selectedSemester, setSelectedSemester] = useState(
    user?.role === 'STUDENT' ? user.semester : 1
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '', logoUrl: '' });

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      setSelectedBranch(user.branch || 'BTECH');
      setSelectedSemester(user.semester || 1);
    }
  }, [user]);

  useEffect(() => {
    fetchSubjects();
  }, [selectedBranch, selectedSemester, user]);

  const fetchSubjects = async () => {
    try {
      const url = user?.role === 'TEACHER' 
        ? '/api/subjects' // Controller already filters by assignments for TEACHER role
        : `/api/subjects?branch=${selectedBranch}&semester=${selectedSemester}`;
      const { data } = await axios.get(url);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load subjects');
      setSubjects([]);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/subjects', {
        ...newSubject,
        branch: selectedBranch,
        semester: selectedSemester,
      });
      toast.success('Subject created');
      setIsModalOpen(false);
      setNewSubject({ name: '', description: '', logoUrl: '' });
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to create subject');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects & Materials</h1>
      </div>

      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex flex-wrap gap-2">
            {BRANCHES.map(branch => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedBranch === branch
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SEMESTERS.map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSemester === sem
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'TEACHER' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
          <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
             Showing your explicitly assigned subjects.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map(subject => (
          <Link key={subject._id} to={`/subject/${subject._id}`} className="group block">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {subject.logoUrl ? (
                    <img src={subject.logoUrl} alt={subject.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <Book className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{subject.name}</h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm flex-grow line-clamp-3">{subject.description}</p>
            </div>
          </Link>
        ))}
        {subjects.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No subjects found for this branch and semester.
          </div>
        )}
      </div>

    </div>
  );
};

export default NotesPage;
