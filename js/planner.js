/**
 * js/planner.js — planner.html(플래너) 전용 로직
 * Day 탭 전환 시 타임라인 + 지도 핀·경로가 함께 갱신되는 데모.
 * 실제 지도 API 없이 CSS/SVG로 만든 장식용 지도라, 좌표는 실제 위치와 무관하다.
 */
(function () {
    // 지도 위 4개 슬롯 좌표(퍼센트) — 요일마다 이 슬롯을 앞에서부터 순서대로 사용한다.
    const MAP_SLOTS = [
        { left: "66%", top: "84%" },
        { left: "50%", top: "60%" },
        { left: "40%", top: "36%" },
        { left: "26%", top: "14%" },
    ];

    const IMG = {
        airport: "https://images.unsplash.com/photo-1490430657723-4d607c1503fc?fm=jpg&auto=format&fit=crop&q=80&w=200",
        food: "https://images.unsplash.com/photo-1649013754416-6ea5d0be0b03?fm=jpg&auto=format&fit=crop&q=80&w=200",
        shibuya: "assets/image/PAGE 03/2.jpg",
        street: "assets/image/PAGE 03/5.jpg",
        skylineEvening: "assets/image/PAGE 03/4.jpg",
        nakamise: "assets/image/PAGE 03/7.jpg",
        shrineSteps: "assets/image/PAGE 03/6.jpg",
        skyline: "assets/image/PAGE 03/1.jpg",
    };

    const TOKYO_ITINERARY = {
        1: {
            date: "9.12 (Sat)",
            items: [
                { time: ["09:00", "09:30"], icon: "plane", title: "Haneda Airport (HND)", text: "하네다 공항 도착", duration: "35 min", pin: "Haneda Airport", img: IMG.airport },
                { time: ["11:00", "12:30"], icon: "map-pin", title: "Shibuya", text: "시부야 스크램블 교차로, 시부야 스카이", duration: "1 hr 30 min", pin: "Shibuya", img: IMG.shibuya },
                { time: ["13:00", "14:30"], icon: "utensils", title: "Local Lunch", text: "추천 맛집: Uobei Shibuya Dogenzaka", duration: "1 hr 30 min", img: IMG.food },
                { time: ["15:00", "16:30"], icon: "map-pin", title: "Harajuku", text: "하라주쿠, 다케시타 거리", duration: "1 hr 30 min", pin: "Harajuku", img: IMG.street },
                { time: ["18:00", "20:00"], icon: "map-pin", title: "Shinjuku", text: "신주쿠, 도쿄도청 전망대", duration: "2 hr", pin: "Shinjuku", img: IMG.skylineEvening },
            ],
        },
        2: {
            date: "9.13 (Sun)",
            items: [
                { time: ["09:00", "11:00"], icon: "map-pin", title: "Asakusa", text: "센소지, 나카미세 거리", duration: "2 hr", pin: "Asakusa", img: IMG.nakamise },
                { time: ["11:30", "12:30"], icon: "utensils", title: "Local Lunch", text: "아사쿠사 텐푸라 맛집", duration: "1 hr", img: IMG.food },
                { time: ["13:00", "15:00"], icon: "map-pin", title: "Ueno", text: "우에노 공원, 우에노 동물원", duration: "2 hr", pin: "Ueno", img: IMG.shrineSteps },
                { time: ["15:30", "17:00"], icon: "map-pin", title: "Akihabara", text: "전자상가, 애니메이트", duration: "1 hr 30 min", pin: "Akihabara", img: IMG.street },
                { time: ["18:30", "20:00"], icon: "utensils", title: "Dinner", text: "아키하바라 라멘 골목", duration: "1 hr 30 min", img: IMG.food },
            ],
        },
        3: {
            date: "9.14 (Mon)",
            items: [
                { time: ["10:00", "12:00"], icon: "map-pin", title: "Odaiba", text: "오다이바 해변공원, 자유의 여신상", duration: "2 hr", pin: "Odaiba", img: IMG.skyline },
                { time: ["12:30", "13:30"], icon: "utensils", title: "Local Lunch", text: "다이버시티 도쿄 플라자 푸드코트", duration: "1 hr", img: IMG.food },
                { time: ["14:00", "16:30"], icon: "sparkles", title: "teamLab Planets", text: "디지털 아트 뮤지엄", duration: "2 hr 30 min", pin: "teamLab Planets", img: IMG.skylineEvening },
                { time: ["17:00", "19:00"], icon: "map-pin", title: "Rainbow Bridge", text: "레인보우브릿지 야경", duration: "2 hr", pin: "Rainbow Bridge", img: IMG.skylineEvening },
            ],
        },
        4: {
            date: "9.15 (Tue)",
            items: [
                { time: ["08:30", "10:00"], icon: "map-pin", title: "Tsukiji Outer Market", text: "츠키지 장외시장", duration: "1 hr 30 min", pin: "Tsukiji Market", img: IMG.food },
                { time: ["10:30", "12:30"], icon: "map-pin", title: "Ginza", text: "긴자 거리, 츄오도리", duration: "2 hr", pin: "Ginza", img: IMG.street },
                { time: ["13:00", "14:00"], icon: "utensils", title: "Local Lunch", text: "긴자 스시 맛집", duration: "1 hr", img: IMG.food },
                { time: ["14:30", "16:30"], icon: "landmark", title: "Imperial Palace", text: "고쿄, 히가시교엔 정원", duration: "2 hr", pin: "Imperial Palace", img: IMG.shrineSteps },
                { time: ["17:00", "19:00"], icon: "map-pin", title: "Roppongi", text: "롯폰기 힐즈 전망대", duration: "2 hr", pin: "Roppongi", img: IMG.skyline },
            ],
        },
        5: {
            date: "9.17 (Thu)",
            items: [
                { time: ["09:00", "11:00"], icon: "shopping-bag", title: "Shinjuku", text: "오모이데요코초, 기념품 쇼핑", duration: "2 hr", pin: "Shinjuku", img: IMG.skylineEvening },
                { time: ["11:30", "13:00"], icon: "utensils", title: "Farewell Lunch", text: "신주쿠 소바 맛집", duration: "1 hr 30 min", img: IMG.food },
                { time: ["14:00", "14:30"], icon: "log-out", title: "Hotel Checkout", text: "숙소 체크아웃", duration: "30 min" },
                { time: ["15:00", "15:35"], icon: "plane-takeoff", title: "Haneda Airport (HND)", text: "공항 이동 및 출국 수속", duration: "35 min", pin: "Haneda Airport", img: IMG.airport },
            ],
        },
    };

    // ── 도시별 플랜: 도쿄는 위의 상세 일정, 나머지는 명소 목록(spots)으로 자동 구성하는 데모 ──
    // spot = [이름, 설명, 아이콘]. 하루에 명소 2곳 + 점심 + 저녁을 채운다.
    const CITY_PLANS = {
        tokyo: { days: 5, stay: "Shibuya, Tokyo", itinerary: TOKYO_ITINERARY },
        kyoto: { days: 3, stay: "Gion, Kyoto", spots: [["후시미 이나리 신사", "천 개의 도리이 길", "landmark"], ["기요미즈데라", "교토 전경이 보이는 사찰", "landmark"], ["아라시야마 대나무숲", "대나무 길 산책", "map-pin"], ["기온 거리", "전통 골목과 찻집", "map-pin"], ["금각사", "연못에 비친 황금 누각", "landmark"], ["니시키 시장", "교토의 부엌, 먹거리 골목", "utensils"]] },
        osaka: { days: 3, stay: "Namba, Osaka", spots: [["오사카성", "천수각과 성곽 공원", "landmark"], ["도톤보리", "글리코 사인과 야경", "map-pin"], ["신세카이", "쿠시카츠 골목과 츠텐카쿠", "map-pin"], ["우메다 스카이 빌딩", "공중정원 전망대", "map-pin"], ["구로몬 시장", "해산물·길거리 음식", "utensils"], ["신사이바시", "쇼핑 아케이드", "shopping-bag"]] },
        taipei: { days: 3, stay: "Ximending, Taipei", spots: [["타이베이 101", "전망대와 쇼핑몰", "landmark"], ["중정기념당", "근위병 교대식", "landmark"], ["융캉제", "딤섬과 망고빙수", "utensils"], ["스린 야시장", "대표 야시장 먹거리", "utensils"], ["단수이 올드스트리트", "강변 노을 산책", "map-pin"], ["지우펀", "홍등 골목 근교 여행", "map-pin"]] },
        danang: { days: 4, start: [9, 3], stay: "My Khe Beach, Da Nang", spots: [["미케 비치", "해변 휴양과 산책", "map-pin"], ["바나힐", "골든브릿지와 테마파크", "sparkles"], ["오행산", "동굴과 사원 탐방", "landmark"], ["한 시장", "로컬 시장과 기념품", "shopping-bag"], ["용 다리", "주말 밤 불쇼", "map-pin"], ["호이안 구시가지", "등불 거리 야경", "map-pin"], ["미선 유적", "참파 왕국 유적", "landmark"], ["온천 스파", "휴식 마무리", "sparkles"]] },
        lisbon: { days: 3, stay: "Alfama, Lisbon", spots: [["벨렝탑", "테주강변 대표 명소", "landmark"], ["알파마 지구", "언덕 골목 산책", "map-pin"], ["28번 트램", "노란 트램 타기", "map-pin"], ["상 조르제 성", "리스본 전망", "landmark"], ["코메르시우 광장", "강변 광장 산책", "map-pin"], ["신트라", "근교 궁전 당일치기", "landmark"]] },
        prague: { days: 3, stay: "Old Town, Prague", spots: [["구시가지 광장", "천문시계 감상", "landmark"], ["카를교", "블타바강 위 석조 다리", "map-pin"], ["프라하성", "성 비투스 대성당", "landmark"], ["바츨라프 광장", "신시가지 중심", "map-pin"], ["비셰흐라드", "강변 요새 산책", "map-pin"], ["야경 크루즈", "블타바강 야경", "sparkles"]] },
        hallstatt: { days: 3, stay: "Hallstatt Village", spots: [["마을 광장", "호숫가 마을 산책", "map-pin"], ["호수 보트", "할슈타트 호수 유람", "map-pin"], ["소금광산", "세계 최초 소금광산", "landmark"], ["5핑거스 전망대", "알프스 호수 전망", "map-pin"], ["호수 산책길", "느린 걸음 힐링", "map-pin"], ["납골당 예배당", "해골 장식 예배당", "landmark"]] },
        giethoorn: { days: 3, stay: "Giethoorn Village", spots: [["운하 보트 투어", "조용한 수로 유람", "map-pin"], ["자전거 산책", "마을 한 바퀴", "map-pin"], ["올드 마트 우스 박물관", "전통 가옥 박물관", "landmark"], ["카페 테라스", "운하 앞 티타임", "utensils"], ["보행자 다리", "초가집 포토 스팟", "map-pin"], ["호수 공원", "여유로운 산책", "map-pin"]] },
        sydney: { days: 3, stay: "Circular Quay, Sydney", spots: [["오페라 하우스", "하버 앞 대표 명소", "landmark"], ["하버 브리지", "다리 위 전망", "map-pin"], ["더 록스", "시드니 구시가지", "map-pin"], ["본다이 비치", "해변과 절벽 산책", "map-pin"], ["로열 보태닉 가든", "공원 산책", "map-pin"], ["달링 하버", "야경과 레스토랑", "sparkles"]] },
    };

    const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const pad = (n) => String(n).padStart(2, "0");

    function tripDates(days, start) {
        const [month, day] = start || [8, 12];
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(2026, month, day + i);
            const m = d.getMonth() + 1, dd = d.getDate(), w = WEEK[d.getDay()];
            return { short: `${m}.${dd} (${w})`, full: `2026.${pad(m)}.${pad(dd)} (${w})` };
        });
    }

    function buildItinerary(spots, days) {
        const FOOD = IMG.food;
        const result = {};
        for (let day = 1; day <= days; day++) {
            const a = spots[((day - 1) * 2) % spots.length];
            const b = spots[((day - 1) * 2 + 1) % spots.length];
            result[day] = {
                items: [
                    { time: ["10:00", "12:00"], icon: a[2], title: a[0], text: a[1], duration: "2 hr", pin: a[0] },
                    { time: ["12:30", "13:30"], icon: "utensils", title: "Local Lunch", text: "현지 맛집에서 점심", duration: "1 hr", img: FOOD },
                    { time: ["14:30", "17:00"], icon: b[2], title: b[0], text: b[1], duration: "2 hr 30 min", pin: b[0] },
                    { time: ["18:30", "20:00"], icon: "utensils", title: "Dinner", text: "현지 맛집에서 저녁", duration: "1 hr 30 min", img: FOOD },
                ],
            };
        }
        return result;
    }

    let ACTIVE = { dates: tripDates(5), itinerary: TOKYO_ITINERARY, place: "Tokyo, Japan", queries: [] };

    function getSlug() {
        const s = (new URLSearchParams(window.location.search).get("city") || "tokyo").trim().toLowerCase();
        return CITY_PLANS[s] ? s : "tokyo";
    }

    // ?city= 값에 맞춰 요약 바, TRIP SUMMARY, Day 탭을 채운다.
    function applyPlan() {
        const slug = getSlug();
        const plan = CITY_PLANS[slug];
        const info = (window.DESTINATION_DETAILS || {})[slug] || {};
        const dates = tripDates(plan.days, plan.start);
        ACTIVE = { dates, itinerary: plan.itinerary || buildItinerary(plan.spots, plan.days), place: `${info.city || "Tokyo"}, ${info.countryEn || "Japan"}`, queries: [] };

        const set = (id, value) => { const el = document.getElementById(id); if (el && value) el.textContent = value; };
        const city = info.city || "TOKYO";
        const first = dates[0].full, last = dates[dates.length - 1].full;
        const nights = plan.days - 1;

        document.title = `플래너 — ${city} ${plan.days}일 · WAYO`;
        set("planCity", city);
        set("planCountry", info.countryEn);
        set("tripCity", city);
        set("planDays", `${plan.days} DAYS`);
        set("planNights", `${nights} NIGHTS`);
        set("tripNights", `${plan.days} DAYS / ${nights} NIGHTS`);
        set("planCost", info.costTotal);
        set("tripCost", info.costTotal);
        set("tripPeriod", `${first.slice(0, 10)} - ${last.slice(0, 10)}`);
        set("tripStay", plan.stay);

        const datesEl = document.getElementById("planDates");
        if (datesEl) datesEl.innerHTML = `${first} <i data-lucide="arrow-right" style="width:13px;height:13px"></i> ${last}`;

        const photo = document.getElementById("planPhoto");
        if (photo && info.heroImg) { photo.src = info.heroImg; photo.alt = city; }

        const tabs = document.getElementById("dayTabs");
        if (tabs) {
            tabs.innerHTML = dates.map((_, i) => `<button type="button" class="day-tab${i === 0 ? " is-active" : ""}" data-day="${i + 1}">DAY 0${i + 1}</button>`).join("");
        }
    }

    function renderTimeline(items) {
        const list = document.getElementById("planTimeline");
        if (!list) return;
        list.innerHTML = items
            .map(
                (item) => `
            <div class="plan-item">
                <div class="plan-item-time"><span>${item.time[0]}</span><span>${item.time[1]}</span></div>
                <div class="plan-item-dot"></div>
                <div class="plan-item-card">
                    ${item.img ? `<img src="${item.img}" alt="${item.title}" class="plan-item-thumb">` : ""}
                    <span class="plan-item-icon"><i data-lucide="${item.icon}" style="width:16px;height:16px"></i></span>
                    <div class="plan-item-text">
                        <h5>${item.title}</h5>
                        <p>${item.text}</p>
                    </div>
                    <span class="plan-item-duration">${item.duration}</span>
                    <button type="button" class="plan-item-menu" aria-label="더보기"><i data-lucide="more-vertical" style="width:15px;height:15px"></i></button>
                </div>
            </div>`
            )
            .join("");
    }

    // 구글 지도 Embed API 키(선택). 비워 두면 키 없이 쓰는 방식으로 표시한다.
    const MAPS_API_KEY = "";

    const enc = encodeURIComponent;

    // 그날 핀이 있는 일정들을 구글 지도(경로)로 보여준다. 장소명 + 도시명으로 검색하므로 좌표가 필요 없다.
    function renderMap(items) {
        const frame = document.getElementById("mapFrame");
        const legendEl = document.getElementById("mapLegend");
        if (!frame || !legendEl) return;

        const stops = items.filter((item) => item.pin);
        const queries = stops.map((stop) => `${stop.pin}, ${ACTIVE.place}`);
        ACTIVE.queries = queries;

        legendEl.innerHTML = stops
            .map((stop, i) => `<div class="plan-map-legend-item"><span class="plan-map-legend-num">${String.fromCharCode(65 + i)}</span> ${stop.pin}</div>`)
            .join("");

        let src;
        if (!queries.length) {
            src = MAPS_API_KEY
                ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${enc(ACTIVE.place)}`
                : `https://maps.google.com/maps?q=${enc(ACTIVE.place)}&output=embed`;
        } else if (MAPS_API_KEY) {
            const base = "https://www.google.com/maps/embed/v1/";
            src = queries.length === 1
                ? `${base}place?key=${MAPS_API_KEY}&q=${enc(queries[0])}`
                : `${base}directions?key=${MAPS_API_KEY}&origin=${enc(queries[0])}&destination=${enc(queries[queries.length - 1])}`
                  + (queries.length > 2 ? `&waypoints=${queries.slice(1, -1).map(enc).join("%7C")}` : "");
        } else {
            src = queries.length === 1
                ? `https://maps.google.com/maps?q=${enc(queries[0])}&output=embed`
                : `https://maps.google.com/maps?saddr=${enc(queries[0])}&daddr=${queries.slice(1).map(enc).join("+to:")}&output=embed`;
        }
        if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
    }

    // 지도 박스 하단을 "+ 일정 추가" 버튼이 아니라, 그날의 마지막 일정 카드 하단에 정확히 맞춘다.
    function syncMapHeight() {
        const map = document.querySelector(".plan-map");
        const timeline = document.getElementById("planTimeline");
        if (!map || !timeline) return;

        const items = timeline.querySelectorAll(".plan-item");
        if (!items.length) return;
        const lastItem = items[items.length - 1];

        const mapTop = map.getBoundingClientRect().top;
        const lastItemBottom = lastItem.getBoundingClientRect().bottom;
        const height = lastItemBottom - mapTop;

        if (height > 0) {
            map.style.height = `${Math.round(height)}px`;
        }
    }

    function renderDay(dayNum) {
        const data = ACTIVE.itinerary[dayNum];
        if (!data) return;

        document.getElementById("dayHeadLabel").textContent = `DAY 0${dayNum}`;
        document.getElementById("dayHeadDate").textContent = ACTIVE.dates[dayNum - 1].short;

        renderTimeline(data.items);
        renderMap(data.items);
        if (window.lucide) lucide.createIcons();

        document.querySelectorAll(".day-tab").forEach((tab) => {
            tab.classList.toggle("is-active", Number(tab.dataset.day) === dayNum);
        });

        // 이미지 로딩으로 카드 높이가 나중에 바뀔 수 있어, 레이아웃이 안정된 다음 프레임에 맞춘다.
        requestAnimationFrame(syncMapHeight);
    }

    function wireDayTabs() {
        document.querySelectorAll(".day-tab").forEach((tab) => {
            tab.addEventListener("click", () => renderDay(Number(tab.dataset.day)));
        });
    }

    function wireActions() {
        const bind = (id, message) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener("click", (e) => {
                e.preventDefault();
                if (window.showToast) window.showToast(message);
            });
        };
        bind("wayoAutoBtn", "AI가 취향에 맞춰 일정을 자동으로 채워드릴게요! (데모)");
        bind("editTripBtn", "여행 정보 수정 기능을 준비하고 있어요!");
        bind("addItemBtn", "일정 추가 기능을 준비하고 있어요!");

        // 전체 경로 보기 → 이 여행(도쿄)의 실제 구글 지도를 새 탭으로 연다.
        const fullRouteBtn = document.getElementById("fullRouteBtn");
        if (fullRouteBtn) {
            fullRouteBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const qs = ACTIVE.queries && ACTIVE.queries.length ? ACTIVE.queries : [ACTIVE.place];
                const url = qs.length === 1
                    ? `https://www.google.com/maps/search/?api=1&query=${enc(qs[0])}`
                    : `https://www.google.com/maps/dir/${qs.map(enc).join("/")}`;
                window.open(url, "_blank", "noopener");
            });
        }
    }

    function init() {
        applyPlan();
        wireDayTabs();
        wireActions();
        renderDay(1);

        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(syncMapHeight, 150);
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
