/**
 * ====================================
 * 파일: positionUtils.js
 * 위치: frontend/src/utils/positionUtils.js
 * 기능: 포지션 관련 공통 유틸리티 함수
 * ====================================
 */

// 포지션별 색상 매핑
export const POSITION_COLORS = {
    GK: '#E8B931',
    DF: '#4A90D9',
    MF: '#50B86C',
    FW: '#E85D5D',
};

/**
 * 포지션 라벨 변환
 * @param {string} position - 원본 포지션 문자열
 * @returns {string} 'GK' | 'DF' | 'MF' | 'FW' | 원본
 */
export function getPositionLabel(position) {
    const pos = (position || '').toUpperCase();
    if (pos.includes('GK') || pos === '골키퍼') return 'GK';
    if (pos.includes('DF') || pos === '수비수') return 'DF';
    if (pos.includes('MF') || pos === '미드필더') return 'MF';
    if (pos.includes('FW') || pos === '공격수') return 'FW';
    return pos || '-';
}

/**
 * 포지션 색상 반환
 * @param {string} position - 원본 포지션 문자열
 * @returns {string} HEX 색상 코드
 */
export function getPositionColor(position) {
    const label = getPositionLabel(position);
    return POSITION_COLORS[label] || '#888';
}

/**
 * 포지션 CSS 클래스 반환
 * @param {string} position - 원본 포지션 문자열
 * @returns {string} 'badge-gk' | 'badge-df' | 'badge-mf' | 'badge-fw' | ''
 */
export function getPositionClass(position) {
    const label = getPositionLabel(position);
    if (['GK', 'DF', 'MF', 'FW'].includes(label)) {
        return `badge-${label.toLowerCase()}`;
    }
    return '';
}
