import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { CATEGORIES, getPackagesByCategory, formatPrice } from '../../data/packages';
import { generateStudentSchedule } from '../../utils/autoSchedule';

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_LABELS = 'PDF, JPG, or PNG';
const MAX_IMAGE_DIM = 1200; // px – resize to this longest edge before upload
const JPEG_QUALITY = 0.75;

// ── Image compressor ─────────────────────────────────────────────────────────
function compressImage(file) {
  return new Promise((resolve) => {
    // Skip PDFs – only compress images
    if (file.type === 'application/pdf') { resolve(file); return; }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      // Only downscale, never upscale
      if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
        const ratio = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const compressed = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
          resolve(compressed);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); }; // fallback
    img.src = url;
  });
}

// ── Styles ───────────────────────────────────────────────────────────────────
const css = {
  wrapper: {
    minHeight: '100vh',
    background: '#F1F4F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'var(--font-body)',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 10px 30px rgba(11, 37, 69, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#111c2d',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#737686',
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '32px',
  },
  dot: (active) => ({
    width: active ? '24px' : '8px',
    height: '8px',
    borderRadius: '4px',
    background: active ? '#0B2545' : '#dee2e6',
    transition: 'all 0.3s',
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  optionBtn: (selected) => ({
    background: selected ? '#e7eeff' : '#ffffff',
    border: `2px solid ${selected ? '#0B2545' : '#dee2e6'}`,
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  }),
  icon: { fontSize: '32px' },
  pkgTitle: { fontSize: '16px', fontWeight: '800', color: '#111c2d' },
  pkgPrice: { fontSize: '14px', fontWeight: '700', color: '#0B2545' },
  fileInputBox: (isDragOver) => ({
    border: `2px dashed ${isDragOver ? '#0B2545' : '#dee2e6'}`,
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    background: isDragOver ? '#e7eeff' : '#f9fafb',
    marginBottom: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  btnRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '32px',
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid #dee2e6',
    color: '#505f76',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  nextBtn: {
    background: '#0B2545',
    border: 'none',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  // ── Progress bar ─────────────────────────────
  progressWrapper: {
    marginBottom: '20px',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0B2545',
    marginBottom: '6px',
  },
  progressTrack: {
    height: '8px',
    borderRadius: '4px',
    background: '#e9ecef',
    overflow: 'hidden',
  },
  progressBar: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    borderRadius: '4px',
    background: 'linear-gradient(90deg, #0B2545, #1a6bff)',
    transition: 'width 0.3s ease',
  }),
  // ── File preview chip ────────────────────────
  fileChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: '#e7eeff',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  fileChipName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0B2545',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '320px',
  },
  fileChipSize: {
    fontSize: '12px',
    color: '#505f76',
    fontWeight: '600',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#ba1a1a',
    padding: '0 4px',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#065f46',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function SetupWizard() {
  const { userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [medicalFile, setMedicalFile] = useState(null);
  const [uploadLater, setUploadLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);    // 0-100
  const [uploadPhase, setUploadPhase] = useState('');          // '' | 'compressing' | 'uploading' | 'done'
  const [isDragOver, setIsDragOver] = useState(false);

  // Step 4 Form State
  const [formData, setFormData] = useState({
    fullName: userProfile?.name || '',
    address: '',
    dob: '',
    nic: '',
    phone: '',
    emergencyContact: '',
    preferredTime: 'morning',
    preferredDays: 'weekdays'
  });

  const totalPrice = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);

  // ── File validation ──────────────────────────────────────────────────────
  const validateFile = useCallback((file) => {
    if (!file) return 'No file selected.';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type "${file.type.split('/')[1] || '?'}". Only ${ALLOWED_LABELS} allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${formatBytes(file.size)}). Maximum is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return '';
  }, []);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError('');
    setMedicalFile(file);
    setUploadPhase('');
    setUploadProgress(0);
  }, [validateFile]);

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e) => { e.preventDefault(); setIsDragOver(false); if (!uploadLater && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); };

  // ── Upload with progress ─────────────────────────────────────────────────
  const uploadFile = async (file) => {
    const fileRef = ref(storage, `medical_certs/${userProfile.id}_${Date.now()}_${file.name}`);
    
    // We use a manual Promise race to timeout the upload if Firebase hangs
    const uploadPromise = uploadBytes(fileRef, file).then(async (snapshot) => {
      setUploadProgress(100);
      return await getDownloadURL(snapshot.ref);
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase Storage timeout. Please check if Storage is enabled and rules allow writes in your Firebase Console.')), 10000);
    });

    return Promise.race([uploadPromise, timeoutPromise]);
  };

  // ── Step navigation ──────────────────────────────────────────────────────
  const handleNext = async () => {
    setError('');

    if (step === 1 && !selectedCategory) {
      setError('Please select a category to continue.');
      return;
    }

    if (step === 2 && selectedPackages.length === 0) {
      setError('Please select at least one vehicle to continue.');
      return;
    }

    if (step === 3) {
      if (!medicalFile && !uploadLater) {
        setError('Please upload your medical certificate or check "upload later".');
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      if (!formData.fullName || !formData.address || !formData.dob || !formData.nic || !formData.phone) {
        setError('Please fill out all required details.');
        return;
      }
      await completeSetup();
      return;
    }

    setStep(step + 1);
  };

  // ── Complete setup ────────────────────────────────────────────────────────
  const completeSetup = async () => {
    setLoading(true);
    setError('');

    // Compute total price from selected packages
    const totalPrice = selectedPackages.reduce((sum, pkg) => sum + (pkg.price || 0), 0);

    try {
      let medicalUrl = '';
      let medicalStatus = 'pending';

      // 1. Upload Medical File if provided
      if (medicalFile && !uploadLater) {
        setUploadPhase('compressing');
        setUploadProgress(0);
        const compressed = await compressImage(medicalFile);

        setUploadPhase('uploading');
        setUploadProgress(0);
        try {
          medicalUrl = await uploadFile(compressed);
          medicalStatus = 'uploaded';
          setUploadPhase('done');
        } catch (uploadError) {
          console.warn('Upload failed, but continuing setup:', uploadError);
          medicalStatus = 'pending'; // Fallback so they can upload later
        }
      }

      // 2. Update Student Profile in Firestore
      const userRef = doc(db, 'users', userProfile.id);

      const updateData = {
        setup_completed: true,
        enrolledPackage: selectedPackages.map(p => p.name).join(', '),
        selected_vehicles: selectedPackages.map(p => p.id),
        total_price: totalPrice,
        category: selectedCategory,
        medical_status: medicalStatus,
        medical_url: medicalUrl,
        classesTotal: selectedPackages.reduce((acc, p) => acc + (p.sessions || 10), 0),
        outstandingFees: totalPrice,
        ...formData
      };

      await updateDoc(userRef, updateData);

      // 3. Generate Schedule
      const schedule = generateStudentSchedule(selectedPackages, {
        preferredDays: formData.preferredDays,
        preferredTime: formData.preferredTime
      });

      const batch = writeBatch(db);
      const schedulesRef = collection(db, 'student_schedules');
      
      schedule.forEach(session => {
        const newDocRef = doc(schedulesRef);
        batch.set(newDocRef, {
          studentId: userProfile.id,
          studentName: formData.fullName,
          ...session
        });
      });
      
      await batch.commit();

      // 4. Update local state
      setUserProfile({
        ...userProfile,
        ...updateData
      });

      navigate('/student', { replace: true });

    } catch (err) {
      console.error('Setup failed:', err);
      setError(`Failed to complete setup. Please try again. Error: ${err.message || err.toString()}`);
      setUploadPhase('');
    } finally {
      setLoading(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderProgress = () => {
    if (!uploadPhase) return null;

    const labelMap = {
      compressing: 'Compressing image…',
      uploading: 'Uploading…',
      done: 'Upload complete ✓',
    };

    return (
      <div style={css.progressWrapper}>
        <div style={css.progressLabel}>
          <span>{labelMap[uploadPhase]}</span>
          {uploadPhase === 'uploading' && <span>{uploadProgress}%</span>}
        </div>
        <div style={css.progressTrack}>
          <div style={css.progressBar(uploadPhase === 'compressing' ? 15 : uploadPhase === 'done' ? 100 : uploadProgress)} />
        </div>
      </div>
    );
  };

  return (
    <div style={css.wrapper}>
      <div style={css.card}>
        <div style={css.header}>
          <h1 style={css.title}>Account Setup</h1>
          <p style={css.subtitle}>
            {step === 1 && "What type of vehicle do you want to learn?"}
            {step === 2 && "Choose your training package"}
            {step === 3 && "Upload your RMV Medical Certificate"}
            {step === 4 && "Finalize your profile"}
          </p>
        </div>

        <div style={css.stepIndicator}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={css.dot(step === s)} />
          ))}
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', color: '#ba1a1a', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {/* STEP 1: CATEGORY */}
        {step === 1 && (
          <div style={css.grid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                style={css.optionBtn(selectedCategory === cat.id)}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedPackages([]);
                }}
              >
                <div style={css.icon}>{cat.icon}</div>
                <div>
                  <div style={css.pkgTitle}>{cat.name}</div>
                  <div style={{ fontSize: '12px', color: '#737686', marginTop: '4px' }}>{cat.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: PACKAGE */}
        {step === 2 && (
          <>
            <div style={css.grid}>
              {getPackagesByCategory(selectedCategory).map(pkg => {
                const isSelected = selectedPackages.some(p => p.id === pkg.id);
                return (
                  <button
                    key={pkg.id}
                    style={css.optionBtn(isSelected)}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPackages(selectedPackages.filter(p => p.id !== pkg.id));
                      } else {
                        setSelectedPackages([...selectedPackages, pkg]);
                      }
                    }}
                  >
                    <div style={css.pkgTitle}>{pkg.name}</div>
                    <div style={css.pkgPrice}>{formatPrice(pkg.price)}</div>
                  </button>
                );
              })}
            </div>
            {selectedPackages.length > 0 && (
              <div style={{ background: '#e7eeff', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0B2545' }}>Total Price</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#111c2d' }}>{formatPrice(totalPrice)}</span>
              </div>
            )}
          </>
        )}

        {/* STEP 3: MEDICAL */}
        {step === 3 && (
          <div>
            {uploadPhase === 'done' && (
              <div style={css.successBanner}>
                <span style={{ fontSize: '18px' }}>✅</span>
                Upload successful! Your medical certificate has been saved.
              </div>
            )}
            {loading && renderProgress()}
            {medicalFile && !loading && (
              <div style={css.fileChip}>
                <div>
                  <div style={css.fileChipName}>📄 {medicalFile.name}</div>
                  <div style={css.fileChipSize}>{formatBytes(medicalFile.size)}</div>
                </div>
                <button style={css.removeBtn} onClick={() => { setMedicalFile(null); setUploadPhase(''); }} title="Remove file">✕</button>
              </div>
            )}
            {!medicalFile && (
              <label
                style={{ display: 'block', cursor: uploadLater ? 'not-allowed' : 'pointer', opacity: uploadLater ? 0.5 : 1 }}
                onDragOver={uploadLater ? undefined : onDragOver}
                onDragLeave={onDragLeave}
                onDrop={uploadLater ? undefined : onDrop}
              >
                <div style={css.fileInputBox(isDragOver)}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏥</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#111c2d', marginBottom: '8px' }}>
                    Click or drag to upload Medical Certificate
                  </div>
                  <div style={{ fontSize: '12px', color: '#737686' }}>
                    {ALLOWED_LABELS} · Max {formatBytes(MAX_FILE_SIZE)}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    disabled={uploadLater}
                  />
                </div>
              </label>
            )}
            <div style={{ textAlign: 'center', marginBottom: '16px', color: '#737686', fontWeight: '700' }}>OR</div>
            <label style={css.checkboxRow}>
              <input
                type="checkbox"
                checked={uploadLater}
                onChange={(e) => {
                  setUploadLater(e.target.checked);
                  if (e.target.checked) { setMedicalFile(null); setUploadPhase(''); }
                }}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#111c2d' }}>
                I don't have it yet, I will bring it later.
              </span>
            </label>
          </div>
        )}

        {/* STEP 4: DETAILS */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #dee2e6' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111c2d', marginBottom: '8px', marginTop: 0 }}>Student Details & Preferences</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>Full Name *</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>NIC *</label>
                <input type="text" value={formData.nic} onChange={e => setFormData({...formData, nic: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>Phone *</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>Date of Birth *</label>
                <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>Address *</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>Emergency Contact Name & Phone</label>
              <input type="text" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none' }} placeholder="e.g. John Doe - 0771234567" />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #dee2e6', margin: '16px 0' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111c2d', marginBottom: '8px', marginTop: 0 }}>Training Preferences</h3>
            <p style={{ fontSize: '13px', color: '#737686', marginBottom: '16px', marginTop: 0 }}>We will auto-generate your training schedule based on these preferences.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>Preferred Days</label>
                <select value={formData.preferredDays} onChange={e => setFormData({...formData, preferredDays: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none' }}>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekend">Weekends (Sat-Sun)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>Preferred Time</label>
                <select value={formData.preferredTime} onChange={e => setFormData({...formData, preferredTime: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none' }}>
                  <option value="morning">Morning (8 AM - 12 PM)</option>
                  <option value="evening">Evening (1 PM - 5 PM)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* BUTTONS */}
        <div style={css.btnRow}>
          {step > 1 && (
            <button style={css.backBtn} onClick={() => { setStep(step - 1); setError(''); }} disabled={loading}>Back</button>
          )}
          <button style={css.nextBtn} onClick={handleNext} disabled={loading}>
            {loading ? 'Processing...' : step === 4 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
