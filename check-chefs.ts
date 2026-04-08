import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkChefs() {
  if (!db) return;
  const snapshot = await getDocs(collection(db, "business_leads"));
  const chefs = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, chef: doc.data().chef }));
  console.log(JSON.stringify(chefs, null, 2));
}

checkChefs();
