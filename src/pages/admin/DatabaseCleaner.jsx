import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Trash2, ShieldAlert, RefreshCw, Database } from 'lucide-react';

export default function DatabaseCleaner() {
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const scanDatabase = async () => {
    setLoading(true);
    setLogs([]);
    addLog("Starting database scan...");

    try {
      const results = {
        invalidStudents: [],
        orphanedPayments: [],
        orphanedBookings: [],
        orphanedSessions: []
      };

      // 1. Fetch all students
      addLog("Fetching students...");
      const stuSnap = await getDocs(collection(db, 'students'));
      const validStudentIds = new Set();

      stuSnap.docs.forEach(d => {
        const id = d.id;
        // Invalid IDs are those containing '@' (emails) or lacking the 'id' field in data
        const data = d.data();
        if (id.includes('@') || !data.name || !data.role) {
          results.invalidStudents.push({ id, reason: id.includes('@') ? 'Email as Document ID' : 'Missing critical profile data', data });
        } else {
          validStudentIds.add(id);
        }
      });
      addLog(`Found ${results.invalidStudents.length} corrupted student documents.`);

      // 2. Fetch Payments
      addLog("Fetching payments...");
      const paySnap = await getDocs(collection(db, 'payments'));
      paySnap.docs.forEach(d => {
        const data = d.data();
        const sId = data.studentId || data.student_id;
        if (!sId || !validStudentIds.has(sId)) {
          results.orphanedPayments.push({ id: d.id, studentId: sId, data });
        }
      });
      addLog(`Found ${results.orphanedPayments.length} orphaned payment records.`);

      // 3. Fetch Bookings/Training Slots
      addLog("Fetching bookings...");
      const bookSnap = await getDocs(collection(db, 'bookings'));
      bookSnap.docs.forEach(d => {
        const data = d.data();
        if (!validStudentIds.has(data.studentId)) {
          results.orphanedBookings.push({ id: d.id, studentId: data.studentId, data });
        }
      });
      addLog(`Found ${results.orphanedBookings.length} orphaned bookings.`);

      // 4. Fetch Sessions
      addLog("Fetching sessions...");
      const sesSnap = await getDocs(collection(db, 'sessions'));
      sesSnap.docs.forEach(d => {
        const data = d.data();
        if (!validStudentIds.has(data.studentId)) {
          results.orphanedSessions.push({ id: d.id, studentId: data.studentId, data });
        }
      });
      addLog(`Found ${results.orphanedSessions.length} orphaned sessions.`);

      setScanResults(results);
      addLog("Scan complete!");
    } catch (err) {
      console.error(err);
      addLog(`Error during scan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanDatabase = async () => {
    if (!scanResults) return;
    
    if (!window.confirm("WARNING: This will permanently delete corrupted students and orphaned data. This action CANNOT be undone. Are you sure?")) {
      return;
    }

    setCleaning(true);
    addLog("Starting cleanup process...");

    try {
      const batch = writeBatch(db);
      let count = 0;

      const queueDelete = (col, items) => {
        items.forEach(item => {
          batch.delete(doc(db, col, item.id));
          count++;
        });
      };

      queueDelete('students', scanResults.invalidStudents);
      queueDelete('payments', scanResults.orphanedPayments);
      queueDelete('bookings', scanResults.orphanedBookings);
      queueDelete('sessions', scanResults.orphanedSessions);

      if (count > 0) {
        addLog(`Executing batch deletion for ${count} documents...`);
        await batch.commit();
        addLog(`Success! All ${count} corrupted/orphaned documents have been safely removed.`);
        setScanResults({ invalidStudents: [], orphanedPayments: [], orphanedBookings: [], orphanedSessions: [] });
      } else {
        addLog("No items required deletion.");
      }
    } catch (err) {
      console.error(err);
      addLog(`Error during cleanup: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const totalIssues = scanResults ? 
    (scanResults.invalidStudents.length + scanResults.orphanedPayments.length + scanResults.orphanedBookings.length + scanResults.orphanedSessions.length) 
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="text-primary" /> Database Diagnostics & Cleanup
        </h1>
        <p className="text-gray-500 text-sm mt-1">Safely scan and resolve corrupted profiles and orphaned data records.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <ShieldAlert className="text-yellow-500 mb-4" size={48} />
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Scan Database</h2>
          <p className="text-sm text-gray-500 mb-6">Analyze your Firestore collections for email-based IDs, missing profiles, and disconnected payments.</p>
          <button 
            onClick={scanDatabase} 
            disabled={loading || cleaning}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {loading ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <Trash2 className="text-red-500 mb-4" size={48} />
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. Clean Corrupted Data</h2>
          <p className="text-sm text-gray-500 mb-6">Permanently wipe the identified corrupted records to restore database integrity.</p>
          <button 
            onClick={cleanDatabase} 
            disabled={!scanResults || totalIssues === 0 || cleaning}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50"
          >
            {cleaning ? <RefreshCw className="animate-spin" size={20} /> : <AlertTriangle size={20} />}
            {cleaning ? 'Cleaning...' : 'Delete Corrupted Data'}
          </button>
        </div>
      </div>

      {scanResults && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            {totalIssues > 0 ? <AlertTriangle className="text-yellow-500" size={20} /> : <CheckCircle className="text-green-500" size={20} />}
            Scan Results ({totalIssues} issues found)
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="text-2xl font-black text-red-600">{scanResults.invalidStudents.length}</div>
              <div className="text-xs font-bold text-red-900 uppercase mt-1">Corrupted Students</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="text-2xl font-black text-orange-600">{scanResults.orphanedPayments.length}</div>
              <div className="text-xs font-bold text-orange-900 uppercase mt-1">Orphaned Payments</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="text-2xl font-black text-yellow-600">{scanResults.orphanedBookings.length}</div>
              <div className="text-xs font-bold text-yellow-900 uppercase mt-1">Orphaned Bookings</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-2xl font-black text-blue-600">{scanResults.orphanedSessions.length}</div>
              <div className="text-xs font-bold text-blue-900 uppercase mt-1">Orphaned Sessions</div>
            </div>
          </div>
        </motion.div>
      )}

      {logs.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs h-48 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
