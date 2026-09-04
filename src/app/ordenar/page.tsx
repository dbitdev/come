"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection,getDocs } from "firebase/firestore";
import { LocateFixed, Search, ShoppingBag } from "lucide-react";
import { db } from "@/lib/firebase";
import AddressPicker from "@/components/AddressPicker";
import { reverseGeocode, useSavedLocation } from "@/lib/location";
import styles from "./order.module.css";
import { isPublished } from "@/lib/utils";
type Place={id:string;name:string;image:string;category:string;rating:number;menu:unknown[];address:string;lat?:number;lng?:number};
type GeoState="idle"|"loading"|"success"|"denied"|"unavailable";
export default function OrderPage(){
 const [mode,setMode]=useState<"pickup"|"delivery">("delivery"),[places,setPlaces]=useState<Place[]>([]),[open,setOpen]=useState(false),[geo,setGeo]=useState<GeoState>("idle");
 // La dirección elegida se recuerda en el navegador entre visitas.
 const {location,save}=useSavedLocation();
 const address=location?.label??"";
 const coords=useMemo(()=>location?{lat:location.lat,lng:location.lng}:null,[location]);
 useEffect(()=>{(async()=>{if(!db)return;const s=await getDocs(collection(db,"come"));setPlaces(s.docs.filter(d=>isPublished(d.data())).map(d=>{const x=d.data();return{id:d.id,name:x.restaurantName||x.name||"Restaurante",image:x.image||x.menu?.[0]?.image||"/hero_food_top.png",category:x.category||"Gastronomía",rating:Number(x.rating)||4.8,menu:Array.isArray(x.menu)?x.menu:[],address:x.address||"México",lat:Number(x.lat)||undefined,lng:Number(x.lng)||undefined}}).filter(x=>x.menu.length));})().catch(()=>setPlaces([]))},[]);
 const locate=()=>{setGeo("loading");if(!navigator.geolocation){setGeo("unavailable");return}navigator.geolocation.getCurrentPosition(async p=>{const lat=p.coords.latitude,lng=p.coords.longitude;const label=await reverseGeocode(lat,lng);setGeo("success");save({label,lat,lng});setOpen(false)},e=>setGeo(e.code===1?"denied":"unavailable"),{enableHighAccuracy:true,timeout:12000,maximumAge:60000})};
 const available=useMemo(()=>{const distance=(p:Place)=>!coords||p.lat==null||p.lng==null?99999:Math.hypot(p.lat-coords.lat,p.lng-coords.lng);return coords?[...places].sort((a,b)=>distance(a)-distance(b)):places},[places,coords]);
 return <main className={styles.page}><section className={styles.hero}><div className={styles.food}><b>come</b></div><div className={styles.start}><span>COME</span><h1>Pide de grandes restaurantes, en una sola experiencia.</h1><button className={styles.addressButton} onClick={()=>setOpen(true)}><Search/><span>{address||"Ingresa una dirección de entrega"}</span></button><button className={styles.location} onClick={locate} disabled={geo==="loading"}><LocateFixed size={18}/>{geo==="loading"?"Buscando tu ubicación…":"Usar mi ubicación actual"}</button>{geo==="denied"&&<p className={styles.geoError}>El navegador bloqueó la ubicación. Actívala para localhost en los permisos del sitio y vuelve a intentarlo.</p>}{geo==="unavailable"&&<p className={styles.geoError}>No fue posible obtener tu ubicación. Escribe tu dirección manualmente.</p>}</div></section><section className={styles.list}><div className={styles.listHead}><div><span>DISPONIBLES CERCA DE TI</span><h2>Elige un restaurante</h2></div><div className={styles.mode}><button className={mode==="delivery"?styles.active:""} onClick={()=>setMode("delivery")}>Entrega</button><button className={mode==="pickup"?styles.active:""} onClick={()=>setMode("pickup")}>Recoger</button></div></div><div className={styles.grid}>{available.map(p=><Link href={`/lugares/menu/${p.id}`} key={p.id}><img src={p.image} alt={p.name}/><div><small>{p.category} · ★ {p.rating.toFixed(1)}</small><h3>{p.name}</h3><p>{p.address}</p><b>Ver menú <ShoppingBag size={15}/></b></div></Link>)}</div>{available.length===0&&<div className={styles.empty}>No encontramos restaurantes para esta búsqueda.</div>}</section>{open&&<AddressPicker value={location} onSelect={next=>{save(next);setOpen(false)}} onClose={()=>setOpen(false)}/>}</main>
}
