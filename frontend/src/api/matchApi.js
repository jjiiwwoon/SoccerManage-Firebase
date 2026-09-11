/**
 * ====================================
 * 파일: matchApi.js (Firebase 버전)
 * 위치: frontend/src/api/
 * 기능: 경기 기록 + 개인 스탯 Firestore CRUD
 * ====================================
 *
 * 변경사항:
 * - Spring Boot fetch → Firestore SDK로 전환
 * - matchStats는 별도 컬렉션으로 관리 (matchId, memberId 필드로 연결)
 */
import { db } from '../firebase';
import {
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
    query, where
} from 'firebase/firestore';

const MATCHES = 'matches';
const MATCH_STATS = 'matchStats';

// ========== 경기 API ==========

// 전체 경기 목록 가져오기
export async function getMatches() {
    const snapshot = await getDocs(collection(db, MATCHES));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 특정 경기 상세 조회
export async function getMatch(id) {
    const docSnap = await getDoc(doc(db, MATCHES, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
}

// 경기 추가 (일정 등록)
export async function createMatch(matchData) {
    // 결과 자동 계산
    const data = { ...matchData };
    if (data.ourScore != null && data.opponentScore != null) {
        if (data.ourScore > data.opponentScore) data.result = 'WIN';
        else if (data.ourScore < data.opponentScore) data.result = 'LOSE';
        else data.result = 'DRAW';
    } else {
        data.result = null;
    }
    const docRef = await addDoc(collection(db, MATCHES), data);
    return { id: docRef.id, ...data };
}

// 경기 수정 (결과 입력 포함)
export async function updateMatch(id, matchData) {
    const data = { ...matchData };
    if (data.ourScore != null && data.opponentScore != null) {
        if (data.ourScore > data.opponentScore) data.result = 'WIN';
        else if (data.ourScore < data.opponentScore) data.result = 'LOSE';
        else data.result = 'DRAW';
    } else {
        data.result = null;
    }
    const ref = doc(db, MATCHES, id);
    await updateDoc(ref, data);
    return { id, ...data };
}

// 경기 삭제
export async function deleteMatch(id) {
    // 경기에 연결된 스탯도 함께 삭제
    const q = query(collection(db, MATCH_STATS), where('matchId', '==', id));
    const statsSnapshot = await getDocs(q);
    const deletePromises = statsSnapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    await deleteDoc(doc(db, MATCHES, id));
}

// ========== 개인 스탯 API ==========

// 특정 경기의 스탯 목록
export async function getMatchStats(matchId) {
    const q = query(collection(db, MATCH_STATS), where('matchId', '==', matchId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 스탯 추가 (경기 ID + 선수 ID)
export async function createMatchStat(matchId, memberId, statData) {
    const data = {
        matchId,
        memberId,
        ...statData,
    };
    const docRef = await addDoc(collection(db, MATCH_STATS), data);
    return { id: docRef.id, ...data };
}

// 스탯 수정
export async function updateMatchStat(statId, statData) {
    const ref = doc(db, MATCH_STATS, statId);
    await updateDoc(ref, statData);
    return { id: statId, ...statData };
}

// 스탯 삭제
export async function deleteMatchStat(statId) {
    await deleteDoc(doc(db, MATCH_STATS, statId));
}

// 특정 경기의 모든 스탯 삭제 (결과 재입력용)
export async function deleteAllMatchStats(matchId) {
    const q = query(collection(db, MATCH_STATS), where('matchId', '==', matchId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
}
