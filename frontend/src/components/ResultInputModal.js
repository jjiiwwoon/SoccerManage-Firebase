/**
 * ====================================
 * 파일: ResultInputModal.js
 * 위치: frontend/src/components/
 * 기능: 경기 결과 입력/수정 모달 컴포넌트
 * ====================================
 */
import React from 'react';
import { getPositionLabel, getPositionClass } from '../utils/positionUtils';

function ResultInputModal({
    selectedMatch,
    isUpcoming,
    resultData,
    setResultData,
    playerStatInputs,
    setPlayerStatInputs,
    onPlayerStatChange,
    onSubmit,
    onClose,
}) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={onSubmit}>
                    <div className="form-title">
                        {isUpcoming ? '결과 입력' : '결과 수정'} — vs {selectedMatch.opponent}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                        {selectedMatch.matchDate}
                        {selectedMatch.matchTime && ` ${selectedMatch.matchTime}`}
                        {selectedMatch.location && ` · ${selectedMatch.location}`}
                    </div>

                    {/* 스코어 입력 */}
                    <div className="score-input-section">
                        <div className="score-team">
                            <span style={{ fontWeight: 600 }}>창우FC</span>
                            <input
                                type="number"
                                className="score-input"
                                min="0"
                                value={resultData.ourScore}
                                onChange={(e) => setResultData({ ...resultData, ourScore: e.target.value })}
                                placeholder="0"
                                required
                            />
                        </div>
                        <span className="score-vs">VS</span>
                        <div className="score-team">
                            <span style={{ fontWeight: 600 }}>{selectedMatch.opponent}</span>
                            <input
                                type="number"
                                className="score-input"
                                min="0"
                                value={resultData.opponentScore}
                                onChange={(e) => setResultData({ ...resultData, opponentScore: e.target.value })}
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    {/* 개인 기록 입력 */}
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                            개인 기록 (참가 선수 체크 후 기록 입력)
                        </div>

                        <div className="stat-input-table-wrap">
                            <table className="stat-input-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                <span>참가</span>
                                                <input
                                                    type="checkbox"
                                                    checked={playerStatInputs.length > 0 && playerStatInputs.every(p => p.played)}
                                                    onChange={(e) => {
                                                        const allChecked = e.target.checked;
                                                        setPlayerStatInputs(prev => prev.map(p => ({
                                                            ...p,
                                                            played: allChecked,
                                                            goals: allChecked ? p.goals : 0,
                                                            assists: allChecked ? p.assists : 0,
                                                        })));
                                                    }}
                                                    title="전체 선택/해제"
                                                />
                                            </div>
                                        </th>
                                        <th>선수</th>
                                        <th style={{ width: '50px' }}>포지션</th>
                                        <th style={{ width: '60px' }}>득점</th>
                                        <th style={{ width: '60px' }}>도움</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const isEditMode = !isUpcoming;
                                        const firstPlayedIdx = isEditMode ? playerStatInputs.findIndex(p => p.played) : -1;
                                        const firstNonPlayedIdx = isEditMode ? playerStatInputs.findIndex(p => !p.played) : -1;
                                        return playerStatInputs.map((player, index) => (
                                            <React.Fragment key={player.memberId}>
                                                {isEditMode && index === firstPlayedIdx && firstPlayedIdx >= 0 && (
                                                    <tr>
                                                        <td colSpan="5" style={{
                                                            textAlign: 'center',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            color: '#3b82f6',
                                                            padding: '8px 0 4px',
                                                            borderBottom: '2px solid rgba(59, 130, 246, 0.3)',
                                                        }}>
                                                            — 참석 —
                                                        </td>
                                                    </tr>
                                                )}
                                                {isEditMode && index === firstNonPlayedIdx && firstNonPlayedIdx > 0 && (
                                                    <tr>
                                                        <td colSpan="5" style={{
                                                            textAlign: 'center',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            color: '#dc2626',
                                                            padding: '8px 0 4px',
                                                            borderBottom: '2px solid rgba(220, 38, 38, 0.3)',
                                                        }}>
                                                            — 불참 —
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr style={{
                                                    opacity: player.played ? 1 : 0.5,
                                                }}>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={player.played}
                                                            onChange={(e) => onPlayerStatChange(index, 'played', e.target.checked)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: 600 }}>
                                                            No.{player.backNumber} {player.name}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${getPositionClass(player.position)}`} style={{ fontSize: '0.7rem' }}>
                                                            {getPositionLabel(player.position)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="stat-mini-input"
                                                            min="0"
                                                            value={player.goals || ''}
                                                            placeholder="0"
                                                            onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                                                            onChange={(e) => onPlayerStatChange(index, 'goals', e.target.value)}
                                                            disabled={!player.played}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="stat-mini-input"
                                                            min="0"
                                                            value={player.assists || ''}
                                                            placeholder="0"
                                                            onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                                                            onChange={(e) => onPlayerStatChange(index, 'assists', e.target.value)}
                                                            disabled={!player.played}
                                                        />
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: '20px' }}>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                        >
                            취소
                        </button>
                        <button type="submit" className="btn btn-gold">
                            {isUpcoming ? '결과 저장' : '결과 수정'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResultInputModal;
