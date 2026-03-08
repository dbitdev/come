"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// List of admin emails (In production, use Firebase Custom Claims or an 'admins' collection)
const ADMIN_EMAILS = ['dbitdev@gmail.com', 'admin@come.mx'];

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (!ADMIN_EMAILS.includes(user.email || '')) {
                router.push('/'); // Redirect non-admins to home
            } else {
                setAuthorized(true);
            }
        }
    }, [user, loading, router]);

    if (loading || !authorized) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#666' }}>
                Verificando credenciales de administrador...
            </div>
        );
    }

    return <>{children}</>;
}
