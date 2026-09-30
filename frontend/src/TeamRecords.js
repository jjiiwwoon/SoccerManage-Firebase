/**
 * ====================================
 * 파일: TeamRecords.js (디자인 캔버스 매칭)
 * 위치: frontend/src/pages/TeamRecords.js
 * 기능: 팀 전적 요약 + 경기 결과 테이블
 * [UI 리디자인] Navy & Volt: 강조 카드, 비율 막대, 득실차 열, 필터별 개수
 *   (데이터 조회/계산 로직은 변경 없음)
 * ====================================
 */
import React, { useState, useEffect } from 'react';
import { getMatches } from '../api/matchApi';
import { getResult, getResultLabel } from '../utils/matchUtils';

function TeamRecords() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getMatches();
                setMatches(data);
            } catch (err) {
                console.error('경기 데이터 로딩 실패:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const completedMatches = matches.filter(m => m.ourScore != null && m.opponentScore != null);

    const totalMatches = completedMatches.length;
    const wins = completedMatches.filter(m => getResult(m) === 'win').length;
    const draws = completedMatches.filter(m => getResult(m) === 'draw').length;
    const losses = completedMatches.filter(m => getResult(m) === 'lose').length;
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';
    const totalGoals = completedMatches.reduce((sum, m) => sum + (m.ourScore || 0), 0);
    const totalConceded = completedMatches.reduce((sum, m) => sum + (m.opponentScore || 0), 0);
    const avgGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0.0';
    const avgConceded = totalMatches > 0 ? (totalConceded / totalMatches).toFixed(1) : '0.0';
    // [UI] 득실차 (득점 - 실점)
    const goalDiff = totalGoals - totalConceded;

    const filteredMatches = completedMatches
        .filter(m => {
            if (filter === 'all') return true;
            return getResult(m) === filter;
        })
        .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate));

    // [UI] 필터 탭별 경기 수
    const filterCounts = { all: totalMatches, win: wins, draw: draws, lose: losses };

    // [UI] 승/패 카드 하단에 표시할 가장 최근 경기
    const latestByResult = (key) => {
        const found = [...completedMatches]
            .filter(m => getResult(m) === key)
            .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate))[0];
        if (!found) return '기록 없음';
        const d = new Date(found.matchDate);
        return `최근 ${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${found.opponent}`;
    };

    // [UI] 날짜 표기 (2026-09-27 → 2026.09.27)
    const formatDate = (dateStr) => (dateStr || '').replace(/-/g, '.');

    if (loading) return <div className="loading">로딩 중...</div>;

    return (
        <div className="team-records-page">
            {/* 페이지 헤더 */}
            <div className="page-header">
                <div>
                    <div className="page-eyebrow">Team Records</div>
                    <h1 className="page-title">팀기록</h1>
                </div>
            </div>

            {/* 상단 5개 스탯 카드 */}
            <div className="tr-stats-top">
                <div className="tr-stat-card tr-stat-card--dark">
                    <div className="tr-stat-card__label">총 경기</div>
                    <div className="tr-stat-card__value">{totalMatches}</div>
                </div>
                <div className="tr-stat-card">
                    <div className="tr-stat-card__label">승</div>
                    <div className="tr-stat-card__value" style={{ color: 'var(--color-win-text)' }}>{wins}</div>
                    <div className="tr-stat-card__sub">{latestByResult('win')}</div>
                </div>
                <div className="tr-stat-card">
                    <div className="tr-stat-card__label">무</div>
                    <div className="tr-stat-card__value" style={{ color: 'var(--color-draw-text)' }}>{draws}</div>
                    <div className="tr-stat-card__sub">{latestByResult('draw')}</div>
                </div>
                <div className="tr-stat-card">
                    <div className="tr-stat-card__label">패</div>
                    <div className="tr-stat-card__value" style={{ color: 'var(--color-lose-text)' }}>{losses}</div>
                    <div className="tr-stat-card__sub">{latestByResult('lose')}</div>
                </div>
                <div className="tr-stat-card tr-stat-card--volt">
                    <div className="tr-stat-card__label">승률</div>
                    <div className="tr-stat-card__value">
                        {winRate}<span className="tr-stat-card__unit">%</span>
                    </div>
                    {/* 승/무/패 비율 막대 */}
                    {totalMatches > 0 && (
                        <div
                            className="tr-ratio-bar"
                            title={`${wins}승 ${draws}무 ${losses}패`}
                        >
                            {wins > 0 && <span style={{ flexGrow: wins, background: 'var(--color-win-text)' }} />}
                            {draws > 0 && <span style={{ flexGrow: draws, background: 'var(--color-draw-text)' }} />}
                            {losses > 0 && <span style={{ flexGrow: losses, background: 'var(--color-lose-text)' }} />}
                        </div>
                    )}
                </div>
            </div>

            {/* 하단 4개 아이콘 스탯 카드 */}
            <div className="tr-stats-bottom">
                {/* 총 득점 */}
                <div className="tr-icon-card">
                    <div className="tr-icon-card__icon tr-icon-card__icon--win">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9"/>
                            <path d="M12 8v8M8 12h8"/>
                        </svg>
                    </div>
                    <div className="tr-icon-card__text">
                        <div className="tr-icon-card__label">총 득점</div>
                        <div className="tr-icon-card__value">
                            {totalGoals}<span className="tr-icon-card__unit">골</span>
                        </div>
                    </div>
                </div>

                {/* 총 실점 */}
                <div className="tr-icon-card">
                    <div className="tr-icon-card__icon tr-icon-card__icon--lose">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9"/>
                            <path d="M8 12h8"/>
                        </svg>
                    </div>
                    <div className="tr-icon-card__text">
                        <div className="tr-icon-card__label">총 실점</div>
                        <div className="tr-icon-card__value">
                            {totalConceded}<span className="tr-icon-card__unit">골</span>
                        </div>
                    </div>
                </div>

                {/* 평균 득점 */}
                <div className="tr-icon-card">
                    <div className="tr-icon-card__icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18h18"/>
                            <path d="m7 14 4-4 3 3 5-6"/>
                        </svg>
                    </div>
                    <div className="tr-icon-card__text">
                        <div className="tr-icon-card__label">평균 득점</div>
                        <div className="tr-icon-card__value">
                            {avgGoals}<span className="tr-icon-card__unit">/ 경기</span>
                        </div>
                    </div>
                </div>

                {/* 평균 실점 */}
                <div className="tr-icon-card">
                    <div className="tr-icon-card__icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18h18"/>
                            <path d="m7 8 4 4 3-3 5 6"/>
                        </svg>
                    </div>
                    <div className="tr-icon-card__text">
                        <div className="tr-icon-card__label">평균 실점</div>
                        <div className="tr-icon-card__value">
                            {avgConceded}<span className="tr-icon-card__unit">/ 경기</span>
                        </div>
                    </div>
                </div>

                {/* 득실차 (득점 - 실점) */}
                <div className="tr-icon-card">
                    <div className={`tr-icon-card__icon ${goalDiff > 0 ? 'tr-icon-card__icon--win' : goalDiff < 0 ? 'tr-icon-card__icon--lose' : ''}`}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 4v16"/>
                            <path d="M3 8l4-4 4 4"/>
                            <path d="M17 20V4"/>
                            <path d="M13 16l4 4 4-4"/>
                        </svg>
                    </div>
                    <div className="tr-icon-card__text">
                        <div className="tr-icon-card__label">득실차</div>
                        <div className={`tr-icon-card__value tr-diff--${goalDiff > 0 ? 'win' : goalDiff < 0 ? 'lose' : 'draw'}`}>
                            {goalDiff > 0 ? `+${goalDiff}` : goalDiff < 0 ? `−${Math.abs(goalDiff)}` : '0'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 경기 기록 테이블 */}
            <div className="tr-match-table">
                <div className="tr-match-table__header">
                    <span className="tr-match-table__title">경기 기록</span>

                    {/* 필터 탭 */}
                    <div className="filter-tabs" style={{ marginBottom: 0 }}>
                        {[
                            { key: 'all', label: '전체' },
                            { key: 'win', label: '승리' },
                            { key: 'draw', label: '무승부' },
                            { key: 'lose', label: '패배' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
                                onClick={() => setFilter(tab.key)}
                            >
                                {tab.label}
                                <span className="filter-tab-count">{filterCounts[tab.key]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 테이블 헤드 */}
                <div className="tr-table-head">
                    <div className="tr-col-num">#</div>
                    <div className="tr-col-date">일자</div>
                    <div className="tr-col-opponent">상대팀</div>
                    <div className="tr-col-score">스코어</div>
                    <div className="tr-col-diff">득실차</div>
                    <div className="tr-col-result">결과</div>
                </div>

                {/* 테이블 바디 */}
                {filteredMatches.length === 0 ? (
                    <div className="tr-empty-state">
                        경기가 추가되면 여기에 표시됩니다
                    </div>
                ) : (
                    filteredMatches.map((match, idx) => {
                        const result = getResult(match);
                        const diff = (match.ourScore || 0) - (match.opponentScore || 0);
                        return (
                            <div key={match.id} className="tr-table-row">
                                <div className="tr-col-num">{String(idx + 1).padStart(2, '0')}</div>
                                <div className="tr-col-date">{formatDate(match.matchDate)}</div>
                                <div className="tr-col-opponent">
                                    <span className="tr-opponent-name">{match.opponent}</span>
                                </div>
                                <div className="tr-col-score">
                                    <span className="tr-score-num">{match.ourScore}</span>
                                    <span className="tr-score-dash">:</span>
                                    <span className="tr-score-num">{match.opponentScore}</span>
                                </div>
                                <div className={`tr-col-diff tr-diff--${result}`}>
                                    {diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '0'}
                                </div>
                                <div className="tr-col-result">
                                    <span className={`result-badge result-${result}`}>
                                        {getResultLabel(result)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default TeamRecords;
