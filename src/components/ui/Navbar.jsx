import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, Mail, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Courses', path: '/courses' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Services', path: '/services' },
  { label: 'Instructors', path: '/instructors' },
  { label: 'Vehicles', path: '/vehicles' },
  { label: 'Testimonials', path: '/testimonials' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();

  const getDashboardLink = () => {
    if (!userProfile) return '/login';
    if (userProfile.role === 'admin') return '/admin';
    if (userProfile.role === 'instructor') return '/instructor';
    return '/student';
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'}`}>
        {/* Top bar */}
        <div className="bg-gray-950 text-white py-2 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-xs">
            <div className="flex items-center gap-6">
              <a href="tel:+94771234567" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Phone size={12} /> +94 77 123 4567
              </a>
              <a href="mailto:info@erangadrivingschool.com" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Mail size={12} /> info@erangadrivingschool.com
              </a>
            </div>
            <span className="text-gray-400">Mon – Sat: 7:00 AM – 6:00 PM</span>
          </div>
        </div>

        {/* Main nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary/50 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">E</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-gray-900 text-sm leading-tight">Eranga Driving</p>
                <p className="text-primary text-xs font-medium">School</p>
              </div>
            </Link>

            {/* Desktop Links */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.path} to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${location.pathname === link.path ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {currentUser ? (
                <>
                  <Link to={getDashboardLink()}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors shadow-md shadow-orange-500/30 flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <button onClick={handleLogout}
                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary transition-colors">
                    Login
                  </Link>
                  <Link to="/register"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary/50 hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/30">
                    Register Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="xl:hidden bg-white border-t border-gray-100 overflow-hidden">
              <nav className="p-4 space-y-1">
                {navLinks.map(link => (
                  <Link key={link.path} to={link.path}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${location.pathname === link.path ? 'text-primary bg-primary/5' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                  {currentUser ? (
                    <>
                      <Link to={getDashboardLink()} className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover flex items-center justify-center gap-2">
                        <LayoutDashboard size={18} />
                        Go to Dashboard
                      </Link>
                      <button onClick={handleLogout} className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-100 hover:bg-red-50 flex items-center justify-center gap-2">
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:border-orange-300">
                        Login
                      </Link>
                      <Link to="/register" className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary/50 hover:bg-orange-600">
                        Register Free
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {/* Spacer */}
      <div className="h-16 md:h-24" />
    </>
  );
}
