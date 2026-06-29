import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, ListTodo, Bell } from 'lucide-react';

const tabs = [
  { label: 'Home',      to: '/dashboard',     Icon: Home      },
  { label: 'Notes',     to: '/notes',         Icon: FileText  },
  { label: 'Todo',      to: '/student-plans', Icon: ListTodo  },
  { label: 'Reminder',  to: '/reminders',     Icon: Bell      },
];

const MobileBottomNav = () => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    
    const handleResize = () => {
      // Hide bottom nav if visualViewport height is less than 85% of innerHeight (keyboard open)
      const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.85;
      setIsVisible(!isKeyboardOpen);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  if (!isVisible) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 h-16 z-50 md:hidden flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.15)] px-2">
      {tabs.map(({ label, to, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 ${
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
    </nav>
  );
};

export default MobileBottomNav;
