/**
 * ====================================
 * 파일: MediaGallery.js (수정됨)
 * 위치: frontend/src/pages/ (기존 파일 덮어쓰기)
 * 기능: 사진/동영상 갤러리 - 파일 업로드 방식
 * ====================================
 *
 * 변경 내용:
 * - 사진: URL 입력 → 컴퓨터에서 파일 선택 업로드로 변경
 * - 동영상: 유튜브 링크 입력은 유지 (동영상은 URL이 맞으니까)
 * - 업로드된 사진은 백엔드 서버에 저장되고 자동으로 URL 생성
 */
import React, { useState, useEffect } from 'react';
import { getMediaList, uploadMedia, createMedia, deleteMedia } from '../api/mediaApi';

function MediaGallery() {
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [uploading, setUploading] = useState(false);

    // 사진 업로드용
    const [photoFile, setPhotoFile] = useState(null);
    const [photoTitle, setPhotoTitle] = useState('');
    const [photoDesc, setPhotoDesc] = useState('');
    const [photoPreview, setPhotoPreview] = useState(null);

    // 동영상 URL 입력용
    const [videoUrl, setVideoUrl] = useState('');
    const [videoTitle, setVideoTitle] = useState('');
    const [videoDesc, setVideoDesc] = useState('');

    // 입력 모드: 'PHOTO' 또는 'VIDEO'
    const [inputMode, setInputMode] = useState('PHOTO');

    useEffect(() => {
        fetchMedia();
    }, [filter]);

    async function fetchMedia() {
        try {
            setLoading(true);
            const type = filter === 'ALL' ? null : filter;
            const data = await getMediaList(type);
            setMediaList(data);
        } catch (err) {
            console.error('미디어 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    }

    // 파일 선택 시 미리보기 생성
    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            // 미리보기 URL 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPhotoFile(null);
            setPhotoPreview(null);
        }
    }

    // 사진 파일 업로드
    async function handleUploadPhoto(e) {
        e.preventDefault();
        if (!photoFile) {
            alert('사진 파일을 선택해주세요.');
            return;
        }
        if (!photoTitle) {
            alert('제목을 입력해주세요.');
            return;
        }
        try {
            setUploading(true);
            await uploadMedia(photoFile, photoTitle, photoDesc);
            // 폼 초기화
            setPhotoFile(null);
            setPhotoTitle('');
            setPhotoDesc('');
            setPhotoPreview(null);
            // 파일 input 초기화
            const fileInput = document.getElementById('photo-file-input');
            if (fileInput) fileInput.value = '';
            fetchMedia();
        } catch (err) {
            alert('사진 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    }

    // 동영상 URL 추가
    async function handleAddVideo(e) {
        e.preventDefault();
        if (!videoUrl) {
            alert('유튜브 링크를 입력해주세요.');
            return;
        }
        if (!videoTitle) {
            alert('제목을 입력해주세요.');
            return;
        }
        try {
            await createMedia({
                title: videoTitle,
                mediaType: 'VIDEO',
                url: videoUrl,
                description: videoDesc,
            });
            setVideoUrl('');
            setVideoTitle('');
            setVideoDesc('');
            fetchMedia();
        } catch (err) {
            alert('동영상 추가에 실패했습니다.');
        }
    }

    async function handleDeleteMedia(id, title) {
        if (window.confirm(`"${title}" 을(를) 삭제하시겠습니까?`)) {
            try {
                await deleteMedia(id);
                fetchMedia();
            } catch (err) {
                alert('삭제에 실패했습니다.');
            }
        }
    }

    // 유튜브 URL에서 영상 ID 추출
    function getYoutubeEmbedUrl(url) {
        if (!url) return null;
        let match = url.match(/[?&]v=([^&]+)/);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
        match = url.match(/youtu\.be\/([^?]+)/);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
        return null;
    }

    if (loading) return <div className="loading">로딩 중...</div>;

    return (
        <div className="media-gallery">
            <h2>갤러리</h2>

            {/* 입력 모드 전환 탭 */}
            <div className="input-mode-tabs">
                <button
                    className={`mode-tab ${inputMode === 'PHOTO' ? 'active' : ''}`}
                    onClick={() => setInputMode('PHOTO')}
                >
                    사진 업로드
                </button>
                <button
                    className={`mode-tab ${inputMode === 'VIDEO' ? 'active' : ''}`}
                    onClick={() => setInputMode('VIDEO')}
                >
                    동영상 추가
                </button>
            </div>

            {/* 사진 업로드 폼 */}
            {inputMode === 'PHOTO' && (
                <form className="upload-form" onSubmit={handleUploadPhoto}>
                    <div className="upload-area">
                        <label htmlFor="photo-file-input" className="file-select-btn">
                            {photoFile ? '다른 사진 선택' : '사진 선택'}
                        </label>
                        <input
                            id="photo-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        {photoFile && (
                            <span className="file-name">{photoFile.name}</span>
                        )}
                    </div>
                    {photoPreview && (
                        <div className="upload-preview">
                            <img src={photoPreview} alt="미리보기" />
                        </div>
                    )}
                    <div className="upload-fields">
                        <input
                            type="text"
                            placeholder="제목"
                            value={photoTitle}
                            onChange={(e) => setPhotoTitle(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="설명 (선택)"
                            value={photoDesc}
                            onChange={(e) => setPhotoDesc(e.target.value)}
                        />
                        <button type="submit" disabled={uploading}>
                            {uploading ? '업로드 중...' : '업로드'}
                        </button>
                    </div>
                </form>
            )}

            {/* 동영상 URL 입력 폼 */}
            {inputMode === 'VIDEO' && (
                <form className="upload-form" onSubmit={handleAddVideo}>
                    <div className="upload-fields">
                        <input
                            type="text"
                            placeholder="제목"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                        />
                        <input
                            type="url"
                            placeholder="유튜브 링크 (https://youtube.com/...)"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            style={{ flex: 2 }}
                        />
                        <input
                            type="text"
                            placeholder="설명 (선택)"
                            value={videoDesc}
                            onChange={(e) => setVideoDesc(e.target.value)}
                        />
                        <button type="submit">추가</button>
                    </div>
                </form>
            )}

            {/* 필터 버튼 */}
            <div className="media-filter">
                <button
                    className={filter === 'ALL' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => setFilter('ALL')}
                >
                    전체
                </button>
                <button
                    className={filter === 'PHOTO' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => setFilter('PHOTO')}
                >
                    사진
                </button>
                <button
                    className={filter === 'VIDEO' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => setFilter('VIDEO')}
                >
                    동영상
                </button>
            </div>

            {/* 미디어 그리드 */}
            {mediaList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                    등록된 미디어가 없습니다. 사진이나 동영상을 추가해보세요!
                </p>
            ) : (
                <div className="media-grid">
                    {mediaList.map((media) => (
                        <div key={media.id} className="media-card">
                            {media.mediaType === 'PHOTO' ? (
                                <div className="media-image">
                                    <img src={media.url} alt={media.title} />
                                </div>
                            ) : (
                                <div className="media-video">
                                    {getYoutubeEmbedUrl(media.url) ? (
                                        <iframe
                                            src={getYoutubeEmbedUrl(media.url)}
                                            title={media.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <a href={media.url} target="_blank" rel="noopener noreferrer" className="video-link">
                                            동영상 보기
                                        </a>
                                    )}
                                </div>
                            )}

                            <div className="media-info">
                                <div className="media-title">{media.title}</div>
                                {media.description && (
                                    <div className="media-desc">{media.description}</div>
                                )}
                                <div className="media-date">{media.uploadDate || ''}</div>
                            </div>
                            <button
                                onClick={() => handleDeleteMedia(media.id, media.title)}
                                className="delete-btn-small"
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MediaGallery;
