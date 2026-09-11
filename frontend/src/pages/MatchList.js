/**
 * ====================================
 * 파일: MatchList.js
 * 위치: frontend/src/pages/ 폴더 안에 넣기
 * 분야: 프론트엔드 / 페이지
 * 기능: 경기 기록 목록 + 경기 추가
 * ====================================
 *
 * MemberList.js랑 같은 구조야!
 * useState로 데이터 저장, useEffect로 데이터 불러오기.
 *
 * 다른 점:
 *   - 날짜(date) 입력이 있음
 *   - 스코어 입력하면 승/무/패가 자동 계산됨
 *   - 경기 카드를 클릭하면 상세 페이지(개인 스탯)로 이동
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMatches, createMatch, deleteMatch } from '../api/matchApi';

function MatchList() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 새 경기 입력 폼
    const [newMatch, setNewMatch] = useState({
        matchDate: '',
        opponent: '',
        ourScore: '',
        opponentScore: '',
        location: '',
    });

    // 페이지 열릴 때 경기 목록 불러오기
    useEffect(() => {
        fetchMatches();
    }, []);

    async function fetchMatches() {
        try {
            setLoading(true);
            const data = await getMatches();
            setMatches(data);
        } catch (err) {
            setError('경기 기록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }

    // 경기 추가
    async function handleAddMatch(e) {
        e.preventDefault();
        if (!newMatch.opponent) {
            alert('상대팀 이름을 입력해주세요.');
            return;
        }
        try {
            await createMatch({
                ...newMatch,
                ourScore: newMatch.ourScore ? parseInt(newMatch.ourScore) : null,
                opponentScore: newMatch.opponentScore ? parseInt(newMatch.opponentScore) : null,
            });
            setNewMatch({ matchDate: '', opponent: '', ourScore: '', opponentScore: '', location: '' });
            fetchMatches();
        } catch (err) {
            alert('경기 추가에 실패했습니다.');
        }
    }

    // 경기 삭제
    async function handleDeleteMatch(id, opponent) {
        if (window.confirm(`vs ${opponent} 경기를 삭제하시겠습니까?`)) {
            try {
                await deleteMatch(id);
                fetchMatches();
            } catch (err) {
                alert('경기 삭제에 실패했습니다.');
            }
        }
    }

    // 결과에 따른 배지 색상
    function getResultStyle(result) {
        if (result === 'WIN') return { backgroundColor: '#27ae60', color: 'white' };
        if (result === 'DRAW') return { backgroundColor: '#f39c12', color: 'white' };
        if (result === 'LOSE') return { backgroundColor: '#e74c3c', color: 'white' };
        return { backgroundColor: '#95a5a6', color: 'white' };
    }

    function getResultText(result) {
        if (result === 'WIN') return '승';
        if (result === 'DRAW') return '무';
        if (result === 'LOSE') return '패';
        return '-';
    }

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="match-list">
            <h2>경기 기록</h2>

            {/* 경기 추가 폼 */}
            <form className="add-match-form" onSubmit={handleAddMatch}>
                <input
                    type="date"
                    value={newMatch.matchDate}
                    onChange={(e) => setNewMatch({...newMatch, matchDate: e.target.value})}
                />
                <input
                    type="text"
                    placeholder="상대팀"
                    value={newMatch.opponent}
                    onChange={(e) => setNewMatch({...newMatch, opponent: e.target.value})}
                />
                <input
                    type="number"
                    placeholder="우리 점수"
                    min="0"
                    value={newMatch.ourScore}
                    onChange={(e) => setNewMatch({...newMatch, ourScore: e.target.value})}
                    style={{width: '90px'}}
                />
                <span style={{fontSize: '1.2rem', fontWeight: 'bold', margin: '0 5px'}}>vs</span>
                <input
                    type="number"
                    placeholder="상대 점수"
                    min="0"
                    value={newMatch.opponentScore}
                    onChange={(e) => setNewMatch({...newMatch, opponentScore: e.target.value})}
                    style={{width: '90px'}}
                />
                <input
                    type="text"
                    placeholder="경기 장소"
                    value={newMatch.location}
                    onChange={(e) => setNewMatch({...newMatch, location: e.target.value})}
                />
                <button type="submit">경기 추가</button>
            </form>

            {/* 전적 요약 */}
            {matches.length > 0 && (
                <div className="record-summary">
                    <span className="summary-item win">
                        {matches.filter(m => m.result === 'WIN').length}승
                    </span>
                    <span className="summary-item draw">
                        {matches.filter(m => m.result === 'DRAW').length}무
                    </span>
                    <span className="summary-item lose">
                        {matches.filter(m => m.result === 'LOSE').length}패
                    </span>
                    <span className="summary-total">
                        (총 {matches.length}경기)
                    </span>
                </div>
            )}

            {/* 경기 목록 */}
            {matches.length === 0 ? (
                <p style={{textAlign: 'center', color: '#666', padding: '40px'}}>
                    등록된 경기가 없습니다. 첫 번째 경기를 추가해보세요!
                </p>
            ) : (
                <div className="match-grid">
                    {matches.map((match) => (
                        <div key={match.id} className="match-card">
                            <div className="match-date">
                                {match.matchDate || '날짜 미정'}
                            </div>
                            <div className="match-score">
                                <span className="team-name">창우FC</span>
                                <span className="score">{match.ourScore ?? '-'}</span>
                                <span className="vs">vs</span>
                                <span className="score">{match.opponentScore ?? '-'}</span>
                                <span className="team-name">{match.opponent}</span>
                            </div>
                            <span
                                className="result-badge"
                                style={getResultStyle(match.result)}
                            >
                                {getResultText(match.result)}
                            </span>
                            {match.location && (
                                <div className="match-location">📍 {match.location}</div>
                            )}
                            <div className="match-actions">
                                <Link to={`/matches/${match.id}`} className="detail-btn">
                                    상세/스탯 보기
                                </Link>
                                <button
                                    onClick={() => handleDeleteMatch(match.id, match.opponent)}
                                    className="delete-btn"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MatchList;
