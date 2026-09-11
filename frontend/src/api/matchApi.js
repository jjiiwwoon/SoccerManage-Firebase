/**
 * ====================================
 * 파일: matchApi.js (수정됨)
 * 위치: frontend/src/api/ (기존 파일 덮어쓰기)
 * 기능: 경기 기록 관련 백엔드 API 호출
 * ====================================
 *
 * 변경사항:
 * - deleteAllMatchStats() 추가 (경기별 스탯 전체 삭제)
 * - updateMatchStat() 추가 (개별 스탯 수정)
 * - 기존 함수들은 그대로 유지
 */

const API_URL = 'http://localhost:8080/api';

// ========== 경기 API ==========

// 전체 경기 목록 가져오기
export async function getMatches() {
    const response = await fetch(`${API_URL}/matches`);
    return response.json();
}

// 특정 경기 상세 조회
export async function getMatch(id) {
    const response = await fetch(`${API_URL}/matches/${id}`);
    return response.json();
}

// 경기 추가 (일정 등록)
export async function createMatch(matchData) {
    const response = await fetch(`${API_URL}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
    });
    return response.json();
}

// 경기 수정 (결과 입력 포함)
export async function updateMatch(id, matchData) {
    const response = await fetch(`${API_URL}/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
    });
    return response.json();
}

// 경기 삭제
export async function deleteMatch(id) {
    await fetch(`${API_URL}/matches/${id}`, { method: 'DELETE' });
}

// ========== 개인 스탯 API ==========

// 특정 경기의 스탯 목록
export async function getMatchStats(matchId) {
    const response = await fetch(`${API_URL}/matches/${matchId}/stats`);
    return response.json();
}

// 스탯 추가 (경기 ID + 선수 ID)
export async function createMatchStat(matchId, memberId, statData) {
    const response = await fetch(`${API_URL}/matches/${matchId}/stats?memberId=${memberId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statData),
    });
    return response.json();
}

// 스탯 수정
export async function updateMatchStat(statId, statData) {
    const response = await fetch(`${API_URL}/stats/${statId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statData),
    });
    return response.json();
}

// 스탯 삭제
export async function deleteMatchStat(statId) {
    await fetch(`${API_URL}/stats/${statId}`, { method: 'DELETE' });
}

// 특정 경기의 모든 스탯 삭제 (결과 재입력용)
export async function deleteAllMatchStats(matchId) {
    await fetch(`${API_URL}/matches/${matchId}/stats/all`, { method: 'DELETE' });
}
