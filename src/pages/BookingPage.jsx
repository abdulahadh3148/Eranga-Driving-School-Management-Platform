import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

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
  const [vehicle, setVehicle] = useState('Car / Van');
  
  // Set tomorrow's date by default
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getTomorrowDateString());
  const [slot, setSlot] = useState('11:00 AM');
  const [instructor, setInstructor] = useState('Saman Perera - Manual Specialist');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  if (!currentUser || !userProfile) {
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
    if (vehicle === 'Car / Van') return 'Car / Van (Manual)';
    if (vehicle === 'Bike') return 'Motorbike (Light)';
    return 'Three-Wheeler (Tuk)';
  };

  const getInstructorName = () => {
    return instructor.split(' - ')[0];
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');

    try {
      const activePackage = userProfile.enrolledPackage || userProfile.package || localStorage.getItem('selectedPackage') || 'Standard';

      // 1. Create booking document in Firestore
      const newBooking = {
        studentId: currentUser.uid,
        studentName: userProfile.name || 'New Student',
        vehicleType: getVehicleLabel(),
        date: date,
        timeSlot: slot,
        instructor: getInstructorName(),
        price: 2500,
        createdAt: new Date().toISOString(),
        status: 'upcoming'
      };

      await addDoc(collection(db, 'bookings'), newBooking);

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
              <a className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 transition-colors duration-200" href="#">Book Class</a>
              <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">History</a>
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
                  onClick={() => setVehicle('Car / Van')}
                  className={`flex flex-col items-center justify-center p-8 transition-all ${
                    vehicle === 'Car / Van' 
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
                  onClick={() => setVehicle('Three-Wheeler')}
                  className={`flex flex-col items-center justify-center p-8 transition-all ${
                    vehicle === 'Three-Wheeler' 
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
                <div className="p-6 bg-surface-variant border border-outline-variant">
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 font-body-md text-primary text-lg"
                  />
                  <div className="mt-4 grid grid-cols-7 text-center text-xs gap-2 opacity-50 font-bold uppercase">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>
                </div>
              </div>

              {/* 03. Available Slots */}
              <div className="space-y-6">
                <h3 className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-bold">03. Available Slots</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'].map((slotTime) => {
                    const isSelected = slot === slotTime;
                    return (
                      <button
                        key={slotTime}
                        onClick={() => setSlot(slotTime)}
                        className={`py-4 font-label-md font-bold text-center transition-all ${
                          isSelected 
                            ? 'bg-primary text-white border border-primary' 
                            : 'bg-surface-variant border border-outline-variant hover:bg-primary-container'
                        }`}
                      >
                        {slotTime}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* 04. Instructor Selection */}
            <div className="space-y-6">
              <h3 className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-bold">04. Choose Instructor</h3>
              <div className="relative">
                <select 
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full appearance-none p-6 bg-surface-variant border border-outline-variant font-body-md text-primary focus:border-primary focus:ring-0 outline-none pr-12"
                >
                  <option value="Saman Perera - Manual Specialist">Saman Perera - Manual Specialist</option>
                  <option value="Anura Kumara - Automatic Expert">Anura Kumara - Automatic Expert</option>
                  <option value="Sunethra Silva - Heavy Vehicle Pro">Sunethra Silva - Heavy Vehicle Pro</option>
                </select>
                <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  expand_more
                </span>
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
                    {slot}
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-on-surface-variant text-sm font-bold">Instructor</span>
                  <span className="font-body-md text-right font-medium">{getInstructorName()}</span>
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
                Your driving session has been scheduled successfully with {getInstructorName()}.
              </p>
            </div>

            <div className="bg-primary-container p-4 text-left border border-outline-variant space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Date:</span> <span className="font-medium">{date}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Slot:</span> <span className="font-medium">{slot}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Vehicle:</span> <span className="font-medium">{vehicle}</span></div>
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
            <a className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
