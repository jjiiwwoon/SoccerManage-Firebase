/**
 * ====================================
 * 파일: TeamRecords.js (디자인 캔버스 매칭)
 * 위치: frontend/src/pages/TeamRecords.js
 * 기능: 팀 전적 요약 + 경기 결과 테이블
 * ====================================
 */
import React, { useState, useEffect } from 'react';
import { getMatches } from '../api/matchApi';

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

    function getResult(match) {
        if (match.ourScore > match.opponentScore) return 'win';
        if (match.ourScore === match.opponentScore) return 'draw';
        return 'lose';
    }

    function getResultLabel(result) {
        if (result === 'win') return '승';
        if (result === 'draw') return '무';
        return '패';
    }

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

    const filteredMatches = completedMatches
        .filter(m => {
            if (filter === 'all') return true;
            return getResult(m) === filter;
        })
        .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate));

    if (loading) return <div className="loading">로딩 중...</div>;

    return (
        <div className="team-records-page">
            {/* 페이지 헤더 */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">팀기록</h1>
                    <div className="page-subtitle">TEAM RECORDS</div>
                </div>
            </div>

            {/* 상단 5개 스탯 카드 */}
            <div className="tr-stats-top">
                <div className="tr-stat-card tr-stat-card--gold-line">
                    <div className="tr-stat-card__label">총 경기</div>
                    <div className="tr-stat-card__value">{totalMatches}</div>
                </div>
                <div className="tr-stat-card">
                    <div className="tr-stat-card__label">승</div>
                    <div className="tr-stat-card__value" style={{ color: 'var(--color-win)' }}>{wins}</div>
                </div>
                <div className="tr-stat-card">
                    <div className="tr-stat-card__label">무</div>
                    <div className="tr-stat-card__value" style={{ color: 'var(--color-draw)' }}>{draws}</div>
                </div>
                <div className="tr-stat-card">
                    <div className="tr-stat-card__label">패</div>
                    <div className="tr-stat-card__value" style={{ color: 'var(--color-lose)' }}>{losses}</div>
                </div>
                <div className="tr-stat-card">
                    <div className="tr-stat-card__label">승률</div>
                    <div className="tr-stat-card__value" style={{ color: 'var(--color-gold)' }}>
                        {winRate}<span className="tr-stat-card__unit">%</span>
                    </div>
                </div>
            </div>

            {/* 하단 4개 아이콘 스탯 카드 */}
            <div className="tr-stats-bottom">
                {/* 총 득점 */}
                <div className="tr-icon-card">
                    <div className="tr-icon-card__icon tr-icon-card__icon--gold">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b08d2a" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
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
                    <div className="tr-icon-card__icon tr-icon-card__icon--red">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
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
                    <div className="tr-icon-card__icon tr-icon-card__icon--gray">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b95a5" strokeWidth="1.5">
                            <path d="M18 20V10M12 20V4M6 20v-6"/>
                        </svg>
                    </div>
                    <div className="tr-icon-card__text">
                        <div className="tr-icon-card__label">평균 득점</div>
                        <div className="tr-icon-card__value">
                            {avgGoals}<span className="tr-icon-card__unit">/경기</span>
                        </div>
                    </div>
                </div>

                {/* 평균 실점 */}
                <div className="tr-icon-card">
                    <div className="tr-icon-card__icon tr-icon-card__icon--orange">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
                            <path d="M18 20V10M12 20V4M6 20v-6"/>
                        </svg>
                    </div>
                    <div className="tr-icon-card__text">
                        <div className="tr-icon-card__label">평균 실점</div>
                        <div className="tr-icon-card__value">
                            {avgConceded}<span className="tr-icon-card__unit">/경기</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 필터 탭 */}
            <div className="filter-tabs" style={{ marginBottom: '16px' }}>
                {[
                    { key: 'all', label: '전체' },
                    { key: 'win', label: '승리' },
                    { key: 'draw', label: '무승부' },
                    { key: 'lose', label: '패배' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`filter-tab filter-tab-${tab.key} ${filter === tab.key ? 'active' : ''}`}
                        onClick={() => setFilter(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 경기 기록 테이블 */}
            <div className="tr-match-table card">
                <div className="card-gold-line"></div>
                <div className="tr-match-table__header">
                    <span className="tr-match-table__title">경기 기록</span>
                </div>

                {/* 테이블 헤드 */}
                <div className="tr-table-head">
                    <div className="tr-col-num">#</div>
                    <div className="tr-col-date">일자</div>
                    <div className="tr-col-opponent">상대팀</div>
                    <div className="tr-col-score">스코어</div>
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
                        return (
                            <div key={match.id} className="tr-table-row">
                                <div className="tr-col-num">{idx + 1}</div>
                                <div className="tr-col-date">{match.matchDate}</div>
                                <div className="tr-col-opponent">
                                    <span className="tr-opponent-name">{match.opponent}</span>
                                </div>
                                <div className="tr-col-score">
                                    <span className="tr-score-num">{match.ourScore}</span>
                                    <span className="tr-score-dash">-</span>
                                    <span className="tr-score-num">{match.opponentScore}</span>
                                </div>
                                <div className="tr-col-result">
                                    <span className={`tr-result-pill tr-result-pill--${result}`}>
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
