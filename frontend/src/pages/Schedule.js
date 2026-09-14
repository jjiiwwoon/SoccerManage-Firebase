/**
 * ====================================
 * 파일: Schedule.js (디자인 캔버스 리뉴얼)
 * 위치: frontend/src/pages/Schedule.js
 * 기능: 일정 페이지 - 캘린더(도트) + 사이드바(경기카드/월간일정) + 일정 등록 + 결과 입력
 * ====================================
 */
import React, { useState, useEffect } from 'react';
import {
    getMatches, createMatch, updateMatch, deleteMatch,
    getMatchStats, createMatchStat, deleteAllMatchStats
} from '../api/matchApi';
import { getMembers } from '../api/memberApi';

/* ========== 스타일 ========== */
const scStyles = `
/* ===== Layout ===== */
.sc-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 20px;
    align-items: start;
}

/* ===== Calendar Card ===== */
.sc-cal-card {
    background: var(--color-surface, #fff);
    border-radius: 12px;
    border: 1px solid var(--color-border, #e5e7eb);
    padding: 24px;
}

.sc-cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.sc-cal-nav-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.sc-cal-nav-btn {
    background: none;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-text, #1a1a2e);
    transition: background 0.15s;
}
.sc-cal-nav-btn:hover {
    background: var(--color-light, #f3f4f6);
}

.sc-cal-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-text, #1a1a2e);
    min-width: 130px;
    text-align: center;
}


/* Calendar Grid */
.sc-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0;
}

.sc-cal-dow {
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 10px 0;
    color: #8b95a5;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sc-cal-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.15s, border-color 0.15s;
    position: relative;
    padding: 5px 3px 3px;
    overflow: hidden;
    border: 2px solid transparent;
}
.sc-cal-cell:hover {
    background: var(--color-light, #f3f4f6);
}
.sc-cal-cell.sc-cal-other {
    opacity: 0.3;
    pointer-events: none;
}
.sc-cal-cell.sc-cal-today {
    border: 2px solid var(--color-gold, #b08d2a);
    background: rgba(176, 141, 42, 0.06);
}
.sc-cal-cell.sc-cal-selected {
    background: rgba(176, 141, 42, 0.12);
}
.sc-cal-cell.sc-cal-completed {
    border-color: #b0b8c4;
    background: rgba(139, 149, 165, 0.04);
}
.sc-cal-cell.sc-cal-upcoming {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.04);
}

.sc-cal-day {
    font-size: 0.88rem;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 0;
}

.sc-cal-match-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 1px;
    width: 100%;
    padding-bottom: 2px;
    position: relative;
}

.sc-cal-match-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #3b82f6;
    line-height: 1.3;
    letter-spacing: 0.3px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    text-align: center;
}

.sc-cal-match-vs {
    font-size: 0.7rem;
    font-weight: 600;
    color: #8b95a5;
    line-height: 1.2;
    text-align: center;
}

.sc-cal-match-opponent {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text, #1a1a2e);
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.sc-cal-match-result {
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.2;
    border-radius: 3px;
    padding: 1px 5px;
}

/* Legend */
.sc-cal-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border, #e5e7eb);
}
.sc-legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.72rem;
    color: #8b95a5;
}
.sc-legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

/* ===== Sidebar ===== */
.sc-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Match Card */
.sc-match-card {
    background: var(--color-surface, #fff);
    border-radius: 12px;
    border: 1px solid var(--color-border, #e5e7eb);
    overflow: hidden;
}

.sc-match-topline {
    height: 3px;
    width: 100%;
}

.sc-match-body {
    padding: 16px 18px;
}

.sc-match-info-center {
    text-align: center;
    margin-bottom: 14px;
}

.sc-match-info-date {
    font-size: 0.95rem;
    color: #8b95a5;
    font-weight: 600;
}

.sc-match-info-location {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.9rem;
    color: #8b95a5;
    margin-top: 4px;
}

.sc-match-status-text {
    font-size: 0.82rem;
    font-weight: 600;
    margin-bottom: 4px;
}

.sc-match-memo-box {
    margin-top: 12px;
    padding: 8px 12px;
    background: var(--color-light, #f3f4f6);
    border-radius: 8px;
    font-size: 0.82rem;
    color: #8b95a5;
    line-height: 1.5;
    white-space: pre-wrap;
}

.sc-match-teams {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.sc-team {
    text-align: center;
    flex: 1;
    min-width: 0;
}

.sc-team-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text, #1a1a2e);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sc-team-label {
    font-size: 0.65rem;
    color: #8b95a5;
    font-weight: 600;
    letter-spacing: 1px;
    margin-top: 2px;
}

/* Score area */
.sc-match-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 0 4px;
}

.sc-score-text {
    font-family: 'Oswald', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text, #1a1a2e);
    letter-spacing: 3px;
}

.sc-match-vs {
    font-size: 1.4rem;
    font-weight: 700;
    color: #8b95a5;
    letter-spacing: 2px;
}

.sc-result-pill {
    display: inline-block;
    font-size: 0.95rem;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 10px;
    letter-spacing: 0.5px;
}
.sc-result-win {
    background: rgba(34, 197, 94, 0.12);
    color: #16a34a;
}
.sc-result-draw {
    background: rgba(245, 158, 11, 0.12);
    color: #d97706;
}
.sc-result-lose {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
}

/* Match card header-btn */
.sc-match-header-btn {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid var(--color-border, #e5e7eb);
    background: none;
    color: var(--color-text, #1a1a2e);
}
.sc-match-header-btn:hover {
    background: var(--color-light, #f3f4f6);
}
.sc-match-header-btn.sc-btn-primary {
    background: var(--color-gold, #b08d2a);
    color: #fff;
    border-color: var(--color-gold, #b08d2a);
}
.sc-match-header-btn.sc-btn-primary:hover {
    opacity: 0.9;
}

/* Match actions — bottom right */
.sc-match-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border, #e5e7eb);
    justify-content: flex-end;
}

.sc-match-actions .sc-btn-danger {
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: none;
    color: #dc2626;
}
.sc-match-actions .sc-btn-danger:hover {
    background: rgba(239, 68, 68, 0.06);
}

/* Goal scorers list */
.sc-scorers-section {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border, #e5e7eb);
}
.sc-scorers-title {
    display: inline-block;
    font-size: 0.9rem;
    font-weight: 700;
    color: #3b82f6;
    border: 1.5px solid #3b82f6;
    border-radius: 6px;
    padding: 2px 10px;
    margin-bottom: 10px;
    letter-spacing: 0.3px;
}
.sc-scorers-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.sc-scorer-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
}
.sc-scorer-name {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--color-text, #1a1a2e);
}
.sc-scorer-icon {
    font-size: 0.85rem;
    line-height: 1;
}
.sc-scorer-goals {
    font-size: 0.92rem;
    font-weight: 700;
    color: #3b82f6;
}
.sc-no-scorers {
    font-size: 0.85rem;
    color: #8b95a5;
    text-align: center;
    padding: 4px 0;
}

/* Empty sidebar card */
.sc-empty-card {
    background: var(--color-surface, #fff);
    border-radius: 12px;
    border: 1px solid var(--color-border, #e5e7eb);
    padding: 28px 18px;
    text-align: center;
    color: #8b95a5;
    font-size: 0.85rem;
}
.sc-empty-card .sc-empty-register {
    margin-top: 12px;
    background: var(--color-gold, #b08d2a);
    color: #fff;
    border: none;
    padding: 7px 18px;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
}

/* ===== Monthly Schedule Card ===== */
.sc-monthly-card {
    background: var(--color-surface, #fff);
    border-radius: 12px;
    border: 1px solid var(--color-border, #e5e7eb);
    overflow: hidden;
}

.sc-monthly-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text, #1a1a2e);
    padding: 14px 18px 10px;
}

.sc-monthly-list {
    max-height: 320px;
    overflow-y: auto;
}

.sc-monthly-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    cursor: pointer;
    transition: background 0.12s;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.sc-monthly-item:last-child {
    border-bottom: none;
}
.sc-monthly-item:hover {
    background: var(--color-light, #f3f4f6);
}

.sc-monthly-bar {
    width: 3px;
    height: 32px;
    border-radius: 2px;
    flex-shrink: 0;
}

.sc-monthly-info {
    flex: 1;
    min-width: 0;
}

.sc-monthly-opponent {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text, #1a1a2e);
}

.sc-monthly-sub {
    font-size: 0.75rem;
    color: #8b95a5;
    margin-top: 1px;
}

.sc-monthly-badge {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 8px;
    flex-shrink: 0;
}

.sc-monthly-empty {
    padding: 20px 18px;
    text-align: center;
    color: #8b95a5;
    font-size: 0.82rem;
}

`;

function Schedule() {
    const [matches, setMatches] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [matchStats, setMatchStats] = useState([]);

    // 모달 상태
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showResultForm, setShowResultForm] = useState(false);
    const [editingMatchId, setEditingMatchId] = useState(null);

    // 일정 등록 폼
    const [newSchedule, setNewSchedule] = useState({
        matchDate: '',
        matchTime: '',
        matchEndTime: '',
        location: '',
        opponent: '',
        memo: '',
    });

    // 날짜 직접 선택용 상태
    const [dateYear, setDateYear] = useState('');
    const [dateMonth, setDateMonth] = useState('');
    const [dateDay, setDateDay] = useState('');

    // 결과 입력 폼
    const [resultData, setResultData] = useState({
        ourScore: '',
        opponentScore: '',
    });
    const [playerStatInputs, setPlayerStatInputs] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const [matchData, memberData] = await Promise.all([
                getMatches(),
                getMembers(),
            ]);
            setMatches(matchData);
            setMembers(memberData);
            return matchData;
        } catch (err) {
            console.error('데이터 로딩 실패:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }

    // 멤버 이름 조회 헬퍼
    function getMemberName(memberId) {
        const member = members.find(m => m.id === memberId);
        return member ? member.name : '알 수 없음';
    }

    // 날짜 유틸
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    function prevMonth() {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDate(null);
        setSelectedMatch(null);
    }

    function nextMonth() {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDate(null);
        setSelectedMatch(null);
    }

    function goToToday() {
        const today = new Date();
        setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today.getDate());
        handleDateClick(today.getDate());
    }

    function getMatchForDate(day) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return matches.find(m => m.matchDate === dateStr);
    }

    function getResult(match) {
        if (match.ourScore == null || match.opponentScore == null) return 'upcoming';
        if (match.ourScore > match.opponentScore) return 'win';
        if (match.ourScore === match.opponentScore) return 'draw';
        return 'lose';
    }

    function getResultLabel(result) {
        if (result === 'win') return '승';
        if (result === 'draw') return '무';
        if (result === 'lose') return '패';
        return '예정';
    }

    function getResultLabelFull(result) {
        if (result === 'win') return '승리';
        if (result === 'draw') return '무승부';
        if (result === 'lose') return '패배';
        return '예정';
    }

    // 색상 헬퍼
    function getDayColor(dayOfWeek) {
        if (dayOfWeek === 0) return '#dc2626'; // Sunday
        if (dayOfWeek === 6) return '#2563eb'; // Saturday
        return '#8b95a5'; // Weekday
    }

    function getDotColor(match) {
        if (match.ourScore == null || match.opponentScore == null) return '#b08d2a'; // upcoming = gold
        if (match.ourScore > match.opponentScore) return '#16a34a'; // win
        if (match.ourScore === match.opponentScore) return '#d97706'; // draw
        return '#dc2626'; // lose
    }

    function getResultColor(result) {
        if (result === 'win') return '#16a34a';
        if (result === 'draw') return '#d97706';
        if (result === 'lose') return '#dc2626';
        return '#b08d2a';
    }

    function getResultGradient(result) {
        const color = getResultColor(result);
        return `linear-gradient(90deg, ${color}, ${color}88)`;
    }

    // 날짜 포맷 헬퍼
    function formatMatchDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);
        const date = new Date(parseInt(parts[0]), m - 1, d);
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        return `${m}월 ${d}일 (${dayNames[date.getDay()]})`;
    }

    // 날짜 클릭
    async function handleDateClick(day) {
        setSelectedDate(day);
        const match = getMatchForDate(day);
        setSelectedMatch(match);

        if (match) {
            try {
                const stats = await getMatchStats(match.id);
                setMatchStats(stats);
            } catch (err) {
                setMatchStats([]);
            }
        } else {
            setMatchStats([]);
        }
    }

    // 사이드바에서 경기 선택
    async function selectMatchFromList(match) {
        // 해당 경기의 날짜로 이동
        const parts = match.matchDate.split('-');
        const matchYear = parseInt(parts[0]);
        const matchMonth = parseInt(parts[1]) - 1;
        const matchDay = parseInt(parts[2]);

        if (matchYear !== year || matchMonth !== month) {
            setCurrentDate(new Date(matchYear, matchMonth, 1));
        }
        setSelectedDate(matchDay);
        setSelectedMatch(match);

        try {
            const stats = await getMatchStats(match.id);
            setMatchStats(stats);
        } catch (err) {
            setMatchStats([]);
        }
    }

    // 이번 달 경기 목록
    function getMonthMatches() {
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        return matches
            .filter(m => m.matchDate && m.matchDate.startsWith(monthStr))
            .sort((a, b) => a.matchDate.localeCompare(b.matchDate));
    }

    // 사이드바에 보여줄 대표 경기 결정
    function getFeaturedMatch() {
        if (selectedMatch) return selectedMatch;

        // 선택된 날짜에 경기가 없으면, 가장 가까운 예정 경기 또는 최근 완료 경기
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const upcoming = matches
            .filter(m => m.matchDate >= todayStr && (m.ourScore == null || m.opponentScore == null))
            .sort((a, b) => a.matchDate.localeCompare(b.matchDate));

        if (upcoming.length > 0) return upcoming[0];

        const completed = matches
            .filter(m => m.ourScore != null && m.opponentScore != null)
            .sort((a, b) => b.matchDate.localeCompare(a.matchDate));

        if (completed.length > 0) return completed[0];
        return null;
    }

    // 날짜 select 동기화 함수
    function syncDateSelects(dateStr) {
        if (dateStr) {
            const parts = dateStr.split('-');
            setDateYear(parts[0]);
            setDateMonth(parts[1]);
            setDateDay(parts[2]);
        }
    }

    function handleDateSelectChange(y, m, d) {
        setDateYear(y);
        setDateMonth(m);
        setDateDay(d);
        if (y && m && d) {
            const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            setNewSchedule(prev => ({ ...prev, matchDate: dateStr }));
        }
    }

    // 해당 월의 일수 계산
    function getDaysInMonthForSelect(y, m) {
        if (!y || !m) return 31;
        return new Date(parseInt(y), parseInt(m), 0).getDate();
    }

    // ========== 일정 등록 ==========
    function openRegisterForm() {
        const today = new Date();
        const dateStr = selectedDate
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
            : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        // 중복 날짜 체크 — 모달 열기 전에 바로 안내
        const existingMatch = matches.find(m => m.matchDate === dateStr);
        if (existingMatch) {
            alert('해당 날짜에 이미 일정이 있습니다.');
            return;
        }
        setEditingMatchId(null);
        setNewSchedule({
            matchDate: dateStr,
            matchTime: '',
            matchEndTime: '',
            location: '',
            opponent: '',
            memo: '',
        });
        syncDateSelects(dateStr);
        setShowRegisterForm(true);
    }

    // ========== 일정 수정 ==========
    function openEditForm(match) {
        setEditingMatchId(match.id);
        setNewSchedule({
            matchDate: match.matchDate || '',
            matchTime: match.matchTime || '',
            matchEndTime: match.matchEndTime || '',
            location: match.location || '',
            opponent: match.opponent || '',
            memo: match.memo || '',
        });
        syncDateSelects(match.matchDate);
        setShowRegisterForm(true);
    }

    async function handleRegisterSubmit(e) {
        e.preventDefault();
        if (!newSchedule.matchDate || !newSchedule.opponent) {
            alert('날짜와 상대팀은 필수입니다.');
            return;
        }
        // 중복 날짜 체크 (수정 모드에서 같은 경기는 제외)
        const existingMatch = matches.find(m => m.matchDate === newSchedule.matchDate);
        if (existingMatch && (!editingMatchId || existingMatch.id !== editingMatchId)) {
            alert('해당 날짜에 이미 일정이 있습니다.');
            return;
        }
        try {
            const payload = {
                matchDate: newSchedule.matchDate,
                matchTime: newSchedule.matchTime || null,
                matchEndTime: newSchedule.matchEndTime || null,
                location: newSchedule.location || null,
                opponent: newSchedule.opponent,
                memo: newSchedule.memo || null,
            };

            if (editingMatchId) {
                // 수정 모드
                await updateMatch(editingMatchId, {
                    ...payload,
                    ourScore: selectedMatch?.ourScore ?? null,
                    opponentScore: selectedMatch?.opponentScore ?? null,
                });
            } else {
                // 등록 모드
                await createMatch({
                    ...payload,
                    ourScore: null,
                    opponentScore: null,
                });
            }

            setShowRegisterForm(false);
            setEditingMatchId(null);
            const updatedMatches = await fetchData();
            // 등록/수정한 날짜 선택
            const day = parseInt(newSchedule.matchDate.split('-')[2]);
            const matchMonth = parseInt(newSchedule.matchDate.split('-')[1]) - 1;
            const matchYear = parseInt(newSchedule.matchDate.split('-')[0]);
            if (matchYear !== year || matchMonth !== month) {
                setCurrentDate(new Date(matchYear, matchMonth, 1));
            }
            setSelectedDate(day);
            if (updatedMatches) {
                const dateStr = newSchedule.matchDate;
                const updatedMatch = updatedMatches.find(m => m.matchDate === dateStr);
                setSelectedMatch(updatedMatch || null);
                if (updatedMatch) {
                    const stats = await getMatchStats(updatedMatch.id);
                    setMatchStats(stats);
                }
            }
        } catch (err) {
            alert(editingMatchId ? '일정 수정에 실패했습니다.' : '일정 등록에 실패했습니다.');
        }
    }

    // ========== 결과 입력 ==========
    function openResultForm() {
        if (!selectedMatch) return;
        setResultData({
            ourScore: selectedMatch.ourScore ?? '',
            opponentScore: selectedMatch.opponentScore ?? '',
        });
        // 선수 목록으로 스탯 입력 폼 초기화
        const isEdit = getResult(selectedMatch) !== 'upcoming';
        const inputs = members.map(member => {
            // 기존 스탯이 있으면 채우기
            const existing = matchStats.find(s =>
                (s.member?.id || s.memberId) === member.id
            );
            return {
                memberId: member.id,
                name: member.name,
                position: member.position,
                backNumber: member.backNumber,
                played: isEdit ? (existing ? true : false) : true,
                goals: existing?.goals || 0,
                assists: existing?.assists || 0,
            };
        });
        // 가나다순 정렬, 수정모드에서는 참가자 먼저
        if (isEdit) {
            inputs.sort((a, b) => {
                if (a.played !== b.played) return a.played ? -1 : 1;
                return a.name.localeCompare(b.name, 'ko');
            });
        } else {
            inputs.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        }
        setPlayerStatInputs(inputs);
        setShowResultForm(true);
    }

    function handlePlayerStatChange(index, field, value) {
        const updated = [...playerStatInputs];
        if (field === 'played') {
            updated[index].played = value;
            if (!value) {
                updated[index].goals = 0;
                updated[index].assists = 0;
            }
        } else {
            updated[index][field] = parseInt(value) || 0;
        }
        setPlayerStatInputs(updated);
    }

    async function handleResultSubmit(e) {
        e.preventDefault();
        if (resultData.ourScore === '' || resultData.opponentScore === '') {
            alert('스코어를 입력해주세요.');
            return;
        }

        // 득점 합계 검증
        const ourScoreNum = parseInt(resultData.ourScore);
        const totalPlayerGoals = playerStatInputs
            .filter(p => p.played)
            .reduce((sum, p) => sum + (p.goals || 0), 0);
        if (ourScoreNum !== totalPlayerGoals) {
            const proceed = window.confirm(
                `팀 득점(${ourScoreNum})과 개인 득점 합계(${totalPlayerGoals})가 다릅니다.\n그래도 저장하시겠습니까?`
            );
            if (!proceed) return;
        }

        try {
            const newOurScore = parseInt(resultData.ourScore);
            const newOpponentScore = parseInt(resultData.opponentScore);

            // 1. 경기 결과 업데이트
            await updateMatch(selectedMatch.id, {
                matchDate: selectedMatch.matchDate,
                matchTime: selectedMatch.matchTime,
                matchEndTime: selectedMatch.matchEndTime,
                opponent: selectedMatch.opponent,
                location: selectedMatch.location,
                memo: selectedMatch.memo,
                ourScore: newOurScore,
                opponentScore: newOpponentScore,
            });

            // 2. 기존 스탯 삭제
            await deleteAllMatchStats(selectedMatch.id);

            // 3. 출전 선수의 스탯 일괄 등록
            const playedPlayers = playerStatInputs.filter(p => p.played);
            for (const player of playedPlayers) {
                await createMatchStat(selectedMatch.id, player.memberId, {
                    goals: player.goals,
                    assists: player.assists,
                });
            }

            setShowResultForm(false);

            // 즉시 카드 업데이트
            setSelectedMatch(prev => ({
                ...prev,
                ourScore: newOurScore,
                opponentScore: newOpponentScore,
            }));

            // 스탯 다시 로드
            const stats = await getMatchStats(selectedMatch.id);
            setMatchStats(stats);

            // 전체 데이터 새로고침
            fetchData();
        } catch (err) {
            alert('결과 입력에 실패했습니다.');
            console.error(err);
        }
    }

    // ========== 경기 삭제 ==========
    async function handleDeleteMatch() {
        if (!selectedMatch) return;
        if (window.confirm(`vs ${selectedMatch.opponent} 일정을 삭제하시겠습니까?`)) {
            try {
                await deleteMatch(selectedMatch.id);
                setSelectedMatch(null);
                setMatchStats([]);
                await fetchData();
            } catch (err) {
                alert('삭제에 실패했습니다.');
            }
        }
    }

    // 포지션 라벨
    function getPositionLabel(position) {
        const pos = (position || '').toUpperCase();
        if (pos.includes('GK') || pos === '골키퍼') return 'GK';
        if (pos.includes('DF') || pos === '수비수') return 'DF';
        if (pos.includes('MF') || pos === '미드필더') return 'MF';
        if (pos.includes('FW') || pos === '공격수') return 'FW';
        return pos || '-';
    }

    function getPositionClass(position) {
        const label = getPositionLabel(position);
        return `badge-${label.toLowerCase()}`;
    }

    // ========== 캘린더 셀 렌더링 ==========
    function renderCalendarCells() {
        const cells = [];
        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        // 이전 달 빈칸
        for (let i = firstDay - 1; i >= 0; i--) {
            const prevDay = daysInPrevMonth - i;
            const prevDow = (firstDay - 1 - i) % 7; // not needed, just use index
            cells.push(
                <div key={`prev-${i}`} className="sc-cal-cell sc-cal-other">
                    <span className="sc-cal-day" style={{ color: '#ccc' }}>{prevDay}</span>
                </div>
            );
        }

        // 현재 달
        for (let day = 1; day <= daysInMonth; day++) {
            const match = getMatchForDate(day);
            const isToday = day === todayDay && month === todayMonth && year === todayYear;
            const isSelected = day === selectedDate;
            const dayOfWeek = new Date(year, month, day).getDay();

            const result = match ? getResult(match) : null;

            let cellClass = 'sc-cal-cell';
            if (isToday) cellClass += ' sc-cal-today';
            if (isSelected) cellClass += ' sc-cal-selected';
            if (match && result === 'upcoming') cellClass += ' sc-cal-upcoming';
            if (match && result !== 'upcoming') cellClass += ' sc-cal-completed';

            cells.push(
                <div
                    key={day}
                    className={cellClass}
                    onClick={() => handleDateClick(day)}
                >
                    <span className="sc-cal-day" style={{ color: getDayColor(dayOfWeek) }}>{day}</span>
                    {match && (
                        <div className="sc-cal-match-info">
                            {result === 'upcoming' ? (
                                <>
                                    <span className="sc-cal-match-label">Match Day</span>
                                    <span className="sc-cal-match-vs">vs</span>
                                    <span className="sc-cal-match-opponent">{match.opponent}</span>
                                </>
                            ) : (
                                <>
                                    <span className="sc-cal-match-vs">vs</span>
                                    <span className="sc-cal-match-opponent">{match.opponent}</span>
                                    <span className="sc-cal-match-result" style={{ color: getResultColor(result) }}>
                                        {getResultLabel(result)}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // 다음 달 빈칸
        const totalCells = cells.length;
        const remaining = 42 - totalCells;
        for (let i = 1; i <= remaining; i++) {
            cells.push(
                <div key={`next-${i}`} className="sc-cal-cell sc-cal-other">
                    <span className="sc-cal-day" style={{ color: '#ccc' }}>{i}</span>
                </div>
            );
        }

        return cells;
    }

    // ========== 사이드바 경기 카드 렌더링 ==========
    function renderMatchCard(match) {
        if (!match) return null;
        const result = getResult(match);
        const isUpcoming = result === 'upcoming';

        return (
            <div className="sc-match-card">
                <div
                    className="sc-match-topline"
                    style={{ background: getResultGradient(result) }}
                ></div>
                <div className="sc-match-body">
                    {/* 상단 정보: 날짜+시간, 장소 (가운데 정렬) */}
                    <div className="sc-match-info-center">
                        <div className="sc-match-info-date">
                            {formatMatchDate(match.matchDate)}
                            {match.matchTime && (
                                <span> {match.matchTime}{match.matchEndTime && `~${match.matchEndTime}`}</span>
                            )}
                        </div>
                        {match.location && (
                            <div className="sc-match-info-location">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                {match.location}
                            </div>
                        )}
                    </div>

                    {/* Status for upcoming */}
                    {isUpcoming && (
                        <div className="sc-match-status-text" style={{ color: '#b08d2a', textAlign: 'center' }}>
                            &middot; 예정
                        </div>
                    )}

                    {/* Teams & Score */}
                    <div className="sc-match-teams">
                        <div className="sc-team">
                            <div className="sc-team-name">창우FC</div>
                            <div className="sc-team-label">HOME</div>
                        </div>

                        {isUpcoming ? (
                            <div className="sc-match-score">
                                <span className="sc-match-vs">VS</span>
                            </div>
                        ) : (
                            <div className="sc-match-score">
                                <div className="sc-score-text">
                                    {match.ourScore} - {match.opponentScore}
                                </div>
                                <span className={`sc-result-pill sc-result-${result}`}>
                                    {getResultLabel(result)}
                                </span>
                            </div>
                        )}

                        <div className="sc-team">
                            <div className="sc-team-name">{match.opponent}</div>
                            <div className="sc-team-label">AWAY</div>
                        </div>
                    </div>

                    {/* 메모 (회색 박스) */}
                    {match.memo && (
                        <div className="sc-match-memo-box">
                            {match.memo}
                        </div>
                    )}

                    {/* Goal Scorers (for completed matches) */}
                    {!isUpcoming && (() => {
                        const scorers = matchStats
                            .filter(s => s.goals > 0)
                            .sort((a, b) => b.goals - a.goals || (a.member?.name || getMemberName(a.memberId)).localeCompare(b.member?.name || getMemberName(b.memberId), 'ko'));
                        return (
                            <div className="sc-scorers-section">
                                <div className="sc-scorers-title">득점자</div>
                                {scorers.length > 0 ? (
                                    <div className="sc-scorers-list">
                                        {scorers.map((s, i) => (
                                            <div key={i} className="sc-scorer-item">
                                                <span className="sc-scorer-name">{s.member?.name || getMemberName(s.memberId)}</span>
                                                <span className="sc-scorer-icon">⚽</span>
                                                <span className="sc-scorer-goals">{s.goals}골</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="sc-no-scorers">득점 기록 없음</div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Action buttons — 오른쪽 아래 */}
                    <div className="sc-match-actions">
                        {isUpcoming ? (
                            <button className="sc-match-header-btn sc-btn-primary" onClick={openResultForm}>
                                결과 입력
                            </button>
                        ) : (
                            <button className="sc-match-header-btn" onClick={openResultForm}>
                                결과 수정
                            </button>
                        )}
                        <button className="sc-match-header-btn" onClick={() => openEditForm(match)}>
                            일정 수정
                        </button>
                        <button className="sc-btn-danger" onClick={handleDeleteMatch}>
                            삭제
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========== 이번 달 일정 리스트 ==========
    function renderMonthlyList() {
        const monthMatches = getMonthMatches();

        return (
            <div className="sc-monthly-card">
                <div className="sc-monthly-title">이번 달 일정</div>
                {monthMatches.length === 0 ? (
                    <div className="sc-monthly-empty">이번 달 등록된 일정이 없습니다.</div>
                ) : (
                    <div className="sc-monthly-list">
                        {monthMatches.map((match) => {
                            const result = getResult(match);
                            const isUpcoming = result === 'upcoming';
                            const barColor = getResultColor(result);
                            const parts = match.matchDate.split('-');
                            const d = parseInt(parts[2]);
                            const dateLabel = `${parseInt(parts[1])}/${d}`;

                            let subText = dateLabel;
                            if (!isUpcoming) {
                                subText += ` · ${match.ourScore}-${match.opponentScore} ${getResultLabel(result)}`;
                            } else if (match.matchTime) {
                                subText += ` · ${match.matchTime}`;
                            }

                            const badgeStyle = isUpcoming
                                ? { background: 'rgba(176, 141, 42, 0.12)', color: '#b08d2a' }
                                : { background: `${barColor}18`, color: barColor };

                            return (
                                <div
                                    key={match.id}
                                    className="sc-monthly-item"
                                    onClick={() => selectMatchFromList(match)}
                                >
                                    <div className="sc-monthly-bar" style={{ background: barColor }}></div>
                                    <div className="sc-monthly-info">
                                        <div className="sc-monthly-opponent">vs {match.opponent}</div>
                                        <div className="sc-monthly-sub">{subText}</div>
                                    </div>
                                    <span className="sc-monthly-badge" style={badgeStyle}>
                                        {isUpcoming ? '예정' : '완료'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    const goalScorers = matchStats.filter(s => s.goals > 0);
    const featuredMatch = getFeaturedMatch();

    if (loading) return <div className="loading">로딩 중...</div>;

    return (
        <div className="schedule-page">
            <style>{scStyles}</style>

            <div className="page-header">
                <h1 className="page-title">일정</h1>
                <button className="btn btn-gold" onClick={openRegisterForm}>
                    + 일정 등록
                </button>
            </div>

            <div className="sc-layout">
                {/* ===== 캘린더 ===== */}
                <div className="sc-cal-card">
                    <div className="sc-cal-header">
                        <div className="sc-cal-nav-group">
                            <button className="sc-cal-nav-btn" onClick={prevMonth}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"/>
                                </svg>
                            </button>
                            <span className="sc-cal-title">{year}년 {month + 1}월</span>
                            <button className="sc-cal-nav-btn" onClick={nextMonth}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="sc-cal-grid">
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                            <div key={day} className="sc-cal-dow" style={{ color: getDayColor(i === 0 ? 0 : i === 6 ? 6 : 1) }}>
                                {day}
                            </div>
                        ))}
                        {renderCalendarCells()}
                    </div>

                    {/* Legend */}
                    <div className="sc-cal-legend">
                        <div className="sc-legend-item">
                            <div className="sc-legend-dot" style={{ background: '#b08d2a' }}></div>
                            예정 경기
                        </div>
                        <div className="sc-legend-item">
                            <div className="sc-legend-dot" style={{ background: '#16a34a' }}></div>
                            승
                        </div>
                        <div className="sc-legend-item">
                            <div className="sc-legend-dot" style={{ background: '#d97706' }}></div>
                            무
                        </div>
                        <div className="sc-legend-item">
                            <div className="sc-legend-dot" style={{ background: '#dc2626' }}></div>
                            패
                        </div>
                    </div>
                </div>

                {/* ===== 오른쪽 사이드바 ===== */}
                <div className="sc-sidebar">
                    {/* 경기 카드 또는 빈 상태 */}
                    {selectedMatch ? (
                        renderMatchCard(selectedMatch)
                    ) : featuredMatch && !selectedDate ? (
                        renderMatchCard(featuredMatch)
                    ) : selectedDate ? (
                        <div className="sc-empty-card">
                            <p>{month + 1}월 {selectedDate}일에는 경기가 없습니다.</p>
                            <button className="sc-empty-register" onClick={openRegisterForm}>
                                이 날짜에 일정 등록
                            </button>
                        </div>
                    ) : (
                        <div className="sc-empty-card">
                            <p>날짜를 선택하면 경기 정보가 표시됩니다.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* ========== 일정 등록 모달 ========== */}
            {showRegisterForm && (
                <div className="modal-overlay" onClick={() => setShowRegisterForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleRegisterSubmit}>
                            <div className="form-title">{editingMatchId ? '일정 수정' : '일정 등록'}</div>
                            <div className="form-grid">
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label date-label-with-icon">
                                        날짜
                                        <span className="date-icon-wrap">
                                            <span className="date-icon-trigger">📅</span>
                                            <input
                                                type="date"
                                                className="date-hidden-input"
                                                value={newSchedule.matchDate}
                                                onChange={(e) => {
                                                    setNewSchedule({ ...newSchedule, matchDate: e.target.value });
                                                    syncDateSelects(e.target.value);
                                                }}
                                                title="달력에서 선택"
                                            />
                                        </span>
                                    </label>
                                    <div className="date-picker-row">
                                        <select
                                            className="form-input date-select"
                                            value={dateYear}
                                            onChange={(e) => handleDateSelectChange(e.target.value, dateMonth, dateDay)}
                                            required
                                        >
                                            <option value="">년</option>
                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                                                <option key={y} value={String(y)}>{y}년</option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-input date-select"
                                            value={dateMonth}
                                            onChange={(e) => handleDateSelectChange(dateYear, e.target.value, dateDay)}
                                            required
                                        >
                                            <option value="">월</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={String(m).padStart(2, '0')}>{m}월</option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-input date-select"
                                            value={dateDay}
                                            onChange={(e) => handleDateSelectChange(dateYear, dateMonth, e.target.value)}
                                            required
                                        >
                                            <option value="">일</option>
                                            {Array.from({ length: getDaysInMonthForSelect(dateYear, dateMonth) }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={String(d).padStart(2, '0')}>{d}일</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">시작 시간</label>
                                    <div className="time-picker-row">
                                        <select
                                            className="form-input time-select"
                                            value={newSchedule.matchTime ? newSchedule.matchTime.split(':')[0] : ''}
                                            onChange={(e) => {
                                                const hour = e.target.value;
                                                const min = newSchedule.matchTime ? newSchedule.matchTime.split(':')[1] : '00';
                                                setNewSchedule({ ...newSchedule, matchTime: hour ? `${hour}:${min}` : '' });
                                            }}
                                        >
                                            <option value="">시</option>
                                            {Array.from({ length: 24 }, (_, i) => i).map(h => (
                                                <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}시</option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-input time-select"
                                            value={newSchedule.matchTime ? newSchedule.matchTime.split(':')[1] : ''}
                                            onChange={(e) => {
                                                const hour = newSchedule.matchTime ? newSchedule.matchTime.split(':')[0] : '00';
                                                const min = e.target.value;
                                                setNewSchedule({ ...newSchedule, matchTime: min ? `${hour}:${min}` : '' });
                                            }}
                                        >
                                            <option value="">분</option>
                                            {Array.from({ length: 60 }, (_, i) => i).map(m => (
                                                <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}분</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">종료 시간</label>
                                    <div className="time-picker-row">
                                        <select
                                            className="form-input time-select"
                                            value={newSchedule.matchEndTime ? newSchedule.matchEndTime.split(':')[0] : ''}
                                            onChange={(e) => {
                                                const hour = e.target.value;
                                                const min = newSchedule.matchEndTime ? newSchedule.matchEndTime.split(':')[1] : '00';
                                                setNewSchedule({ ...newSchedule, matchEndTime: hour ? `${hour}:${min}` : '' });
                                            }}
                                        >
                                            <option value="">시</option>
                                            {Array.from({ length: 24 }, (_, i) => i).map(h => (
                                                <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}시</option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-input time-select"
                                            value={newSchedule.matchEndTime ? newSchedule.matchEndTime.split(':')[1] : ''}
                                            onChange={(e) => {
                                                const hour = newSchedule.matchEndTime ? newSchedule.matchEndTime.split(':')[0] : '00';
                                                const min = e.target.value;
                                                setNewSchedule({ ...newSchedule, matchEndTime: min ? `${hour}:${min}` : '' });
                                            }}
                                        >
                                            <option value="">분</option>
                                            {Array.from({ length: 60 }, (_, i) => i).map(m => (
                                                <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}분</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">상대팀</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="상대팀 이름"
                                        value={newSchedule.opponent}
                                        onChange={(e) => setNewSchedule({ ...newSchedule, opponent: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">장소</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="경기 장소"
                                        value={newSchedule.location}
                                        onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '12px' }}>
                                <label className="form-label">메모</label>
                                <textarea
                                    className="form-input"
                                    placeholder="메모"
                                    value={newSchedule.memo}
                                    onChange={(e) => setNewSchedule({ ...newSchedule, memo: e.target.value })}
                                    rows={2}
                                    style={{ resize: 'vertical', minHeight: '40px', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowRegisterForm(false)}
                                >
                                    취소
                                </button>
                                <button type="submit" className="btn btn-gold">
                                    {editingMatchId ? '수정' : '등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== 결과 입력 모달 ========== */}
            {showResultForm && selectedMatch && (
                <div className="modal-overlay" onClick={() => setShowResultForm(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleResultSubmit}>
                            <div className="form-title">
                                {getResult(selectedMatch) === 'upcoming' ? '결과 입력' : '결과 수정'} — vs {selectedMatch.opponent}
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
                                                const isEditMode = getResult(selectedMatch) !== 'upcoming';
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
                                                                    onChange={(e) => handlePlayerStatChange(index, 'played', e.target.checked)}
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
                                                                    onChange={(e) => handlePlayerStatChange(index, 'goals', e.target.value)}
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
                                                                    onChange={(e) => handlePlayerStatChange(index, 'assists', e.target.value)}
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
                                    onClick={() => setShowResultForm(false)}
                                >
                                    취소
                                </button>
                                <button type="submit" className="btn btn-gold">
                                    {getResult(selectedMatch) === 'upcoming' ? '결과 저장' : '결과 수정'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Schedule;
