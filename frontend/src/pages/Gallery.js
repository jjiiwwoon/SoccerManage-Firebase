/**
 * ====================================
 * 파일: Gallery.js (신규)
 * 위치: frontend/src/pages/Gallery.js
 * 기능: 사진/동영상 갤러리 페이지
 * ====================================
 *
 * 기능:
 * 1. 사진 업로드 (파일 선택 → 서버 저장)
 * 2. 동영상 URL 등록 (YouTube 등)
 * 3. 그리드 뷰로 표시
 * 4. 클릭하면 확대/상세 보기 (라이트박스)
 * 5. 필터: 전체 / 사진 / 동영상
 * 6. 삭제 기능
 */
import React, { useState, useEffect } from 'react';
import {
    getGalleryItems, uploadPhoto, addVideo, deleteGalleryItem
} from '../api/galleryApi';

function Gallery() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PHOTO, VIDEO
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showLightbox, setShowLightbox] = useState(null); // 클릭한 항목
    const [uploading, setUploading] = useState(false);

    // 사진 업로드 폼
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoTitle, setPhotoTitle] = useState('');

    // 동영상 등록 폼
    const [videoUrl, setVideoUrl] = useState('');
    const [videoTitle, setVideoTitle] = useState('');

    useEffect(() => {
        fetchItems();
    }, [filter]);

    async function fetchItems() {
        try {
            setLoading(true);
            const type = filter === 'ALL' ? null : filter;
            const data = await getGalleryItems(type);
            setItems(data);
        } catch (err) {
            console.error('갤러리 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    }

    // 사진 업로드 처리
    async function handlePhotoUpload(e) {
        e.preventDefault();
        if (photoFiles.length === 0) return;

        setUploading(true);
        try {
            for (const file of photoFiles) {
                await uploadPhoto(file, photoTitle);
            }
            setShowUploadModal(false);
            setPhotoFiles([]);
            setPhotoTitle('');
            fetchItems();
        } catch (err) {
            console.error('업로드 실패:', err);
            alert('업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    }

    // 동영상 등록 처리
    async function handleVideoSubmit(e) {
        e.preventDefault();
        if (!videoUrl.trim()) return;

        try {
            await addVideo(videoUrl, videoTitle);
            setShowVideoModal(false);
            setVideoUrl('');
            setVideoTitle('');
            fetchItems();
        } catch (err) {
            console.error('동영상 등록 실패:', err);
            alert('등록에 실패했습니다.');
        }
    }

    // 삭제
    async function handleDelete(id) {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteGalleryItem(id);
            setShowLightbox(null);
            fetchItems();
        } catch (err) {
            console.error('삭제 실패:', err);
        }
    }

    // YouTube URL에서 비디오 ID 추출
    function getYouTubeId(url) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    // 날짜 포맷
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    }

    return (
        <div className="gallery-page">
            {/* 헤더 */}
            <div className="page-header">
                <h1 className="page-title">갤러리</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn btn-gold"
                        onClick={() => setShowUploadModal(true)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'4px',verticalAlign:'middle'}}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        사진 올리기
                    </button>
                    <button
                        className="btn btn-dark"
                        onClick={() => setShowVideoModal(true)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'4px',verticalAlign:'middle'}}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                        동영상 추가
                    </button>
                </div>
            </div>

            {/* 필터 탭 */}
            <div className="filter-tabs">
                {['ALL', 'PHOTO', 'VIDEO'].map(f => (
                    <button
                        key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'ALL' ? '전체' : f === 'PHOTO' ? '사진' : '동영상'}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>
                    총 {items.length}개
                </span>
            </div>

            {/* 갤러리 그리드 */}
            {loading ? (
                <div className="loading">로딩 중...</div>
            ) : items.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                        아직 등록된 {filter === 'ALL' ? '사진/동영상이' : filter === 'PHOTO' ? '사진이' : '동영상이'} 없습니다.
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                        위 버튼을 눌러 추가해보세요!
                    </p>
                </div>
            ) : (
                <div className="gallery-grid">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className="gallery-item"
                            onClick={() => setShowLightbox(item)}
                        >
                            {item.type === 'PHOTO' ? (
                                <img
                                    src={item.fileData}
                                    alt={item.title || '사진'}
                                    className="gallery-thumb"
                                />
                            ) : (
                                <div className="gallery-video-thumb">
                                    {getYouTubeId(item.fileData) ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${getYouTubeId(item.fileData)}/hqdefault.jpg`}
                                            alt={item.title || '동영상'}
                                            className="gallery-thumb"
                                        />
                                    ) : (
                                        <div className="gallery-thumb gallery-video-placeholder">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                        </div>
                                    )}
                                    <div className="gallery-play-icon">▶</div>
                                </div>
                            )}
                            <div className="gallery-item-info">
                                <span className="gallery-item-title">
                                    {item.title || (item.type === 'PHOTO' ? '사진' : '동영상')}
                                </span>
                                <span className="gallery-item-date">
                                    {formatDate(item.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== 사진 업로드 모달 ===== */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="form-title">사진 올리기</div>
                        <form onSubmit={handlePhotoUpload}>
                            <div className="form-group">
                                <label className="form-label">사진 선택 (여러 장 가능)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={e => setPhotoFiles(Array.from(e.target.files))}
                                    className="form-input"
                                    required
                                />
                                {photoFiles.length > 0 && (
                                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                                        {photoFiles.length}개 파일 선택됨
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">제목 / 설명 (선택)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="예: 2024 시즌 개막전"
                                    value={photoTitle}
                                    onChange={e => setPhotoTitle(e.target.value)}
                                />
                            </div>

                            {/* 미리보기 */}
                            {photoFiles.length > 0 && (
                                <div className="photo-preview-grid">
                                    {photoFiles.map((file, idx) => (
                                        <img
                                            key={idx}
                                            src={URL.createObjectURL(file)}
                                            alt={`미리보기 ${idx + 1}`}
                                            className="photo-preview-thumb"
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowUploadModal(false)}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-gold"
                                    disabled={uploading}
                                >
                                    {uploading ? '업로드 중...' : '업로드'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== 동영상 등록 모달 ===== */}
            {showVideoModal && (
                <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="form-title">동영상 추가</div>
                        <form onSubmit={handleVideoSubmit}>
                            <div className="form-group">
                                <label className="form-label">동영상 URL</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={videoUrl}
                                    onChange={e => setVideoUrl(e.target.value)}
                                    required
                                />
                                <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    YouTube, 네이버TV 등 동영상 링크를 입력하세요
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">제목 (선택)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="예: 하이라이트 영상"
                                    value={videoTitle}
                                    onChange={e => setVideoTitle(e.target.value)}
                                />
                            </div>
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowVideoModal(false)}
                                >
                                    취소
                                </button>
                                <button type="submit" className="btn btn-gold">
                                    등록
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== 라이트박스 (확대 보기) ===== */}
            {showLightbox && (
                <div className="lightbox-overlay" onClick={() => setShowLightbox(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button
                            className="lightbox-close"
                            onClick={() => setShowLightbox(null)}
                        >
                            ✕
                        </button>

                        {showLightbox.type === 'PHOTO' ? (
                            <img
                                src={showLightbox.fileData}
                                alt={showLightbox.title || '사진'}
                                className="lightbox-image"
                            />
                        ) : (
                            <div className="lightbox-video">
                                {getYouTubeId(showLightbox.fileData) ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeId(showLightbox.fileData)}`}
                                        title={showLightbox.title || '동영상'}
                                        className="lightbox-iframe"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <p style={{ marginBottom: '16px' }}>외부 동영상 링크:</p>
                                        <a
                                            href={showLightbox.fileData}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-gold"
                                        >
                                            동영상 보기 →
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="lightbox-info">
                            <div className="lightbox-title">
                                {showLightbox.title || (showLightbox.type === 'PHOTO' ? '사진' : '동영상')}
                            </div>
                            <div className="lightbox-meta">
                                <span>{formatDate(showLightbox.createdAt)}</span>
                                <button
                                    className="btn btn-sm btn-outline"
                                    style={{ color: 'var(--color-fw)' }}
                                    onClick={() => handleDelete(showLightbox.id)}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Gallery;
