import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  Save, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown, 
  Home, Edit3, Type, Star, MessageSquare, MapPin, Upload, Loader2, CheckCircle 
} from 'lucide-react';

export default function ManageHomePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Home page state
  const [heroSlides, setHeroSlides] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  // Uploading state
  const [uploading, setUploading] = useState({ type: null, index: null });

  // Load from Firestore or fallback to default homepage data
  useEffect(() => {
    (async () => {
      try {
        const docRef = doc(db, 'settings', 'homepage');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setHeroSlides(data.heroSlides || []);
          setGalleryImages(data.galleryImages || []);
          setTestimonials(data.testimonials || []);
        } else {
          // Defaults matching original Homepage
          setHeroSlides([
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
          setGalleryImages([
            "/images/happy_student_license_1779561909390.png",
            "/images/sl_car_practice_1778907138866.png",
            "/images/student_female_avatar.png",
            "/images/student_male_avatar.png",
            "/images/sl_bike_practice_1778907087379.png",
            "/images/sl_van_practice_1778907161234.png"
          ]);
          setTestimonials([
            {
              text: "I got my license on my first attempt! The instructors made me feel so confident on the road. They were organized, kind, patient, and prepared me methodically for the practical test.",
              name: "Harshika Jayasekara",
              location: "Kurunegala, Sri Lanka",
              image: "/images/student_female_avatar.png",
              rating: 5
            },
            {
              text: "The online portal made booking lessons and studying road signs incredibly easy. The instructors are highly professional and supportive. I passed my trail test yesterday.",
              name: "Thilina Perera",
              location: "Peradeniya, Sri Lanka",
              image: "/images/student_male_avatar.png",
              rating: 5
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, 'settings', 'homepage'), {
        heroSlides,
        galleryImages,
        testimonials,
        updatedAt: new Date().toISOString()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving homepage config:', err);
      alert('Failed to save homepage settings');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload helper
  const handleFileUpload = async (file, type, index = null) => {
    if (!file) return;
    setUploading({ type, index });
    const storageRef = ref(storage, `homepage/${type}_${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        console.error('Upload error:', error);
        alert('Image upload failed');
        setUploading({ type: null, index: null });
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        if (type === 'hero') {
          const updated = [...heroSlides];
          updated[index].image = downloadUrl;
          setHeroSlides(updated);
        } else if (type === 'gallery') {
          if (index !== null) {
            const updated = [...galleryImages];
            updated[index] = downloadUrl;
            setGalleryImages(updated);
          } else {
            setGalleryImages([...galleryImages, downloadUrl]);
          }
        } else if (type === 'testimonial') {
          const updated = [...testimonials];
          updated[index].image = downloadUrl;
          setTestimonials(updated);
        }
        setUploading({ type: null, index: null });
      }
    );
  };

  // Add/Remove Helpers
  const addHeroSlide = () => {
    setHeroSlides([...heroSlides, { image: '', title: 'New Slide Title', subtitle: 'Slide subtitle text goes here.' }]);
  };

  const removeHeroSlide = (idx) => {
    setHeroSlides(heroSlides.filter((_, i) => i !== idx));
  };

  const addTestimonial = () => {
    setTestimonials([...testimonials, { text: 'Outstanding classes and supportive team!', name: 'New Student', location: 'Kurunegala', image: '/images/student_male_avatar.png', rating: 5 }]);
  };

  const removeTestimonial = (idx) => {
    setTestimonials(testimonials.filter((_, i) => i !== idx));
  };

  const removeGalleryImage = (idx) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={28} className="animate-spin" color="#f97316" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #ec4899, #d946ef)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(236,72,153,0.25)',
          }}>
            <Home size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Home Page Management</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Update sliders, graduates photos, and customer testimonials</p>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* 1. HERO SLIDESHOW EDIT */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 650, color: '#111827', margin: 0 }}>Hero Carousel Slides</h2>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Add slides that display on the main landing slider block</p>
            </div>
            <button onClick={addHeroSlide} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
            }}>
              <Plus size={16} /> Add New Slide
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {heroSlides.map((slide, idx) => (
              <div key={idx} style={{ padding: 16, border: '1px solid #f3f4f6', borderRadius: 12, background: '#fafafa', display: 'flex', gap: 16 }}>
                {/* Image upload block */}
                <div style={{ width: 180, flexShrink: 0 }}>
                  <div style={{ width: '100%', height: 110, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden', position: 'relative', border: '1px solid #e5e7eb' }}>
                    {slide.image ? (
                      <img src={slide.image} alt="" style={{ width: '100%', height: '100%', objectCover: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                        <ImageIcon size={24} />
                        <span style={{ fontSize: 10, marginTop: 4 }}>No Image</span>
                      </div>
                    )}
                    {uploading.type === 'hero' && uploading.index === idx && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: '6px 0', border: '1px dashed #d1d5db', borderRadius: 6,
                    fontSize: 11.5, fontWeight: 550, color: '#4b5563', cursor: 'pointer', marginTop: 8, background: '#fff'
                  }}>
                    <Upload size={13} /> Upload Image
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e.target.files[0], 'hero', idx)} />
                  </label>
                </div>

                {/* Form fields */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => {
                      const updated = [...heroSlides];
                      updated[idx].title = e.target.value;
                      setHeroSlides(updated);
                    }}
                    placeholder="Slide Title / Main Text"
                    style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600 }}
                  />
                  <textarea
                    value={slide.subtitle}
                    onChange={(e) => {
                      const updated = [...heroSlides];
                      updated[idx].subtitle = e.target.value;
                      setHeroSlides(updated);
                    }}
                    placeholder="Slide Subtitle Description text"
                    rows={2}
                    style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12.5 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => removeHeroSlide(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                      <Trash2 size={14} /> Remove Slide
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. GRADUATES PHOTO GALLERY */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e5e7eb' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 650, color: '#111827', margin: 0 }}>Proud Graduates Photo Gallery</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 16px' }}>Upload photos of students who passed their driving trials</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14, marginBottom: 16 }}>
            {galleryImages.map((imgUrl, idx) => (
              <div key={idx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3', border: '1px solid #e5e7eb', background: '#f3f4f6' }}>
                <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => removeGalleryImage(idx)}
                  style={{
                    position: 'absolute', top: 6, right: 6, background: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Add placeholder button */}
            <label style={{
              border: '2px dashed #d1d5db', borderRadius: 8, aspectRatio: '4/3',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#6b7280', cursor: 'pointer', background: '#fafafa', hover: { background: '#f3f4f6' }
            }}>
              {uploading.type === 'gallery' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Plus size={20} />
                  <span style={{ fontSize: 11, marginTop: 4, fontWeight: 550 }}>Add Photo</span>
                </>
              )}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e.target.files[0], 'gallery')} />
            </label>
          </div>
        </div>

        {/* 3. TESTIMONIALS */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 650, color: '#111827', margin: 0 }}>Student Testimonials</h2>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Manage success reviews shown on the front page</p>
            </div>
            <button onClick={addTestimonial} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, border: 'none', background: '#fdf2f8', color: '#db2777',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
            }}>
              <Plus size={16} /> Add Testimonial
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {testimonials.map((testi, idx) => (
              <div key={idx} style={{ padding: 16, border: '1px solid #f3f4f6', borderRadius: 12, background: '#fafafa', display: 'flex', gap: 16 }}>
                {/* Student Avatar */}
                <div style={{ width: 100, flexShrink: 0 }}>
                  <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', position: 'relative', margin: '0 auto', border: '1px solid #e5e7eb' }}>
                    {testi.image ? (
                      <img src={testi.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                        <ImageIcon size={18} />
                      </div>
                    )}
                    {uploading.type === 'testimonial' && uploading.index === idx && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Loader2 size={14} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <label style={{
                    display: 'block', textAlign: 'center', fontSize: 10, fontWeight: 600,
                    color: '#2563eb', cursor: 'pointer', marginTop: 8
                  }}>
                    Change Photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e.target.files[0], 'testimonial', idx)} />
                  </label>
                </div>

                {/* Testimonial details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      value={testi.name}
                      onChange={(e) => {
                        const updated = [...testimonials];
                        updated[idx].name = e.target.value;
                        setTestimonials(updated);
                      }}
                      placeholder="Student Name"
                      style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}
                    />
                    <input
                      type="text"
                      value={testi.location}
                      onChange={(e) => {
                        const updated = [...testimonials];
                        updated[idx].location = e.target.value;
                        setTestimonials(updated);
                      }}
                      placeholder="Location (e.g. Kurunegala)"
                      style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12.5 }}
                    />
                  </div>
                  <textarea
                    value={testi.text}
                    onChange={(e) => {
                      const updated = [...testimonials];
                      updated[idx].text = e.target.value;
                      setTestimonials(updated);
                    }}
                    placeholder="Testimonial review text..."
                    rows={2}
                    style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12.5 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#4b5563' }}>Rating:</span>
                      <select
                        value={testi.rating}
                        onChange={(e) => {
                          const updated = [...testimonials];
                          updated[idx].rating = Number(e.target.value);
                          setTestimonials(updated);
                        }}
                        style={{ padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}
                      >
                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeTestimonial(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                      <Trash2 size={14} /> Remove Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button block */}
        <motion.div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px 28px', borderRadius: 14,
              background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ec4899, #d946ef)',
              color: '#fff', border: 'none', fontSize: 15, fontWeight: 650,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: saved ? '0 4px 14px rgba(16,185,129,0.3)' : '0 4px 14px rgba(236,72,153,0.3)',
              transition: 'all 0.3s ease',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle size={18} /> Homepage Saved Successfully</>
            ) : (
              <><Save size={18} /> Save Homepage Settings</>
            )}
          </button>
        </motion.div>

      </div>
    </div>
  );
}
