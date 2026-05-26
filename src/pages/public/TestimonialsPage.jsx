import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  { name: 'Samantha Perera', course: 'Car (Class B)', date: 'March 2025', rating: 5, text: 'Eranga Driving School was amazing! My instructor Kamal sir was patient and explained everything clearly. I passed on my first attempt! Highly recommend to anyone in Kurunegala.' },
  { name: 'Pradeep Kumar', course: 'Motorcycle (Class A)', date: 'January 2025', rating: 5, text: 'The motorcycle training was thorough and safe. Nimal sir taught me balance and road awareness step by step. The dual-control setup gave me so much confidence.' },
  { name: 'Fathima Rizana', course: 'Car (Standard Package)', date: 'April 2025', rating: 5, text: 'I was nervous about driving but the instructors here made me feel very comfortable. The theory classes were excellent and the dashboard system for tracking my progress was very helpful.' },
  { name: 'Lahiru Bandara', course: 'Heavy Vehicle (Class CE)', date: 'February 2025', rating: 4, text: 'Professional training for my lorry licence. Chaminda sir knows the routes inside out. Good fleet and very organized scheduling system. Will recommend to my colleagues.' },
  { name: 'Ayesha Perera', course: 'Car (Premium Package)', date: 'May 2025', rating: 5, text: 'The premium package was worth every rupee. Highway driving, night sessions, defensive driving — all covered perfectly. I feel so confident on the road now.' },
  { name: 'Kasun Rajapaksha', course: 'Three-Wheeler (Class B1)', date: 'December 2024', rating: 5, text: 'Quick and efficient. Got my three-wheeler licence in just two weeks. The instructors are punctual and the vehicles are well-maintained. Great experience overall!' },
  { name: 'Dilrukshi Silva', course: 'Car (Basic Package)', date: 'March 2025', rating: 4, text: 'Good teaching methods and very patient instructors. The online booking system made scheduling my lessons very easy. Would have given 5 stars if there were more time slots available.' },
  { name: 'Rohan Wickramasinghe', course: 'Van (Class C)', date: 'January 2025', rating: 5, text: 'Excellent commercial vehicle training. The instructors understand the Sri Lankan road system very well and prepared me perfectly for the RMV test. Passed first time!' },
];

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={14} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const avg = (testimonials.reduce((a, t) => a + t.rating, 0) / testimonials.length).toFixed(1);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/50/20 text-primary text-sm font-semibold mb-4">Student Reviews</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">What Our Students Say</h1>
            <p className="text-gray-400 text-lg mb-8">Real stories from real graduates.</p>
            {/* Rating summary */}
            <div className="inline-flex flex-col items-center bg-white/10 rounded-2xl px-10 py-6 border border-white/20">
              <span className="text-5xl font-black text-primary">{avg}</span>
              <div className="flex gap-1 my-2">
                {[1,2,3,4,5].map(s => <Star key={s} size={20} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-gray-400 text-sm">Based on {testimonials.length}+ reviews</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-primary/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[['1000+', 'Graduates'], ['98%', 'Pass Rate'], ['4.9', 'Avg Rating'], ['15+', 'Years']].map(([v, l], i) => (
              <div key={i}><p className="text-3xl font-black">{v}</p><p className="text-orange-100 text-sm">{l}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map(({ name, course, date, rating, text }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} viewport={{ once: true }}
              className="border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all relative">
              <Quote size={32} className="text-orange-100 absolute top-4 right-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{name}</p>
                  <p className="text-primary text-xs">{course}</p>
                </div>
              </div>
              <Stars rating={rating} />
              <p className="text-gray-600 text-sm leading-relaxed mt-3 mb-3">"{text}"</p>
              <p className="text-gray-400 text-xs">{date}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-primary/50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Success Stories</h2>
          <p className="text-orange-100 mb-6">Become the next graduate to celebrate passing on your first attempt.</p>
          <Link to="/register" className="inline-block px-8 py-3 rounded-xl bg-white text-primary font-bold hover:bg-primary/5 transition-colors">
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}
