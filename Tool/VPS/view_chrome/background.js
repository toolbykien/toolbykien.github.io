// Cấu hình Firebase để kết nối với cơ sở dữ liệu Firestore
const config = {
    apiKey: "AIzaSyClgrlU3cOTayqLSHLvkQI1W1LtrJWHtUQ",
    projectId: "view-v1-af0a0"
};

// --- CẤU HÌNH THỜI GIAN AUTO NEXT YT (Dễ dàng chỉnh sửa tại đây) ---
// Tính năng: Xác định khoảng thời gian ngẫu nhiên để hệ thống tự động tìm và click vào một video khác khi đang xem YouTube.
const MIN_WAIT_SECONDS = 60 * 0.5; // Thời gian chờ tối thiểu (5 phút)
const MAX_WAIT_SECONDS = 60 * 1; // Thời gian chờ tối đa (20 phút)
// ---------------------------------------------------------------

// Các biến toàn cục quản lý định danh thiết bị, phiên làm việc và trạng thái tính năng
const appId = "extension-remote-control";
let deviceId = null;
let startTime = null;
let lastProcessedTime = 0; 
let idToken = null;
let cachedIP = "0.0.0.0";
let isAutoClickEnabled = false; // Trạng thái bật/tắt tính năng tự động chuyển video YouTube
let autoClickTimer = null; // Biến lưu trữ bộ hẹn giờ để có thể hủy khi cần

// Hàm lấy hoặc khởi tạo dữ liệu định danh thiết bị (deviceId) lưu trữ trong trình duyệt
async function getPersistentData() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['deviceId', 'startTime', 'lastProcessedTime'], (result) => {
            let data = { ...result };
            let changed = false;
            if (!result.deviceId) {
                data.deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
                changed = true;
            }
            if (!result.startTime) {
                data.startTime = new Date().toISOString();
                changed = true;
            }
            if (changed) chrome.storage.local.set(data, () => resolve(data));
            else resolve(data);
        });
    });
}

// Hàm đăng nhập ẩn danh vào Firebase để lấy token xác thực (idToken) qua REST API
async function signInAnonymous() {
    try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ returnSecureToken: true })
        });
        const data = await resp.json();
        if (data.idToken) {
            idToken = data.idToken;
            return true;
        }
        return false;
    } catch (e) { return false; }
}

// Hàm lấy địa chỉ IP công cộng của thiết bị từ dịch vụ ipify
async function fetchInitialIP() {
    try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const data = await resp.json();
        cachedIP = data.ip;
    } catch (e) { }
}

// Hàm hỗ trợ chuyển đổi số giây sang định dạng thời gian hh:mm:ss hoặc mm:ss
function formatSeconds(s) {
    if (isNaN(s)) return "00:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = Math.floor(s % 60);
    return (h > 0 ? h + ":" : "") + String(m).padStart(2, '0') + ":" + String(sc).padStart(2, '0');
}

// Hàm tiêm (inject) script vào trang web để thực hiện tính năng tự động lướt (cuộn trang)
async function injectAutoScroll(tabId) {
    try {
        const tab = await chrome.tabs.get(tabId).catch(() => null);
        if (!tab || !tab.url || !tab.url.startsWith('http')) return;

        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                if (window.isAutoScrolling) return;
                window.isAutoScrolling = true;

                let dir = 1; 
                const scrollTask = () => {
                    if (!window.isAutoScrolling) return;

                    // Lấy chiều cao thực tế của trang
                    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
                    const currentPos = window.innerHeight + window.scrollY;

                    // Đổi chiều khi chạm biên
                    if (currentPos >= scrollHeight - 15) dir = -1;
                    if (window.scrollY <= 15) dir = 1;

                    // Đổi chiều ngẫu nhiên 1% cơ hội mỗi bước để tự nhiên hơn
                    if (Math.random() < 0.01) dir *= -1;

                    // Tốc độ ngẫu nhiên từ 50-200px
                    const speed = (Math.random() * 150) + 50; // Tốc độ lướt mượt mà hơn
                    window.scrollBy({ top: speed * dir, behavior: 'auto' });

                    // Delay ngẫu nhiên từ 1000-6000ms
                    setTimeout(scrollTask, Math.floor(Math.random() * 5000) + 1000);
                };
                scrollTask();
            }
        }).catch(() => {});
    } catch (e) {}
}

// Hàm thiết lập thời gian và thực hiện click vào video ngẫu nhiên khi đang ở YouTube
async function scheduleRandomYouTubeClick() {
    if (autoClickTimer) clearTimeout(autoClickTimer);
    if (!isAutoClickEnabled) return;

    // Tính toán thời gian ngẫu nhiên dựa trên cấu hình ở đầu file
    const randomTime = Math.floor(Math.random() * (MAX_WAIT_SECONDS - MIN_WAIT_SECONDS + 1) + MIN_WAIT_SECONDS) * 1000;
    
    autoClickTimer = setTimeout(async () => {
        if (!isAutoClickEnabled) return;

        // Tìm kiếm tất cả các tab đang mở YouTube video
        chrome.tabs.query({ url: "*://*.youtube.com/watch*" }, async (tabs) => {
            const targetTab = tabs.find(t => t.active) || tabs[0];
            
            if (targetTab) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: targetTab.id },
                        func: () => {
                            // Danh sách các bộ chọn video gợi ý hoặc nút Next của YouTube
                            const selectors = [
                                'ytd-compact-video-renderer a#thumbnail',
                                'ytd-rich-item-renderer a#video-title-link',
                                'ytd-watch-next-secondary-results-renderer a#thumbnail',
                                '.ytp-next-button'
                            ];
                            
                            const recommendations = Array.from(document.querySelectorAll(selectors.join(',')));
                            const validLinks = recommendations.filter(el => el.href && el.href.includes('watch'));
                            
                            if (validLinks.length > 0) {
                                const randomVideo = validLinks[Math.floor(Math.random() * validLinks.length)];
                                randomVideo.click(); // Giả lập click chuột
                                // Dự phòng bằng cách ép trình duyệt chuyển URL nếu lệnh click bị chặn
                                setTimeout(() => {
                                    if (window.location.href !== randomVideo.href) {
                                        window.location.href = randomVideo.href;
                                    }
                                }, 1000);
                            }
                        }
                    });
                } catch (e) {}
            }
            // Tự động lên lịch cho lần chuyển video kế tiếp
            scheduleRandomYouTubeClick();
        });
    }, randomTime);
}

// Hàm lấy thông tin tiêu đề tab hiện tại và tiến trình video nếu đang xem YouTube
async function getActiveTabStatus() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true }, async (tabs) => {
            if (tabs && tabs[0]) {
                const tab = tabs[0];
                let videoTime = null;

                if (tab.url && tab.url.startsWith('http') && tab.url.includes("youtube.com/watch")) {
                    try {
                        const results = await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: () => {
                                const v = document.querySelector('video');
                                if (v) return { curr: v.currentTime, dur: v.duration };
                                return null;
                            }
                        });
                        if (results && results[0].result) {
                            const { curr, dur } = results[0].result;
                            videoTime = `${formatSeconds(curr)} / ${formatSeconds(dur)}`;
                        }
                    } catch (e) { }
                }

                resolve({
                    title: tab.title || "Không có tiêu đề",
                    videoTime: videoTime
                });
            } else {
                resolve({ title: "Đang ẩn trình duyệt", videoTime: null });
            }
        });
    });
}

// Hàm gửi tín hiệu "nhịp tim" (heartbeat) để cập nhật trạng thái thiết bị lên Dashboard định kỳ
async function sendHeartbeat(status = "online") {
    if (!deviceId || !startTime) return;
    if (!idToken && !(await signInAnonymous())) return;

    const tabStatus = await getActiveTabStatus();

    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/artifacts/${appId}/public/data/devices/${deviceId}?updateMask.fieldPaths=status&updateMask.fieldPaths=ip&updateMask.fieldPaths=lastSeen&updateMask.fieldPaths=id&updateMask.fieldPaths=startTime&updateMask.fieldPaths=activeTitle&updateMask.fieldPaths=videoTime`;
    
    const body = {
        fields: {
            id: { stringValue: deviceId },
            status: { stringValue: status },
            ip: { stringValue: cachedIP },
            lastSeen: { timestampValue: new Date().toISOString() },
            startTime: { timestampValue: startTime },
            activeTitle: { stringValue: tabStatus.title },
            videoTime: { stringValue: tabStatus.videoTime || "" }
        }
    };

    try {
        const resp = await fetch(url, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (resp.status === 401) idToken = null; 
    } catch (e) { idToken = null; }
}

// Hàm kiểm tra lệnh từ Dashboard (mở URL mới hoặc bật/tắt Auto Next YT)
async function checkCommands() {
    if (!idToken || !deviceId) return;
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/artifacts/${appId}/public/data/devices/${deviceId}`;
    try {
        const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${idToken}` } });
        if (!resp.ok) return;
        const data = await resp.json();

        // Kiểm tra và cập nhật trạng thái bật/tắt tính năng Auto Next YT từ server
        const newAutoClickState = data.fields?.autoClickYT?.booleanValue || false;
        if (newAutoClickState !== isAutoClickEnabled) {
            isAutoClickEnabled = newAutoClickState;
            if (isAutoClickEnabled) scheduleRandomYouTubeClick();
            else if (autoClickTimer) {
                clearTimeout(autoClickTimer);
                autoClickTimer = null;
            }
        }

        // Kiểm tra nếu có lệnh mở URL mới dựa trên mốc thời gian (commandTime)
        if (data.fields && data.fields.targetUrl && data.fields.commandTime) {
            const targetUrl = data.fields.targetUrl.stringValue;
            const commandTime = Number(data.fields.commandTime.integerValue || data.fields.commandTime.doubleValue || 0);
            if (commandTime > lastProcessedTime) {
                lastProcessedTime = commandTime;
                chrome.storage.local.set({ lastProcessedTime: commandTime });
                
                chrome.tabs.query({ active: true }, (tabs) => {
                    if (tabs && tabs[0]) {
                        chrome.tabs.update(tabs[0].id, { url: targetUrl });
                        setTimeout(() => injectAutoScroll(tabs[0].id), 3000);
                    } else {
                        chrome.tabs.create({ url: targetUrl });
                    }
                });
            }
        }
    } catch (e) { }
}

// Trình lắng nghe sự kiện: Kích hoạt tự động cuộn hoặc click YouTube mỗi khi trang được tải xong
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active && tab.url && tab.url.startsWith('http')) {
        setTimeout(() => injectAutoScroll(tabId), 4000);
        if (tab.url.includes("youtube.com/watch") && isAutoClickEnabled && !autoClickTimer) {
            scheduleRandomYouTubeClick();
        }
    }
});

// Sử dụng cơ chế Alarm của Chrome để duy trì kết nối khi Extension chạy ngầm
if (chrome.alarms) {
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'heartbeat_alarm') {
            sendHeartbeat("online");
            checkCommands();
        }
    });
}

// Hàm khởi chạy chính: Thiết lập dữ liệu, đăng nhập và bắt đầu các vòng lặp đồng bộ
async function main() {
    const data = await getPersistentData();
    deviceId = data.deviceId;
    startTime = data.startTime;
    lastProcessedTime = data.lastProcessedTime || 0;
    await fetchInitialIP();
    await signInAnonymous();
    await sendHeartbeat("online");
    // Tạo alarm chạy mỗi phút một lần
    if (chrome.alarms) chrome.alarms.create('heartbeat_alarm', { periodInMinutes: 1 });
    // Thiết lập các khoảng thời gian đồng bộ dự phòng
    setInterval(() => sendHeartbeat("online"), 45000);
    setInterval(checkCommands, 10000);
}
main();