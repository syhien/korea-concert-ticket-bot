async function sleep(t) {
    return await new Promise(resolve => setTimeout(resolve, t));
}

function theFrame() {
    if (window._theFrameInstance == null) {
      window._theFrameInstance = document.getElementById('oneStopFrame').contentWindow;
    }
  
    return window._theFrameInstance;
}

function getConcertId() {
    return document.getElementById("prodId").value;
}

function openEverySection() {
    let frame = theFrame();
    let section = frame.document.getElementsByClassName("seat_name");
    // console.log(section);
    for (let i = 0; i < section.length; i++) {
        section[i].parentElement.click();
    }
}

function clickOnArea(area) {
    let frame = theFrame();
    let section = frame.document.getElementsByClassName("area_tit");
    for (let i = 0; i < section.length; i++) {
        let reg = new RegExp(area + "\$","g");
        if (section[i].innerHTML.match(reg)) {
            section[i].parentElement.click();
            return;
        }
    }
}

async function findSeat() {
    let frame = theFrame();
    let canvas = frame.document.getElementById("ez_canvas");
    let seat = canvas.getElementsByTagName("rect");
    // console.log(seat);
    await sleep(130);
    for (let i = 0; i < seat.length; i++) {
        let fillColor = seat[i].getAttribute("fill");
    
        // Check if fill color is different from #DDDDDD or none
        if (fillColor !== "#DDDDDD" && fillColor !== "none") {
            console.log("Rect with different fill color found:", seat[i]);
            var clickEvent = new Event('click', { bubbles: true });

            seat[i].dispatchEvent(clickEvent);
            frame.document.getElementById("nextTicketSelection").click();
            
            // 检查并发送通知
            if ("Notification" in window) {
                if (Notification.permission === "granted") {
                    let notification = new Notification("提示", {
                        body: "发现合适的座位，点击切换窗口",
                        icon: "icon.png"
                    });
                    
                    // 通知点击事件，用户点击通知时窗口会聚焦
                    notification.onclick = () => {
                        window.focus();
                    };
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            let notification = new Notification("提示", {
                                body: "发现合适的座位，点击切换窗口",
                                icon: "icon.png"
                            });

                            notification.onclick = () => {
                                window.focus();
                            };
                        }
                    });
                }
            }

            return true;
        }
    }
    return false;
}

async function captureElementScreenshot(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        const canvas = await html2canvas(element);
        const screenshot = canvas.toDataURL("image/png").split(",")[1]; // Return base64 string without data URL prefix
        console.log("Screenshot captured:", screenshot);
        return screenshot;
    } catch (error) {
        console.error("Error capturing screenshot:", error);
    }
}

async function sendImageToApi(base64Image) {
    const url = 'https://api.jfbym.com/api/YmServer/customApi';
    const body = JSON.stringify({
        image: base64Image,
        token: 'fbo_xEsWYlWsIvutIqYB6IpZ_eoh6UY5cPZbLhfJ7ak',
        type: '10111'
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const data = result.data.data;
        console.log('API response:', data);
        return data;
    } catch (error) {
        console.error('Error sending image to API:', error);
    }
}

async function checkCaptchaFinish() {
    if (document.getElementById("certification").style.display != "none") {
        console.log("Captcha detected, solving...");
        let screenshot = await captureElementScreenshot("captchaImg");
        let response = await sendImageToApi(screenshot);
        // #label-for-captcha
        document.getElementById("label-for-captcha").value = response;
        // #btnComplete
        document.getElementById("btnComplete").click();
        await sleep(130);
        if (document.getElementById("errorMessage").style.display != "none") {
            // #btnReload
            console.log("Captcha error, reloading...");
            document.getElementById("btnReload").click();
            await sleep(1000);
        }
        checkCaptchaFinish();
        return;
    }
    let frame = theFrame();
    await sleep(500);
    frame.document.getElementById("nextTicketSelection").click();
    return;
}

async function reload() {
    let frame = theFrame();
    frame.document.getElementById("btnReloadSchedule").click();
    await sleep(750);
}

async function searchSeat(data) {
    for (sec of data.section) {
        openEverySection();
        clickOnArea(sec);
        if (await findSeat()) {
            checkCaptchaFinish();
            return;
        }
    }
    reload();
    await searchSeat(data);
}

async function waitFirstLoad() {
    let concertId = getConcertId();
    let data = await get_stored_value(concertId);
    await sleep(1000);
    checkCaptchaFinish();
    searchSeat(data);
}


waitFirstLoad();