/**
 * ====================================
 * 파일: visitorApi.js (새 파일)
 * 위치: frontend/src/api/visitorApi.js
 * 기능: 방문자 추적 API + 관리자 데이터 조회
 * ====================================
 *
 * 1. trackPageVisit() - 페이지 방문 시 Cloud Function 호출
 * 2. getVisitors() - Firestore에서 방문자 기록 조회 (관리자용)
 * 3. getMonthlyUsage() - 월별 서버 호출 수 조회 (관리자용)
 */
import { db } from '../firebase';
import {
    collection, getDocs, query, where, orderBy, limit,
    Timestamp
} from 'firebase/firestore';

const VISITORS = 'visitors';

// ========== 방문자 추적 (Cloud Function 호출) ==========

/**
 * 페이지 방문을 Cloud Function에 기록
 * 실패해도 사용자 경험에 영향 없도록 에러를 무시함
 */
export async function trackPageVisit(page) {
    try {
        const response = await fetch(
            'https://asia-northeast3-changwoofc.cloudfunctions.net/trackVisitor',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page,
                    referrer: document.referrer || '직접 접속',
                }),
            }
        );
        return await response.json();
    } catch (error) {
        // 추적 실패해도 사이트 이용에는 문제 없음
        console.warn('방문자 추적 실패 (무시됨):', error.message);
        return null;
    }
}

// ========== 관리자용 데이터 조회 ==========

/**
 * 방문자 기록 조회
 * @param {string} filter - 'today' | 'week' | 'month' | 'all'
 * @returns {Array} 방문자 기록 배열
 */
export async function getVisitors(filter = 'all') {
    let q;
    const visitorsRef = collection(db, VISITORS);

    if (filter === 'all') {
        q = query(visitorsRef, orderBy('timestamp', 'desc'), limit(500));
    } else {
        const now = new Date();
        let startDate;

        if (filter === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (filter === 'week') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (filter === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        q = query(
            visitorsRef,
            where('timestamp', '>=', Timestamp.fromDate(startDate)),
            orderBy('timestamp', 'desc'),
            limit(500)
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Firestore Timestamp → 읽을 수 있는 문자열로 변환
            timestamp: data.timestamp
                ? data.timestamp.toDate().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                : data.createdAt || '-',
        };
    });
}

/**
 * 월별 서버 호출 수 조회
 */
export async function getMonthlyUsage() {
    try {
        const response = await fetch(
            'https://asia-northeast3-changwoofc.cloudfunctions.net/getMonthlyCount'
        );
        return await response.json();
    } catch (error) {
        console.error('월별 사용량 조회 실패:', error);
        return { count: 0, limit: 1500000, monthKey: '-' };
    }
}

/**
 * 통계 요약 계산
 * @param {Array} visitors - 전체 방문자 기록
 */
export function calculateStats(visitors) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 오늘/이번주 필터를 위해 createdAt(ISO string) 사용
    const todayCount = visitors.filter(v => {
        const d = v.createdAt ? new Date(v.createdAt) : null;
        return d && d >= todayStart;
    }).length;

    const weekCount = visitors.filter(v => {
        const d = v.createdAt ? new Date(v.createdAt) : null;
        return d && d >= weekStart;
    }).length;

    // 고유 IP 수
    const uniqueIPs = new Set(visitors.map(v => v.ip)).size;

    return {
        todayCount,
        weekCount,
        totalCount: visitors.length,
        uniqueIPs,
    };
}
