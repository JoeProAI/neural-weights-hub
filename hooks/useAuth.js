import { useState, useEffect, useContext, createContext } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set user immediately for auth state
        setUser(user);
        
        // Try to create/update user document in Firestore if available (non-blocking)
        if (db) {
          // Use setTimeout to make Firestore operations non-blocking
          setTimeout(async () => {
            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                  email: user.email,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  createdAt: new Date(),
                  subscriptionPlan: 'free',
                  subscriptionStatus: 'active'
                });
              }
            } catch (error) {
              // Silently fail - Firestore issues shouldn't block auth
              console.debug('Firestore operation skipped:', error.message);
            }
          }, 100);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (email, password) => {
    if (!auth) throw new Error('Authentication not available');
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithEmail = async (email, password) => {
    if (!auth) throw new Error('Authentication not available');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Authentication not available');
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    if (!auth) throw new Error('Authentication not available');
    return signOut(auth);
  };

  const value = {
    user,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
