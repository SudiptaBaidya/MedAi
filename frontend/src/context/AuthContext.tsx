import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface User {
    uid: string;
    email: string | null;
    name: string | null;
    photoURL: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    loginWithGoogle: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const currentToken = await firebaseUser.getIdToken();
                setToken(currentToken);
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                });
            } else {
                setUser(null);
                setToken(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const currentToken = await result.user.getIdToken();
            setToken(currentToken);

            // Sync with our backend
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://medai-utym.onrender.com'}/api/auth/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to sync user with database');
            }

        } catch (error) {
            console.error('[AuthContext] Login Failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setToken(null);
        } catch (error) {
            console.error('[AuthContext] Logout Failed:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
