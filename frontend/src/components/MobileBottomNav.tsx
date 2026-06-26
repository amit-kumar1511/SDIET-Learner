import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, Sparkles, Bell } from 'lucide-react';

const tabs = [
  { label: 'Home',      to: '/dashboard',  Icon: Home      },
  { label: 'Notes',     to: '/notes',      Icon: FileText  },
  { label: 'AI',        to: '/ai-teacher', Icon: Sparkles  },
  { label: 'Reminder',  to: '/reminders',  Icon: Bell      },
];

const MobileBottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Outer pill container */}
      <div className="mx-3 mb-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[2rem] shadow-2xl shadow-black/10 dark:shadow-black/40 px-2 py-2 flex items-center justify-around">
          {tabs.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-2 rounded-[1.5rem] transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span
                    className={`text-[10px] font-bold tracking-wide transition-all duration-200 ${
                      isActive ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
