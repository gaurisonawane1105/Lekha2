import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, FileText, Calendar, Users, Settings, LayoutDashboard, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const Layout = ({ children, role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getNavItems = () => {
    const basePath = `/${role.toLowerCase()}`;
    switch (role) {
      case 'Student':
        return [
          { path: basePath, label: 'Dashboard', icon: LayoutDashboard },
          { path: `${basePath}/files`, label: 'Files', icon: FileText },
          { path: `${basePath}/meetings`, label: 'Meetings', icon: Calendar },
        ];
      case 'Guide':
        return [
          { path: basePath, label: 'Dashboard', icon: LayoutDashboard },
          { path: `${basePath}/projects`, label: 'Projects', icon: BookOpen },
          { path: `${basePath}/verifications`, label: 'Verifications', icon: FileText },
        ];
      case 'HOD':
        return [
          { path: basePath, label: 'Dashboard', icon: LayoutDashboard },
          { path: `${basePath}/projects`, label: 'All Projects', icon: BookOpen },
        ];
      case 'Admin':
        return [
          { path: basePath, label: 'Dashboard', icon: LayoutDashboard },
          { path: `${basePath}/users`, label: 'Users', icon: Users },
          { path: `${basePath}/projects`, label: 'Projects', icon: BookOpen },
          { path: `${basePath}/settings`, label: 'Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white h-screen sticky top-0 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold font-heading tracking-tight text-slate-900" data-testid="app-logo">
            Lekha
          </h1>
          <p className="text-sm text-slate-500 mt-1">Digital Black Book</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="px-4 py-2 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-900" data-testid="user-name">{user.full_name}</p>
            <p className="text-xs text-slate-500">{user.role_name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2"
            data-testid="logout-button"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
