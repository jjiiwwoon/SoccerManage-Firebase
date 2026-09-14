/**
 * ====================================
 * 파일: MatchFormModal.js
 * 위치: frontend/src/components/
 * 기능: 일정 등록/수정 모달 컴포넌트
 * ====================================
 */
import React from 'react';

function MatchFormModal({
    editingMatchId,
    newSchedule,
    setNewSchedule,
    dateYear,
    dateMonth,
    dateDay,
    onDateSelectChange,
    onSyncDateSelects,
    getDaysInMonthForSelect,
    onSubmit,
    onClose,
}) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={onSubmit}>
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
                                            onSyncDateSelects(e.target.value);
                                        }}
                                        title="달력에서 선택"
                                    />
                                </span>
                            </label>
                            <div className="date-picker-row">
                                <select
                                    className="form-input date-select"
                                    value={dateYear}
                                    onChange={(e) => onDateSelectChange(e.target.value, dateMonth, dateDay)}
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
                                    onChange={(e) => onDateSelectChange(dateYear, e.target.value, dateDay)}
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
                                    onChange={(e) => onDateSelectChange(dateYear, dateMonth, e.target.value)}
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
                            onClick={onClose}
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
    );
}

export default MatchFormModal;
