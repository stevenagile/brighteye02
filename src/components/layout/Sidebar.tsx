import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
  Glasses,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const navItems = [
  { icon: LayoutDashboard, label: '儀表板', path: '/' },
  { icon: Users, label: '客戶管理', path: '/members' },
  { icon: Receipt, label: '客戶服務紀錄', path: '/transactions' },
  { icon: Settings, label: '系統設定', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('登出失敗');
    } else {
      toast.success('已成功登出');
      navigate('/login');
    }
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
          <Glasses className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-sidebar-foreground">伯洸眼鏡</h1>
            <p className="text-xs text-sidebar-foreground/60">管理系統</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-nav-item",
                isActive && "active"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        {!collapsed && user && (
          <div className="px-4 py-2 text-xs text-sidebar-foreground/60 truncate">
            {user.email}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>登出</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-nav-item w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>收起選單</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
