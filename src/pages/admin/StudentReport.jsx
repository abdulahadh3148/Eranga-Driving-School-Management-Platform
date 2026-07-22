import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ArrowLeft, Printer, CheckCircle, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { formatPrice } from '../../data/packages';

export default function StudentReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Student Profile
        const sDoc = await getDoc(doc(db, 'students', id));
        if (sDoc.exists()) {
          setStudent({ id: sDoc.id, ...sDoc.data() });
        }

        // 2. Fetch Payments
        const pQ = query(collection(db, 'payments'), where('studentId', '==', id));
        const pSnap = await getDocs(pQ);
        const pData = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by date
        pData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setPayments(pData);

        // 3. Fetch Session Progress
        const sQ = query(collection(db, 'session_progress'), where('studentId', '==', id));
        const sSnap = await getDocs(sQ);
        const sData = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Only keep attended sessions
        const attended = sData.filter(s => s.attendance === 'present');
        attended.sort((a, b) => new Date(a.date) - new Date(b.date));
        setSessions(attended);

      } catch (err) {
        console.error("Error fetching report data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student) {
    return <div className="p-8 text-center text-red-500 font-bold">Student not found.</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCost = Number(student.package_price || student.total_price || 0);
  const isPaidFull = totalPaid >= totalCost;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 print:bg-white print:pb-0">
      
      {/* ── Top Bar (Hidden on Print) ── */}
      <div className="max-w-4xl mx-auto pt-8 px-8 mb-6 flex justify-between items-center print:hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
        >
          <Printer size={18} /> Print Report
        </button>
      </div>

      {/* ── Report A4 Paper Style ── */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-10 flex justify-between items-center print:bg-transparent print:text-black print:border-b print:border-gray-300">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">ERANGA DRIVING SCHOOL</h1>
            <p className="text-slate-400 font-medium print:text-gray-500">Official Student Training Report</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-400 mb-1 print:text-gray-500">Date Generated</div>
            <div className="text-lg font-bold">{new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        <div className="p-10 space-y-12">
          
          {/* Section 1: Profile */}
          <section>
            <h2 className="text-xl font-black text-gray-900 border-b-2 border-gray-100 pb-3 mb-6 uppercase tracking-wider">1. Student Profile</h2>
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                <div className="text-lg font-bold text-gray-900">{student.name}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Student ID</label>
                <div className="text-lg font-mono text-gray-900">{student.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span className="font-medium text-gray-800">{student.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span className="font-medium text-gray-800">{student.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="font-medium text-gray-800">{student.district || 'Kurunegala'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="font-medium text-gray-800">Enrolled: {new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </section>

          {/* Section 2: Training Program */}
          <section>
            <h2 className="text-xl font-black text-gray-900 border-b-2 border-gray-100 pb-3 mb-6 uppercase tracking-wider">2. Training Program</h2>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <div className="font-black text-blue-900 text-xl">{student.selected_package || student.enrolledPackage}</div>
                <div className="px-3 py-1 rounded-full bg-blue-200 text-blue-800 font-bold text-xs uppercase">
                  {student.training_category === 'lv' ? 'Light Vehicle' : 'Heavy Vehicle'}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-800">Total Mandatory Sessions:</span>
                <span className="font-bold text-blue-900">{student.classesTotal || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="font-medium text-blue-800">Sessions Attended:</span>
                <span className="font-bold text-blue-900">{sessions.length}</span>
              </div>
            </div>
          </section>

          {/* Section 3: Financial Summary */}
          <section>
            <h2 className="text-xl font-black text-gray-900 border-b-2 border-gray-100 pb-3 mb-6 uppercase tracking-wider">3. Financial Summary</h2>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Total Fee</div>
                <div className="text-xl font-black text-gray-900">{formatPrice(totalCost)}</div>
              </div>
              <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                <div className="text-xs font-bold text-green-600 uppercase mb-1">Total Paid</div>
                <div className="text-xl font-black text-green-700">{formatPrice(totalPaid)}</div>
              </div>
              <div className={`p-5 rounded-xl border ${isPaidFull ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`text-xs font-bold uppercase mb-1 ${isPaidFull ? 'text-slate-500' : 'text-red-600'}`}>Balance Due</div>
                <div className={`text-xl font-black ${isPaidFull ? 'text-slate-900' : 'text-red-700'}`}>
                  {isPaidFull ? 'FULLY PAID ✓' : formatPrice(Math.max(0, totalCost - totalPaid))}
                </div>
              </div>
            </div>

            {payments.length > 0 && (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  <tr>
                    <th className="py-3">Date</th>
                    <th className="py-3">Receipt ID</th>
                    <th className="py-3">Method</th>
                    <th className="py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="py-3 font-medium text-gray-900">{new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-gray-500 font-mono text-xs">{p.id}</td>
                      <td className="py-3 text-gray-600 uppercase text-xs font-bold">{p.method || 'Cash'}</td>
                      <td className="py-3 text-right font-bold text-gray-900">{formatPrice(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Section 4: Skills Mastered */}
          <section>
            <h2 className="text-xl font-black text-gray-900 border-b-2 border-gray-100 pb-3 mb-6 uppercase tracking-wider">4. Practical Skills Log</h2>
            <div className="grid grid-cols-2 gap-4">
              {student.skills && student.skills.map((skill, idx) => {
                const isMastered = student.learned_skills?.includes(skill.key);
                if (!isMastered) return null;
                return (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                    <span className="font-bold text-gray-800 text-sm">{skill.label}</span>
                  </div>
                );
              })}
              {(!student.learned_skills || student.learned_skills.length === 0) && (
                <div className="col-span-2 text-gray-500 italic">No specific skills logged in system.</div>
              )}
            </div>
          </section>

          {/* Footer Signature */}
          <div className="mt-20 pt-10 border-t border-gray-200 flex justify-between">
            <div className="text-center">
              <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
              <div className="text-xs font-bold text-gray-500 uppercase">Instructor Signature</div>
            </div>
            <div className="text-center">
              <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
              <div className="text-xs font-bold text-gray-500 uppercase">Admin / Principal Signature</div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Print CSS Injection */}
      <style dangerouslySetContent={{__html: `
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
        }
      `}} />
    </div>
  );
}
