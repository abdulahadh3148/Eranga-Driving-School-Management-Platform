import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, getDocs, query } from 'firebase/firestore';

const tabs = ['All', 'Cars', 'Motorcycles', 'Three-Wheelers', 'Heavy'];
const statusColors = { Available: 'bg-green-100 text-green-700', 'In Use': 'bg-blue-100 text-blue-700', Maintenance: 'bg-red-100 text-red-700' };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('All');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'vehicles')));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setVehicles(data);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const filtered = active === 'All' ? vehicles : vehicles.filter(v => v.category === active);

  return (
    <div className="bg-white">
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">Our Fleet</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Modern Training Vehicles</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">All vehicles are dual-controlled, regularly serviced, and road-test ready.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap gap-2 mb-10">
          {tabs.map(t => (
            <button key={t} onClick={() => setActive(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${active === t ? 'bg-primary/50 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={36} className="text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((v, i) => (
              <motion.div key={v.id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
                <div className="bg-gray-50 h-36 flex items-center justify-center text-6xl group-hover:bg-primary/5 transition-colors">
                  {v.emoji}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900">{v.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>{v.status}</span>
                  </div>
                  <p className="text-primary text-sm font-medium mb-3">{v.type}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(v.features || []).map((f, j) => (
                      <span key={j} className="px-2 py-0.5 bg-gray-100 rounded-lg text-xs text-gray-600">{f}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="py-16 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Fleet Safety Standards</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">All vehicles undergo monthly inspections and are equipped with dual controls, airbags, ABS, and reverse cameras.</p>
          <Link to="/register" className="inline-block px-8 py-3 rounded-xl bg-primary/50 text-white font-bold hover:bg-orange-600 transition-colors">
            Book a Lesson
          </Link>
        </div>
      </section>
    </div>
  );
}
