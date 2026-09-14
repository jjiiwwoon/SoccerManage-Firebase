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
import { getPositionLabel, getPositionClass } from '../utils/positionUtils';
import MatchFormModal from '../components/MatchFormModal';
import ResultInputModal from '../components/ResultInputModal';
import './Schedule.css';

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
                <MatchFormModal
                    editingMatchId={editingMatchId}
                    newSchedule={newSchedule}
                    setNewSchedule={setNewSchedule}
                    dateYear={dateYear}
                    dateMonth={dateMonth}
                    dateDay={dateDay}
                    onDateSelectChange={handleDateSelectChange}
                    onSyncDateSelects={syncDateSelects}
                    getDaysInMonthForSelect={getDaysInMonthForSelect}
                    onSubmit={handleRegisterSubmit}
                    onClose={() => setShowRegisterForm(false)}
                />
            )}

            {/* ========== 결과 입력 모달 ========== */}
            {showResultForm && selectedMatch && (
                <ResultInputModal
                    selectedMatch={selectedMatch}
                    isUpcoming={getResult(selectedMatch) === 'upcoming'}
                    resultData={resultData}
                    setResultData={setResultData}
                    playerStatInputs={playerStatInputs}
                    setPlayerStatInputs={setPlayerStatInputs}
                    onPlayerStatChange={handlePlayerStatChange}
                    onSubmit={handleResultSubmit}
                    onClose={() => setShowResultForm(false)}
                />
            )}
        </div>
    );
}

export default Schedule;
