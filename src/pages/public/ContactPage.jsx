import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

const subjects = ['General Enquiry', 'Course Information', 'Booking Issue', 'Payment Issue', 'Complaint', 'Feedback'];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">Get In Touch</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">We're here to help. Reach out and our team will respond within 24 hours.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Info Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {[
            { icon: MapPin, title: 'Address', lines: ['No. 42, Main Street', 'Kurunegala, Sri Lanka'] },
            { icon: Phone, title: 'Phone', lines: ['+94 77 123 4567', '+94 81 234 5678'] },
            { icon: Mail, title: 'Email', lines: ['info@erangadrivingschool.com', 'support@erangadrivingschool.com'] },
            { icon: Clock, title: 'Operating Hours', lines: ['Mon–Fri: 7:00 AM – 6:00 PM', 'Sat: 8:00 AM – 4:00 PM'] },
          ].map(({ icon: Icon, title, lines }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="border border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              {lines.map((l, j) => <p key={j} className="text-gray-500 text-sm">{l}</p>)}
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 mb-6">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name:'',email:'',phone:'',subject:'',message:'' }); }}
                  className="px-6 py-2.5 rounded-xl bg-primary/50 text-white font-semibold text-sm hover:bg-orange-600 transition-colors">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="+94 77 123 4567"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="you@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <select required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 bg-white transition-all">
                    <option value="">Select a subject</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 resize-none transition-all" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-primary/50 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={16} /> Send Message</>}
                </button>
              </form>
            )}
          </motion.div>

          {/* Map */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Us</h2>
            <div className="rounded-2xl overflow-hidden border border-gray-200 h-[400px] shadow-sm">
              <iframe
                title="Eranga Driving School Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31684.87!2d80.6337!3d7.2906!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae368dde3c36a77%3A0xf30ce8b8f8c8adf!2sKurunegala%2C%20Sri%20Lanka!5e0!3m2!1sen!2s!4v1621000000000!5m2!1sen!2s"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <div className="mt-4 p-4 bg-primary/5 border border-orange-200 rounded-xl">
              <p className="text-orange-700 text-sm font-medium">📍 No. 42, Main Street, Kurunegala, Sri Lanka</p>
              <p className="text-primary text-xs mt-1">Near Kurunegala City Centre, 5 min from the lake</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
