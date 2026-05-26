import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';

const faqData = {
  Registration: [
    { q: 'How do I register at Eranga Driving School?', a: 'You can register online through our website or visit our office at No. 42, Main Street, Kurunegala. Online registration is quick and free — you\'ll need a valid national ID and a passport-sized photo.' },
    { q: 'What documents do I need to register?', a: 'You need your National Identity Card (NIC), a passport-sized photograph, and your Birth Certificate. For heavy vehicle courses, an existing Class B licence is required.' },
    { q: 'What is the minimum age to register?', a: 'You must be at least 18 years old to register for a car (Class B) licence. Motorcycle (Class A) requires a minimum age of 17 with parental consent.' },
    { q: 'How long does the approval process take?', a: 'Once you submit your registration, our team will review and approve your application within 24–48 hours. You\'ll be notified by SMS and email.' },
    { q: 'Can I register for multiple courses?', a: 'Yes, you can enroll in multiple courses simultaneously. We recommend completing one course at a time for the best learning experience.' },
  ],
  'Lessons & Schedule': [
    { q: 'How are driving lessons scheduled?', a: 'After approval, you can book lessons through your student dashboard. Choose your preferred date, time slot, and instructor. Slots are available from 7 AM to 6 PM, Monday to Saturday.' },
    { q: 'Can I choose my own instructor?', a: 'Yes! You can request a specific instructor when booking a session, subject to their availability.' },
    { q: 'What if I need to cancel or reschedule a lesson?', a: 'You can cancel or reschedule a lesson up to 24 hours in advance through your dashboard without any penalty. Late cancellations may incur a small fee.' },
    { q: 'How long is each driving lesson?', a: 'Standard lessons are 1 hour each. Some advanced sessions (highway driving, night driving) may be 2 hours.' },
    { q: 'Are lessons available on weekends?', a: 'Yes, we offer lessons on Saturdays from 8 AM to 4 PM. Sundays are not available.' },
  ],
  Exams: [
    { q: 'What is the written exam format?', a: 'The RMV written exam consists of 30 multiple-choice questions on road rules, signs, and safe driving practices. You need 24/30 to pass. We provide comprehensive preparation materials.' },
    { q: 'How do I book the government road test?', a: 'After completing your practical lessons, our admin team will assist you in booking the official RMV road test. We guide you through the entire process.' },
    { q: 'What is your pass rate?', a: 'We maintain a 98% first-attempt pass rate for the RMV road test. Our instructors specifically train students on the test route and evaluation criteria.' },
    { q: 'Can I use the school\'s vehicle for the road test?', a: 'Yes! Standard and Premium package students can use one of our dual-control vehicles for the official road test at no extra charge.' },
  ],
  Payments: [
    { q: 'What payment methods are accepted?', a: 'We accept cash, bank transfer (HNB/Commercial Bank), and card payments (Visa/Mastercard). Online payments can be made through your student dashboard.' },
    { q: 'Can I pay in installments?', a: 'Yes, flexible payment plans are available. Typically, 50% is due at registration and the remaining 50% before practical lessons begin.' },
    { q: 'Is there a refund policy?', a: 'If you withdraw before completing 25% of your lessons, a 75% refund is applicable. After 25%, refunds are handled on a case-by-case basis. Contact our office for details.' },
    { q: 'Are there any extra charges?', a: 'The package price is all-inclusive. The only additional cost is the government RMV exam fee (approximately Rs. 1,000), which is paid directly to the Department of Motor Traffic.' },
  ],
  General: [
    { q: 'Where is Eranga Driving School located?', a: 'We are located at No. 42, Main Street, Kurunegala, Sri Lanka. We also conduct highway driving sessions on the Kurunegala–Colombo Expressway.' },
    { q: 'What languages are lessons conducted in?', a: 'Lessons are available in Sinhala, Tamil, and English. Please specify your preferred language when registering.' },
    { q: 'Do you offer pickup services?', a: 'Yes, we offer a pickup and drop service within a 10km radius of our Kurunegala office for an additional fee of Rs. 500 per session.' },
    { q: 'What safety measures are in place in your vehicles?', a: 'All our vehicles have dual controls (instructor can take control at any time), airbags, ABS braking, and are regularly serviced to ensure roadworthiness.' },
  ],
};

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-900 text-sm pr-4">{q}</span>
        <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <p className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Registration');
  const categories = Object.keys(faqData);

  const filtered = search
    ? Object.entries(faqData).flatMap(([, items]) =>
        items.filter(i => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase()))
      )
    : faqData[activeTab];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">FAQs</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">Find answers to common questions about registration, lessons, exams, and payments.</p>
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 text-sm" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        {!search && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                  ${activeTab === cat ? 'bg-primary/50 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {search && filtered.length === 0 && (
          <p className="text-center text-gray-500 py-12">No results found for "{search}". Try different keywords.</p>
        )}

        <div className="space-y-3">
          {filtered.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 bg-primary/50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Still Have Questions?</h2>
          <p className="text-orange-100 mb-6">Our team is happy to help. Reach out to us anytime.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/contact" className="px-6 py-3 rounded-xl bg-white text-primary font-bold hover:bg-primary/5 transition-colors">Contact Us</Link>
            <a href="tel:+94771234567" className="px-6 py-3 rounded-xl border-2 border-white text-white font-bold hover:bg-white/10 transition-colors">Call: +94 77 123 4567</a>
          </div>
        </div>
      </section>
    </div>
  );
}
