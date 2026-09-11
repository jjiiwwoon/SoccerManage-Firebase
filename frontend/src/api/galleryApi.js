/**
 * ====================================
 * 파일: galleryApi.js (신규)
 * 위치: frontend/src/api/
 * 기능: 갤러리(사진/동영상) 관련 API 호출
 * ====================================
 */

const API_URL = 'http://localhost:8080/api';

// 갤러리 전체 조회 (타입별 필터 가능)
export async function getGalleryItems(type) {
    const url = type ? `${API_URL}/gallery?type=${type}` : `${API_URL}/gallery`;
    const response = await fetch(url);
    return response.json();
}

// 단일 항목 조회
export async function getGalleryItem(id) {
    const response = await fetch(`${API_URL}/gallery/${id}`);
    return response.json();
}

// 사진 업로드
export async function uploadPhoto(file, title) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || '');
    const response = await fetch(`${API_URL}/gallery/photo`, {
        method: 'POST',
        body: formData,
    });
    return response.json();
}

// 동영상 URL 등록
export async function addVideo(url, title) {
    const response = await fetch(`${API_URL}/gallery/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
    });
    return response.json();
}

// 제목 수정
export async function updateGalleryItem(id, title) {
    const response = await fetch(`${API_URL}/gallery/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    return response.json();
}

// 삭제
export async function deleteGalleryItem(id) {
    await fetch(`${API_URL}/gallery/${id}`, { method: 'DELETE' });
}
