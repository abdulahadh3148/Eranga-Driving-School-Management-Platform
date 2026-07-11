import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Globe, Camera, Video, ArrowRight } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary/50 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xl">E</span>
              </div>
              <div>
                <p className="font-bold text-white text-base">Eranga Driving</p>
                <p className="text-primary text-xs">School</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Sri Lanka's most trusted driving school, helping students master the road safely since 2010. 1000+ graduates with a 98% first-attempt pass rate.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-primary/50 flex items-center justify-center transition-colors">
                <Globe size={16} />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-primary/50 flex items-center justify-center transition-colors">
                <Camera size={16} />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-primary/50 flex items-center justify-center transition-colors">
                <Video size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {['Home', 'About Us', 'Courses', 'Pricing', 'Services', 'Instructors', 'Vehicles', 'Testimonials', 'FAQ', 'Contact'].map(label => (
                <li key={label}>
                  <Link to={`/${label.toLowerCase().replace(' ', '-').replace(' us', '')}`}
                    className="text-gray-400 hover:text-primary text-sm flex items-center gap-1.5 transition-colors group">
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                No. 42, Main Street, Kurunegala, Sri Lanka
              </li>
              <li>
                <a href="tel:+94771234567" className="flex items-center gap-3 text-sm text-gray-400 hover:text-primary transition-colors">
                  <Phone size={16} className="text-primary shrink-0" /> +94 77 123 4567
                </a>
              </li>
              <li>
                <a href="mailto:info@erangadrivingschool.com" className="flex items-center gap-3 text-sm text-gray-400 hover:text-primary transition-colors">
                  <Mail size={16} className="text-primary shrink-0" /> info@erangadrivingschool.com
                </a>
              </li>
            </ul>
            <div className="mt-5">
              <h4 className="text-sm font-medium text-white mb-2">Operating Hours</h4>
              <p className="text-gray-400 text-sm">Mon – Fri: 7:00 AM – 6:00 PM</p>
              <p className="text-gray-400 text-sm">Saturday: 8:00 AM – 4:00 PM</p>
              <p className="text-gray-500 text-sm">Sunday: Closed</p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">Get driving tips and school news delivered to your inbox.</p>
            <div className="flex flex-col gap-2">
              <input type="email" placeholder="Your email address"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition-colors" />
              <button className="w-full px-4 py-2.5 rounded-xl bg-primary/50 hover:bg-orange-600 text-white font-semibold text-sm transition-colors">
                Subscribe
              </button>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-medium text-white mb-2">We're Accredited By</h4>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-gray-300">RMV Sri Lanka</span>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-gray-300">NVSCA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-sm">© {year} Eranga Driving School. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/about" className="text-gray-500 hover:text-primary text-sm transition-colors">Privacy Policy</Link>
            <Link to="/about" className="text-gray-500 hover:text-primary text-sm transition-colors">Terms of Service</Link>
            <Link to="/contact" className="text-gray-500 hover:text-primary text-sm transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
