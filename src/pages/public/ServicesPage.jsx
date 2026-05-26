import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Car, MapPin, Moon, Shield, Wrench, FileCheck, Heart } from 'lucide-react';

const services = [
  { icon: BookOpen, title: 'Theory Classes', desc: 'Comprehensive road rules, signs, and traffic law education. Available in Sinhala, Tamil, and English.', features: ['RMV Syllabus Covered', 'Practice Quizzes', 'Study Materials Provided'] },
  { icon: Car, title: 'Practical Driving Lessons', desc: 'Hands-on lessons in dual-control vehicles with certified instructors in real traffic conditions.', features: ['Dual-Control Safety', 'City & Residential Roads', '1-hour Sessions'] },
  { icon: MapPin, title: 'Highway Driving', desc: 'Build confidence on the Kurunegala–Colombo Expressway with experienced highway driving instructors.', features: ['Expressway Included', 'High-Speed Techniques', 'Safe Overtaking'] },
  { icon: Moon, title: 'Night Driving', desc: 'Learn to handle reduced visibility, headlights, and night-specific hazards on real roads.', features: ['Premium Package', 'Street Light Navigation', 'Headlight Usage'] },
  { icon: FileCheck, title: 'Exam Preparation', desc: 'Targeted theory and practical exam prep with mock tests and feedback sessions.', features: ['Mock Written Tests', 'Trial Road Tests', 'Examiner Feedback'] },
  { icon: Car, title: 'Vehicle for Test Day', desc: 'Use our well-maintained, familiar dual-control vehicle for your official RMV road test.', features: ['Standard & Premium Packages', 'Familiar Vehicle', 'Test Route Practice'] },
  { icon: Shield, title: 'Defensive Driving', desc: 'Advanced skills for anticipating hazards, handling emergencies, and protecting yourself on the road.', features: ['Premium Package Only', 'Hazard Perception', 'Emergency Manoeuvres'] },
  { icon: Heart, title: 'First Aid for Drivers', desc: 'Basic first aid training relevant to road accidents — a valuable skill every driver should have.', features: ['CPR Basics', 'Accident Response', 'Certificate Provided'] },
];

const steps = [
  { num: '01', title: 'Register Online', desc: 'Create your account and choose a package in minutes.' },
  { num: '02', title: 'Theory Classes', desc: 'Master road rules and traffic signs with our expert instructors.' },
  { num: '03', title: 'Practical Lessons', desc: 'Learn to drive on real roads with a certified instructor.' },
  { num: '04', title: 'Exam & Licence', desc: 'Pass the RMV test and receive your driving licence!' },
];

export default function ServicesPage() {
  return (
    <div className="bg-white">
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">What We Offer</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Everything you need to become a safe, confident, licensed driver — all under one roof.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(({ icon: Icon, title, desc, features }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} viewport={{ once: true }}
              className="border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-orange-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 group-hover:bg-primary/50 flex items-center justify-center mb-4 transition-colors">
                <Icon size={22} className="text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1.5">
                {features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Your Journey to a Licence</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ num, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }} viewport={{ once: true }} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/50 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                  <span className="text-white font-black text-xl">{num}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary/50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start Learning Today</h2>
          <p className="text-orange-100 mb-6">Register for free and pick the services that match your learning goals.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="px-8 py-3 rounded-xl bg-white text-primary font-bold hover:bg-primary/5 transition-colors">Get Started</Link>
            <Link to="/pricing" className="px-8 py-3 rounded-xl border-2 border-white text-white font-bold hover:bg-white/10 transition-colors">View Pricing</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
