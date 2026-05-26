import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

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
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            const isAlex = user.email === 'alex@example.com';
            const defaultProfile = {
              name: isAlex ? 'Alex' : (user.displayName || 'New Student'),
              email: user.email,
              role: 'student',
              status: 'pending',
              progress: isAlex ? 60 : 0,
              classesCompleted: isAlex ? 12 : 0,
              classesTotal: 18,
              lessonsScheduled: isAlex ? 4 : 0,
              outstandingFees: isAlex ? 4500 : 15000,
              currentStep: isAlex ? 'Theory Exam' : 'Medical Check',
              createdAt: new Date().toISOString()
            };
            if (isAlex) await setDoc(userDocRef, defaultProfile);
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

  const logout = () => {
    localStorage.removeItem('mockUser');
    return signOut(auth);
  };

  const value = { currentUser, userProfile, setUserProfile, loading, logout, loginMockUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
