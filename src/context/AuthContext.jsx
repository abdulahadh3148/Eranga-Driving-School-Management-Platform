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
        if (mockUserObj.name === 'Super Admin') {
          mockUserObj.name = 'Admin';
          localStorage.setItem('mockUser', JSON.stringify(mockUserObj));
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUser({
          uid: mockUserObj.uid || mockUserObj.authUid || mockUserObj.id || 'mock-uid',
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
          let foundDoc = null;
          let collectionName = '';

          const studentQ = query(collection(db, 'students'), where('authUid', '==', user.uid));
          const studentSnap = await getDocs(studentQ);
          if (!studentSnap.empty) {
            foundDoc = studentSnap.docs[0];
            collectionName = 'students';
          } else {
            const instructorQ = query(collection(db, 'instructors'), where('authUid', '==', user.uid));
            const instructorSnap = await getDocs(instructorQ);
            if (!instructorSnap.empty) {
              foundDoc = instructorSnap.docs[0];
              collectionName = 'instructors';
            } else {
              const adminQ = query(collection(db, 'admins'), where('authUid', '==', user.uid));
              const adminSnap = await getDocs(adminQ);
              if (!adminSnap.empty) {
                foundDoc = adminSnap.docs[0];
                collectionName = 'admins';
              }
            }
          }
          
          if (foundDoc) {
            const data = foundDoc.data();
            const role = data.role || data.type || collectionName.slice(0, -1);
            
            // TEMP: Console debug for user and session safety validation
            console.log('User Profile Fetched from ' + collectionName + ':', data);

            if (!data.role) {
              await setDoc(doc(db, collectionName, foundDoc.id), { role }, { merge: true });
            }

            setUserProfile({ id: foundDoc.id, ...data, role });
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
            if (isAlex) await setDoc(doc(db, 'students', newCustomId), defaultProfile);
            setUserProfile(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // If we fail to fetch or create the profile, don't leave the app stuck in an infinite loading state.
          // Clear the user so they can try logging in again, or you could add an error state here.
          setCurrentUser(null);
          setUserProfile(null);
          await signOut(auth);
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
      uid: profile.authUid || profile.id || profile.uid || 'mock-uid',
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
