/**
 * ====================================
 * 파일: memberApi.js (Firebase 버전)
 * 위치: frontend/src/api/
 * 기능: 멤버 관련 Firestore CRUD
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

const MEMBERS = 'members';
const MATCH_STATS = 'matchStats';

// 전체 멤버 목록
export async function getMembers() {
    const snapshot = await getDocs(collection(db, MEMBERS));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 특정 멤버 조회
export async function getMember(id) {
    const docSnap = await getDoc(doc(db, MEMBERS, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
}

// 멤버 추가 (JSON)
export async function createMember(memberData) {
    const docRef = await addDoc(collection(db, MEMBERS), memberData);
    return { id: docRef.id, ...memberData };
}

// 멤버 추가 (사진 포함) — Firebase Storage에 업로드
export async function createMemberWithPhoto(name, backNumber, position, role, photoFile) {
    const memberData = {
        name,
        backNumber: Number(backNumber),
        position,
        role: role || 'MEMBER',
        profilePhoto: null,
        profilePhotoFileName: null,
    };

    // 먼저 Firestore에 멤버 문서 생성
    const docRef = await addDoc(collection(db, MEMBERS), memberData);

    // 사진이 있으면 Storage에 업로드
    if (photoFile) {
        const storageRef = ref(storage, `members/${docRef.id}/${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        const downloadURL = await getDownloadURL(storageRef);

        await updateDoc(docRef, {
            profilePhoto: downloadURL,
            profilePhotoFileName: photoFile.name,
        });
        memberData.profilePhoto = downloadURL;
        memberData.profilePhotoFileName = photoFile.name;
    }

    return { id: docRef.id, ...memberData };
}

// 멤버 수정 (JSON)
export async function updateMember(id, memberData) {
    const ref = doc(db, MEMBERS, id);
    await updateDoc(ref, memberData);
    return { id, ...memberData };
}

// 멤버 수정 (사진 포함)
export async function updateMemberWithPhoto(id, name, backNumber, position, photoFile, removePhoto) {
    const updateData = {
        name,
        backNumber: Number(backNumber),
        position,
    };

    // 사진 삭제 요청
    if (removePhoto) {
        // 기존 사진 Storage에서 삭제
        const memberDoc = await getDoc(doc(db, MEMBERS, id));
        if (memberDoc.exists() && memberDoc.data().profilePhotoFileName) {
            try {
                const oldRef = ref(storage, `members/${id}/${memberDoc.data().profilePhotoFileName}`);
                await deleteObject(oldRef);
            } catch (e) { /* 파일이 없을 수도 있음 */ }
        }
        updateData.profilePhoto = null;
        updateData.profilePhotoFileName = null;
    }

    // 새 사진 업로드
    if (photoFile) {
        const storageRef = ref(storage, `members/${id}/${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        const downloadURL = await getDownloadURL(storageRef);
        updateData.profilePhoto = downloadURL;
        updateData.profilePhotoFileName = photoFile.name;
    }

    const docRef = doc(db, MEMBERS, id);
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
}

// 프로필 사진 업로드
export async function uploadMemberPhoto(id, file) {
    const storageRef = ref(storage, `members/${id}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const docRef = doc(db, MEMBERS, id);
    await updateDoc(docRef, {
        profilePhoto: downloadURL,
        profilePhotoFileName: file.name,
    });
    const updated = await getDoc(docRef);
    return { id, ...updated.data() };
}

// 프로필 사진 삭제
export async function deleteMemberPhoto(id) {
    const docRef = doc(db, MEMBERS, id);
    const memberDoc = await getDoc(docRef);

    // Storage에서 파일 삭제
    if (memberDoc.exists() && memberDoc.data().profilePhotoFileName) {
        try {
            const storageRef = ref(storage, `members/${id}/${memberDoc.data().profilePhotoFileName}`);
            await deleteObject(storageRef);
        } catch (e) { /* 파일이 없을 수도 있음 */ }
    }

    await updateDoc(docRef, {
        profilePhoto: null,
        profilePhotoFileName: null,
    });
    const updated = await getDoc(docRef);
    return { id, ...updated.data() };
}

// 멤버 삭제
export async function deleteMember(id) {
    // Storage에서 사진도 삭제
    const memberDoc = await getDoc(doc(db, MEMBERS, id));
    if (memberDoc.exists() && memberDoc.data().profilePhotoFileName) {
        try {
            const storageRef = ref(storage, `members/${id}/${memberDoc.data().profilePhotoFileName}`);
            await deleteObject(storageRef);
        } catch (e) { /* 파일이 없을 수도 있음 */ }
    }
    await deleteDoc(doc(db, MEMBERS, id));
}

// 특정 선수의 모든 스탯 조회
export async function getMemberStats(memberId) {
    const q = query(collection(db, MATCH_STATS), where('memberId', '==', memberId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
