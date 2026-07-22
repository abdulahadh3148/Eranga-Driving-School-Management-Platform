import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import {
  Save, Download, Database, Settings as SettingsIcon, Shield, Bell,
  School, Phone, Mail, Globe, CheckCircle, AlertTriangle, Loader2,
  HardDrive, FileJson, Clock, Info, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Building2, Palette, Lock, RefreshCw, Users, Car, Package, Home,
  Eye, Image, Type, MapPin, ExternalLink, Star, Gauge, FileText, BookOpen
} from 'lucide-react';

const APP_VERSION = '1.0.0';
const BUILD_DATE = '2026-07-17';

// All Firestore collections to back up
const BACKUP_COLLECTIONS = [
  'students', 'users', 'instructors', 'sessions', 'payments',
  'notifications', 'packages', 'training_slots', 'bookings',
  'mock_test_results', 'session_progress', 'counters',
  'student_packages', 'schedules', 'vehicles', 'settings'
];

const DEFAULT_SETTINGS = {
  schoolName: 'Eranga Driving School',
  contactEmail: 'info@erangadrivingschool.com',
  contactPhone: '+94 77 123 4567',
  address: 'No. 45, Main Street, Colombo 05, Sri Lanka',
  website: 'www.erangadrivingschool.com',
  allowRegistrations: true,
  autoPaymentVerification: true,
  maintenanceMode: false,
  emailNotifications: true,
  smsNotifications: false,
  paymentReminders: true,
  // Instructor settings
  maxStudentsPerInstructor: '15',
  autoAssignInstructors: false,
  showInstructorRatings: true,
  instructorSessionDuration: '60',
  // Vehicle settings
  showVehiclePhotos: true,
  vehicleMaintenanceAlerts: true,
  defaultVehicleType: 'Car',
  // Package settings
  showPackagePrices: true,
  allowCustomPackages: false,
  defaultLessonsCount: '20',
  packageCurrency: 'LKR',
  // Home page settings
  heroTitle: 'Master the Road with Confidence',
  heroSubtitle: "Sri Lanka's Premier Driver Education Platform",
  showTestimonials: true,
  showGallery: true,
  showStats: true,
  contactMapEnabled: true,
};

// --- TOGGLE SWITCH COMPONENT ---
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 44, height: 24, borderRadius: 12,
        background: checked ? '#f97316' : '#d1d5db',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s ease', flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease',
      }} />
    </button>
  );
}

// --- SECTION CARD ---
function SectionCard({ icon: Icon, title, subtitle, children, collapsible, defaultOpen = true, accentColor = '#f97316' }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid #e5e7eb', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <div
        onClick={collapsible ? () => setOpen(!open) : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 24px', borderBottom: open ? '1px solid #f3f4f6' : 'none',
          cursor: collapsible ? 'pointer' : 'default', userSelect: 'none',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${accentColor}14`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={accentColor} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 650, color: '#111827', margin: 0, lineHeight: 1.3 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12.5, color: '#9ca3af', margin: '2px 0 0', lineHeight: 1.3 }}>{subtitle}</p>}
        </div>
        {collapsible && (
          <div style={{ color: '#9ca3af' }}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '20px 24px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- INPUT FIELD ---
function InputField({ label, icon: Icon, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 550, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 14px', paddingLeft: Icon ? 38 : 14,
            border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14,
            color: '#111827', background: '#fafafa', outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.08)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
        />
      </div>
    </div>
  );
}

// --- TOGGLE ROW ---
function ToggleRow({ label, description, checked, onChange, icon: Icon, danger }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderRadius: 12,
      background: danger && checked ? 'rgba(239,68,68,0.04)' : '#fafafa',
      border: `1px solid ${danger && checked ? 'rgba(239,68,68,0.15)' : '#f3f4f6'}`,
      marginBottom: 10, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        {Icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} color={danger ? '#ef4444' : '#f97316'} />
          </div>
        )}
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 550, color: '#111827' }}>{label}</div>
          {description && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{description}</div>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}


export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backupProgress, setBackupProgress] = useState(null); // null | 'running' | 'done' | 'error'
  const [backupStats, setBackupStats] = useState(null);

  // Load settings from Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...settings,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save settings. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  // Update a single setting
  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // --- DATABASE BACKUP ---
  const handleBackup = async () => {
    setBackupProgress('running');
    setBackupStats(null);

    try {
      const backup = {
        metadata: {
          appName: 'Eranga Driving School Management System',
          version: APP_VERSION,
          exportDate: new Date().toISOString(),
          exportedBy: 'admin',
          collections: [],
        },
        data: {},
      };

      let totalDocs = 0;

      for (const colName of BACKUP_COLLECTIONS) {
        try {
          const snap = await getDocs(collection(db, colName));
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          backup.data[colName] = docs;
          backup.metadata.collections.push({ name: colName, count: docs.length });
          totalDocs += docs.length;
        } catch {
          // Collection might not exist yet — skip
          backup.data[colName] = [];
          backup.metadata.collections.push({ name: colName, count: 0 });
        }
      }

      backup.metadata.totalDocuments = totalDocs;

      // Create and download JSON
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = url;
      a.download = `eranga_ds_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupStats({ totalDocs, collections: backup.metadata.collections, size: (jsonStr.length / 1024).toFixed(1) });
      setBackupProgress('done');
    } catch (err) {
      console.error('Backup failed:', err);
      setBackupProgress('error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} color="#f97316" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 4px' }}>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
          }}>
            <SettingsIcon size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>System Settings</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Configure application preferences, features & backup</p>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* === SCHOOL DETAILS === */}
        <SectionCard icon={Building2} title="School Information" subtitle="Update your school's contact details" accentColor="#3b82f6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <InputField label="School Name" icon={School} value={settings.schoolName} onChange={v => update('schoolName', v)} />
            </div>
            <InputField label="Contact Email" icon={Mail} value={settings.contactEmail} onChange={v => update('contactEmail', v)} />
            <InputField label="Contact Phone" icon={Phone} value={settings.contactPhone} onChange={v => update('contactPhone', v)} />
            <div style={{ gridColumn: '1 / -1' }}>
              <InputField label="Address" icon={Globe} value={settings.address} onChange={v => update('address', v)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <InputField label="Website" icon={Globe} value={settings.website} onChange={v => update('website', v)} />
            </div>
          </div>
        </SectionCard>

        {/* === APPLICATION FEATURES === */}
        <SectionCard icon={Shield} title="Application Features" subtitle="Control core application behavior" accentColor="#8b5cf6">
          <ToggleRow
            icon={Lock}
            label="Allow New Student Registrations"
            description="When disabled, new students cannot create accounts"
            checked={settings.allowRegistrations}
            onChange={v => update('allowRegistrations', v)}
          />
          <ToggleRow
            icon={CheckCircle}
            label="Auto Payment Verification"
            description="Automatically verify payments in demo mode"
            checked={settings.autoPaymentVerification}
            onChange={v => update('autoPaymentVerification', v)}
          />
          <ToggleRow
            icon={Bell}
            label="Email Notifications"
            description="Send email alerts for important events"
            checked={settings.emailNotifications}
            onChange={v => update('emailNotifications', v)}
          />
          <ToggleRow
            icon={Bell}
            label="Payment Reminders"
            description="Remind students about outstanding fees"
            checked={settings.paymentReminders}
            onChange={v => update('paymentReminders', v)}
          />
          <ToggleRow
            icon={AlertTriangle}
            label="Maintenance Mode"
            description="Block all student access to the application"
            checked={settings.maintenanceMode}
            onChange={v => update('maintenanceMode', v)}
            danger
          />
        </SectionCard>

        {/* === INSTRUCTOR SETTINGS === */}
        <SectionCard icon={Users} title="Instructor Settings" subtitle="Configure instructor management rules" accentColor="#0ea5e9" collapsible>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <InputField label="Max Students per Instructor" icon={Users} value={settings.maxStudentsPerInstructor} onChange={v => update('maxStudentsPerInstructor', v)} type="number" />
            <InputField label="Session Duration (minutes)" icon={Clock} value={settings.instructorSessionDuration} onChange={v => update('instructorSessionDuration', v)} type="number" />
          </div>
          <ToggleRow
            icon={RefreshCw}
            label="Auto-Assign Instructors"
            description="Automatically assign available instructors to new students"
            checked={settings.autoAssignInstructors}
            onChange={v => update('autoAssignInstructors', v)}
          />
          <ToggleRow
            icon={Star}
            label="Show Instructor Ratings"
            description="Display instructor star ratings to students"
            checked={settings.showInstructorRatings}
            onChange={v => update('showInstructorRatings', v)}
          />
        </SectionCard>

        {/* === VEHICLE SETTINGS === */}
        <SectionCard icon={Car} title="Vehicle Settings" subtitle="Manage vehicle display & maintenance options" accentColor="#f59e0b" collapsible>
          <InputField label="Default Vehicle Type" icon={Car} value={settings.defaultVehicleType} onChange={v => update('defaultVehicleType', v)} placeholder="Car, Bike, Van..." />
          <ToggleRow
            icon={Image}
            label="Show Vehicle Photos"
            description="Display vehicle images on student-facing pages"
            checked={settings.showVehiclePhotos}
            onChange={v => update('showVehiclePhotos', v)}
          />
          <ToggleRow
            icon={AlertTriangle}
            label="Vehicle Maintenance Alerts"
            description="Get notified when vehicles are due for service"
            checked={settings.vehicleMaintenanceAlerts}
            onChange={v => update('vehicleMaintenanceAlerts', v)}
          />
        </SectionCard>

        {/* === PACKAGE SETTINGS === */}
        <SectionCard icon={Package} title="Package Settings" subtitle="Control pricing display & package defaults" accentColor="#a855f7" collapsible>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <InputField label="Default Lessons Count" icon={BookOpen} value={settings.defaultLessonsCount} onChange={v => update('defaultLessonsCount', v)} type="number" />
            <InputField label="Currency" icon={FileText} value={settings.packageCurrency} onChange={v => update('packageCurrency', v)} />
          </div>
          <ToggleRow
            icon={Eye}
            label="Show Package Prices"
            description="Display pricing on the public packages page"
            checked={settings.showPackagePrices}
            onChange={v => update('showPackagePrices', v)}
          />
          <ToggleRow
            icon={Package}
            label="Allow Custom Packages"
            description="Let students request custom lesson bundles"
            checked={settings.allowCustomPackages}
            onChange={v => update('allowCustomPackages', v)}
          />
        </SectionCard>

        {/* === HOME PAGE CONTROL === */}
        <SectionCard icon={Home} title="Home Page Control" subtitle="Customize the public homepage content & sections" accentColor="#ec4899" collapsible>
          <InputField label="Hero Title" icon={Type} value={settings.heroTitle} onChange={v => update('heroTitle', v)} />
          <InputField label="Hero Subtitle" icon={Type} value={settings.heroSubtitle} onChange={v => update('heroSubtitle', v)} />
          <div style={{ marginTop: 4 }}>
            <ToggleRow
              icon={Star}
              label="Show Testimonials"
              description="Display student testimonials on the homepage"
              checked={settings.showTestimonials}
              onChange={v => update('showTestimonials', v)}
            />
            <ToggleRow
              icon={Image}
              label="Show Gallery"
              description="Display the photo gallery section"
              checked={settings.showGallery}
              onChange={v => update('showGallery', v)}
            />
            <ToggleRow
              icon={Gauge}
              label="Show Statistics"
              description="Display success rate and student count stats"
              checked={settings.showStats}
              onChange={v => update('showStats', v)}
            />
            <ToggleRow
              icon={MapPin}
              label="Show Contact Map"
              description="Display the Google Maps embed on contact section"
              checked={settings.contactMapEnabled}
              onChange={v => update('contactMapEnabled', v)}
            />
          </div>
        </SectionCard>

        {/* === DATABASE BACKUP === */}
        <SectionCard icon={Database} title="Database Backup" subtitle="Download a complete backup of all application data" accentColor="#10b981">
          <div style={{
            padding: 16, borderRadius: 12, background: '#f0fdf4',
            border: '1px solid #bbf7d0', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Info size={16} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                This will export <strong>all {BACKUP_COLLECTIONS.length} collections</strong> from your Firestore database as a single JSON file.
                Includes students, payments, sessions, bookings, instructors, vehicles, and all other data.
              </div>
            </div>
          </div>

          <button
            onClick={handleBackup}
            disabled={backupProgress === 'running'}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 24px', borderRadius: 12,
              background: backupProgress === 'running' ? '#d1d5db' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
              cursor: backupProgress === 'running' ? 'wait' : 'pointer',
              boxShadow: backupProgress === 'running' ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
              transition: 'all 0.2s', width: '100%', justifyContent: 'center',
            }}
          >
            {backupProgress === 'running' ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Exporting data...</>
            ) : (
              <><Download size={18} /> Download Full Database Backup</>
            )}
          </button>

          {/* Backup Result */}
          <AnimatePresence>
            {backupProgress === 'done' && backupStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 16 }}
              >
                <div style={{
                  padding: 16, borderRadius: 12, background: '#f0fdf4',
                  border: '1px solid #86efac',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <CheckCircle size={16} color="#16a34a" />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#166534' }}>Backup completed successfully!</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fff', border: '1px solid #dcfce7', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{backupStats.totalDocs}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Total Records</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fff', border: '1px solid #dcfce7', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{backupStats.collections.filter(c => c.count > 0).length}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Collections</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fff', border: '1px solid #dcfce7', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{backupStats.size} KB</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>File Size</div>
                    </div>
                  </div>

                  {/* Collection breakdown */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Collection Breakdown</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {backupStats.collections.filter(c => c.count > 0).map(c => (
                        <span key={c.name} style={{
                          padding: '4px 10px', borderRadius: 6,
                          background: '#ecfdf5', border: '1px solid #a7f3d0',
                          fontSize: 11.5, color: '#166534', fontWeight: 500,
                        }}>
                          {c.name}: {c.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {backupProgress === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 16, padding: 14, borderRadius: 12,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <AlertTriangle size={16} color="#dc2626" />
                <span style={{ fontSize: 13, color: '#991b1b' }}>Backup failed. Check your permissions and try again.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionCard>

        {/* === SAVE BUTTON === */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px 28px', borderRadius: 14,
              background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff', border: 'none', fontSize: 15, fontWeight: 650,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: saved ? '0 4px 14px rgba(16,185,129,0.3)' : '0 4px 14px rgba(249,115,22,0.3)',
              transition: 'all 0.3s ease',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
            ) : saved ? (
              <><CheckCircle size={18} /> Settings Saved Successfully</>
            ) : (
              <><Save size={18} /> Save All Settings</>
            )}
          </button>
        </motion.div>

        {/* === APP INFO FOOTER === */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: '20px 24px', borderRadius: 16,
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              }}>
                <School size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Eranga Driving School</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Management System</div>
              </div>
            </div>
            <div style={{
              padding: '5px 14px', borderRadius: 20,
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.2)',
              fontSize: 12.5, fontWeight: 650, color: '#fb923c',
              letterSpacing: 0.3,
            }}>
              v{APP_VERSION}
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12, marginBottom: 16,
          }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Platform</div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 550 }}>React + Vite</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Database</div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 550 }}>Firebase</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Build Date</div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 550 }}>{BUILD_DATE}</div>
            </div>
          </div>

          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Features Included</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Student Management', 'Instructor Panel', 'Payment Tracking',
                'Session Booking', 'Medical Records', 'L-Permit Processing',
                'Trial Exams', 'Vehicle Fleet', 'Reports & Analytics', 'Notifications'
              ].map(f => (
                <span key={f} style={{
                  padding: '3px 10px', borderRadius: 6,
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.15)',
                  fontSize: 11, color: '#fb923c', fontWeight: 500,
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11.5, color: '#475569' }}>
            © {new Date().getFullYear()} Eranga Driving School. All rights reserved.
          </div>
        </motion.div>

      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
