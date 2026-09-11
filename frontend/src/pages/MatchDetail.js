/**
 * ====================================
 * 파일: MatchDetail.js (수정됨)
 * 위치: frontend/src/pages/ (기존 파일 덮어쓰기)
 * 기능: 경기 상세 + 개인 스탯 (쿼터 수 추가)
 * ====================================
 *
 * 기존: 골, 어시스트만 입력
 * 추가: 쿼터 수 입력 (1~4), 통계에 쿼터 합계 표시
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatch, getMatchStats, createMatchStat, deleteMatchStat } from '../api/matchApi';
import { getMembers } from '../api/memberApi';

function MatchDetail() {
    const { id } = useParams();

    const [match, setMatch] = useState(null);
    const [stats, setStats] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newStat, setNewStat] = useState({
        memberId: '',
        goals: 0,
        assists: 0,
        quarters: 1,    // 쿼터 수 추가 (기본 1)
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            setLoading(true);
            const [matchData, statsData, membersData] = await Promise.all([
                getMatch(id),
                getMatchStats(id),
                getMembers(),
            ]);
            setMatch(matchData);
            setStats(statsData);
            setMembers(membersData);
        } catch (err) {
            console.error('데이터 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddStat(e) {
        e.preventDefault();
        if (!newStat.memberId) {
            alert('선수를 선택해주세요.');
            return;
        }
        try {
            await createMatchStat(id, newStat.memberId, {
                goals: parseInt(newStat.goals) || 0,
                assists: parseInt(newStat.assists) || 0,
                quarters: parseInt(newStat.quarters) || 1,
            });
            setNewStat({ memberId: '', goals: 0, assists: 0, quarters: 1 });
            const updatedStats = await getMatchStats(id);
            setStats(updatedStats);
        } catch (err) {
            alert('스탯 추가에 실패했습니다.');
        }
    }

    async function handleDeleteStat(statId) {
        if (window.confirm('이 기록을 삭제하시겠습니까?')) {
            try {
                await deleteMatchStat(statId);
                const updatedStats = await getMatchStats(id);
                setStats(updatedStats);
            } catch (err) {
                alert('스탯 삭제에 실패했습니다.');
            }
        }
    }

    function getResultStyle(result) {
        if (result === 'WIN') return { backgroundColor: '#27ae60', color: 'white' };
        if (result === 'DRAW') return { backgroundColor: '#f39c12', color: 'white' };
        if (result === 'LOSE') return { backgroundColor: '#e74c3c', color: 'white' };
        return {};
    }

    function getResultText(result) {
        if (result === 'WIN') return '승리';
        if (result === 'DRAW') return '무승부';
        if (result === 'LOSE') return '패배';
        return '-';
    }

    if (loading) return <div className="loading">로딩 중...</div>;
    if (!match) return <div className="error">경기를 찾을 수 없습니다.</div>;

    const totalGoals = stats.reduce((sum, s) => sum + (s.goals || 0), 0);
    const totalAssists = stats.reduce((sum, s) => sum + (s.assists || 0), 0);
    const totalQuarters = stats.reduce((sum, s) => sum + (s.quarters || 0), 0);

    return (
        <div className="match-detail">
            <Link to="/matches" className="back-link">← 경기 목록으로</Link>

            <div className="match-detail-header">
                <div className="match-date-detail">{match.matchDate || '날짜 미정'}</div>
                <div className="match-score-detail">
                    <div className="team-side">
                        <span className="team-name-detail">창우FC</span>
                        <span className="score-detail">{match.ourScore ?? '-'}</span>
                    </div>
                    <div className="vs-detail">vs</div>
                    <div className="team-side">
                        <span className="score-detail">{match.opponentScore ?? '-'}</span>
                        <span className="team-name-detail">{match.opponent}</span>
                    </div>
                </div>
                <span className="result-badge-detail" style={getResultStyle(match.result)}>
                    {getResultText(match.result)}
                </span>
                {match.location && <div className="location-detail">📍 {match.location}</div>}
            </div>

            <div className="stats-section">
                <h3>개인 기록</h3>

                <form className="add-stat-form" onSubmit={handleAddStat}>
                    <select
                        value={newStat.memberId}
                        onChange={(e) => setNewStat({...newStat, memberId: e.target.value})}
                    >
                        <option value="">선수 선택</option>
                        {members.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.name} ({member.position || '포지션 미정'})
                            </option>
                        ))}
                    </select>
                    <label>
                        쿼터:
                        <select
                            value={newStat.quarters}
                            onChange={(e) => setNewStat({...newStat, quarters: e.target.value})}
                            style={{width: '70px', marginLeft: '5px'}}
                        >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </label>
                    <label>
                        골:
                        <input
                            type="number"
                            min="0"
                            value={newStat.goals}
                            onChange={(e) => setNewStat({...newStat, goals: e.target.value})}
                            style={{width: '60px', marginLeft: '5px'}}
                        />
                    </label>
                    <label>
                        어시스트:
                        <input
                            type="number"
                            min="0"
                            value={newStat.assists}
                            onChange={(e) => setNewStat({...newStat, assists: e.target.value})}
                            style={{width: '60px', marginLeft: '5px'}}
                        />
                    </label>
                    <button type="submit">기록 추가</button>
                </form>

                {stats.length > 0 && (
                    <div className="stats-summary">
                        총 {totalGoals}골 / {totalAssists}어시스트 / {totalQuarters}쿼터
                    </div>
                )}

                {stats.length === 0 ? (
                    <p style={{textAlign: 'center', color: '#666', padding: '20px'}}>
                        등록된 개인 기록이 없습니다.
                    </p>
                ) : (
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>선수</th>
                                <th>포지션</th>
                                <th>쿼터</th>
                                <th>골</th>
                                <th>어시스트</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((stat) => (
                                <tr key={stat.id}>
                                    <td>
                                        <Link to={`/players/${stat.member?.id}`} style={{color: '#3498db', textDecoration: 'none'}}>
                                            {stat.member?.name || '-'}
                                        </Link>
                                    </td>
                                    <td>{stat.member?.position || '-'}</td>
                                    <td className="stat-number">{stat.quarters || 0}</td>
                                    <td className="stat-number">{stat.goals}</td>
                                    <td className="stat-number">{stat.assists}</td>
                                    <td>
                                        <button
                                            onClick={() => handleDeleteStat(stat.id)}
                                            className="delete-btn-small"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default MatchDetail;
