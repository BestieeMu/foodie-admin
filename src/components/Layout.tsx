import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, LogOut, Store, Users, DollarSign, BarChart3, Star, UserCircle, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { socketService } from '../services/socket';
import { Toaster, toast } from 'react-hot-toast';

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  useEffect(() => {
    socketService.connect();

    socketService.on('orders:update', (data) => {
      console.log('Socket event:', data);
      if (data.type === 'created') {
        if (user?.role === 'admin' && data.order?.restaurant_id && user.restaurantId && data.order.restaurant_id !== user.restaurantId) {
            return;
        }
        playNotificationSound();
        toast.success(`New Order #${data.order.id.slice(-6)} received!`, { duration: 6000, icon: '🛎️' });
      } else if (data.type === 'status') {
         toast(`Order #${data.orderId.slice(-6)} updated to ${data.status.replace(/_/g, ' ')}`, { icon: '🔄' });
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'super_admin' ? [
    { icon: Store, label: 'Restaurants', path: '/' },
    { icon: ShoppingBag, label: 'Orders', path: '/orders' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: DollarSign, label: 'Finance', path: '/finance' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShoppingBag, label: 'Orders', path: '/orders' },
    { icon: UtensilsCrossed, label: 'Menu', path: '/menu' },
    { icon: Users, label: 'Staff', path: '/staff' },
    { icon: DollarSign, label: 'Finance', path: '/finance' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Star, label: 'Reviews', path: '/reviews' },
    { icon: UserCircle, label: 'Customers', path: '/customers' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-primary">Foodie Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'super_admin' ? 'Platform Admin' : 'Restaurant Dashboard'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-orange-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 relative">
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff', borderRadius: '10px' } }} />
        <Outlet />
      </main>
    </div>
  );
}