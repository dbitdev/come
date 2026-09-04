"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SearchOverlay from "./SearchOverlay";
import styles from "./Navbar.module.css";

export default function Navbar(){
 const [open,setOpen]=useState(false);
 const [buscando,setBuscando]=useState(false);
 const [scrolled,setScrolled]=useState(false);
 const {user}=useAuth();
 const pathname=usePathname();

 // La portada pública abre con una foto a sangre: ahí la barra va encima del
 // hero, sin fondo, y sólo se rellena al hacer scroll.
 const overHero = pathname==="/" && !user;

 useEffect(()=>{
  if(!overHero) return;
  const onScroll=()=>setScrolled(window.scrollY>24);
  // rAF en vez de una llamada directa: cubre la recarga con scroll restaurado
  // sin provocar un setState síncrono dentro del efecto.
  const frame=requestAnimationFrame(onScroll);
  window.addEventListener("scroll",onScroll,{passive:true});
  return ()=>{cancelAnimationFrame(frame);window.removeEventListener("scroll",onScroll)};
 },[overHero]);

 // Cerrar menú y buscador al navegar (ajuste de estado durante el render, el
 // patrón recomendado en vez de un efecto que sincroniza con la ruta).
 const [rutaPrevia,setRutaPrevia]=useState(pathname);
 if(pathname!==rutaPrevia){setRutaPrevia(pathname);setOpen(false);setBuscando(false)}

 const transparent = overHero && !scrolled && !open;

 return <><header className={`${styles.header} ${transparent?styles.transparent:styles.solid}`}><Link href="/" className={styles.brand}>come</Link><nav className={open?styles.open:""}>
  <Link href="/restaurantes" onClick={()=>setOpen(false)}>Restaurantes</Link><Link href="/guias" onClick={()=>setOpen(false)}>Guías</Link><Link href="/chefs" onClick={()=>setOpen(false)}>Chefs</Link><Link href="/mapa" onClick={()=>setOpen(false)}>Mapa</Link>
 </nav><div className={styles.actions}><button type="button" className={styles.iconBtn} onClick={()=>setBuscando(true)} aria-label="Buscar"><Search size={20}/></button><Link href={user?"/perfil":"/login"} aria-label="Cuenta"><User size={20}/></Link><Link href="/ordenar" className={styles.order}><ShoppingBag size={17}/> Ordenar</Link><button onClick={()=>setOpen(!open)} aria-label="Menú" className={styles.burger}>{open?<X/>:<Menu/>}</button></div></header>
 {buscando&&<SearchOverlay onClose={()=>setBuscando(false)}/>}</>
}
