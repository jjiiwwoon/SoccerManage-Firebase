/**
 * ====================================
 * 파일: mediaApi.js (수정됨)
 * 위치: frontend/src/api/ (기존 파일 덮어쓰기)
 * 기능: 미디어 갤러리 API 통신 + 파일 업로드
 * ====================================
 *
 * 변경 내용:
 * - uploadMedia() 추가: FormData로 파일을 백엔드에 업로드
 * - createMedia() 유지: 동영상 URL 추가용
 */

const API_URL = 'http://localhost:8080/api';

// 미디어 목록 (전체 또는 타입별)
export async function getMediaList(type) {
    const url = type ? `${API_URL}/media?type=${type}` : `${API_URL}/media`;
    const response = await fetch(url);
    return response.json();
}

// 사진 파일 업로드 (새로 추가)
export async function uploadMedia(file, title, description) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) {
        formData.append('description', description);
    }

    const response = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        body: formData,
        // Content-Type 헤더를 직접 설정하지 않음!
        // FormData를 쓰면 브라우저가 자동으로 multipart/form-data + boundary를 설정해줌
    });
    return response.json();
}

// 동영상 URL 추가 (기존 유지)
export async function createMedia(mediaData) {
    const response = await fetch(`${API_URL}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaData),
    });
    return response.json();
}

// 미디어 삭제
export async function deleteMedia(id) {
    await fetch(`${API_URL}/media/${id}`, { method: 'DELETE' });
}
