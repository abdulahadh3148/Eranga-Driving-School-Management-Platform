import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ChevronRight, ChevronDown, LogOut } from 'lucide-react';

const NavItem = ({ item, location, collapsed }) => {
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  const Icon = item.icon;
  return (
    <Link to={item.path}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
        ${isActive ? 'bg-primary/50 text-white shadow-lg shadow-orange-500/30' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
      <Icon size={20} className="shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }} className="text-sm font-medium whitespace-nowrap overflow-hidden">
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {item.label}
        </div>
      )}
    </Link>
  );
};

const NavGroup = ({ item, location, collapsed }) => {
  const Icon = item.icon;
  
  // Check if any child is active
  const isChildActive = item.children?.some(child => 
    location.pathname === child.path || location.pathname.startsWith(child.path + '/')
  );
  
  const [open, setOpen] = useState(isChildActive);

  // Auto-open when a child becomes active
  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (collapsed) {
    // When collapsed, show just the icon with a tooltip listing children
    return (
      <div className="relative group">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full
            ${isChildActive ? 'bg-primary/50 text-white shadow-lg shadow-orange-500/30' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
        >
          <Icon size={20} className="shrink-0" />
        </button>
        <div className="absolute left-full ml-2 top-0 bg-gray-800 rounded-lg py-2 min-w-[180px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-50 transition-opacity shadow-xl">
          <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase">{item.label}</p>
          {item.children.map(child => {
            const ChildIcon = child.icon;
            const childActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
            return (
              <Link key={child.path} to={child.path}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${childActive ? 'text-primary font-bold' : 'text-gray-300 hover:text-white'}`}>
                <ChildIcon size={14} /> {child.label}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full
          ${isChildActive ? 'text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
      >
        <Icon size={20} className="shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">{item.label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 pl-3 border-l border-white/10 mt-1 space-y-0.5">
              {item.children.map(child => (
                <NavItem key={child.path} item={child} location={location} collapsed={false} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarContent = ({ collapsed, setCollapsed, title, items, userProfile, handleLogout, location }) => (
  <div className="flex flex-col h-full bg-gray-950 border-r border-white/10">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-primary font-bold text-lg leading-tight">Eranga</p>
            <p className="text-gray-400 text-xs">{title}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setCollapsed(!collapsed)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
        <ChevronRight size={18} className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
      </button>
    </div>

    {/* Nav Items */}
    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
      {items.map((item, idx) => 
        item.children 
          ? <NavGroup key={item.label + idx} item={item} location={location} collapsed={collapsed} />
          : <NavItem key={item.path} item={item} location={location} collapsed={collapsed} />
      )}
    </nav>

    {/* User Footer */}
    <div className="p-3 border-t border-white/10">
      <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 mb-2`}>
        <div className="w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {userProfile?.name?.charAt(0) || 'U'}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
              <p className="text-white text-sm font-medium whitespace-nowrap">{userProfile?.name || 'User'}</p>
              <p className="text-gray-500 text-xs whitespace-nowrap capitalize">{userProfile?.role || 'student'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button onClick={handleLogout}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
        <LogOut size={18} className="shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }} className="text-sm font-medium whitespace-nowrap overflow-hidden">
              Sign Out
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  </div>
);

export default function Sidebar({ items, title }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-xl text-white shadow-lg">
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50">
              <div className="absolute top-3 right-3">
                <button onClick={() => setMobileOpen(false)} className="p-1.5 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent
                collapsed={false}
                setCollapsed={setCollapsed}
                title={title}
                items={items}
                userProfile={userProfile}
                handleLogout={handleLogout}
                location={location}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside animate={{ width: collapsed ? 72 : 256 }} transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden">
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          title={title}
          items={items}
          userProfile={userProfile}
          handleLogout={handleLogout}
          location={location}
        />
      </motion.aside>
    </>
  );
}
