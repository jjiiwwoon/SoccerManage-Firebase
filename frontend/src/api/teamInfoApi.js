/**
 * ====================================
 * 파일: teamInfoApi.js (Firebase 버전)
 * 위치: frontend/src/api/
 * 기능: 팀 정보 Firestore CRUD
 * ====================================
 *
 * 변경사항:
 * - 팀 사진 저장: Base64 → Firebase Storage
 * - Storage에 파일 업로드 후 다운로드 URL을 Firestore에 저장
 */
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const TEAM_DOC = doc(db, 'teamInfo', 'main');

// 팀 정보 조회
export async function getTeamInfo() {
    const docSnap = await getDoc(TEAM_DOC);
    if (!docSnap.exists()) {
        // 초기 데이터 생성
        const defaultData = {
            teamName: '창우FC',
            description: '',
            teamPhoto: null,
            teamPhotoFileName: null,
        };
        await setDoc(TEAM_DOC, defaultData);
        return { id: 'main', ...defaultData };
    }
    return { id: docSnap.id, ...docSnap.data() };
}

// 팀 정보 수정 (이름, 소개, 링크)
export async function updateTeamInfo(data) {
    await updateDoc(TEAM_DOC, data);
    const updated = await getDoc(TEAM_DOC);
    return { id: 'main', ...updated.data() };
}

// 팀 사진 업로드 — Firebase Storage에 저장
export async function uploadTeamPhoto(file) {
    // 기존 사진이 있으면 Storage에서 삭제
    const currentDoc = await getDoc(TEAM_DOC);
    if (currentDoc.exists() && currentDoc.data().teamPhotoFileName) {
        try {
            const oldRef = ref(storage, `team/${currentDoc.data().teamPhotoFileName}`);
            await deleteObject(oldRef);
        } catch (e) { /* 파일이 없을 수도 있음 */ }
    }

    // 새 사진 Storage에 업로드
    const storageRef = ref(storage, `team/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    await updateDoc(TEAM_DOC, {
        teamPhoto: downloadURL,
        teamPhotoFileName: file.name,
    });
    const updated = await getDoc(TEAM_DOC);
    return { id: 'main', ...updated.data() };
}

// 팀 사진 삭제
export async function deleteTeamPhoto() {
    // Storage에서 파일 삭제
    const currentDoc = await getDoc(TEAM_DOC);
    if (currentDoc.exists() && currentDoc.data().teamPhotoFileName) {
        try {
            const storageRef = ref(storage, `team/${currentDoc.data().teamPhotoFileName}`);
            await deleteObject(storageRef);
        } catch (e) { /* 파일이 없을 수도 있음 */ }
    }

    await updateDoc(TEAM_DOC, {
        teamPhoto: null,
        teamPhotoFileName: null,
    });
}
