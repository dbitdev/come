"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ArrowRight, Check, UserRound } from "lucide-react";
import { auth } from "@/lib/firebase";
import AccesoSocial from "@/components/AccesoSocial";
import styles from "../login/auth.module.css";
import { destinoTrasEntrar } from "@/lib/utils";
import { registrarAceptacion } from "@/components/AceptacionLegal";

export default function RegisterPage(){
 const router=useRouter(); const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const [acepta,setAcepta]=useState(false);
 const finish=()=>router.replace(destinoTrasEntrar());
 // La aceptación se guarda en cuanto existe la cuenta, también al entrar con Google o Apple.
 const listoSocial=async()=>{if(auth.currentUser) await registrarAceptacion(auth.currentUser.uid).catch(()=>{});finish()};
 const register=async(e:React.FormEvent)=>{e.preventDefault();if(!acepta){setError("Para crear tu cuenta acepta los Términos y el Aviso de privacidad.");return}setBusy(true);setError("");try{const result=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(result.user,{displayName:name});await registrarAceptacion(result.user.uid).catch(()=>{});finish()}catch(err:any){setError(err?.code==="auth/email-already-in-use"?"Ese correo ya está registrado.":err?.code==="auth/weak-password"?"Usa una contraseña de al menos seis caracteres.":"No pudimos crear tu cuenta.")}finally{setBusy(false)}};
 return <main className={styles.page}><section className={styles.visual}><div className={styles.overlay}/><div className={styles.visualCopy}><span>ÚNETE A LA MESA</span><h1>Come mejor. Descubre más.</h1><ul><li><Check/>Guarda tus favoritos</li><li><Check/>Recibe recomendaciones</li><li><Check/>Planea tu próxima salida</li></ul></div></section><section className={styles.panel}><div className={styles.formWrap}><span className={styles.eyebrow}>CREA TU PERFIL</span><h2>Empieza a explorar</h2><p>Tu cuenta convierte Come en una guía personal.</p>{error&&<div className={styles.error}>{error}</div>}<label className={styles.legalCheck}><input type="checkbox" checked={acepta} onChange={e=>setAcepta(e.target.checked)} required/><span>He leído y acepto los <Link href="/terminos" target="_blank">Términos y condiciones</Link> y el <Link href="/privacidad" target="_blank">Aviso de privacidad</Link>. Soy mayor de 18 años.</span></label><AccesoSocial modo="registrar" onListo={listoSocial} onError={setError} deshabilitado={busy||!acepta}/><div className={styles.divider}><span>o usa tu correo</span></div><form onSubmit={register}><label>Nombre<div><UserRound size={18}/><input value={name} onChange={e=>setName(e.target.value)} required placeholder="¿Cómo te llamas?"/></div></label><label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@correo.com"/></label><label>Contraseña<input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres"/></label><button className={styles.submit} disabled={busy||!acepta}>{busy?"Creando cuenta…":"Crear mi cuenta"}<ArrowRight size={18}/></button></form><p className={styles.switch}>¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p></div></section></main>
}
