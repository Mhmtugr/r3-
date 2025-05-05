import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// MehmetEndustriyelTakip uygulaması için Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyCUjPf-XtmbcmFmy3m-HWjJoilDNQbt3GE",
  authDomain: "mehmetendustriyeltakip-1d917.firebaseapp.com",
  projectId: "mehmetendustriyeltakip-1d917",
  storageBucket: "mehmetendustriyeltakip-1d917.firebasestorage.app",
  messagingSenderId: "278521463542",
  appId: "1:278521463542:web:ee3f34dd1c8830f664e2d7"
};

// Firebase başlatma
const app = initializeApp(firebaseConfig);

// Firestore, Storage ve Analytics servisleri
const db = getFirestore(app);
const storage = getStorage(app);
let analytics = null;

// Analytics'i sadece tarayıcı ortamında başlat
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, db, storage, analytics };
export default app;