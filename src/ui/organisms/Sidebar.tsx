import { NavLink } from 'react-router-dom';
import Button from '@/ui/atoms/Button';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/settings', label: 'Settings' },
];

const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" className="w-full">Logout</Button>
      </div>
    </aside>
  );
};
export default Sidebar