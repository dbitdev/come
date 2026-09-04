"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { ArrowRight, Check, UserRound } from "lucide-react";
import { auth } from "@/lib/firebase";
import styles from "../login/auth.module.css";

export default function RegisterPage(){
 const router=useRouter(); const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 const finish=()=>router.replace("/");
 const register=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{const result=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(result.user,{displayName:name});finish()}catch(err:any){setError(err?.code==="auth/email-already-in-use"?"Ese correo ya está registrado.":err?.code==="auth/weak-password"?"Usa una contraseña de al menos seis caracteres.":"No pudimos crear tu cuenta.")}finally{setBusy(false)}};
 const google=async()=>{setBusy(true);setError("");try{await signInWithPopup(auth,new GoogleAuthProvider());finish()}catch{setError("No pudimos completar el registro con Google.")}finally{setBusy(false)}};
 return <main className={styles.page}><section className={styles.visual}><div className={styles.overlay}/><div className={styles.visualCopy}><span>ÚNETE A LA MESA</span><h1>Come mejor. Descubre más.</h1><ul><li><Check/>Guarda tus favoritos</li><li><Check/>Recibe recomendaciones</li><li><Check/>Planea tu próxima salida</li></ul></div></section><section className={styles.panel}><div className={styles.formWrap}><span className={styles.eyebrow}>CREA TU PERFIL</span><h2>Empieza a explorar</h2><p>Tu cuenta convierte Come en una guía personal.</p>{error&&<div className={styles.error}>{error}</div>}<button className={styles.google} onClick={google} disabled={busy}>G&nbsp;&nbsp; Registrarme con Google</button><div className={styles.divider}><span>o usa tu correo</span></div><form onSubmit={register}><label>Nombre<div><UserRound size={18}/><input value={name} onChange={e=>setName(e.target.value)} required placeholder="¿Cómo te llamas?"/></div></label><label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@correo.com"/></label><label>Contraseña<input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres"/></label><button className={styles.submit} disabled={busy}>{busy?"Creando cuenta…":"Crear mi cuenta"}<ArrowRight size={18}/></button></form><p className={styles.switch}>¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p></div></section></main>
}
