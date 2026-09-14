/**
 * ====================================
 * 파일: Home.js (수정됨)
 * 위치: frontend/src/pages/Home.js
 * 기능: 메인 홈 페이지
 * ====================================
 *
 * 변경사항:
 * 1. 히어로 영역 → 팀 소개 영역 (사진 + 소개글 + 링크, 편집 가능)
 * 2. SINCE 2024 배지 + 멤버 수 배지 추가
 * 3. 미니 통계 바 (경기/승/무/패/승률) 추가
 * 4. 퀵 링크 5열 배치
 * 5. 다가오는 경기 + 최근 경기 결과 2열 나란히 배치
 * 6. 링크 편집: 고정 3개 → 동적 추가/삭제 (linksJson 활용)
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMatches } from '../api/matchApi';
import { getMembers } from '../api/memberApi';
import { getTeamInfo, updateTeamInfo, uploadTeamPhoto, deleteTeamPhoto } from '../api/teamInfoApi';
import { getResult, getResultLabel, getDday } from '../utils/matchUtils';

function Home() {
    const [matches, setMatches] = useState([]);
    const [members, setMembers] = useState([]);
    const [teamInfo, setTeamInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [savingInfo, setSavingInfo] = useState(false);
    const photoInput = useRef(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [matchData, infoData, memberData] = await Promise.all([
                    getMatches(),
                    getTeamInfo(),
                    getMembers(),
                ]);
                setMatches(matchData);
                setTeamInfo(infoData);
                setMembers(memberData);
            } catch (err) {
                console.error('데이터 로딩 실패:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // 다가오는 경기 (오늘 이후 예정된 경기 중 가장 가까운 것)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingMatches = matches
        .filter(m => {
            const matchDate = new Date(m.matchDate);
            matchDate.setHours(0, 0, 0, 0);
            return (m.ourScore === null || m.ourScore === undefined) && matchDate >= today;
        })
        .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));

    const nextMatch = upcomingMatches[0] || null;

    // 최근 완료된 경기 3개
    const recentResults = matches
        .filter(m => m.ourScore !== null && m.ourScore !== undefined)
        .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate))
        .slice(0, 3);

    // 통계 계산
    const completedMatches = matches.filter(m => m.ourScore !== null && m.ourScore !== undefined);
    const totalMatches = completedMatches.length;
    const wins = completedMatches.filter(m => m.ourScore > m.opponentScore).length;
    const draws = completedMatches.filter(m => m.ourScore === m.opponentScore).length;
    const losses = completedMatches.filter(m => m.ourScore < m.opponentScore).length;
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';

    // 날짜 포맷
    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    }

    // linksJson 파싱 헬퍼
    function parseLinks(info) {
        if (info?.linksJson) {
            try {
                const parsed = JSON.parse(info.linksJson);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) { /* 파싱 실패 시 빈 배열 */ }
        }
        const links = [];
        if (info?.link1) links.push({ label: info.link1Label || '', url: info.link1 });
        if (info?.link2) links.push({ label: info.link2Label || '', url: info.link2 });
        if (info?.link3) links.push({ label: info.link3Label || '', url: info.link3 });
        return links;
    }

    // 편집 모드 진입
    function startEdit() {
        setEditData({
            teamName: teamInfo?.teamName || '',
            description: teamInfo?.description || '',
            links: parseLinks(teamInfo),
        });
        setEditMode(true);
    }

    // 링크 추가
    function addLink() {
        setEditData(prev => ({
            ...prev,
            links: [...prev.links, { label: '', url: '' }],
        }));
    }

    // 링크 삭제
    function removeLink(index) {
        setEditData(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index),
        }));
    }

    // 링크 수정
    function updateLink(index, field, value) {
        setEditData(prev => ({
            ...prev,
            links: prev.links.map((link, i) => i === index ? { ...link, [field]: value } : link),
        }));
    }

    // 팀 정보 저장
    async function handleSaveInfo(e) {
        e.preventDefault();
        setSavingInfo(true);
        try {
            const payload = {
                teamName: editData.teamName,
                description: editData.description,
                linksJson: JSON.stringify(
                    editData.links.filter(l => l.url.trim() !== '')
                ),
            };
            const updated = await updateTeamInfo(payload);
            setTeamInfo(updated);
            setEditMode(false);
        } catch (err) {
            console.error('저장 실패:', err);
            alert('저장에 실패했습니다.');
        } finally {
            setSavingInfo(false);
        }
    }

    // 팀 사진 업로드
    async function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const updated = await uploadTeamPhoto(file);
            setTeamInfo(updated);
        } catch (err) {
            console.error('사진 업로드 실패:', err);
            alert('사진 업로드에 실패했습니다.');
        }
    }

    // 팀 사진 삭제
    async function handlePhotoDelete() {
        if (!window.confirm('팀 사진을 삭제하시겠습니까?')) return;
        try {
            await deleteTeamPhoto();
            setTeamInfo(prev => ({ ...prev, teamPhoto: null, teamPhotoFileName: null }));
        } catch (err) {
            console.error('사진 삭제 실패:', err);
        }
    }

    if (loading) return <div className="loading">로딩 중...</div>;

    return (
        <div className="home-page">
            {/* ===== 팀 소개 영역 ===== */}
            <div className="team-intro-section">
                {/* 팀 사진 */}
                <div className="team-photo-area">
                    {teamInfo?.teamPhoto ? (
                        <div className="team-photo-wrapper">
                            <img
                                src={teamInfo.teamPhoto}
                                alt="팀 사진"
                                className="team-photo"
                            />
                            <div className="team-photo-actions">
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => photoInput.current?.click()}
                                >
                                    변경
                                </button>
                                <button
                                    className="btn btn-sm btn-outline"
                                    style={{ color: 'var(--color-fw)' }}
                                    onClick={handlePhotoDelete}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="team-photo-placeholder"
                            onClick={() => photoInput.current?.click()}
                        >
                            <div className="placeholder-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            </div>
                            <div className="placeholder-text">팀 사진</div>
                        </div>
                    )}
                    <input
                        ref={photoInput}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                    />
                </div>

                {/* 팀 정보 */}
                <div className="team-info-area">
                    {!editMode ? (
                        <>
                            <div className="team-intro-header">
                                <div>
                                    <h1 className="team-intro-name">
                                        {teamInfo?.teamName || '창우FC'}
                                    </h1>
                                    <div className="team-badges">
                                        <span className="team-badge team-badge-muted">{members.length}명</span>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={startEdit}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'4px',verticalAlign:'middle'}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    편집
                                </button>
                            </div>
                            <p className="team-intro-desc">
                                {teamInfo?.description || '축구동호회 팀 관리 시스템'}
                            </p>
                            <div className="team-links">
                                {parseLinks(teamInfo).map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="team-link">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px', verticalAlign: 'middle'}}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                        {link.label || link.url}
                                    </a>
                                ))}
                            </div>

                            {/* 미니 통계 바 */}
                            <div className="team-mini-stats">
                                <div className="mini-stat">
                                    <span className="mini-stat-number">{totalMatches}</span>
                                    <span className="mini-stat-label">경기</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-number" style={{ color: 'var(--color-win)' }}>{wins}</span>
                                    <span className="mini-stat-label">승</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-number" style={{ color: 'var(--color-draw)' }}>{draws}</span>
                                    <span className="mini-stat-label">무</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-number" style={{ color: 'var(--color-lose)' }}>{losses}</span>
                                    <span className="mini-stat-label">패</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-number" style={{ color: 'var(--color-gold)' }}>{winRate}%</span>
                                    <span className="mini-stat-label">승률</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSaveInfo} className="team-edit-form">
                            <div className="form-group">
                                <label className="form-label">팀 이름</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editData.teamName}
                                    onChange={e => setEditData({ ...editData, teamName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">팀 소개</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="팀 소개를 입력하세요"
                                    value={editData.description}
                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">링크</label>
                                <div className="dynamic-links-list">
                                    {editData.links && editData.links.map((link, index) => (
                                        <div key={index} className="dynamic-link-row">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="링크 이름"
                                                value={link.label}
                                                onChange={e => updateLink(index, 'label', e.target.value)}
                                            />
                                            <input
                                                type="url"
                                                className="form-input"
                                                placeholder="https://..."
                                                value={link.url}
                                                onChange={e => updateLink(index, 'url', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="btn-link-remove"
                                                onClick={() => removeLink(index)}
                                                title="링크 삭제"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn-link-add"
                                        onClick={addLink}
                                    >
                                        + 링크 추가
                                    </button>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setEditMode(false)}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-gold"
                                    disabled={savingInfo}
                                >
                                    {savingInfo ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* ===== 퀵 링크 (5열) ===== */}
            <div className="quick-links">
                <Link to="/team-records" className="quick-link-card">
                    <div className="quick-link-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                    </div>
                    <div className="quick-link-title">팀기록</div>
                    <div className="quick-link-desc">팀 전적 및 경기 결과</div>
                </Link>
                <Link to="/player-stats" className="quick-link-card">
                    <div className="quick-link-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="quick-link-title">개인기록</div>
                    <div className="quick-link-desc">선수별 상세 기록</div>
                </Link>
                <Link to="/squad" className="quick-link-card">
                    <div className="quick-link-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div className="quick-link-title">스쿼드</div>
                    <div className="quick-link-desc">팀원 관리</div>
                </Link>
                <Link to="/schedule" className="quick-link-card">
                    <div className="quick-link-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div className="quick-link-title">일정</div>
                    <div className="quick-link-desc">경기 일정 캘린더</div>
                </Link>
                <Link to="/gallery" className="quick-link-card">
                    <div className="quick-link-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                    <div className="quick-link-title">갤러리</div>
                    <div className="quick-link-desc">사진 모음</div>
                </Link>
            </div>

            {/* ===== 다가오는 경기 + 최근 경기 결과 (2열 배치) ===== */}
            <div className="home-matches-grid">
                {/* 다가오는 경기 */}
                <div className="card home-match-card">
                    <div className="card-gold-line"></div>
                    <div className="card-title">다가오는 경기</div>
                    {nextMatch ? (
                        <div className="upcoming-match-content">
                            <div className="upcoming-dday">
                                <span className="dday-badge">{getDday(nextMatch.matchDate)}</span>
                            </div>
                            <div className="upcoming-match-info">
                                <div className="upcoming-date">
                                    {formatDate(nextMatch.matchDate)}
                                    {nextMatch.matchTime && (
                                        <span className="upcoming-time"> {nextMatch.matchTime}</span>
                                    )}
                                </div>
                                <div className="upcoming-teams">
                                    <span className="upcoming-our-team">창우FC</span>
                                    <span className="upcoming-vs">VS</span>
                                    <span className="upcoming-opponent">{nextMatch.opponent}</span>
                                </div>
                                {nextMatch.location && (
                                    <div className="upcoming-location">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'4px',verticalAlign:'middle'}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                        {nextMatch.location}
                                    </div>
                                )}
                                {nextMatch.memo && (
                                    <div className="upcoming-location" style={{ marginTop: '4px', color: 'var(--color-text-light)' }}>
                                        {nextMatch.memo}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="home-empty-state">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-disabled)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <p>예정된 경기가 없습니다</p>
                            <Link to="/schedule" className="home-empty-link">
                                일정 등록하러 가기 →
                            </Link>
                        </div>
                    )}
                </div>

                {/* 최근 경기 결과 */}
                <div className="card home-match-card">
                    <div className="card-gold-line"></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div className="card-title" style={{ marginBottom: 0 }}>최근 경기 결과</div>
                        <Link to="/team-records" style={{ color: 'var(--color-gold)', fontSize: '0.8rem' }}>
                            전체 보기 →
                        </Link>
                    </div>
                    {recentResults.length > 0 ? (
                        recentResults.map((match) => (
                            <div key={match.id} className="match-row">
                                <div className="match-result-bar" style={{
                                    backgroundColor: `var(--color-${getResult(match)})`
                                }} />
                                <div className="match-date-col">
                                    {formatDate(match.matchDate)}
                                </div>
                                <div className="match-teams-col">
                                    <span style={{ fontWeight: 600 }}>창우FC</span>
                                    <span className="match-score">
                                        {match.ourScore} - {match.opponentScore}
                                    </span>
                                    <span>{match.opponent}</span>
                                </div>
                                <span className={`result-badge result-${getResult(match)}`}>
                                    {getResultLabel(getResult(match))}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="home-empty-state">
                            <p>완료된 경기가 없습니다</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Home;
