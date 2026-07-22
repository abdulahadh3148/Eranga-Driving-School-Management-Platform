import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth, db, storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, writeBatch, collection } from 'firebase/firestore';
import { CATEGORIES, getPackagesByCategory, formatPrice } from '../../data/packages';
import { generateSkills } from '../../utils/skillGenerator';
import { Car, Truck, CheckCircle2, FileImage, UploadCloud, FileText, CheckSquare, Square } from 'lucide-react';


// ── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_LABELS = 'PDF, JPG, or PNG';


// ── Styles ───────────────────────────────────────────────────────────────────
const css = {
  wrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f6f8fd 0%, #e2e8f0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: 'var(--font-body)',
  },
  card: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '48px',
    width: '100%',
    maxWidth: '680px',
    boxShadow: '0 25px 50px -12px rgba(11, 37, 69, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: '-0.5px',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    fontWeight: '500',
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  dot: (active) => ({
    width: active ? '36px' : '10px',
    height: '10px',
    borderRadius: '6px',
    background: active ? '#2563eb' : '#e2e8f0',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  optionBtn: (selected) => ({
    background: selected ? '#eff6ff' : '#ffffff',
    border: `2px solid ${selected ? '#3b82f6' : '#f1f5f9'}`,
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'center',
    boxShadow: selected ? '0 12px 24px rgba(59, 130, 246, 0.15)' : '0 4px 12px rgba(0,0,0,0.02)',
    transform: selected ? 'translateY(-4px)' : 'translateY(0)',
  }),
  optionBtnCat: (selected) => ({
    background: selected ? '#eff6ff' : '#ffffff',
    border: `2px solid ${selected ? '#3b82f6' : '#f1f5f9'}`,
    borderRadius: '20px',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'left',
    position: 'relative',
    boxShadow: selected ? '0 12px 24px rgba(59, 130, 246, 0.15)' : '0 4px 12px rgba(0,0,0,0.02)',
    transform: selected ? 'translateY(-4px)' : 'translateY(0)',
  }),
  catBadge: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: '#2563eb',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
  },
  catDetails: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '12px',
    lineHeight: '1.6',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  catDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '500'
  },
  icon: { marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: '#eff6ff', borderRadius: '16px' },
  pkgTitle: { fontSize: '20px', fontWeight: '900', color: '#0f172a' },
  pkgPrice: { fontSize: '15px', fontWeight: '800', color: '#2563eb' },
  fileInputBox: (isDragOver) => ({
    border: `2px dashed ${isDragOver ? '#3b82f6' : '#cbd5e1'}`,
    borderRadius: '16px',
    padding: '48px 24px',
    textAlign: 'center',
    background: isDragOver ? '#eff6ff' : '#f8fafc',
    marginBottom: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  }),
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s',
  },
  btnRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid #f1f5f9',
  },
  backBtn: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#475569',
    padding: '14px 28px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  nextBtn: {
    background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
    border: 'none',
    color: '#ffffff',
    padding: '14px 36px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginLeft: 'auto',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
    background: '#94a3b8',
    boxShadow: 'none',
  },
  // ── Progress bar ─────────────────────────────
  progressWrapper: {
    marginBottom: '24px',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  progressTrack: {
    height: '10px',
    borderRadius: '5px',
    background: '#e2e8f0',
    overflow: 'hidden',
  },
  progressBar: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    borderRadius: '5px',
    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
    transition: 'width 0.4s ease-out',
  }),
  // ── File preview chip ────────────────────────
  fileChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)',
  },
  fileChipName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e3a8a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '320px',
  },
  fileChipSize: {
    fontSize: '12px',
    color: '#60a5fa',
    fontWeight: '600',
    marginTop: '2px',
  },
  removeBtn: {
    background: '#fee2e2',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#dc2626',
    transition: 'all 0.2s',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: '#f0fdf4',
    border: '1px solid #a7f3d0',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#065f46',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
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
  const [permitFile, setPermitFile] = useState(null);
  const [uploadLater, setUploadLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);    // 0-100
  const [uploadPhase, setUploadPhase] = useState('');          // '' | 'compressing' | 'uploading' | 'done'
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasPriorExperience, setHasPriorExperience] = useState(false);
  
  const basePrice = selectedPackages.reduce((sum, pkg) => sum + (pkg.price || 0), 0);
  const totalPrice = hasPriorExperience ? Math.max(0, basePrice - 1000) : basePrice;

  const [formData, setFormData] = useState({
    lPermitStatus: 'no'
  });

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

  const compressImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 800; // max dimension

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress aggressively
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5); 
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const uploadFile = async (file, pathPrefix) => {
    console.log("[UPLOAD] Compressing file to Base64...");
    try {
      const base64String = await compressImageToBase64(file);
      console.log("[UPLOAD] Compression successful.");
      return base64String;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
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

      if (medicalFile && !uploadLater) {
        setUploadPhase('uploading');
        try {
          medicalUrl = await uploadFile(medicalFile, `medical/${userProfile.id}_${Date.now()}`);
          medicalStatus = 'submitted';
        } catch (err) {
          console.warn("Medical upload failed, using fallback:", err);
          medicalStatus = 'submitted';
          medicalUrl = 'pending-upload';
        }
      }

      // 2. Update Student Profile in Firestore
      const userRef = doc(db, 'students', userProfile.id);

      let permitStatus = formData.lPermitStatus === 'yes' ? 'pending' : 'pending';
      let permitUrl = null;
      if (formData.lPermitStatus === 'yes' && permitFile) {
        try {
          permitUrl = await uploadFile(permitFile, `lpermit/${userProfile.id}_${Date.now()}`);
          permitStatus = 'submitted';
        } catch (err) {
          console.warn("L-Permit upload failed, using fallback:", err);
          permitStatus = 'submitted';
          permitUrl = 'pending-upload';
        }
      }

      const updateData = {
        setup_completed: true,
        training_category: selectedCategory,
        selected_package: selectedPackages.map(p => p.name).join(' + '),
        selected_vehicles: selectedPackages.map(p => p.id),
        package_price: totalPrice,
        medical_status: medicalStatus,
        medical_url: medicalUrl,
        l_permit_status: permitStatus,
        permit_url: permitUrl,
        prior_experience: hasPriorExperience,
        // Backward compatibility
        enrolledPackage: selectedPackages.map(p => p.name).join(' + '),
        total_price: totalPrice,
        classesTotal: selectedPackages.reduce((acc, p) => acc + (p.sessions || 10), 0),
        outstandingFees: totalPrice,
        skills: generateSkills(selectedPackages.map(p => p.id))
      };

      await updateDoc(userRef, updateData);



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
      uploading: 'Uploading…',
      done: 'Upload complete ✓',
    };

    return (
      <div style={css.progressWrapper}>
        <div style={css.progressLabel}>
          <span>{labelMap[uploadPhase]}</span>
        </div>
        <div style={css.progressTrack}>
          <div style={css.progressBar(uploadPhase === 'done' ? 100 : 50)} />
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
          </p>
        </div>

        <div style={css.stepIndicator}>
          {[1, 2, 3].map(s => (
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
          <div style={{ ...css.grid, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              const details = cat.id === 'lv' 
                ? ['Personal & Daily Transport', 'Car (Auto/Manual)', 'Motorcycle', 'Three-Wheeler'] 
                : ['Commercial Transport', 'Passenger Bus', 'Heavy Duty Lorry', 'Prime Mover'];
              
              return (
                <button
                  key={cat.id}
                  style={css.optionBtnCat(isSelected)}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedPackages([]);
                  }}
                >
                  {isSelected && <div style={css.catBadge}>Selected</div>}
                  <div style={css.icon}>
                    {cat.id === 'lv' ? <Car size={32} color="#3b82f6" /> : <Truck size={32} color="#3b82f6" />}
                  </div>
                  <div style={{ width: '100%' }}>
                    <div style={css.pkgTitle}>{cat.name}</div>
                    <div style={{ fontSize: '13px', color: '#737686', marginTop: '4px', marginBottom: '12px', fontWeight: '500' }}>
                      {cat.description}
                    </div>
                    
                    <div style={{ height: '1px', background: '#eaeef4', width: '100%', marginBottom: '12px' }}></div>
                    
                    <div style={css.catDetails}>
                      {details.map((detail, idx) => (
                        <div key={idx} style={css.catDetailItem}>
                          <span style={{ color: isSelected ? '#3b82f6' : '#cbd5e1', display: 'flex', alignItems: 'center' }}>
                            <CheckCircle2 size={16} />
                          </span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 2: PACKAGE (MULTI-SELECT) */}
        {step === 2 && (
          <>
            <p style={{ fontSize: '13px', color: '#737686', marginBottom: '16px', textAlign: 'center' }}>You can select multiple vehicles. Total price will be calculated automatically.</p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', color: isSelected ? '#2563eb' : '#94a3b8' }}>
                        {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                      </span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={css.pkgTitle}>{pkg.name}</div>
                        <div style={css.pkgPrice}>{formatPrice(pkg.price)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedPackages.length > 0 && (
              <div style={{ background: '#e7eeff', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPackages.map(pkg => (
                    <div key={pkg.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#505f76' }}>
                      <span>✓ {pkg.name}</span>
                      <span>{formatPrice(pkg.price)}</span>
                    </div>
                  ))}
                  
                  {hasPriorExperience && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', fontWeight: '700', marginTop: '4px' }}>
                      <span>✓ Prior Experience Discount</span>
                      <span>- Rs. 1,000</span>
                    </div>
                  )}

                  <hr style={{ border: 'none', borderTop: '1px solid #c5d0e6', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0B2545' }}>Total ({selectedPackages.length} vehicle{selectedPackages.length > 1 ? 's' : ''})</span>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#111c2d' }}>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Experience Checkbox */}
            {selectedPackages.length > 0 && (
              <div style={{ marginTop: '24px', background: '#f8faff', border: '1px solid #eaeef4', padding: '16px 20px', borderRadius: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasPriorExperience}
                    onChange={(e) => setHasPriorExperience(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#0B2545' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#111c2d' }}>I already have driving experience</div>
                    <div style={{ fontSize: '12px', color: '#737686', marginTop: '4px' }}>Check this to apply a Rs. 1,000 discount on your training package.</div>
                  </div>
                </label>
              </div>
            )}
          </>
        )}

        {/* STEP 3: MEDICAL */}
        {step === 3 && (
          <div>
            {uploadPhase === 'done' && (
              <div style={css.successBanner}>
                <CheckCircle2 size={20} color="#059669" />
                Upload successful! Your medical certificate has been saved.
              </div>
            )}
            {loading && renderProgress()}
            {medicalFile && !loading && (
              <div style={css.fileChip}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <FileImage size={24} color="#3b82f6" />
                  <div>
                    <div style={css.fileChipName}>{medicalFile.name}</div>
                    <div style={css.fileChipSize}>{formatBytes(medicalFile.size)}</div>
                  </div>
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
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <UploadCloud size={48} color={isDragOver ? '#2563eb' : '#94a3b8'} strokeWidth={1.5} />
                  </div>
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

            <hr style={{ border: 'none', borderTop: '1px solid #dee2e6', margin: '24px 0' }} />

            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#111c2d', marginBottom: '16px', marginTop: 0 }}>Additional Details</h3>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#505f76', marginBottom: '6px' }}>Do you already have an L Permit?</label>
              <select value={formData.lPermitStatus} onChange={e => setFormData({...formData, lPermitStatus: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dee2e6', outline: 'none', marginBottom: '12px' }}>
                <option value="no">No, I don't have one</option>
                <option value="yes">Yes, I already have it</option>
              </select>
              
              {formData.lPermitStatus === 'yes' && (
                <div>
                  {permitFile ? (
                    <div style={css.fileChip}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <FileImage size={24} color="#3b82f6" />
                        <div>
                          <div style={css.fileChipName}>{permitFile.name}</div>
                          <div style={css.fileChipSize}>{formatBytes(permitFile.size)}</div>
                        </div>
                      </div>
                      <button style={css.removeBtn} onClick={() => setPermitFile(null)} title="Remove file">✕</button>
                    </div>
                  ) : (
                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <div style={css.fileInputBox(false)}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                          <FileText size={32} color="#94a3b8" />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#111c2d', marginBottom: '4px' }}>
                          Upload L Permit Photo
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if(e.target.files[0]) {
                              const err = validateFile(e.target.files[0]);
                              if(err) setError(err); else { setError(''); setPermitFile(e.target.files[0]); }
                            }
                          }}
                        />
                      </div>
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        )}



        {/* BUTTONS */}
        <div style={css.btnRow}>
          {step > 1 && (
            <button style={css.backBtn} onClick={() => { setStep(step - 1); setError(''); }} disabled={loading}>Back</button>
          )}
          <button style={css.nextBtn} onClick={handleNext} disabled={loading}>
            {loading ? 'Processing...' : step === 3 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
