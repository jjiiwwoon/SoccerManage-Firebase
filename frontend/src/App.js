/**
 * ====================================
 * 파일: App.js (수정됨)
 * 위치: frontend/src/App.js
 * 기능: 라우팅 + 네비게이션
 * ====================================
 *
 * 변경사항:
 * - 갤러리 페이지 라우트 추가 (/gallery)
 * - 네비게이션에 갤러리 탭 추가
 */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

import Home from './pages/Home';
import TeamRecords from './pages/TeamRecords';
import PlayerStats from './pages/PlayerStats';
import Squad from './pages/Squad';
import Schedule from './pages/Schedule';
import Gallery from './pages/Gallery';

/* 네비게이션 컴포넌트 (useLocation 사용을 위해 분리) */
function Navigation() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'HOME' },
        { path: '/team-records', label: '팀기록' },
        { path: '/player-stats', label: '개인기록' },
        { path: '/squad', label: '스쿼드' },
        { path: '/schedule', label: '일정' },
        { path: '/gallery', label: '갤러리' },
    ];

    return (
        <nav className="main-nav">
            <div className="nav-inner">
                <Link to="/" className="nav-brand">
                    <span className="brand-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                    </span>
                    <span className="brand-text">창우FC</span>
                </Link>

                <button
                    className="mobile-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>

                <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}

function App() {
    return (
        <Router>
            <div className="App">
                <Navigation />

                <div className="content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/team-records" element={<TeamRecords />} />
                        <Route path="/player-stats" element={<PlayerStats />} />
                        <Route path="/squad" element={<Squad />} />
                        <Route path="/schedule" element={<Schedule />} />
                        <Route path="/gallery" element={<Gallery />} />
                    </Routes>
                </div>

                <footer className="main-footer">
                    <p>© 2024 창우FC. All rights reserved.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
