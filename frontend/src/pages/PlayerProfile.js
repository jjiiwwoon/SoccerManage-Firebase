/**
 * ====================================
 * 파일: PlayerProfile.js (새 파일)
 * 위치: frontend/src/pages/
 * 기능: 선수 개인 프로필 + 통산 기록
 * ====================================
 *
 * 선수 이름 클릭하면 이 페이지로 와.
 * 통산 기록: 경기수, 쿼터수, 득점, 어시스트
 * + SNS 링크 (유튜브, 인스타, 기타)
 * + 경기별 세부 기록 테이블
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMember, getMemberStats } from '../api/memberApi';

function PlayerProfile() {
    const { id } = useParams();

    const [member, setMember] = useState(null);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            setLoading(true);
            const [memberData, statsData] = await Promise.all([
                getMember(id),
                getMemberStats(id),
            ]);
            setMember(memberData);
            setStats(statsData);
        } catch (err) {
            console.error('데이터 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="loading">로딩 중...</div>;
    if (!member) return <div className="error">선수를 찾을 수 없습니다.</div>;

    // 통산 기록 계산
    const totalGames = stats.length;                                           // 경기수 (기록 있는 경기 = 출전 경기)
    const totalQuarters = stats.reduce((sum, s) => sum + (s.quarters || 0), 0); // 총 쿼터수
    const totalGoals = stats.reduce((sum, s) => sum + (s.goals || 0), 0);       // 총 골
    const totalAssists = stats.reduce((sum, s) => sum + (s.assists || 0), 0);   // 총 어시스트

    return (
        <div className="player-profile">
            <Link to="/members" className="back-link">← 멤버 목록으로</Link>

            {/* 선수 정보 카드 */}
            <div className="profile-header">
                <div className="profile-info">
                    <h2 className="profile-name">{member.name}</h2>
                    <div className="profile-details">
                        <span className="profile-position">{member.position || '포지션 미정'}</span>
                        <span className="profile-number">
                            {member.backNumber ? `#${member.backNumber}` : ''}
                        </span>
                        <span className={`role-badge ${member.role}`}>
                            {member.role === 'CAPTAIN' ? '주장' :
                             member.role === 'MANAGER' ? '매니저' : '팀원'}
                        </span>
                    </div>

                    {/* SNS 링크 */}
                    <div className="profile-links">
                        {member.youtubeLink && (
                            <a href={member.youtubeLink} target="_blank" rel="noopener noreferrer" className="sns-link youtube">
                                ▶ YouTube
                            </a>
                        )}
                        {member.instagramLink && (
                            <a href={member.instagramLink} target="_blank" rel="noopener noreferrer" className="sns-link instagram">
                                📷 Instagram
                            </a>
                        )}
                        {member.snsLink && (
                            <a href={member.snsLink} target="_blank" rel="noopener noreferrer" className="sns-link other">
                                🔗 SNS
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* 통산 기록 카드 */}
            <div className="career-stats">
                <h3>통산 기록</h3>
                <div className="stats-cards">
                    <div className="stat-card">
                        <div className="stat-value">{totalGames}</div>
                        <div className="stat-label">경기</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalQuarters}</div>
                        <div className="stat-label">쿼터</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalGoals}</div>
                        <div className="stat-label">득점</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalAssists}</div>
                        <div className="stat-label">어시스트</div>
                    </div>
                </div>
            </div>

            {/* 경기별 세부 기록 */}
            <div className="match-history">
                <h3>경기별 기록</h3>
                {stats.length === 0 ? (
                    <p style={{textAlign: 'center', color: '#666', padding: '20px'}}>
                        등록된 경기 기록이 없습니다.
                    </p>
                ) : (
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>날짜</th>
                                <th>상대팀</th>
                                <th>결과</th>
                                <th>쿼터</th>
                                <th>골</th>
                                <th>어시스트</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((stat) => (
                                <tr key={stat.id}>
                                    <td>
                                        <Link to={`/matches/${stat.match?.id}`} style={{color: '#3498db', textDecoration: 'none'}}>
                                            {stat.match?.matchDate || '-'}
                                        </Link>
                                    </td>
                                    <td>{stat.match?.opponent || '-'}</td>
                                    <td>
                                        <span style={{
                                            color: stat.match?.result === 'WIN' ? '#27ae60' :
                                                   stat.match?.result === 'LOSE' ? '#e74c3c' : '#f39c12',
                                            fontWeight: 'bold'
                                        }}>
                                            {stat.match?.ourScore ?? '-'} : {stat.match?.opponentScore ?? '-'}
                                        </span>
                                    </td>
                                    <td className="stat-number">{stat.quarters || 0}</td>
                                    <td className="stat-number">{stat.goals}</td>
                                    <td className="stat-number">{stat.assists}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default PlayerProfile;
