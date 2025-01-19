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
    console.log(section);
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
    console.log(seat);
    await sleep(750);
    for (let i = 0; i < seat.length; i++) {
        let fillColor = seat[i].getAttribute("fill");
    
        // Check if fill color is different from #DDDDDD or none
        if (fillColor !== "#DDDDDD" && fillColor !== "none") {
            console.log("Rect with different fill color found:", seat[i]);
            var clickEvent = new Event('click', { bubbles: true });

            seat[i].dispatchEvent(clickEvent);
            frame.document.getElementById("nextTicketSelection").click();
            window.focus(); // 将当前窗口聚焦到前台
            return true;
        }
    }
    return false;
}

async function checkCaptchaFinish() {
    if (document.getElementById("certification").style.display != "none") {
        await sleep(1000);
        console.log("Captcha detected, solving...");
        let img = document.getElementById("captchaImg");
        let base64img = img.src;
        let base64 = base64img.split(",")[1];

        // 发送请求到 API 获取验证码
        let response = await fetch('https://api.jfbym.com/api/YmServer/customApi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64, token: "fbo_xEsWYlWsIvutIqYB6IpZ_eoh6UY5cPZbLhfJ7ak", type: "10103" })
        });

        let result = await response.json();
        console.log(result);
        let captchaCode = result.data.data;

        // 填充验证码
        // <input type="text" id="label-for-captcha" class="inputType mhover" style="border-color:#ddd;text-transform:uppercase;" maxlength="8">
        let input = document.getElementById("label-for-captcha");
        input.value = captchaCode;

        // 点击确认按钮
        // <a href="#none" class="btn_flexible btn_full_radius" id="btnComplete"><span>Submit</span></a>
        let submit = document.getElementById("btnComplete");
        submit.click();

        // checkCaptchaFinish();
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
            frame.document.getElementById("nextTicketSelection").click();
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
    await checkCaptchaFinish();
    searchSeat(data);
}


waitFirstLoad();