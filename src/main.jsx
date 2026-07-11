import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebase/config';

async function debugDB() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log('--- USERS ---');
    usersSnap.forEach(d => console.log(d.id, d.data()));

    const instSnap = await getDocs(collection(db, 'instructors'));
    console.log('--- INSTRUCTORS ---');
    instSnap.forEach(d => console.log(d.id, d.data()));
  } catch (err) {
    console.error('Error debugging DB:', err);
  }
}
debugDB();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
