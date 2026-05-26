import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Phone, Mail, Loader2 } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={14} className={s <= Math.round(rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating || 5.0}</span>
    </div>
  );
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setInstructors(data);
      } catch (err) {
        console.error('Error fetching instructors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructors();
  }, []);

  return (
    <div className="bg-white">
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">Our Team</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Meet Our Instructors</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Certified, experienced, and passionate about teaching safe driving skills.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={36} className="text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((inst, i) => (
              <motion.div key={inst.id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-orange-200 transition-all text-center group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black shadow-lg shadow-orange-500/30">
                  {(inst.name || 'I').charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-0.5">{inst.name}</h3>
                <p className="text-primary text-sm font-medium mb-2">{inst.vehiclePreference || 'All Categories'}</p>
                <div className="flex justify-center mb-3"><Stars rating={inst.rating || 5.0} /></div>
                <div className="flex justify-center gap-4 text-xs text-gray-500 mb-4">
                  <span>🏆 {inst.experience || 10} yrs exp</span>
                  <span>👥 {inst.studentsCount || inst.students || 100}+ students</span>
                </div>
                {inst.lang && (
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 mb-3">
                    <span className="font-medium">Languages: </span>{inst.lang}
                  </div>
                )}
                <div className="flex flex-col gap-1.5 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <Phone size={12} className="text-gray-400" />
                    <span>{inst.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail size={12} className="text-gray-400" />
                    <span>{inst.email}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="py-16 bg-primary/50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Learn from the Best</h2>
          <p className="text-orange-100 mb-6">Register today and get matched with the perfect instructor for your needs.</p>
          <Link to="/register" className="inline-block px-8 py-3 rounded-xl bg-white text-primary font-bold hover:bg-primary/5 transition-colors">
            Register Free
          </Link>
        </div>
      </section>
    </div>
  );
}
