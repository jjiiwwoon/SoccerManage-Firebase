/**
 * ====================================
 * 파일: MemberList.js (수정됨)
 * 위치: frontend/src/pages/ (기존 파일 덮어쓰기)
 * 기능: 멤버 목록 + 통산 기록을 테이블로 표시
 * ====================================
 *
 * 변경 내용:
 * - 카드 형태 → 네이버 스포츠 스타일 테이블로 변경
 * - 각 멤버의 통산 기록(경기수, 쿼터, 골, 어시스트)을 함께 표시
 * - 골 기준 정렬 (내림차순)
 * - 이름 클릭 시 개인 프로필로 이동
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMembers, getMemberStats, createMember, deleteMember } from '../api/memberApi';

function MemberList() {
    const [members, setMembers] = useState([]);
    const [memberStats, setMemberStats] = useState({});  // { memberId: [stats] }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [sortBy, setSortBy] = useState('goals');  // 정렬 기준

    const [newMember, setNewMember] = useState({
        name: '',
        position: '',
        backNumber: '',
        role: 'MEMBER',
    });

    useEffect(() => {
        fetchMembersWithStats();
    }, []);

    async function fetchMembersWithStats() {
        try {
            setLoading(true);
            const membersData = await getMembers();
            setMembers(membersData);

            // 각 멤버의 스탯을 모두 가져오기
            const statsMap = {};
            await Promise.all(
                membersData.map(async (member) => {
                    try {
                        const stats = await getMemberStats(member.id);
                        statsMap[member.id] = stats;
                    } catch (err) {
                        statsMap[member.id] = [];
                    }
                })
            );
            setMemberStats(statsMap);
        } catch (err) {
            setError('멤버 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }

    // 멤버별 통산 기록 계산
    function getCareerStats(memberId) {
        const stats = memberStats[memberId] || [];
        return {
            games: stats.length,
            quarters: stats.reduce((sum, s) => sum + (s.quarters || 0), 0),
            goals: stats.reduce((sum, s) => sum + (s.goals || 0), 0),
            assists: stats.reduce((sum, s) => sum + (s.assists || 0), 0),
        };
    }

    // 정렬된 멤버 목록
    function getSortedMembers() {
        return [...members].sort((a, b) => {
            const statsA = getCareerStats(a.id);
            const statsB = getCareerStats(b.id);
            return (statsB[sortBy] || 0) - (statsA[sortBy] || 0);
        });
    }

    async function handleAddMember(e) {
        e.preventDefault();
        if (!newMember.name) {
            alert('이름을 입력해주세요.');
            return;
        }
        try {
            await createMember({
                ...newMember,
                backNumber: newMember.backNumber ? parseInt(newMember.backNumber) : null,
            });
            setNewMember({ name: '', position: '', backNumber: '', role: 'MEMBER' });
            setShowAddForm(false);
            fetchMembersWithStats();
        } catch (err) {
            alert('멤버 추가에 실패했습니다.');
        }
    }

    async function handleDeleteMember(id, name) {
        if (window.confirm(`${name} 선수를 삭제하시겠습니까?`)) {
            try {
                await deleteMember(id);
                fetchMembersWithStats();
            } catch (err) {
                alert('멤버 삭제에 실패했습니다.');
            }
        }
    }

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error">{error}</div>;

    const sortedMembers = getSortedMembers();

    return (
        <div className="member-list">
            <h2>선수 기록</h2>

            {/* 멤버 추가 버튼 */}
            <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: '8px 20px',
                        backgroundColor: showAddForm ? '#e74c3c' : '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                    }}
                >
                    {showAddForm ? '취소' : '+ 선수 추가'}
                </button>
            </div>

            {/* 멤버 추가 폼 */}
            {showAddForm && (
                <form className="add-member-form" onSubmit={handleAddMember}>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="이름"
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            required
                        />
                        <select
                            value={newMember.position}
                            onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                        >
                            <option value="">포지션 선택</option>
                            <option value="GK">GK (골키퍼)</option>
                            <option value="DF">DF (수비수)</option>
                            <option value="MF">MF (미드필더)</option>
                            <option value="FW">FW (공격수)</option>
                        </select>
                        <input
                            type="number"
                            placeholder="등번호"
                            value={newMember.backNumber}
                            onChange={(e) => setNewMember({ ...newMember, backNumber: e.target.value })}
                            min="1"
                            max="99"
                        />
                        <select
                            value={newMember.role}
                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        >
                            <option value="MEMBER">팀원</option>
                            <option value="CAPTAIN">주장</option>
                            <option value="MANAGER">매니저</option>
                        </select>
                        <button type="submit">추가</button>
                    </div>
                </form>
            )}

            {/* 선수 기록 테이블 */}
            {members.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                    등록된 선수가 없습니다. 선수를 추가해보세요!
                </p>
            ) : (
                <div className="stats-table-wrapper">
                    <table className="player-stats-table">
                        <thead>
                            <tr>
                                <th className="th-rank">순위</th>
                                <th className="th-name">선수</th>
                                <th className="th-position">포지션</th>
                                <th
                                    className={`th-stat sortable ${sortBy === 'goals' ? 'active-sort' : ''}`}
                                    onClick={() => setSortBy('goals')}
                                >
                                    득점
                                </th>
                                <th
                                    className={`th-stat sortable ${sortBy === 'assists' ? 'active-sort' : ''}`}
                                    onClick={() => setSortBy('assists')}
                                >
                                    도움
                                </th>
                                <th
                                    className={`th-stat sortable ${sortBy === 'games' ? 'active-sort' : ''}`}
                                    onClick={() => setSortBy('games')}
                                >
                                    경기
                                </th>
                                <th
                                    className={`th-stat sortable ${sortBy === 'quarters' ? 'active-sort' : ''}`}
                                    onClick={() => setSortBy('quarters')}
                                >
                                    쿼터
                                </th>
                                <th className="th-action">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMembers.map((member, index) => {
                                const career = getCareerStats(member.id);
                                return (
                                    <tr key={member.id}>
                                        <td className="td-rank">{index + 1}</td>
                                        <td className="td-name">
                                            <Link to={`/players/${member.id}`} className="player-link">
                                                <span className="player-name">{member.name}</span>
                                                {member.backNumber && (
                                                    <span className="player-number">#{member.backNumber}</span>
                                                )}
                                            </Link>
                                            {member.role === 'CAPTAIN' && <span className="badge-captain">주장</span>}
                                            {member.role === 'MANAGER' && <span className="badge-manager">매니저</span>}
                                        </td>
                                        <td className="td-position">{member.position || '-'}</td>
                                        <td className="td-stat highlight">{career.goals}</td>
                                        <td className="td-stat">{career.assists}</td>
                                        <td className="td-stat">{career.games}</td>
                                        <td className="td-stat">{career.quarters}</td>
                                        <td className="td-action">
                                            <button
                                                onClick={() => handleDeleteMember(member.id, member.name)}
                                                className="delete-btn-small"
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default MemberList;
