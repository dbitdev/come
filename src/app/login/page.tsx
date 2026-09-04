"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { ArrowRight, Check, Mail } from "lucide-react";
import { auth } from "@/lib/firebase";
import styles from "./auth.module.css";

export default function LoginPage(){
 const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 const finish=()=>router.replace("/");
 const login=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{await signInWithEmailAndPassword(auth,email,password);finish()}catch(err:any){setError(err?.code==="auth/invalid-credential"?"Correo o contraseña incorrectos.":"No pudimos iniciar sesión. Revisa tus datos e inténtalo nuevamente.")}finally{setBusy(false)}};
 const google=async()=>{setBusy(true);setError("");try{await signInWithPopup(auth,new GoogleAuthProvider());finish()}catch{setError("No pudimos completar el acceso con Google.")}finally{setBusy(false)}};
 return <main className={styles.page}>
  <section className={styles.visual}><div className={styles.overlay}/><div className={styles.visualCopy}><span>COME CONTIGO</span><h1>Tu próxima gran comida empieza aquí.</h1><ul><li><Check/>Recomendaciones para ti</li><li><Check/>Lugares y guías guardadas</li><li><Check/>Pedidos y reservaciones en un lugar</li></ul></div></section>
  <section className={styles.panel}><div className={styles.formWrap}><span className={styles.eyebrow}>BIENVENIDO DE NUEVO</span><h2>Inicia sesión</h2><p>Entra para descubrir una versión de Come hecha para ti.</p>{error&&<div className={styles.error}>{error}</div>}<button className={styles.google} onClick={google} disabled={busy}>G&nbsp;&nbsp; Continuar con Google</button><div className={styles.divider}><span>o usa tu correo</span></div><form onSubmit={login}><label>Correo electrónico<div><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@correo.com"/></div></label><label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/></label><button className={styles.submit} disabled={busy}>{busy?"Entrando…":"Entrar"}<ArrowRight size={18}/></button></form><p className={styles.switch}>¿Aún no tienes cuenta? <Link href="/register">Crea una</Link></p></div></section>
 </main>
}
