import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function FixData() {
  const [logs, setLogs] = useState([]);
  const [data, setData] = useState({ bookings: [], slots: [], sessions: [] });
  const navigate = useNavigate();

  const addLog = (msg) => setLogs(p => [...p, msg]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        addLog("Fetching current database state...");
        
        const bSnap = await getDocs(collection(db, 'bookings'));
        const b = bSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
        
        const tSnap = await getDocs(collection(db, 'training_slots'));
        const t = tSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
        
        const sSnap = await getDocs(collection(db, 'sessions'));
        const s = sSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

        setData({ bookings: b, slots: t, sessions: s });
        addLog(`Found ${b.length} bookings, ${t.length} training_slots, ${s.length} sessions.`);
      } catch (err) {
        addLog(`Error fetching data: ${err.message}`);
      }
    };
    fetchData();
  }, []);

  const runMigration = async () => {
    try {
      addLog("Starting migration...");
      let count = 0;
      for (const slot of data.slots) {
        const newPayload = {
          ...slot,
          timeSlot: slot.timeSlot || slot.time || (slot.startTime ? `${slot.startTime} - ${slot.endTime}` : 'Unknown Time'),
          vehicle: slot.vehicleType || slot.vehicle || 'Not specified'
        };
        addLog(`Migrating slot ${slot._id} for ${slot.studentName}...`);
        await setDoc(doc(db, 'bookings', slot._id), newPayload);
        await deleteDoc(doc(db, 'training_slots', slot._id));
        count++;
      }
      addLog(`Migration complete! Moved ${count} slots to bookings.`);
    } catch (err) {
      addLog(`Migration error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Database Diagnostics</h2>
      <button onClick={runMigration} style={{ padding: '10px', background: 'blue', color: 'white', marginRight: '10px' }}>
        Run Migration Fix
      </button>
      <button onClick={() => navigate('/admin/bookings')} style={{ padding: '10px', background: 'green', color: 'white' }}>
        Go to Admin Bookings
      </button>

      <div style={{ marginTop: '20px', padding: '10px', background: '#eee' }}>
        <h3>Logs</h3>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1, background: '#f9f9f9', padding: '10px' }}>
          <h3>training_slots (Orphans)</h3>
          <pre style={{ fontSize: '10px' }}>{JSON.stringify(data.slots, null, 2)}</pre>
        </div>
        <div style={{ flex: 1, background: '#f9f9f9', padding: '10px' }}>
          <h3>bookings (Admin sees this)</h3>
          <pre style={{ fontSize: '10px' }}>{JSON.stringify(data.bookings, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
