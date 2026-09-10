"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            console.warn("Firebase auth not initialized — skipping auth listener");
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            // Sin una ficha por persona no hay a quién asignarle un negocio desde
            // el admin: la colección `users` estaba vacía porque nadie la escribía.
            // Va aquí y no en el registro para que cubra también a quien entra con
            // Google o Apple, y para que los que ya existían queden al entrar.
            if (user && db) {
                setDoc(
                    doc(db, "users", user.uid),
                    {
                        email: user.email ?? "",
                        displayName: user.displayName ?? "",
                        photoURL: user.photoURL ?? "",
                        ultimoAcceso: serverTimestamp(),
                    },
                    { merge: true },
                ).catch(() => {
                    /* Si falla, la sesión sigue siendo válida; no vale bloquear la entrada. */
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
