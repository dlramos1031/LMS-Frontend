import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { useEffect, useState } from 'react';

export default function RootNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  return user ? <MainStack /> : <AuthStack />;
  
}