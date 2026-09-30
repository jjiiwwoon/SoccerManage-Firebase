/**
 * ====================================
 * 파일: index.js
 * 위치: functions/index.js
 * 기능: 방문자 추적 Cloud Function
 * ====================================
 *
 * 기능 설명:
 * - 프론트엔드에서 페이지 이동 시 호출됨
 * - 접속자의 IP, 지역, 페이지, 기기정보, 유입경로를 Firestore에 저장
 * - geoip-lite로 IP → 지역(도시, 국가) 변환
 * - 월 호출 카운트 관리 (30일 기준 150만 회 제한)
 */
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
// geoip-lite는 함수 안에서 lazy 로드 (초기화 타임아웃 방지)
let geoip = null;
function getGeoip() {
    if (!geoip) geoip = require("geoip-lite");
    return geoip;
}

admin.initializeApp();
const db = admin.firestore();

// ========== 월 호출 제한 설정 ==========
const MONTHLY_LIMIT = 1500000; // 150만 회

/**
 * 이번 달 호출 횟수를 가져오고 +1 증가시킴
 * @returns {number} 현재 호출 횟수 (증가 전)
 */
async function getAndIncrementMonthlyCount() {
    const now = new Date();
    // "2026-09" 형식으로 월별 키 생성
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const countRef = db.collection("meta").doc("monthlyCount");

    const docSnap = await countRef.get();
    const data = docSnap.exists ? docSnap.data() : {};

    // 월이 바뀌었으면 리셋
    if (data.monthKey !== monthKey) {
        await countRef.set({ monthKey, count: 1 });
        return 0;
    }

    const currentCount = data.count || 0;
    await countRef.update({ count: admin.firestore.FieldValue.increment(1) });
    return currentCount;
}

// ========== 메인 Cloud Function ==========
exports.trackVisitor = onRequest({ cors: true, region: "asia-northeast3" }, async (req, res) => {
    try {
        // 1. 월 호출 제한 체크
        const currentCount = await getAndIncrementMonthlyCount();
        if (currentCount >= MONTHLY_LIMIT) {
            res.status(200).json({ success: false, reason: "monthly_limit_reached" });
            return;
        }

        // 2. IP 추출 (Cloud Functions에서는 x-forwarded-for 헤더 사용)
        const ip = req.headers["x-forwarded-for"]
            ? req.headers["x-forwarded-for"].split(",")[0].trim()
            : req.ip || "unknown";

        // 3. geoip-lite로 지역 정보 변환
        const geo = getGeoip().lookup(ip);
        const location = geo
            ? { city: geo.city || "Unknown", country: geo.country || "Unknown", region: geo.region || "" }
            : { city: "Unknown", country: "Unknown", region: "" };

        // 4. 요청 바디에서 페이지, 유입경로 추출
        const { page, referrer } = req.body || {};

        // 5. User-Agent에서 기기/브라우저 정보 추출
        const userAgent = req.headers["user-agent"] || "Unknown";
        const device = parseUserAgent(userAgent);

        // 6. Firestore에 저장
        await db.collection("visitors").add({
            ip,
            location,
            page: page || "/",
            device,
            referrer: referrer || "직접 접속",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("trackVisitor error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== 월별 호출 수 조회 (관리자 페이지용) ==========
exports.getMonthlyCount = onRequest({ cors: true, region: "asia-northeast3" }, async (req, res) => {
    try {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const countRef = db.collection("meta").doc("monthlyCount");

        const docSnap = await countRef.get();
        const data = docSnap.exists ? docSnap.data() : {};

        res.status(200).json({
            monthKey,
            count: data.monthKey === monthKey ? (data.count || 0) : 0,
            limit: MONTHLY_LIMIT,
        });
    } catch (error) {
        console.error("getMonthlyCount error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ========== User-Agent 파싱 ==========
function parseUserAgent(ua) {
    let browser = "기타";
    let os = "기타";

    // 브라우저 판별
    if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/")) browser = "Chrome";
    else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("MSIE") || ua.includes("Trident/")) browser = "IE";

    // OS 판별
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "Mac";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return `${browser} / ${os}`;
}
