import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, Users, Car, ThumbsUp, Target, Eye, Heart, Shield } from 'lucide-react';

const stats = [
  { value: '1000+', label: 'Graduates', icon: Users },
  { value: '98%', label: 'Pass Rate', icon: ThumbsUp },
  { value: '15+', label: 'Years Experience', icon: Award },
  { value: '20+', label: 'Vehicles', icon: Car },
];

const values = [
  { icon: Shield, title: 'Safety First', desc: 'Every lesson prioritizes road safety and responsible driving habits.' },
  { icon: Award, title: 'Excellence', desc: 'We maintain the highest standards in training and instruction quality.' },
  { icon: Target, title: 'Innovation', desc: 'Modern techniques and technology for effective learning.' },
  { icon: Heart, title: 'Community', desc: 'We care about our students and the communities they drive in.' },
];

const team = [
  { name: 'Mr. Eranga Perera', role: 'Founder & Chief Instructor', exp: '20 years' },
  { name: 'Mrs. Dilani Silva', role: 'Senior Instructor', exp: '12 years' },
  { name: 'Mr. Kamal Fernando', role: 'Theory Instructor', exp: '8 years' },
  { name: 'Mr. Roshan Jayawardena', role: 'Heavy Vehicle Specialist', exp: '15 years' },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gray-950 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 opacity-90" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/50/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">About Us</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-2xl">Sri Lanka's Most Trusted Driving School</h1>
            <p className="text-gray-300 text-lg max-w-xl">Founded in 2010, Eranga Driving School has been shaping confident, responsible drivers across Sri Lanka for over 15 years.</p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label, icon: Icon }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
                <Icon size={32} className="text-white/80 mx-auto mb-2" />
                <p className="text-4xl font-black text-white">{value}</p>
                <p className="text-orange-100 font-medium">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Story</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-5">15 Years of Driving Excellence</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Eranga Driving School was founded in 2010 by Mr. Eranga Perera, a passionate driving instructor with a vision to make quality driver education accessible to everyone in Sri Lanka.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Starting with just two vehicles and a small team, we have grown into one of the most reputable driving schools in the country, with a state-of-the-art training facility in Kurunegala and a fleet of over 20 modern dual-control vehicles.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our 98% first-attempt pass rate speaks to the quality of our instruction and the dedication of our students. We pride ourselves on producing not just licensed drivers, but safe, confident, and responsible road users.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="grid grid-cols-2 gap-4">
            {[
              { label: 'Founded', value: '2010', bg: 'bg-primary/5 border-orange-200' },
              { label: 'Location', value: 'Kurunegala, LK', bg: 'bg-gray-50 border-gray-200' },
              { label: 'Accredited', value: 'RMV & NVSCA', bg: 'bg-gray-50 border-gray-200' },
              { label: 'Languages', value: 'Sinhala, Tamil, English', bg: 'bg-primary/5 border-orange-200' },
            ].map((item, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${item.bg}`}>
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <p className="font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Target, title: 'Our Mission', color: 'orange', text: 'To provide world-class driver education that empowers every student with the knowledge, skills, and confidence to drive safely and responsibly throughout their lives.' },
              { icon: Eye, title: 'Our Vision', color: 'gray', text: 'To be Sri Lanka\'s leading driver education institution, recognized for excellence in training, innovation in methods, and unwavering commitment to road safety.' },
            ].map(({ icon: Icon, title, color, text }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className={`w-12 h-12 rounded-2xl ${color === 'orange' ? 'bg-primary/50' : 'bg-gray-900'} flex items-center justify-center mb-4`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">What We Stand For</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">Our Core Values</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="text-center p-6 rounded-2xl hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Icon size={26} className="text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">The People Behind Our Success</span>
            <h2 className="text-3xl font-bold text-white mt-2">Meet Our Team</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(({ name, role, exp }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/50 flex items-center justify-center mx-auto mb-4 text-2xl font-black text-white">
                  {name.charAt(4)}
                </div>
                <h3 className="font-bold text-white mb-1">{name}</h3>
                <p className="text-primary text-sm mb-1">{role}</p>
                <p className="text-gray-500 text-xs">{exp} experience</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-orange-100 mb-8">Join 1000+ graduates who trusted Eranga Driving School for their licence.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="px-8 py-3 rounded-xl bg-white text-primary font-bold hover:bg-primary/5 transition-colors">
              Register Now
            </Link>
            <Link to="/contact" className="px-8 py-3 rounded-xl border-2 border-white text-white font-bold hover:bg-white/10 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
