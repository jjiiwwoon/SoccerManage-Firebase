/**
 * ====================================
 * PlayerStats.js
 * frontend/pages/PlayerStats.js
 * 개인기록 페이지 - 그리드 기반 선수별 스탯 테이블 + 상세 패널
 * ====================================
 *
 * Design canvas 기반 리팩터링:
 * - HTML table -> CSS Grid 기반 div 레이아웃
 * - 컬럼: # | 선수 | 출전 | 골 | 도움 | 공격P | 출석률 | 경기당 골
 * - 포지션 컬러 아바타 (36x36), 상세패널 (56x56)
 * - 각 컬럼 헤더 클릭 시 오름차순/내림차순 정렬
 * - 클릭 시 하단 상세 패널 (경기별 기록 포함)
 * - 탑 스코어러 골드 하이라이트
 * - CSS 클래스 접두사: ps-
 */
import React, { useState, useEffect } from 'react';
import { getMembers } from '../api/memberApi';
import { getMatches, getAllMatchStats } from '../api/matchApi';
import { getPositionLabel, getPositionColor, getPositionClass } from '../utils/positionUtils';

// 컬럼 정의 (헤더 클릭 정렬용)
const COLUMNS = [
    { key: 'matches', label: '출전' },
    { key: 'goals', label: '골' },
    { key: 'assists', label: '도움' },
    { key: 'attackPoints', label: '공격P' },
    { key: 'attendance', label: '출석률' },
    { key: 'goalsPerGame', label: '경기당 골' },
];

function PlayerStats() {
    const [members, setMembers] = useState([]);
    const [playerStats, setPlayerStats] = useState([]);
    const [matchRecords, setMatchRecords] = useState({}); // { [memberId]: [{ matchDate, opponent, goals, assists, result }] }
    const [totalCompletedMatches, setTotalCompletedMatches] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('goals');
    const [sortDir, setSortDir] = useState('desc');
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [membersData, matchesData] = await Promise.all([
                    getMembers(),
                    getMatches(),
                ]);
                setMembers(membersData);

                const allStats = {};
                const allMatchRecords = {};

                membersData.forEach(member => {
                    allStats[member.id] = {
                        id: member.id,
                        name: member.name,
                        position: member.position || '-',
                        backNumber: member.backNumber || '-',
                        profilePhoto: member.profilePhoto || null,
                        matches: 0,
                        goals: 0,
                        assists: 0,
                    };
                    allMatchRecords[member.id] = [];
                });

                // 완료된 경기만 통계에 포함
                const completedMatches = matchesData.filter(m => m.ourScore != null && m.opponentScore != null);
                setTotalCompletedMatches(completedMatches.length);

                // 전체 스탯 일괄 조회 (N+1 쿼리 방지)
                const allMatchStatsData = await getAllMatchStats();

                // matchId → match 매핑
                const matchMap = {};
                completedMatches.forEach(m => { matchMap[m.id] = m; });

                allMatchStatsData.forEach(stat => {
                    const match = matchMap[stat.matchId];
                    if (!match) return; // 완료되지 않은 경기의 스탯은 건너뜀

                    const memberId = stat.member?.id || stat.memberId;
                    if (!allStats[memberId]) return;

                    // 경기 결과 판단
                    let result = '무';
                    if (match.ourScore > match.opponentScore) result = '승';
                    else if (match.ourScore < match.opponentScore) result = '패';

                    allStats[memberId].matches += 1;
                    allStats[memberId].goals += (stat.goals || 0);
                    allStats[memberId].assists += (stat.assists || 0);

                    // 경기별 기록 저장
                    allMatchRecords[memberId].push({
                        matchDate: match.matchDate || match.date || '-',
                        opponent: match.opponent || '-',
                        goals: stat.goals || 0,
                        assists: stat.assists || 0,
                        result: result,
                        score: `${match.ourScore}-${match.opponentScore}`,
                    });
                });

                const statsArray = Object.values(allStats).map(s => ({
                    ...s,
                    attackPoints: s.goals + s.assists,
                    attendance: completedMatches.length > 0
                        ? Math.round((s.matches / completedMatches.length) * 100)
                        : 0,
                    goalsPerGame: s.matches > 0
                        ? parseFloat((s.goals / s.matches).toFixed(2))
                        : 0,
                }));

                setPlayerStats(statsArray);
                setMatchRecords(allMatchRecords);
            } catch (err) {
                console.error('데이터 로딩 실패:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // 포지션 필터 탭 클래스
    function getFilterTabClass(tabKey) {
        if (filter !== tabKey) return 'filter-tab';
        if (tabKey === 'all') return 'filter-tab active';
        return `filter-tab active filter-tab-${tabKey}`;
    }

    // 컬럼 헤더 클릭 정렬
    function handleHeaderSort(key) {
        if (sortBy === key) {
            setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(key);
            setSortDir('desc');
        }
    }

    // 선수 선택
    function selectPlayer(player) {
        setSelectedPlayer(prev => prev?.id === player.id ? null : player);
    }

    // 필터 + 검색 + 정렬
    const filteredStats = playerStats
        .filter(p => {
            if (filter === 'all') return true;
            return getPositionLabel(p.position) === filter.toUpperCase();
        })
        .filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const diff = a[sortBy] - b[sortBy];
            return sortDir === 'desc' ? -diff : diff;
        });

    // 공동순위 계산
    function getRanks(stats) {
        const ranks = [];
        let currentRank = 1;
        for (let i = 0; i < stats.length; i++) {
            if (i > 0 && stats[i][sortBy] === stats[i - 1][sortBy]) {
                ranks.push(ranks[i - 1]);
            } else {
                ranks.push(currentRank);
            }
            currentRank = i + 2;
        }
        return ranks;
    }
    const ranks = getRanks(filteredStats);

    // 탑 스코어러 ID
    const topScorerId = playerStats.reduce((topId, p) => {
        const topPlayer = playerStats.find(pp => pp.id === topId);
        if (!topPlayer || p.goals > topPlayer.goals) return p.id;
        return topId;
    }, null);

    // 아바타 렌더 (포지션 색상 그라데이션)
    function renderAvatar(player, size = 36) {
        const color = getPositionColor(player.position);
        const gradient = `linear-gradient(135deg, ${color}33, ${color}66)`;

        if (player.profilePhoto) {
            return (
                <div
                    className="ps-player-avatar"
                    style={{
                        width: size,
                        height: size,
                        minWidth: size,
                        borderRadius: '50%',
                        background: gradient,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <img
                        src={player.profilePhoto}
                        alt={player.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                </div>
            );
        }

        // 이니셜 아바타
        const initial = player.name ? player.name.charAt(0) : '?';
        return (
            <div
                className="ps-player-avatar"
                style={{
                    width: size,
                    height: size,
                    minWidth: size,
                    borderRadius: '50%',
                    background: gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    fontWeight: 700,
                    fontSize: size * 0.4,
                }}
            >
                {initial}
            </div>
        );
    }

    // 선택된 선수의 상세 데이터
    const selectedPlayerRecords = selectedPlayer ? (matchRecords[selectedPlayer.id] || []) : [];

    if (loading) return <div className="loading">로딩 중...</div>;

    return (
        <div className="player-stats-page">
            <div className="page-header">
                <h1 className="page-title">개인기록</h1>
                <input
                    type="text"
                    className="search-input"
                    placeholder="선수 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* 포지션 필터 */}
            <div className="filter-tabs">
                {[
                    { key: 'all', label: '전체' },
                    { key: 'gk', label: 'GK' },
                    { key: 'df', label: 'DF' },
                    { key: 'mf', label: 'MF' },
                    { key: 'fw', label: 'FW' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={getFilterTabClass(tab.key)}
                        onClick={() => setFilter(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 그리드 기반 선수 스탯 테이블 */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* 테이블 헤더 영역 */}
                <div className="ps-table-header-bar">
                    <span className="ps-subtitle">PLAYER STATS</span>
                </div>

                {/* 그리드 테이블 헤더 (클릭 정렬) */}
                <div className="ps-table-head">
                    <div className="ps-col-rank">순위</div>
                    <div className="ps-col-player">선수</div>
                    {COLUMNS.map(col => (
                        <div
                            key={col.key}
                            className={`ps-col-stat ps-col-sortable ${sortBy === col.key ? 'ps-col-sorted' : ''} ${col.key === 'goals' ? 'ps-col-goals' : ''} ${col.key === 'attendance' ? 'ps-col-rate' : ''} ${col.key === 'goalsPerGame' ? 'ps-col-gpg' : ''}`}
                            onClick={() => handleHeaderSort(col.key)}
                        >
                            {col.label}
                            {sortBy === col.key && (
                                <span className="ps-sort-arrow">{sortDir === 'desc' ? ' ▼' : ' ▲'}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* 그리드 테이블 바디 */}
                <div className="ps-table-body">
                    {filteredStats.length === 0 ? (
                        <div className="ps-empty-row">
                            해당하는 선수가 없습니다.
                        </div>
                    ) : (
                        filteredStats.map((player, index) => {
                            const isTopScorer = player.id === topScorerId && player.goals > 0;
                            const isSelected = selectedPlayer?.id === player.id;
                            return (
                                <div
                                    key={player.id}
                                    className={`ps-table-row ${isSelected ? 'ps-row-selected' : ''}`}
                                    style={isTopScorer ? { background: 'rgba(176,141,42,0.03)' } : undefined}
                                    onClick={() => selectPlayer(player)}
                                >
                                    <div className="ps-col-rank">{ranks[index]}.</div>
                                    <div className="ps-col-player">
                                        {renderAvatar(player, 36)}
                                        <div className="ps-player-info">
                                            <div className="ps-player-name">{player.name}</div>
                                            <span className={`badge ${getPositionClass(player.position)}`}>
                                                {getPositionLabel(player.position)}
                                            </span>
                                        </div>
                                    </div>
                                    {COLUMNS.map(col => (
                                        <div
                                            key={col.key}
                                            className={`ps-col-stat ${sortBy === col.key ? 'ps-col-sorted' : ''} ${col.key === 'goals' ? 'ps-col-goals' : ''} ${col.key === 'attendance' ? 'ps-col-rate' : ''} ${col.key === 'goalsPerGame' ? 'ps-col-gpg' : ''}`}
                                        >
                                            {col.key === 'attendance' ? `${player[col.key]}%` : player[col.key]}
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 선수 상세 패널 */}
            {selectedPlayer && (
                <div className="ps-detail-card">
                    <div
                        className="ps-detail-top-line"
                        style={{ background: getPositionColor(selectedPlayer.position) }}
                    ></div>
                    <div className="ps-detail-header">
                        <div className="ps-detail-avatar-section">
                            {renderAvatar(selectedPlayer, 56)}
                            <div className="ps-detail-name-section">
                                <div className="ps-detail-player-name">{selectedPlayer.name}</div>
                                <span className={`badge ${getPositionClass(selectedPlayer.position)}`}>
                                    {getPositionLabel(selectedPlayer.position)}
                                </span>
                                <div className="ps-detail-title">No.{selectedPlayer.backNumber}</div>
                            </div>
                        </div>
                        <div className="ps-detail-big-stats">
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value">{selectedPlayer.goals}</div>
                                <div className="ps-detail-stat-label">골</div>
                            </div>
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value">{selectedPlayer.assists}</div>
                                <div className="ps-detail-stat-label">도움</div>
                            </div>
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value">{selectedPlayer.attackPoints}</div>
                                <div className="ps-detail-stat-label">공격P</div>
                            </div>
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value">{selectedPlayer.goalsPerGame}</div>
                                <div className="ps-detail-stat-label">경기당</div>
                            </div>
                        </div>
                    </div>

                    {/* 경기별 기록 */}
                    <div className="ps-detail-matches-title">경기별 기록</div>
                    <div className="ps-detail-matches-head">
                        <div>일자</div>
                        <div>상대</div>
                        <div>골</div>
                        <div>도움</div>
                        <div>결과</div>
                    </div>
                    {selectedPlayerRecords.length === 0 ? (
                        <div className="ps-detail-no-records">출전 기록이 없습니다.</div>
                    ) : (
                        selectedPlayerRecords.map((record, idx) => (
                            <div key={idx} className="ps-detail-match-row">
                                <div>{record.matchDate}</div>
                                <div>{record.opponent}</div>
                                <div>{record.goals}</div>
                                <div>{record.assists}</div>
                                <div className={`ps-result-${record.result}`}>
                                    {record.result} ({record.score})
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <style>{`
                /* ===== Grid Table Layout ===== */
                .ps-table-header-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--color-border, #e5e7eb);
                }
                .ps-subtitle {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    color: var(--color-text-muted, #999);
                    text-transform: uppercase;
                }

                /* Grid Columns: # | 선수 | 출전 | 골 | 도움 | 공격P | 출석률 | 경기당 골 */
                .ps-table-head,
                .ps-table-row {
                    display: grid;
                    grid-template-columns: 52px 0.9fr 80px 80px 80px 88px 88px 104px;
                    align-items: center;
                    min-height: 56px;
                }
                .ps-table-head {
                    padding: 0 36px 0 20px;
                    background: var(--color-bg-secondary, #f9fafb);
                    border-bottom: 1px solid var(--color-border, #e5e7eb);
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--color-text-muted, #999);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    min-height: 48px;
                }
                .ps-col-sortable {
                    cursor: pointer;
                    user-select: none;
                    transition: color 0.15s;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .ps-col-sortable:hover {
                    color: var(--color-text, #333);
                }
                .ps-col-sorted {
                    color: #2563eb !important;
                }
                .ps-sort-arrow {
                    font-size: 8px;
                    position: absolute;
                    right: 2px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .ps-table-body {
                    max-height: 600px;
                    overflow-y: auto;
                }
                .ps-table-row {
                    padding: 8px 20px;
                    border-bottom: 1px solid var(--color-border-light, #f0f0f0);
                    cursor: pointer;
                    transition: background 0.12s;
                }
                .ps-table-row:hover {
                    background: var(--color-bg-secondary, #f9fafb);
                }
                .ps-row-selected {
                    background: var(--color-bg-secondary, #f0f4ff) !important;
                    box-shadow: inset 3px 0 0 var(--color-primary, #2563eb);
                }

                /* Columns */
                .ps-col-rank {
                    font-size: 17px;
                    font-weight: 500;
                    color: var(--color-text-muted, #999);
                    text-align: center;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .ps-col-player {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }
                .ps-table-head .ps-col-player {
                    font-size: 17px;
                }
                .ps-player-info {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }
                .ps-player-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--color-text, #222);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .ps-player-info .badge {
                    font-size: 10px;
                    width: fit-content;
                    flex-shrink: 0;
                }
                .ps-col-stat {
                    text-align: center;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 17px;
                    font-weight: 500;
                    color: var(--color-text, #333);
                }
                .ps-col-goals {
                    font-weight: 700;
                }
                .ps-col-rate {
                    font-size: 14px;
                }
                .ps-col-gpg {
                    font-weight: 600;
                    color: var(--color-text, #333);
                }

                .ps-empty-row {
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-muted, #999);
                    font-size: 14px;
                }

                /* ===== Detail Card ===== */
                .ps-detail-card {
                    margin-top: 16px;
                    background: var(--color-bg, #fff);
                    border-radius: 12px;
                    border: 1px solid var(--color-border, #e5e7eb);
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .ps-detail-top-line {
                    height: 3px;
                    width: 100%;
                }
                .ps-detail-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 24px;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                .ps-detail-avatar-section {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .ps-detail-name-section {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .ps-detail-player-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--color-text, #222);
                }
                .ps-detail-title {
                    font-size: 12px;
                    color: var(--color-text-muted, #999);
                }
                .ps-detail-big-stats {
                    display: flex;
                    gap: 28px;
                }
                .ps-detail-stat-item {
                    text-align: center;
                }
                .ps-detail-stat-value {
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--color-text, #222);
                    line-height: 1.2;
                }
                .ps-detail-stat-label {
                    font-size: 11px;
                    color: var(--color-text-muted, #999);
                    margin-top: 2px;
                }

                /* 경기별 기록 sub-table */
                .ps-detail-matches-title {
                    padding: 12px 24px 8px;
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--color-text, #333);
                    border-top: 1px solid var(--color-border, #e5e7eb);
                }
                .ps-detail-matches-head,
                .ps-detail-match-row {
                    display: grid;
                    grid-template-columns: 100px 1fr 50px 50px 100px;
                    padding: 6px 24px;
                    font-size: 12px;
                    align-items: center;
                }
                .ps-detail-matches-head {
                    font-weight: 600;
                    color: var(--color-text-muted, #999);
                    border-bottom: 1px solid var(--color-border-light, #f0f0f0);
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    font-size: 11px;
                }
                .ps-detail-match-row {
                    border-bottom: 1px solid var(--color-border-light, #f0f0f0);
                    color: var(--color-text, #555);
                }
                .ps-detail-match-row:last-child {
                    border-bottom: none;
                }
                .ps-detail-match-row:hover {
                    background: var(--color-bg-secondary, #f9fafb);
                }
                .ps-detail-no-records {
                    padding: 20px 24px;
                    text-align: center;
                    font-size: 13px;
                    color: var(--color-text-muted, #999);
                }

                /* 경기 결과 색상 */
                .ps-result-승 { color: #2563eb; font-weight: 600; }
                .ps-result-패 { color: #dc2626; font-weight: 600; }
                .ps-result-무 { color: var(--color-text-muted, #999); font-weight: 500; }

            `}</style>
        </div>
    );
}

export default PlayerStats;
