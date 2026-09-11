/**
 * ====================================
 * 파일: memberApi.js (수정됨)
 * 위치: frontend/src/api/ (기존 파일 덮어쓰기)
 * ====================================
 *
 * 변경사항:
 * - createMemberWithPhoto() 추가 (FormData 방식)
 * - uploadMemberPhoto() 추가
 * - deleteMemberPhoto() 추가
 */

const API_URL = 'http://localhost:8080/api';

// 전체 멤버 목록
export async function getMembers() {
    const response = await fetch(`${API_URL}/members`);
    return response.json();
}

// 특정 멤버 조회
export async function getMember(id) {
    const response = await fetch(`${API_URL}/members/${id}`);
    return response.json();
}

// 멤버 추가 (JSON)
export async function createMember(memberData) {
    const response = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
    });
    return response.json();
}

// 멤버 추가 (사진 포함, FormData)
export async function createMemberWithPhoto(name, backNumber, position, role, photoFile) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('backNumber', backNumber);
    formData.append('position', position);
    formData.append('role', role || 'MEMBER');
    if (photoFile) {
        formData.append('photo', photoFile);
    }
    const response = await fetch(`${API_URL}/members/with-photo`, {
        method: 'POST',
        body: formData,
    });
    return response.json();
}

// 멤버 수정 (JSON)
export async function updateMember(id, memberData) {
    const response = await fetch(`${API_URL}/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
    });
    return response.json();
}

// 멤버 수정 (사진 포함, FormData)
export async function updateMemberWithPhoto(id, name, backNumber, position, photoFile, removePhoto) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('backNumber', backNumber);
    formData.append('position', position);
    formData.append('removePhoto', removePhoto ? 'true' : 'false');
    if (photoFile) {
        formData.append('photo', photoFile);
    }
    const response = await fetch(`${API_URL}/members/${id}/with-photo`, {
        method: 'PUT',
        body: formData,
    });
    return response.json();
}

// 프로필 사진 업로드
export async function uploadMemberPhoto(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/members/${id}/photo`, {
        method: 'POST',
        body: formData,
    });
    return response.json();
}

// 프로필 사진 삭제
export async function deleteMemberPhoto(id) {
    const response = await fetch(`${API_URL}/members/${id}/photo`, {
        method: 'DELETE',
    });
    return response.json();
}

// 멤버 삭제
export async function deleteMember(id) {
    await fetch(`${API_URL}/members/${id}`, { method: 'DELETE' });
}

// 특정 선수의 모든 스탯 조회
export async function getMemberStats(memberId) {
    const response = await fetch(`${API_URL}/members/${memberId}/stats`);
    return response.json();
}
