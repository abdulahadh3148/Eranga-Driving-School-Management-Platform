import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, updateDoc, increment, getDocs, query, where, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { TIME_SLOTS, autoAssignResources } from '../utils/schedulingEngine';
import { generateCustomId } from '../utils/idGenerator';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function BookingPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Dynamic state hooks
  const [vehicle, setVehicle] = useState('Car'); // 'Car', 'Van', 'Bike', 'Heavy'
  
  // Set tomorrow's date by default
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getTomorrowDateString());
  const [slot, setSlot] = useState(TIME_SLOTS[0]); // Entire object from TIME_SLOTS
  
  const [loading, setLoading] = useState(false);
  const [engineLoading, setEngineLoading] = useState(true);
  const [instructorsList, setInstructorsList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [sessionsList, setSessionsList] = useState([]);

  useEffect(() => {
    const fetchEngineData = async () => {
      try {
        const [instSnap, vehSnap, sesSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'instructor'))),
          getDocs(collection(db, 'vehicles')),
          getDocs(collection(db, 'sessions'))
        ]);
        setInstructorsList(instSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setVehiclesList(vehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSessionsList(sesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching engine data:', err);
      } finally {
        setEngineLoading(false);
      }
    };
    fetchEngineData();
  }, []);

  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  if (!currentUser || !userProfile || engineLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center">
          <p className="font-label-md text-label-md text-primary animate-pulse">Loading portal...</p>
        </div>
      </div>
    );
  }

  const activePackage = userProfile?.enrolledPackage || userProfile?.package || localStorage.getItem('selectedPackage') || 'Standard';
  const isEnrolled = !!(userProfile?.enrolledPackage || userProfile?.package);
  const packageNames = { Basic: 'Basic Starter', Standard: 'Pro Driver', Premium: 'Ultimate License' };
  const packagePrices = { Basic: 15000, Standard: 25000, Premium: 45000 };

  // Map user selections to human-readable values
  const getVehicleLabel = () => {
    if (vehicle === 'Car') return 'Car / Van (Manual)';
    if (vehicle === 'Bike') return 'Motorbike (Light)';
    return 'Three-Wheeler (Tuk)';
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');

    try {
      const activePackage = userProfile.enrolledPackage || userProfile.package || localStorage.getItem('selectedPackage') || 'Standard';

      // 0. Auto Assign Resources
      const assignment = autoAssignResources(
        sessionsList,
        date,
        slot.id,
        vehicle, 
        instructorsList,
        vehiclesList
      );

      if (!assignment || !assignment.instructor) {
        throw new Error('No instructors or vehicles available for this time slot. Please select a different time or date.');
      }

      // 1. Create booking document in Firestore
      const newBooking = {
        studentId: currentUser.uid,
        studentName: userProfile.name || 'New Student',
        vehicleType: getVehicleLabel(),
        date: date,
        timeSlot: slot.label,
        instructorId: assignment.instructor.id,
        instructor: assignment.instructor.name,
        price: 2500,
        createdAt: new Date().toISOString(),
        status: 'upcoming'
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), newBooking);

      // 1.5 Create session in 'sessions' (schedules) table
      const sessionId = await generateCustomId('SES');
      const newSession = {
        bookingId: bookingRef.id,
        date: date,
        timeSlotId: slot.id,
        timeSlotLabel: slot.label,
        time: slot.label,
        instructorId: assignment.instructor.id,
        instructorName: assignment.instructor.name,
        vehicleId: assignment.vehicle.id,
        vehicleName: assignment.vehicle.name,
        vehicleType: vehicle,
        students: [currentUser.uid], 
        studentId: currentUser.uid, 
        studentName: userProfile.name || 'New Student',
        trainingLevel: 'L1',
        trainingLevelLabel: 'Training L1',
        status: 'upcoming'
      };
      
      await setDoc(doc(db, 'sessions', sessionId), newSession);

      // 2. Increment lessonsScheduled count in student profile document
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updates = {
        lessonsScheduled: increment(1)
      };

      // Auto-enroll student into package if they haven't enrolled yet
      if (!userProfile.enrolledPackage && !userProfile.package) {
        updates.enrolledPackage = activePackage;
        updates.package = activePackage;
        
        const prices = { Basic: 15000, Standard: 25000, Premium: 45000 };
        const lessons = { Basic: 5, Standard: 10, Premium: 20 };
        updates.outstandingFees = prices[activePackage] || 25000;
        updates.classesTotal = lessons[activePackage] || 10;
      }

      await updateDoc(userDocRef, updates);

      // 3. Trigger success modal
      setShowSuccess(true);
      
      // Auto-redirect to dashboard after 3.5 seconds
      setTimeout(() => {
        navigate('/student');
      }, 3500);

    } catch (err) {
      console.error('Booking failed:', err);
      setError(err.message || 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-body-md text-body-md bg-surface text-on-surface min-h-screen relative">
      
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#ffffff] border-b border-outline-variant">
        <div className="flex justify-between items-center w-full px-4 md:px-20 h-20 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/student" className="font-headline-sm text-headline-sm font-bold tracking-tighter text-primary">
              Eranga Driving School
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/student" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200">Dashboard</Link>
              <span className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1">Book Class</span>
              <Link to="/student" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200">History</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined p-2 text-on-surface">notifications</button>
            <div className="w-10 h-10 border border-outline-variant overflow-hidden flex items-center justify-center bg-surface-container-highest">
              <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 md:px-20 max-w-[1280px] mx-auto">
        {/* Title Section */}
        <div className="mb-16">
          <h1 className="font-display-lg-mobile md:font-display-lg text-4xl md:text-6xl text-primary font-bold mb-4 font-serif">Book Driving Class</h1>
          <p className="font-headline-sm text-xl text-on-surface-variant max-w-2xl">
            Select your preferred date, vehicle, and time slot to begin your journey toward driving excellence.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-500 text-red-700 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {!isEnrolled && (
          <div className="mb-8 p-6 bg-primary/5 border border-primary/30 text-primary flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-3xl flex-shrink-0">info</span>
            <div>
              <p className="font-bold text-lg text-primary">Direct Enrollment Enabled</p>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                You are currently unenrolled. Confirming this lesson booking will automatically enroll you in the <strong className="text-primary">{packageNames[activePackage]}</strong> package (Rs. {packagePrices[activePackage]?.toLocaleString()}). Outstanding package fees will be updated on your dashboard.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Booking Form Area */}
          <section className="lg:col-span-8 space-y-12">
            
            {/* 01. Vehicle Selection */}
            <div className="space-y-6">
              <h3 className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-bold">01. Select Vehicle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <button 
                  onClick={() => setVehicle('Car')}
                  className={`flex flex-col items-center justify-center p-8 transition-all ${
                    vehicle === 'Car' 
                      ? 'bg-primary-container border-2 border-primary active-ring' 
                      : 'bg-surface-variant border border-outline-variant hover:bg-primary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-4xl mb-3">directions_car</span>
                  <span className="font-label-md font-bold">Car / Van</span>
                </button>
                
                <button 
                  onClick={() => setVehicle('Bike')}
                  className={`flex flex-col items-center justify-center p-8 transition-all ${
                    vehicle === 'Bike' 
                      ? 'bg-primary-container border-2 border-primary active-ring' 
                      : 'bg-surface-variant border border-outline-variant hover:bg-primary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-4xl mb-3">two_wheeler</span>
                  <span className="font-label-md font-bold">Bike</span>
                </button>
                
                <button 
                  onClick={() => setVehicle('Heavy')}
                  className={`flex flex-col items-center justify-center p-8 transition-all ${
                    vehicle === 'Heavy' 
                      ? 'bg-primary-container border-2 border-primary active-ring' 
                      : 'bg-surface-variant border border-outline-variant hover:bg-primary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-4xl mb-3">electric_rickshaw</span>
                  <span className="font-label-md font-bold">Three-Wheeler</span>
                </button>
                
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* 02. Choose Date */}
              <div className="space-y-6">
                <h3 className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-bold">02. Choose Date</h3>
                <div className="booking-calendar-container">
                  <style>{`
                    .booking-calendar-container .react-datepicker {
                      border: 1px solid var(--md-sys-color-outline-variant, #c4c7c5) !important;
                      border-radius: 0 !important;
                      font-family: inherit !important;
                      width: 100% !important;
                      background: var(--md-sys-color-surface-variant, #e7e0ec) !important;
                    }
                    .booking-calendar-container .react-datepicker__month-container {
                      width: 100% !important;
                    }
                    .booking-calendar-container .react-datepicker__header {
                      background: var(--md-sys-color-primary, #0B2545) !important;
                      border-bottom: none !important;
                      border-radius: 0 !important;
                      padding: 16px 12px 12px !important;
                    }
                    .booking-calendar-container .react-datepicker__current-month {
                      color: #fff !important;
                      font-weight: 800 !important;
                      font-size: 15px !important;
                      letter-spacing: 0.04em !important;
                      margin-bottom: 8px !important;
                    }
                    .booking-calendar-container .react-datepicker__day-names {
                      display: flex !important;
                      justify-content: space-around !important;
                    }
                    .booking-calendar-container .react-datepicker__day-name {
                      color: rgba(255,255,255,0.7) !important;
                      font-weight: 700 !important;
                      font-size: 11px !important;
                      text-transform: uppercase !important;
                      width: 36px !important;
                      line-height: 36px !important;
                    }
                    .booking-calendar-container .react-datepicker__month {
                      margin: 8px !important;
                    }
                    .booking-calendar-container .react-datepicker__week {
                      display: flex !important;
                      justify-content: space-around !important;
                    }
                    .booking-calendar-container .react-datepicker__day {
                      width: 36px !important;
                      line-height: 36px !important;
                      font-size: 13px !important;
                      font-weight: 600 !important;
                      border-radius: 0 !important;
                      color: #333 !important;
                      transition: all 0.15s !important;
                    }
                    .booking-calendar-container .react-datepicker__day:hover {
                      background: rgba(11,37,69,0.1) !important;
                      border-radius: 0 !important;
                    }
                    .booking-calendar-container .react-datepicker__day--selected {
                      background: #0B2545 !important;
                      color: #fff !important;
                      font-weight: 800 !important;
                    }
                    .booking-calendar-container .react-datepicker__day--today {
                      font-weight: 900 !important;
                      color: #0B2545 !important;
                      border: 2px solid #0B2545 !important;
                    }
                    .booking-calendar-container .react-datepicker__day--today.react-datepicker__day--selected {
                      color: #fff !important;
                      border-color: #0B2545 !important;
                    }
                    .booking-calendar-container .react-datepicker__day--disabled {
                      color: #ccc !important;
                    }
                    .booking-calendar-container .react-datepicker__navigation {
                      top: 14px !important;
                    }
                    .booking-calendar-container .react-datepicker__navigation-icon::before {
                      border-color: #fff !important;
                    }
                  `}</style>
                  <DatePicker
                    selected={date ? new Date(date + 'T00:00:00') : new Date()}
                    onChange={(d) => {
                      if (d) {
                        const offset = d.getTimezoneOffset();
                        const local = new Date(d.getTime() - (offset * 60 * 1000));
                        setDate(local.toISOString().split('T')[0]);
                      }
                    }}
                    inline
                    minDate={new Date()}
                    calendarClassName="booking-inline-calendar"
                  />
                </div>
              </div>

              {/* 03. Available Slots */}
              <div className="space-y-6">
                <h3 className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-bold">03. Available Slots</h3>
                <div className="grid grid-cols-2 gap-3">
                  {TIME_SLOTS.map((ts) => {
                    const isSelected = slot.id === ts.id;
                    return (
                      <button
                        key={ts.id}
                        onClick={() => setSlot(ts)}
                        className={`py-4 font-label-md font-bold text-center transition-all ${
                          isSelected 
                            ? 'bg-primary text-white border border-primary' 
                            : 'bg-surface-variant border border-outline-variant hover:bg-primary-container'
                        }`}
                      >
                        {ts.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* 04. Instructor Selection */}
            <div className="space-y-6">
              <h3 className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-bold">04. Instructor Selection</h3>
              <div className="p-6 bg-surface-variant border border-outline-variant text-on-surface-variant font-body-md">
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  An expert instructor will be automatically assigned to you based on your selected vehicle and time slot.
                </p>
              </div>
            </div>

          </section>

          {/* Summary & Price Panel */}
          <aside className="lg:col-span-4">
            <div className="sticky top-32 p-8 bg-surface-variant border border-outline-variant space-y-8">
              <h3 className="text-2xl font-serif font-bold text-primary">Booking Summary</h3>
              
              <div className="space-y-4 pt-4 border-t border-outline-variant">
                
                <div className="flex justify-between items-start">
                  <span className="text-on-surface-variant text-sm font-bold">Package</span>
                  <span className="font-body-md text-right font-medium text-primary font-bold">
                    {packageNames[activePackage]}
                    <span className="block text-[10px] text-on-surface-variant font-normal">
                      {isEnrolled ? 'Enrolled Active' : 'Auto-Enroll on Confirm'}
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-on-surface-variant text-sm font-bold">Vehicle</span>
                  <span className="font-body-md text-right font-medium">{getVehicleLabel()}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-on-surface-variant text-sm font-bold">Schedule</span>
                  <span className="font-body-md text-right font-medium">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <br/>
                    {slot.label}
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-on-surface-variant text-sm font-bold">Instructor</span>
                  <span className="font-body-md text-right font-medium text-primary flex items-center gap-1 justify-end">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Auto-Assigned
                  </span>
                </div>
                
              </div>

              <div className="space-y-2 pt-4 border-t border-outline-variant">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-sm font-bold">Session Fee</span>
                  <span className="font-body-md font-medium">Rs. 2,500</span>
                </div>
                {!isEnrolled && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant text-sm font-bold">Package Cost</span>
                    <span className="font-body-md font-medium">Rs. {packagePrices[activePackage]?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-outline-variant">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">Total Booking</span>
                  <span className="text-2xl font-bold text-primary font-serif">Rs. 2,500</span>
                </div>
                {!isEnrolled && (
                  <p className="text-[10px] text-on-surface-variant leading-tight">
                    * Booking fee is included in package. Package price Rs. {packagePrices[activePackage]?.toLocaleString()} will be charged to outstanding balance.
                  </p>
                )}
              </div>

              <button 
                onClick={handleConfirmBooking}
                disabled={loading}
                style={{ backgroundColor: '#0B2545' }}
                className="w-full py-5 text-white font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              
              <p className="text-xs text-on-surface-variant text-center italic">
                Free cancellation up to 24 hours before your session.
              </p>
            </div>
          </aside>

        </div>
      </main>

      {/* Success Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-variant border border-outline-variant p-10 max-w-md w-full text-center space-y-6 shadow-2xl rounded-none">
            <div className="w-16 h-16 bg-success-green text-white rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl font-bold">check</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-primary">Booking Confirmed!</h2>
              <p className="text-on-surface-variant text-sm">
                Your driving session has been scheduled successfully.
              </p>
            </div>

            <div className="bg-primary-container p-4 text-left border border-outline-variant space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Date:</span> <span className="font-medium">{date}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Slot:</span> <span className="font-medium">{slot.label}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Vehicle:</span> <span className="font-medium">{getVehicleLabel()}</span></div>
            </div>

            <button 
              onClick={() => navigate('/student')}
              className="w-full py-4 bg-primary text-white font-bold uppercase tracking-wider text-sm hover:bg-opacity-90 transition-all"
            >
              Go to Dashboard
            </button>
            <p className="text-xs text-on-surface-variant animate-pulse">Redirecting you to dashboard automatically...</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-background border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-20 py-12 max-w-[1280px] mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface-variant tracking-tighter">Eranga Driving School</span>
            <p className="font-label-sm text-xs text-on-surface-variant">© 2026 EDS Driving Excellence. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-8">
            <Link className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors" to="/about">Privacy Policy</Link>
            <Link className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors" to="/about">Terms of Service</Link>
            <Link className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors" to="/contact">Contact Support</Link>
          </nav>
        </div>
      </footer>

    </div>
  );
}
