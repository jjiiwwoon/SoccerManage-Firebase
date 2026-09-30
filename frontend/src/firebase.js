/**
 * ====================================
 * 파일: firebase.js (수정됨)
 * 위치: frontend/src/firebase.js
 * 기능: Firebase 초기화 + Functions 연결 추가
 * ====================================
 *
 * 변경사항:
 * - getFunctions 추가 (Cloud Functions 호출용)
 */
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

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
export const analytics = getAnalytics(app);
export const functions = getFunctions(app, "asia-northeast3");  // ← 추가: Cloud Functions 연결 (서울 리전)
export default app;
