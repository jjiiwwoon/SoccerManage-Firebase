import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";   // ← 이 줄 추가

const firebaseConfig = {
    apiKey: "AIzaSyDhM4R2q2ueCpErm9wTiKwNQm78iH-E4SQ",
    authDomain: "changwoofc.firebaseapp.com",
    projectId: "changwoofc",
    storageBucket: "changwoofc.firebasestorage.app",
    messagingSenderId: "405518171125",
    appId: "1:405518171125:web:16a2ff2dfaf8e03bfe7ebc",
    measurementId: "G-SGGGZE8L47"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);   // ← 이 줄 추가
export default app;