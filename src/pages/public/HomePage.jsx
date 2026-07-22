import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Headphones, MapPin, Award, TrendingUp, Star, ShieldCheck, Check, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: 'easeOut' },
  }),
};

export default function HomePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Dynamic states
  const [heroSlides, setHeroSlides] = useState([
    {
      image: "/images/hero_driving_lesson_1779561685186.png",
      title: "Master the Road with Confidence",
      subtitle: "Sri Lanka's Premier Driver Education Platform, empowering the next generation of safe drivers."
    },
    {
      image: "/images/hero_training_fleet_1779561893072.png",
      title: "Learn from Kurunegala's Elite Instructors",
      subtitle: "Maintaining a verified 98% first-attempt success rate across all vehicle classes."
    }
  ]);

  const [galleryImages, setGalleryImages] = useState([
    "/images/happy_student_license_1779561909390.png",
    "/images/sl_car_practice_1778907138866.png",
    "/images/student_female_avatar.png",
    "/images/student_male_avatar.png",
    "/images/sl_bike_practice_1778907087379.png",
    "/images/sl_van_practice_1778907161234.png"
  ]);

  const [testimonials, setTestimonials] = useState([
    {
      text: "I got my license on my first attempt! The instructors made me feel so confident on the road. They were organized, kind, patient, and prepared me methodically for the practical test. Couldn't have imagined anyone better.",
      name: "Harshika Jayasekara",
      location: "Kurunegala, Sri Lanka",
      image: "/images/student_female_avatar.png",
      rating: 5
    },
    {
      text: "The online portal made booking lessons and studying road signs incredibly easy. The instructors are highly professional and supportive. I passed my trail test yesterday with zero mistakes. Highly recommend DriveAdmin!",
      name: "Thilina Perera",
      location: "Peradeniya, Sri Lanka",
      image: "/images/student_male_avatar.png",
      rating: 5
    }
  ]);

  // Load custom homepage contents
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'homepage'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.heroSlides && data.heroSlides.length > 0) setHeroSlides(data.heroSlides);
          if (data.galleryImages && data.galleryImages.length > 0) setGalleryImages(data.galleryImages);
          if (data.testimonials && data.testimonials.length > 0) setTestimonials(data.testimonials);
        }
      } catch (err) {
        console.error('Error fetching dynamic home contents:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (testimonials.length === 0) return;
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handleSelectPackage = (packageKey) => {
    localStorage.setItem('selectedPackage', packageKey);
    if (currentUser) {
      navigate('/student');
    } else {
      navigate('/login');
    }
  };

  const specialItems = [
    {
      icon: Headphones,
      title: "Customer Support",
      desc: "Our support team is dedicated to providing exceptional service and ensuring student satisfaction. We are here to assist you every step of the way."
    },
    {
      icon: MapPin,
      title: "Peradeniya & Kurunegala",
      desc: "We know the value of your time. We support practical trials directly at Kurunegala and Peradeniya Trial Points to optimize your timeline."
    },
    {
      icon: Award,
      title: "Top Rated Driving School",
      desc: "We are Kurunegala's most highly rated Driving School on Google reviews. Students give us high ratings due to our personalized services."
    },
    {
      icon: TrendingUp,
      title: "Top Results From Us",
      desc: "We proudly announce over 98% practical trial success rates. We offer the best expert instructors for both Auto and Manual options."
    }
  ];

  return (
    <div className="bg-surface font-body-md text-on-surface selection:bg-primary selection:text-white">

      {/* HERO SLIDESHOW SECTION */}
      <section className="relative h-[65vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-slate-900">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
              index === activeSlide ? "opacity-60 scale-100" : "opacity-0 scale-105 pointer-events-none"
            }`}
            style={{ transition: 'opacity 1s ease-in-out, transform 6s ease-in-out' }}
          >
            <img
              alt={slide.title}
              className="w-full h-full object-cover"
              src={slide.image}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/30 z-10"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 max-w-4xl text-center px-margin-mobile mt-8"
        >
          <div className="inline-flex items-center gap-xs bg-white/10 px-md py-base rounded-full border border-white/20 mb-lg backdrop-blur-md">
            <span className="text-blue-400 material-symbols-outlined text-[18px] fill-current">verified</span>
            <span className="font-label-md text-label-md text-white/90">Kurunegala's Most Rated Learning Platform</span>
          </div>

          <h1 className="font-headline-xl text-[38px] leading-[46px] md:text-[56px] md:leading-[64px] text-white mb-md font-extrabold tracking-tight">
            {heroSlides[activeSlide].title}
          </h1>

          <p className="font-body-lg text-body-lg text-white/80 mb-xl max-w-2xl mx-auto">
            {heroSlides[activeSlide].subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
            <Link to="/register" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-xl py-md rounded-xl font-label-md text-label-md shadow-xl hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 text-center font-bold">Get Started Now</Link>
            <Link to="/login" className="w-full sm:w-auto bg-white/10 text-white border border-white/20 px-xl py-md rounded-xl font-label-md text-label-md hover:bg-white/20 backdrop-blur-md transition-all text-center font-bold">Student Portal</Link>
          </div>
        </motion.div>

        <div className="absolute bottom-md left-1/2 -translate-x-1/2 z-20 flex gap-xs">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === activeSlide ? "bg-primary w-6" : "bg-white/40 w-2 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

      {/* CONTENT ACTION GRID */}
      <section className="py-xl px-margin-mobile bg-slate-50 relative z-20 -mt-12 max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {[
            {
              img: "/images/road_signs_feature.png",
              title: "Official Road Signs",
              desc: "Master Sri Lankan highway and utility road signs. Essential study guides for the written examination.",
              link: "/login",
              cta: "Open Learning Center"
            },
            {
              img: "/images/theory_paper_feature.png",
              title: "Online Theory Paper",
              desc: "Practice with our real-time randomized theory mock exams modeled exactly after the DMV standard.",
              link: "/login",
              cta: "Start Mock Exam"
            },
            {
              img: "/images/online_registry_feature.png",
              title: "Quick Online Registry",
              desc: "Sign up on our next-gen digital portal, receive prompt admin approval, and choose your driving packages.",
              link: "/register",
              cta: "Apply Online Now"
            }
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 hover:border-primary/20 group flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden bg-slate-100 relative">
                  <img alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={card.img} />
                </div>
                <div className="p-lg">
                  <h3 className="font-headline-md text-headline-md text-slate-800 mb-xs group-hover:text-primary transition-colors font-bold">{card.title}</h3>
                  <p className="text-body-sm text-slate-500 font-medium leading-relaxed">{card.desc}</p>
                </div>
              </div>
              <div className="p-lg pt-0">
                <Link to={card.link} className="text-primary font-bold text-label-md inline-flex items-center gap-xs group-hover:gap-md transition-all bg-primary-light/50 px-4 py-2 rounded-lg">
                  {card.cta} <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHY ARE WE SPECIAL SECTION */}
      <section id="why-special" className="py-24 px-margin-mobile bg-white border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-xl items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="w-full lg:w-3/5"
            >
              <div className="mb-lg">
                <span className="text-primary font-black tracking-widest uppercase text-[11px] bg-primary-light px-3 py-1 rounded-full">Premium Quality Service</span>
                <h2 className="font-headline-lg text-4xl font-extrabold text-slate-800 mt-xs leading-tight">Why is DriveAdmin Special?</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                {specialItems.map((item, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={i}
                    className="flex gap-md items-start"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex-shrink-0 flex items-center justify-center shadow-sm">
                      <item.icon size={22} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-xs text-base">{item.title}</h4>
                      <p className="text-body-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Spotlight Testimonial Widget */}
            <motion.div
              id="testimonials"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full lg:w-2/5 bg-gradient-to-br from-primary to-[#051120] text-white p-xl rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[380px] border border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <Quote size={180} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-md">
                  <div className="flex items-center gap-xs">
                    <Quote size={28} className="text-blue-400 rotate-180" />
                    <span className="font-headline-md text-lg font-bold tracking-tight">Student Success Stories</span>
                  </div>
                  <div className="flex gap-xs">
                    <button 
                      onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)} 
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)} 
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="h-[140px] overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeTestimonial}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="font-body-md text-slate-300 italic leading-relaxed text-sm"
                    >
                      "{testimonials[activeTestimonial].text}"
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-md pt-md border-t border-white/10 mt-4">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeTestimonial}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-md w-full"
                  >
                    <img
                      alt={testimonials[activeTestimonial].name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-400 shadow-md bg-slate-800"
                      src={testimonials[activeTestimonial].image}
                    />
                    <div>
                      <h5 className="font-label-md text-sm font-bold text-white">{testimonials[activeTestimonial].name}</h5>
                      <p className="text-[12px] text-slate-400">{testimonials[activeTestimonial].location}</p>
                      <div className="flex gap-1 mt-1 text-yellow-400">
                        {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                          <Star key={i} size={13} className="fill-current text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRAINING FLEET SECTION */}
      <section id="fleet" className="py-24 px-margin-mobile bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-black uppercase tracking-widest text-[11px] bg-primary-light px-3 py-1 rounded-full">Our Training Fleet</span>
            <h2 className="font-headline-lg text-4xl font-extrabold text-slate-800 mt-xs">Vehicles &amp; License Classes</h2>
            <p className="text-body-sm text-slate-500 font-medium mt-xs max-w-xl mx-auto">We provide training in modern, fully insured, dual-controlled vehicles tailored to your license preferences.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                img: "/images/sl_car_practice_1778907138866.png",
                title: "Light Motor Car (B Class)",
                badge: "Manual & Auto",
                desc: "Train in dual-controlled modern cars. Master highway driving, reverse parking, and lane discipline."
              },
              {
                img: "/images/sl_bike_practice_1778907087379.png",
                title: "Motorcycle (A Class)",
                badge: "Geared & Scooter",
                desc: "Learn balance, control, and traffic regulations on our private tracks. Geared and auto options available."
              },
              {
                img: "/images/sl_van_practice_1778907161234.png",
                title: "Light Van / Dual Purpose",
                badge: "B1 Class",
                desc: "Gain expertise in driving light trucks and commercial delivery vans. Excellent career-oriented training."
              }
            ].map((vehicle, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={idx}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition-all hover:-translate-y-1"
              >
                <div className="h-52 overflow-hidden bg-slate-100 relative">
                  <img src={vehicle.img} alt={vehicle.title} className="w-full h-full object-cover" />
                  <span className="absolute top-4 right-4 bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">{vehicle.badge}</span>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-slate-800 text-lg mb-2">{vehicle.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">{vehicle.desc}</p>
                  <Link to="/register" className="text-primary font-bold text-xs inline-flex items-center gap-1 hover:underline">
                    Enroll in Class <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL GRADUATES GALLERY */}
      <section id="gallery" className="py-24 px-margin-mobile bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-black uppercase tracking-widest text-[11px] bg-primary-light px-3 py-1 rounded-full">Our Wall of Fame</span>
            <h2 className="font-headline-lg text-4xl font-extrabold text-slate-800 mt-xs">Proud Successful Graduates</h2>
            <p className="text-body-sm text-slate-500 font-medium mt-xs">Real students who aced their driving trials and won their licenses on the first run!</p>
          </motion.div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {galleryImages.map((imgUrl, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
                className="break-inside-avoid relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 hover:border-primary/30 transition-all duration-300 group cursor-pointer bg-slate-50"
              >
                <img
                  alt={`Successful Graduate ${index + 1}`}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  src={imgUrl}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white font-bold text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                    <Star size={16} className="text-yellow-400 fill-current" /> Passed First Attempt!
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES SECTION */}
      <section id="packages" className="py-24 px-margin-mobile bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-black uppercase tracking-widest text-[11px] bg-primary-light px-3 py-1 rounded-full">Structured Plans</span>
            <h2 className="font-headline-lg text-4xl font-extrabold text-slate-800 mt-xs">Our Packages &amp; Special Offers</h2>
            <p className="font-body-md text-slate-500 font-medium max-w-xl mx-auto mt-xs">Choose the perfect plan tailored to your learning goals and schedule.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-stretch max-w-6xl mx-auto">
            {/* Motorcycle Package */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="flex flex-col p-8 bg-white rounded-3xl shadow-sm border border-slate-100 transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <h3 className="font-bold text-slate-800 text-2xl mb-xs">Motorcycle</h3>
              <div className="mb-lg">
                <span className="text-[36px] font-black text-primary">Rs. 5,500</span>
              </div>
              <ul className="space-y-sm mb-xl flex-grow font-medium">
                {['6 Practical Sessions', 'Theory Support Included', 'Private Practice Tracks'].map((f, i) => (
                  <li key={i} className="flex items-center gap-xs text-sm text-slate-500">
                    <span className="material-symbols-outlined text-primary text-[20px] fill-current">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSelectPackage('lv-bike')} className="w-full py-3.5 px-lg rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all">Select Package</button>
            </motion.div>

            {/* Car Manual Package */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="relative flex flex-col p-8 bg-white rounded-3xl shadow-md border-2 border-primary lg:scale-105 z-10"
            >
              <div className="flex justify-between items-start mb-xs">
                <h3 className="font-bold text-slate-800 text-2xl">Car Manual</h3>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold tracking-wider">POPULAR</span>
              </div>
              <div className="mb-lg">
                <span className="text-[36px] font-black text-primary">Rs. 11,000</span>
              </div>
              <ul className="space-y-sm mb-xl flex-grow font-medium">
                {['10 Practical Sessions', 'Comprehensive Theory Support', 'Mock Test Included', 'Dual-Control Vehicles'].map((f, i) => (
                  <li key={i} className="flex items-center gap-xs text-sm text-slate-700">
                    <span className="material-symbols-outlined text-primary text-[20px] fill-current">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSelectPackage('lv-car-manual')} className="w-full py-3.5 px-lg rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary-hover transition-all active:scale-95">Select Package</button>
            </motion.div>

            {/* Car Auto Package */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="flex flex-col p-8 bg-white rounded-3xl shadow-sm border border-slate-100 transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <h3 className="font-bold text-slate-800 text-2xl mb-xs">Car Automatic</h3>
              <div className="mb-lg">
                <span className="text-[36px] font-black text-primary">Rs. 13,000</span>
              </div>
              <ul className="space-y-sm mb-xl flex-grow font-medium font-medium">
                {['10 Practical Sessions', 'Comprehensive Theory Support', 'Mock Test Included', 'Smooth Auto Vehicles'].map((f, i) => (
                  <li key={i} className="flex items-center gap-xs text-sm text-slate-500">
                    <span className="material-symbols-outlined text-primary text-[20px] fill-current">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSelectPackage('lv-car-auto')} className="w-full py-3.5 px-lg rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all">Select Package</button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* LOCATIONS & MAPS SECTION */}
      <section id="locations" className="py-24 px-margin-mobile bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-black uppercase tracking-widest text-[11px] bg-primary-light px-3 py-1 rounded-full">Find Us</span>
            <h2 className="font-headline-lg text-4xl font-extrabold text-slate-800 mt-xs">Key Locations & Maps</h2>
            <p className="font-body-md text-slate-500 font-medium max-w-xl mx-auto mt-xs">Everything you need to know about our training centers, medical testing, and RMV offices.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Frame */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 rounded-3xl overflow-hidden shadow-lg border border-slate-200 h-[400px] lg:h-auto relative"
            >
              <iframe 
                src="https://maps.google.com/maps?q=Kurunegala+Sri+Lanka&t=&z=13&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0, minHeight: '100%' }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Eranga Driving School Location"
              ></iframe>
            </motion.div>

            {/* Location Cards */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-4"
            >
              {/* Driving School */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer group" onClick={() => window.open('https://maps.app.goo.gl/3wQqxtfqNeRwjk7V6', '_blank')}>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Eranga Driving School</h3>
                    <p className="text-sm text-slate-500 mt-1">Main Training Center & Office. Click to open in Google Maps.</p>
                  </div>
                </div>
              </div>

              {/* Medical Center */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-blue-500/30 transition-all hover:shadow-md group">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">NTMI Medical Center</h3>
                    <p className="text-sm text-slate-500 mt-1">Required for Medical Certificates. Locate your nearest branch for tests.</p>
                  </div>
                </div>
              </div>

              {/* RMV / DMV */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-orange-500/30 transition-all hover:shadow-md group">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 p-3 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                    <Award size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">RMV / DMV Office</h3>
                    <p className="text-sm text-slate-500 mt-1">For Written & Practical Exams. Typically coordinated by our instructors.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-margin-mobile bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-primary to-[#051120] p-8 md:p-[64px] text-center border border-slate-100 shadow-2xl"
          >
            {/* Background image overlay */}
            <div className="absolute inset-0 bg-[url('/images/hero_driving_lesson_1779561685186.png')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
            
            <div className="relative z-10 text-white max-w-3xl mx-auto">
              <h2 className="font-headline-xl text-3xl md:text-5xl font-extrabold mb-md leading-tight text-white">Start Your Driving Journey Today!</h2>
              <p className="font-body-lg text-slate-300 mb-lg max-w-xl mx-auto text-sm md:text-base font-medium">
                Join thousands of successful drivers who have claimed their independence on the road with DriveAdmin.
              </p>
              <Link to="/register" className="bg-primary hover:bg-primary-hover border border-white/10 text-white px-8 py-3.5 rounded-xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 inline-block">Register Online Now</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

