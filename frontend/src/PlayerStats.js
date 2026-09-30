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
 * - [UI 리디자인] Navy & Volt: 1위 볼트 배지, 출석률 막대, 네이비 상세 패널
 *   (데이터 조회/정렬/필터 로직은 변경 없음)
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

/**
 * 경기별 기록 정렬: 날짜 내림차순(최신 → 과거)
 * - matchDate는 'YYYY-MM-DD' 문자열이라 문자열 비교로 정확히 정렬됨
 * - 같은 날짜면 경기 시간(matchTime) 늦은 순
 * - 날짜가 없는 기록('-')은 맨 아래로
 */
function compareRecordsByDateDesc(a, b) {
    const aHasDate = a.matchDate && a.matchDate !== '-';
    const bHasDate = b.matchDate && b.matchDate !== '-';
    if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;

    const dateDiff = String(b.matchDate).localeCompare(String(a.matchDate));
    if (dateDiff !== 0) return dateDiff;

    return String(b.matchTime || '').localeCompare(String(a.matchTime || ''));
}

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
                        matchId: match.id,
                        matchDate: match.matchDate || match.date || '-',
                        matchTime: match.matchTime || '',
                        opponent: match.opponent || '-',
                        goals: stat.goals || 0,
                        assists: stat.assists || 0,
                        result: result,
                        score: `${match.ourScore}-${match.opponentScore}`,
                    });
                });

                // ✅ 경기별 기록을 최신순(내림차순)으로 정렬
                // Firestore getDocs()는 문서 ID(랜덤) 순으로 오기 때문에
                // 정렬하지 않으면 선수마다 날짜 순서가 제각각으로 보임
                Object.values(allMatchRecords).forEach(records => {
                    records.sort(compareRecordsByDateDesc);
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

    // [UI] 결과 라벨(승/무/패) → 배지 클래스
    const RESULT_CLASS = { '승': 'result-win', '무': 'result-draw', '패': 'result-lose' };

    // [UI] 날짜 표기 (2026-09-27 → 2026.09.27)
    const formatDate = (dateStr) => String(dateStr || '-').replace(/-/g, '.').replace(/^\.$/, '-');

    if (loading) return <div className="loading">로딩 중...</div>;

    return (
        <div className="player-stats-page">
            <div className="page-header">
                <div>
                    <div className="page-eyebrow">Player Stats</div>
                    <h1 className="page-title">개인기록</h1>
                </div>
                <div className="ps-search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="선수 이름 검색"
                        aria-label="선수 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
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
                    <span className="ps-table-title">
                        선수별 기록<span className="ps-table-count">{filteredStats.length}</span>
                    </span>
                    <span className="ps-table-hint">열 제목을 누르면 정렬돼요</span>
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
                                <span className="ps-sort-arrow">{sortDir === 'desc' ? '▼' : '▲'}</span>
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
                            const isFirst = ranks[index] === 1 && player[sortBy] > 0;
                            return (
                                <div
                                    key={player.id}
                                    className={`ps-table-row ${isSelected ? 'ps-row-selected' : ''}`}
                                    title={isTopScorer ? '득점 1위' : undefined}
                                    onClick={() => selectPlayer(player)}
                                >
                                    <div className="ps-col-rank">
                                        <span className={`ps-rank-badge ${isFirst ? 'is-top' : ''}`}>{ranks[index]}</span>
                                    </div>
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
                                            {col.key === 'attendance' ? (
                                                <span className="ps-att">
                                                    <span className="ps-att-track">
                                                        <span className="ps-att-fill" style={{ width: `${player.attendance}%`, display: 'block' }} />
                                                    </span>
                                                    <span className="ps-att-value">{player.attendance}%</span>
                                                </span>
                                            ) : player[col.key]}
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
                    <div className="ps-detail-header">
                        <div className="ps-detail-avatar-section">
                            {renderAvatar(selectedPlayer, 64)}
                            <div className="ps-detail-name-section">
                                <div className="ps-detail-name-row">
                                    <span className="ps-detail-player-name">{selectedPlayer.name}</span>
                                    <span className={`badge ${getPositionClass(selectedPlayer.position)}`}>
                                        {getPositionLabel(selectedPlayer.position)}
                                    </span>
                                </div>
                                <div className="ps-detail-title">No.{selectedPlayer.backNumber}</div>
                            </div>
                        </div>
                        <div className="ps-detail-big-stats">
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value">{selectedPlayer.matches}</div>
                                <div className="ps-detail-stat-label">출전</div>
                            </div>
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value">{selectedPlayer.goals}</div>
                                <div className="ps-detail-stat-label">골</div>
                            </div>
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value">{selectedPlayer.assists}</div>
                                <div className="ps-detail-stat-label">도움</div>
                            </div>
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value is-volt">{selectedPlayer.attackPoints}</div>
                                <div className="ps-detail-stat-label">공격P</div>
                            </div>
                            <div className="ps-detail-stat-item">
                                <div className="ps-detail-stat-value">{selectedPlayer.goalsPerGame}</div>
                                <div className="ps-detail-stat-label">경기당 골</div>
                            </div>
                        </div>
                    </div>

                    {/* 경기별 기록 */}
                    <div className="ps-detail-matches-title">경기별 기록<span>최신순</span></div>
                    <div className="ps-detail-matches-head">
                        <div>일자</div>
                        <div>상대</div>
                        <div className="ps-detail-center">골</div>
                        <div className="ps-detail-center">도움</div>
                        <div className="ps-detail-center">결과</div>
                    </div>
                    {selectedPlayerRecords.length === 0 ? (
                        <div className="ps-detail-no-records">출전 기록이 없습니다.</div>
                    ) : (
                        selectedPlayerRecords.map((record, idx) => (
                            <div key={idx} className="ps-detail-match-row">
                                <div className="ps-detail-date">{formatDate(record.matchDate)}</div>
                                <div className="ps-detail-opponent">{record.opponent}</div>
                                <div className="ps-detail-num">{record.goals}</div>
                                <div className="ps-detail-num">{record.assists}</div>
                                <div className="ps-detail-center">
                                    <span className={`result-badge ${RESULT_CLASS[record.result] || ''}`}>
                                        {record.result} {record.score.replace('-', ':')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <style>{`
                /* ===== Grid Table Layout ===== */
                .ps-search {
                    position: relative;
                    width: 300px;
                }
                .ps-search svg {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-muted);
                    pointer-events: none;
                }
                .ps-search .search-input {
                    padding-left: 42px;
                    max-width: none;
                }
                .ps-table-header-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 28px;
                }
                .ps-table-title {
                    font-size: 1.19rem;
                    font-weight: 800;
                    color: var(--color-text);
                }
                .ps-table-count {
                    font-family: var(--font-display);
                    font-size: 1.12rem;
                    font-weight: 700;
                    color: #8a93a8;
                    margin-left: 6px;
                }
                .ps-table-hint {
                    font-size: 13px;
                    color: var(--color-text-muted);
                }

                /* Grid Columns: # | 선수 | 출전 | 골 | 도움 | 공격P | 출석률 | 경기당 골 */
                .ps-table-head,
                .ps-table-row {
                    display: grid;
                    grid-template-columns: 72px 1fr 90px 90px 90px 90px 150px 110px;
                    align-items: center;
                }
                .ps-table-head {
                    padding: 0 28px;
                    background: #f7f8fb;
                    border-top: 1px solid var(--color-border);
                    border-bottom: 1px solid var(--color-border);
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--color-text-muted);
                    height: 48px;
                    /* 본문 스크롤바 폭만큼 제목 줄에도 같은 여백을 둬서 열을 일자로 맞춤 */
                    overflow-y: hidden;
                    scrollbar-gutter: stable;
                }
                .ps-col-sortable {
                    cursor: pointer;
                    user-select: none;
                    transition: color 0.15s;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 4px;
                    height: 100%;
                }
                .ps-col-sortable:hover {
                    color: var(--color-text);
                }
                .ps-table-head .ps-col-sorted {
                    color: var(--color-primary);
                    font-weight: 700;
                }
                .ps-sort-arrow {
                    font-size: 9px;
                }
                .ps-table-body {
                    max-height: 600px;
                    overflow-y: auto;
                    scrollbar-gutter: stable;
                }
                .ps-table-row {
                    padding: 0 28px;
                    height: 60px;
                    border-bottom: 1px solid #eef0f5;
                    cursor: pointer;
                    transition: background 0.12s;
                }
                .ps-table-row:hover {
                    background: #f7f8fb;
                }
                .ps-row-selected {
                    background: var(--color-primary-soft) !important;
                    box-shadow: inset 3px 0 0 var(--color-primary);
                }

                /* Columns */
                .ps-col-rank {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .ps-rank-badge {
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-display);
                    font-size: 17px;
                    font-weight: 700;
                    color: var(--color-text-muted);
                }
                .ps-rank-badge.is-top {
                    background: var(--color-volt);
                    color: var(--color-primary);
                }
                .ps-col-player {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }
                .ps-player-info {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }
                .ps-player-name {
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--color-text);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .ps-player-info .badge {
                    font-size: 12px;
                    width: fit-content;
                    flex-shrink: 0;
                }
                .ps-col-stat {
                    text-align: center;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: var(--font-display);
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--color-text);
                }
                .ps-table-head .ps-col-stat {
                    font-family: var(--font-body);
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--color-text-muted);
                }
                .ps-table-row .ps-col-goals {
                    font-size: 20px;
                    font-weight: 700;
                }
                .ps-att {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .ps-att-track {
                    width: 60px;
                    height: 6px;
                    border-radius: 6px;
                    background: #e8ebf2;
                    overflow: hidden;
                }
                .ps-att-fill {
                    height: 100%;
                    border-radius: 6px;
                    background: var(--color-primary);
                }
                .ps-att-value {
                    width: 40px;
                    text-align: right;
                    font-size: 15px;
                }

                .ps-empty-row {
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-muted);
                    font-size: 14px;
                }

                /* ===== Detail Card ===== */
                .ps-detail-card {
                    margin-top: 20px;
                    background: var(--color-card);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--color-border);
                    overflow: hidden;
                }
                .ps-detail-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 26px 32px;
                    gap: 20px;
                    flex-wrap: wrap;
                    background: var(--color-primary);
                    color: #ffffff;
                }
                .ps-detail-avatar-section {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                }
                .ps-detail-avatar-section .ps-player-avatar {
                    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.12);
                    background: #ffffff !important;
                }
                .ps-detail-name-section {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .ps-detail-name-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ps-detail-player-name {
                    font-size: 24px;
                    font-weight: 900;
                    color: #ffffff;
                }
                .ps-detail-title {
                    font-family: var(--font-display);
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.65);
                }
                .ps-detail-big-stats {
                    display: flex;
                    gap: 36px;
                }
                .ps-detail-stat-item {
                    text-align: center;
                }
                .ps-detail-stat-value {
                    font-family: var(--font-display);
                    font-size: 34px;
                    font-weight: 700;
                    color: #ffffff;
                    line-height: 1;
                }
                .ps-detail-stat-value.is-volt {
                    color: var(--color-volt);
                }
                .ps-detail-stat-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.65);
                    margin-top: 6px;
                }

                /* 경기별 기록 sub-table */
                .ps-detail-matches-title {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 32px 12px;
                    font-size: 16px;
                    font-weight: 800;
                    color: var(--color-text);
                }
                .ps-detail-matches-title span {
                    font-size: 13px;
                    font-weight: 400;
                    color: var(--color-text-muted);
                }
                .ps-detail-matches-head,
                .ps-detail-match-row {
                    display: grid;
                    grid-template-columns: 160px 1fr 80px 80px 140px;
                    padding: 0 32px;
                    align-items: center;
                }
                .ps-detail-matches-head {
                    height: 44px;
                    background: #f7f8fb;
                    font-size: 13px;
                    color: var(--color-text-muted);
                }
                .ps-detail-match-row {
                    height: 56px;
                    border-top: 1px solid #eef0f5;
                    font-size: 15px;
                    color: var(--color-text);
                }
                .ps-detail-match-row:hover {
                    background: #f7f8fb;
                }
                .ps-detail-center {
                    text-align: center;
                }
                .ps-detail-date {
                    font-family: var(--font-display);
                    font-size: 17px;
                    font-weight: 600;
                    color: var(--color-text-light);
                }
                .ps-detail-opponent {
                    font-weight: 700;
                }
                .ps-detail-num {
                    font-family: var(--font-display);
                    font-size: 19px;
                    font-weight: 700;
                    text-align: center;
                }
                .ps-detail-no-records {
                    padding: 24px 32px;
                    text-align: center;
                    font-size: 13px;
                    color: var(--color-text-muted);
                    border-top: 1px solid #eef0f5;
                }
            `}</style>
        </div>
    );
}

export default PlayerStats;
