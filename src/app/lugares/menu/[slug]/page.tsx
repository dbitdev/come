"use client";
import { useEffect,useMemo,useState } from "react";
import { useParams,useRouter } from "next/navigation";
import { collection,doc,getDoc,getDocs } from "firebase/firestore";
import { slugify } from "@/lib/utils";
import { ArrowLeft,Minus,Plus,ShoppingBag,Star } from "lucide-react";
import { db } from "@/lib/firebase";
import styles from "./menu.module.css";

type Item={name:string;description?:string;ingredients?:string;image?:string;price:number};
// Lo que trae el documento de Firestore, que no coincide del todo con lo que pinta la pantalla.
type DatosLugar={restaurantName?:string;name?:string;category?:string;rating?:number|string;image?:string;address?:string;menu?:Partial<Item>[]};
type Restaurant={name:string;category?:string;rating?:number;image?:string;address?:string;menu:Item[]};
export default function MenuPage(){
 const {slug}=useParams<{slug:string}>(); const router=useRouter(); const [restaurant,setRestaurant]=useState<Restaurant|null>(null); const [loading,setLoading]=useState(true); const [cart,setCart]=useState<Record<number,number>>({});
 // El parámetro es el nombre en slug ("levadura-de-olla"); aceptamos también
 // el id de Firestore para no romper enlaces viejos.
 useEffect(()=>{(async()=>{if(!db||!slug)return;const clave=decodeURIComponent(slug);let d:DatosLugar|null=null;const porId=await getDoc(doc(db,"come",clave));if(porId.exists()){d=porId.data()}else{const todos=await getDocs(collection(db,"come"));for(const item of todos.docs){const datos=item.data();if(slugify(String(datos.restaurantName||datos.name||""))===clave){d=datos;break}}}if(d){setRestaurant({name:d.restaurantName||d.name||"Restaurante",category:d.category,rating:Number(d.rating)||4.8,image:d.image||d.menu?.[0]?.image,address:d.address,menu:(Array.isArray(d.menu)?d.menu:[]).map((x)=>({name:x.name||"Platillo",description:x.description,ingredients:x.ingredients,image:x.image,price:Number(x.price)||0}))})}})().catch(()=>setRestaurant(null)).finally(()=>setLoading(false))},[slug]);
 const total=useMemo(()=>restaurant?.menu.reduce((sum,item,index)=>sum+item.price*(cart[index]||0),0)||0,[cart,restaurant]); const count=Object.values(cart).reduce((a,b)=>a+b,0);
 const change=(index:number,delta:number)=>setCart(old=>({...old,[index]:Math.max(0,(old[index]||0)+delta)}));
 if(loading)return <div className={styles.state}>Cargando menú…</div>; if(!restaurant)return <div className={styles.state}>Restaurante no encontrado.</div>;
 return <main className={styles.page}><header className={styles.cover}><img src={restaurant.image||"/hero_food_top.png"} alt={restaurant.name}/><div className={styles.shade}/><button onClick={()=>router.back()}><ArrowLeft/> Volver</button><div><span>{restaurant.category} · <Star size={14} fill="currentColor"/> {restaurant.rating}</span><h1>{restaurant.name}</h1><p>{restaurant.address}</p></div></header><div className={styles.body}><section><span className={styles.eyebrow}>MENÚ</span><h2>Elige tus platillos</h2><div className={styles.menu}>{restaurant.menu.map((item,index)=><article key={`${item.name}-${index}`}><div className={styles.itemCopy}><h3>{item.name}</h3><p>{item.description||item.ingredients||"Preparado por el restaurante."}</p><strong>${item.price.toLocaleString("es-MX")}</strong><div className={styles.quantity}>{cart[index]?<><button onClick={()=>change(index,-1)} aria-label="Quitar"><Minus/></button><b>{cart[index]}</b></>:null}<button onClick={()=>change(index,1)} aria-label="Agregar"><Plus/></button></div></div>{item.image&&<img src={item.image} alt={item.name}/>}</article>)}</div>{restaurant.menu.length===0&&<div className={styles.empty}>Este establecimiento todavía no ha publicado artículos para ordenar.</div>}</section><aside><div className={styles.cartTitle}><ShoppingBag/><h2>Tu pedido</h2></div>{count===0?<p>Agrega algo del menú para comenzar.</p>:<div className={styles.lines}>{restaurant.menu.map((item,index)=>cart[index]?<div key={index}><span>{cart[index]} × {item.name}</span><b>${(item.price*cart[index]).toLocaleString("es-MX")}</b></div>:null)}</div>}<div className={styles.total}><span>Total estimado</span><strong>${total.toLocaleString("es-MX")}</strong></div><button className={styles.checkout} disabled={!count}>Continuar pedido</button><small>Los precios y la disponibilidad se confirmarán antes del pago. El cobro todavía no está habilitado.</small></aside></div></main>
}
