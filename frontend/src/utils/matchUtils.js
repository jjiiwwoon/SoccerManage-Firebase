/**
 * ====================================
 * 파일: matchUtils.js
 * 위치: frontend/src/utils/matchUtils.js
 * 기능: 경기 결과 관련 공통 유틸리티 함수
 * ====================================
 */

/**
 * 경기 결과 판별 (win / draw / lose)
 * @param {object} match - { ourScore, opponentScore }
 * @returns {'win' | 'draw' | 'lose'}
 */
export function getResult(match) {
    if (match.ourScore > match.opponentScore) return 'win';
    if (match.ourScore === match.opponentScore) return 'draw';
    return 'lose';
}

/**
 * 경기 결과 한글 라벨
 * @param {'win' | 'draw' | 'lose'} result
 * @returns {'승' | '무' | '패'}
 */
export function getResultLabel(result) {
    if (result === 'win') return '승';
    if (result === 'draw') return '무';
    return '패';
}

/**
 * D-day 계산
 * @param {string} dateStr - 경기 날짜 문자열
 * @returns {string} 'D-DAY' 또는 'D-N'
 */
export function getDday(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchDate = new Date(dateStr);
    matchDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((matchDate - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-DAY';
    return `D-${diff}`;
}
