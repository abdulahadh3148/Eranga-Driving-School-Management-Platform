import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, X, Star, Zap } from 'lucide-react';

const packages = [
  {
    name: 'Basic',
    price: 15000,
    duration: '4 Weeks',
    vehicleType: 'Car (Manual)',
    popular: false,
    color: 'gray',
    features: [
      { text: '10 Theory Classes', included: true },
      { text: '10 Practical Lessons (1hr each)', included: true },
      { text: 'Written Exam Preparation', included: true },
      { text: 'Vehicle for Test Day', included: false },
      { text: 'Highway Driving', included: false },
      { text: 'Night Driving Session', included: false },
      { text: 'Defensive Driving Module', included: false },
      { text: 'Free Repeat Lessons', included: false },
    ],
  },
  {
    name: 'Standard',
    price: 25000,
    duration: '6 Weeks',
    vehicleType: 'Car (Manual/Auto)',
    popular: true,
    color: 'orange',
    features: [
      { text: '15 Theory Classes', included: true },
      { text: '18 Practical Lessons (1hr each)', included: true },
      { text: 'Written Exam Preparation', included: true },
      { text: 'Vehicle for Test Day', included: true },
      { text: 'Highway Driving', included: true },
      { text: 'Night Driving Session', included: false },
      { text: 'Defensive Driving Module', included: false },
      { text: 'Free Repeat Lessons (2)', included: true },
    ],
  },
  {
    name: 'Premium',
    price: 40000,
    duration: '8 Weeks',
    vehicleType: 'Car + Motorway',
    popular: false,
    color: 'dark',
    features: [
      { text: '20 Theory Classes', included: true },
      { text: '25 Practical Lessons (1hr each)', included: true },
      { text: 'Written Exam Preparation', included: true },
      { text: 'Vehicle for Test Day', included: true },
      { text: 'Highway Driving', included: true },
      { text: 'Night Driving Session', included: true },
      { text: 'Defensive Driving Module', included: true },
      { text: 'Unlimited Repeat Lessons', included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">Transparent Pricing</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Package</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">No hidden fees. Pick the plan that fits your schedule and budget.</p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }} viewport={{ once: true }}
              className={`relative rounded-2xl flex flex-col overflow-hidden border-2 transition-shadow hover:shadow-2xl
                ${pkg.popular ? 'border-primary shadow-xl shadow-orange-500/20' : 'border-gray-200'}`}>
              {pkg.popular && (
                <div className="bg-primary/50 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-1">
                  <Zap size={13} /> MOST POPULAR
                </div>
              )}
              <div className={`p-8 ${pkg.popular ? 'bg-primary/50 text-white' : pkg.color === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                <p className={`text-sm mb-4 ${pkg.popular ? 'text-orange-100' : 'text-gray-500'}`}>{pkg.vehicleType} · {pkg.duration}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium">Rs.</span>
                  <span className="text-4xl font-black">{pkg.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex-1 p-8 bg-white">
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      {f.included
                        ? <Check size={16} className="text-green-500 shrink-0" />
                        : <X size={16} className="text-gray-300 shrink-0" />}
                      <span className={f.included ? 'text-gray-700' : 'text-gray-400 line-through'}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className={`block w-full text-center py-3 rounded-xl font-bold transition-colors
                    ${pkg.popular ? 'bg-primary/50 text-white hover:bg-orange-600' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  Get Started
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
            <Star size={20} className="text-green-500" />
            <p className="text-green-700 font-medium text-sm">
              All packages include our <strong>98% Pass Rate Guarantee</strong> — or free repeat lessons until you pass.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ snippet */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Common Pricing Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Are there any hidden fees?', a: 'No. The package price includes all lessons, theory materials, and exam preparation. The only additional cost may be the government RMV exam fee.' },
              { q: 'Can I pay in installments?', a: 'Yes! We offer flexible payment plans. Contact us to arrange a payment schedule that works for you.' },
              { q: 'What if I need more lessons than the package includes?', a: 'Additional lessons can be purchased at Rs. 2,000 per hour. Premium package students receive unlimited free repeats.' },
            ].map(({ q, a }, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/faq" className="text-primary hover:text-primary font-semibold text-sm">View All FAQs →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Your Licence?</h2>
          <p className="text-orange-100 mb-8">Join today and start your journey towards becoming a confident driver.</p>
          <Link to="/register" className="inline-block px-8 py-3.5 rounded-xl bg-white text-primary font-bold hover:bg-primary/5 transition-colors">
            Register Now — It's Free
          </Link>
        </div>
      </section>
    </div>
  );
}
