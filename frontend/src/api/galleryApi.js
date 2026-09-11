/**
 * ====================================
 * 파일: galleryApi.js (Firebase 버전)
 * 위치: frontend/src/api/
 * 기능: 갤러리(사진/동영상) Firestore CRUD
 * ====================================
 *
 * 변경사항:
 * - 사진 저장: Base64 → Firebase Storage
 * - Storage에 파일 업로드 후 다운로드 URL을 Firestore에 저장
 */
import { db, storage } from '../firebase';
import {
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
    query, where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const GALLERY = 'gallery';

// 갤러리 전체 조회 (타입별 필터 가능)
export async function getGalleryItems(type) {
    let q;
    if (type) {
        q = query(collection(db, GALLERY), where('type', '==', type));
    } else {
        q = collection(db, GALLERY);
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 단일 항목 조회
export async function getGalleryItem(id) {
    const docSnap = await getDoc(doc(db, GALLERY, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
}

// 사진 업로드 — Firebase Storage에 저장
export async function uploadPhoto(file, title) {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `gallery/${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const data = {
        title: title || '',
        type: 'PHOTO',
        fileData: downloadURL,
        fileName: file.name,
        storagePath: `gallery/${fileName}`,
        createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, GALLERY), data);
    return { id: docRef.id, ...data };
}

// 동영상 URL 등록
export async function addVideo(url, title) {
    const data = {
        title: title || '',
        type: 'VIDEO',
        url,
        createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, GALLERY), data);
    return { id: docRef.id, ...data };
}

// 제목 수정
export async function updateGalleryItem(id, title) {
    const docRef = doc(db, GALLERY, id);
    await updateDoc(docRef, { title });
    return { id, title };
}

// 삭제
export async function deleteGalleryItem(id) {
    // Storage에서 파일도 삭제 (사진인 경우)
    const docSnap = await getDoc(doc(db, GALLERY, id));
    if (docSnap.exists() && docSnap.data().storagePath) {
        try {
            const storageRef = ref(storage, docSnap.data().storagePath);
            await deleteObject(storageRef);
        } catch (e) { /* 파일이 없을 수도 있음 */ }
    }
    await deleteDoc(doc(db, GALLERY, id));
}
