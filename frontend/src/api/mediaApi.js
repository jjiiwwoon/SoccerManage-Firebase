/**
 * ====================================
 * 파일: mediaApi.js (Firebase 버전)
 * 위치: frontend/src/api/
 * 기능: 미디어 갤러리 Firestore CRUD
 * ====================================
 *
 * 변경사항:
 * - 사진 저장: Base64 → Firebase Storage
 * - Storage에 파일 업로드 후 다운로드 URL을 Firestore에 저장
 */
import { db, storage } from '../firebase';
import {
    collection, doc, getDocs, getDoc, addDoc, deleteDoc,
    query, where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const MEDIA = 'media';

// 미디어 목록 (전체 또는 타입별)
export async function getMediaList(type) {
    let q;
    if (type) {
        q = query(collection(db, MEDIA), where('type', '==', type));
    } else {
        q = collection(db, MEDIA);
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 사진 파일 업로드 — Firebase Storage에 저장
export async function uploadMedia(file, title, description) {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `media/${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const data = {
        title,
        description: description || '',
        type: 'PHOTO',
        fileData: downloadURL,
        fileName: file.name,
        storagePath: `media/${fileName}`,
        createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, MEDIA), data);
    return { id: docRef.id, ...data };
}

// 동영상 URL 추가
export async function createMedia(mediaData) {
    const data = {
        ...mediaData,
        createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, MEDIA), data);
    return { id: docRef.id, ...data };
}

// 미디어 삭제
export async function deleteMedia(id) {
    // Storage에서 파일도 삭제 (사진인 경우)
    const docSnap = await getDoc(doc(db, MEDIA, id));
    if (docSnap.exists() && docSnap.data().storagePath) {
        try {
            const storageRef = ref(storage, docSnap.data().storagePath);
            await deleteObject(storageRef);
        } catch (e) { /* 파일이 없을 수도 있음 */ }
    }
    await deleteDoc(doc(db, MEDIA, id));
}
