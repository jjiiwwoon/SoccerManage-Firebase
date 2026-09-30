/**
 * ====================================
 * 파일: AdminVisitors.jsx (새 파일)
 * 위치: frontend/src/pages/AdminVisitors.jsx
 * 기능: 숨겨진 관리자 방문자 통계 대시보드
 * ====================================
 *
 * 접속 URL: /cwfc-admin-2026
 * - 네비게이션에 표시 안 됨
 * - 직접 URL 입력해야만 접속 가능
 *
 * 표시 내용:
 * - 요약 카드 (오늘/이번주/전체 방문자, 고유 IP)
 * - 서버 호출 게이지 바 (150만 회 기준)
 * - 방문 기록 테이블 (IP, 지역, 페이지, 시간, 기기, 유입경로)
 * - 날짜 필터 (오늘/이번주/이번달/전체)
 */
import React, { useState, useEffect } from 'react';
import { getVisitors, getMonthlyUsage, calculateStats } from '../api/visitorApi';

// ========== 스타일 ==========
const styles = {
    container: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: '30px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        flexWrap: 'wrap',
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: '#1a1a2e',
        margin: 0,
    },
    subtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    filterGroup: {
        display: 'flex',
        gap: 8,
    },
    filterBtn: (active) => ({
        padding: '8px 16px',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        background: active ? '#1a1a2e' : '#f0f0f5',
        color: active ? '#fff' : '#555',
        transition: 'all 0.2s',
    }),

    // 요약 카드
    cardsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
    },
    card: {
        background: '#fff',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
    },
    cardLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 6,
    },
    cardValue: {
        fontSize: 28,
        fontWeight: 700,
        color: '#1a1a2e',
    },

    // 서버 호출 게이지
    gaugeContainer: {
        background: '#fff',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        marginBottom: 24,
    },
    gaugeHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    gaugeLabel: {
        fontSize: 14,
        fontWeight: 600,
        color: '#1a1a2e',
    },
    gaugeCount: {
        fontSize: 13,
        color: '#888',
    },
    gaugeBarBg: {
        height: 12,
        borderRadius: 6,
        background: '#f0f0f5',
        overflow: 'hidden',
    },
    gaugeBarFill: (percent) => ({
        height: '100%',
        borderRadius: 6,
        width: `${Math.min(percent, 100)}%`,
        background: percent > 80 ? '#e74c3c' : percent > 50 ? '#f39c12' : '#2ecc71',
        transition: 'width 0.5s ease',
    }),

    // 테이블
    tableContainer: {
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        overflow: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 13,
    },
    th: {
        textAlign: 'left',
        padding: '14px 16px',
        background: '#fafafa',
        color: '#666',
        fontWeight: 600,
        borderBottom: '1px solid #eee',
        whiteSpace: 'nowrap',
    },
    td: {
        padding: '12px 16px',
        borderBottom: '1px solid #f5f5f5',
        color: '#333',
    },
    emptyRow: {
        textAlign: 'center',
        padding: 40,
        color: '#aaa',
    },
    loading: {
        textAlign: 'center',
        padding: 60,
        color: '#888',
        fontSize: 15,
    },
    badge: (color) => ({
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: color === 'blue' ? '#e8f0fe' : '#f0fde8',
        color: color === 'blue' ? '#1a73e8' : '#2e7d32',
    }),
};

// ========== 메인 컴포넌트 ==========
function AdminVisitors() {
    const [visitors, setVisitors] = useState([]);
    const [allVisitors, setAllVisitors] = useState([]);
    const [usage, setUsage] = useState({ count: 0, limit: 1500000 });
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    // 데이터 로드
    useEffect(() => {
        loadData();
    }, []);

    // 필터 변경 시 데이터 재조회
    useEffect(() => {
        loadVisitors();
    }, [filter]);

    async function loadData() {
        setLoading(true);
        try {
            const [visitorsData, usageData, allData] = await Promise.all([
                getVisitors(filter),
                getMonthlyUsage(),
                getVisitors('all'),
            ]);
            setVisitors(visitorsData);
            setAllVisitors(allData);
            setUsage(usageData);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadVisitors() {
        try {
            const data = await getVisitors(filter);
            setVisitors(data);
        } catch (error) {
            console.error('방문자 조회 실패:', error);
        }
    }

    const stats = calculateStats(allVisitors);
    const usagePercent = usage.limit > 0 ? (usage.count / usage.limit) * 100 : 0;

    if (loading) {
        return <div style={styles.loading}>데이터를 불러오는 중...</div>;
    }

    return (
        <div style={styles.container}>
            {/* 헤더 */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>방문자 분석</h1>
                    <p style={styles.subtitle}>이 페이지는 관리자 전용입니다</p>
                </div>
                <div style={styles.filterGroup}>
                    {[
                        { key: 'today', label: '오늘' },
                        { key: 'week', label: '이번 주' },
                        { key: 'month', label: '이번 달' },
                        { key: 'all', label: '전체' },
                    ].map(f => (
                        <button
                            key={f.key}
                            style={styles.filterBtn(filter === f.key)}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 요약 카드 */}
            <div style={styles.cardsRow}>
                <div style={styles.card}>
                    <div style={styles.cardLabel}>오늘 방문</div>
                    <div style={styles.cardValue}>{stats.todayCount}</div>
                </div>
                <div style={styles.card}>
                    <div style={styles.cardLabel}>이번 주 방문</div>
                    <div style={styles.cardValue}>{stats.weekCount}</div>
                </div>
                <div style={styles.card}>
                    <div style={styles.cardLabel}>전체 방문</div>
                    <div style={styles.cardValue}>{stats.totalCount}</div>
                </div>
                <div style={styles.card}>
                    <div style={styles.cardLabel}>고유 방문자 (IP)</div>
                    <div style={styles.cardValue}>{stats.uniqueIPs}</div>
                </div>
            </div>

            {/* 서버 호출 게이지 */}
            <div style={styles.gaugeContainer}>
                <div style={styles.gaugeHeader}>
                    <span style={styles.gaugeLabel}>
                        이번 달 서버 호출 ({usage.monthKey || '-'})
                    </span>
                    <span style={styles.gaugeCount}>
                        {(usage.count || 0).toLocaleString()} / {(usage.limit || 1500000).toLocaleString()}
                        {' '}({usagePercent.toFixed(2)}%)
                    </span>
                </div>
                <div style={styles.gaugeBarBg}>
                    <div style={styles.gaugeBarFill(usagePercent)} />
                </div>
            </div>

            {/* 방문 기록 테이블 */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>IP</th>
                            <th style={styles.th}>지역</th>
                            <th style={styles.th}>페이지</th>
                            <th style={styles.th}>접속 시간</th>
                            <th style={styles.th}>기기 / 브라우저</th>
                            <th style={styles.th}>유입 경로</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visitors.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={styles.emptyRow}>
                                    방문 기록이 없습니다
                                </td>
                            </tr>
                        ) : (
                            visitors.map((v) => (
                                <tr key={v.id}>
                                    <td style={styles.td}>
                                        <code style={{ fontSize: 12 }}>{v.ip}</code>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.badge('blue')}>
                                            {v.location
                                                ? `${v.location.city}, ${v.location.country}`
                                                : 'Unknown'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.badge('green')}>{v.page}</span>
                                    </td>
                                    <td style={styles.td}>{v.timestamp}</td>
                                    <td style={styles.td}>{v.device || '-'}</td>
                                    <td style={styles.td}>
                                        {v.referrer && v.referrer !== '직접 접속'
                                            ? <a href={v.referrer} target="_blank" rel="noreferrer"
                                                style={{ color: '#1a73e8', textDecoration: 'none' }}>
                                                {new URL(v.referrer).hostname}
                                              </a>
                                            : '직접 접속'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminVisitors;
