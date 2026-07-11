/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generateCustomId } from '../utils/idGenerator';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for mock session in localStorage on mount
    const mockUserStr = localStorage.getItem('mockUser');
    if (mockUserStr) {
      try {
        const mockUserObj = JSON.parse(mockUserStr);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUser({
          uid: mockUserObj.uid || 'mock-uid',
          email: mockUserObj.email,
          displayName: mockUserObj.name
        });
        setUserProfile(mockUserObj);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing mockUser from localStorage:', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we have a mock user in localStorage, prioritize it
      if (localStorage.getItem('mockUser')) {
        setLoading(false);
        return;
      }

      if (user) {
        setCurrentUser(user);
        try {
          const q = query(collection(db, 'users'), where('authUid', '==', user.uid));
          const querySnap = await getDocs(q);
          
          if (!querySnap.empty) {
            const docSnap = querySnap.docs[0];
            const data = docSnap.data();
            const fallbackRole = data.role || data.type || 'student';
            
            // The users collection is now the single source of truth for all roles.
            // No legacy merging from 'instructors' or 'students' is needed.

            // TEMP: Console debug for user and session safety validation
            console.log('User Profile Fetched:', data);

            if (!data.role) {
              await setDoc(doc(db, 'users', docSnap.id), { role: fallbackRole }, { merge: true });
            }

            setUserProfile({ id: docSnap.id, ...data, role: fallbackRole });
          } else {
            // Fallback for new unlinked seed accounts (like Alex)
            const isAlex = user.email === 'alex@example.com';
            const newCustomId = await generateCustomId('EDS');
            const defaultProfile = {
              id: newCustomId,
              authUid: user.uid,
              name: isAlex ? 'Alex' : (user.displayName || 'New Student'),
              email: user.email,
              role: 'student',
              status: 'pending',
              progress: isAlex ? 60 : 0,
              classesCompleted: isAlex ? 12 : 0,
              classesTotal: 18,
              lessonsScheduled: isAlex ? 4 : 0,
              outstandingFees: isAlex ? 4500 : 0,
              currentStep: isAlex ? 'Theory Exam' : 'Medical Check',
              createdAt: new Date().toISOString()
            };
            if (isAlex) await setDoc(doc(db, 'users', newCustomId), defaultProfile);
            setUserProfile(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginMockUser = (profile) => {
    const mockUserObj = {
      uid: profile.uid || 'mock-uid',
      email: profile.email,
      displayName: profile.name
    };
    setCurrentUser(mockUserObj);
    setUserProfile(profile);
    localStorage.setItem('mockUser', JSON.stringify(profile));
  };

  const logout = async () => {
    localStorage.removeItem('mockUser');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setUserProfile(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = { currentUser, userProfile, setUserProfile, loading, logout, loginMockUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
