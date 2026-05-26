import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Car, Bike, Truck, Filter } from 'lucide-react';

const courses = [
  { id: 1, icon: '🚗', title: 'Car Driving (Class B)', category: 'Light Vehicle', duration: '4–8 weeks', price: 'Rs. 15,000–40,000', desc: 'Learn to drive manual and automatic cars on local roads, highways, and in city traffic.', features: ['Theory + Practical', 'RMV Exam Prep', 'Dual-Control Vehicle', 'Certificate Issued'] },
  { id: 2, icon: '🏍️', title: 'Motorcycle (Class A)', category: 'Motorcycle', duration: '3–4 weeks', price: 'Rs. 10,000–18,000', desc: 'Master motorcycle riding with safety gear, balance training, and road awareness sessions.', features: ['Safety Gear Provided', 'Balancing Sessions', 'Road Test Prep', 'Certificate Issued'] },
  { id: 3, icon: '🛺', title: 'Three-Wheeler (Class B1)', category: 'Light Vehicle', duration: '2–3 weeks', price: 'Rs. 8,000–12,000', desc: 'Tuk-tuk / three-wheeler driving for daily commuters and commercial operators.', features: ['Short Duration', 'Practical Focus', 'Exam Guidance', 'Certificate Issued'] },
  { id: 4, icon: '🚐', title: 'Van / Bus (Class C/D)', category: 'Heavy Vehicle', duration: '6–10 weeks', price: 'Rs. 30,000–55,000', desc: 'Commercial vehicle training for van, minibus, and bus drivers on Sri Lanka roads.', features: ['Class B Required', 'Passenger Safety', 'Route Planning', 'Certificate Issued'] },
  { id: 5, icon: '🚛', title: 'Heavy Vehicle (Class CE)', category: 'Heavy Vehicle', duration: '8–12 weeks', price: 'Rs. 45,000–75,000', desc: 'Lorry and heavy commercial vehicle driving for professional transport operators.', features: ['Class C Required', 'Cargo Safety', 'Highway + Expressway', 'Certificate Issued'] },
  { id: 6, icon: '🔄', title: 'Refresher Course', category: 'Special', duration: '1–2 weeks', price: 'Rs. 5,000–8,000', desc: 'For licensed drivers who want to improve skills or return after a long break.', features: ['Flexible Schedule', 'Targeted Lessons', 'Confidence Building', 'No Exam Needed'] },
];

const tabs = ['All', 'Light Vehicle', 'Motorcycle', 'Heavy Vehicle', 'Special'];

export default function CoursesPage() {
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? courses : courses.filter(c => c.category === active);

  return (
    <div className="bg-white">
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">Our Courses</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Course</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">From beginner car lessons to heavy vehicle certification — we have a course for every driver.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-10 items-center">
          <Filter size={16} className="text-gray-400 mr-1" />
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActive(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${active === tab ? 'bg-primary/50 text-white shadow-md shadow-orange-500/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-orange-200 transition-all group">
              <div className="text-4xl mb-4">{course.icon}</div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">{course.category}</span>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{course.title}</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">{course.desc}</p>
              <div className="flex gap-4 text-xs text-gray-500 mb-4">
                <span>⏱ {course.duration}</span>
                <span>💰 {course.price}</span>
              </div>
              <ul className="space-y-1.5 mb-5">
                {course.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block w-full text-center py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-sm group-hover:bg-primary/50 transition-colors">
                Enroll Now
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-primary/50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Not Sure Which Course?</h2>
          <p className="text-orange-100 mb-6">Talk to our team and we'll help you choose the right programme.</p>
          <Link to="/contact" className="inline-block px-8 py-3 rounded-xl bg-white text-primary font-bold hover:bg-primary/5 transition-colors">
            Get Free Advice
          </Link>
        </div>
      </section>
    </div>
  );
}
