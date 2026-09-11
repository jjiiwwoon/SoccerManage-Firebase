/**
 * ====================================
 * 파일: teamInfoApi.js (신규)
 * 위치: frontend/src/api/
 * 기능: 팀 정보 관련 API 호출
 * ====================================
 */

const API_URL = 'http://localhost:8080/api';

// 팀 정보 조회
export async function getTeamInfo() {
    const response = await fetch(`${API_URL}/team-info`);
    return response.json();
}

// 팀 정보 수정 (이름, 소개, 링크)
export async function updateTeamInfo(data) {
    const response = await fetch(`${API_URL}/team-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

// 팀 사진 업로드
export async function uploadTeamPhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/team-info/photo`, {
        method: 'POST',
        body: formData,
    });
    return response.json();
}

// 팀 사진 삭제
export async function deleteTeamPhoto() {
    await fetch(`${API_URL}/team-info/photo`, { method: 'DELETE' });
}
