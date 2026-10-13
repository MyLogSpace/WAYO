/**
 * js/favorites.js — favorites.html(즐겨찾기) 전용 로직
 * TRAVEL DESTINATIONS / ITINERARIES 탭 전환 + 하트 버튼으로 카드 제거(데모, 새로고침하면 초기화).
 */
(function () {
    const DESTINATIONS = [
        { city: "TOKYO", country: "일본", flag: "🇯🇵", match: 94, photo: "assets/image/PAGE 01/hero/도쿄.jpg", link: "destination-detail.html?city=tokyo" },
        { city: "TAIPEI", country: "대만", flag: "🇹🇼", match: 89, photo: null, link: "destination-detail.html?city=taipei" },
        { city: "OSAKA", country: "일본", flag: "🇯🇵", match: 86, photo: "https://images.unsplash.com/photo-1734427842844-29f08e51763a?fm=jpg&auto=format&fit=crop&q=80&w=600", link: "destination-detail.html?city=osaka" },
        { city: "DA NANG", country: "베트남", flag: "🇻🇳", match: 83, photo: "no-photo.svg", link: "destination-detail.html?city=danang" },
    ];

    const ITINERARIES = [
        { tag: "일본 · 도쿄", nights: "5 DAYS · 4 NIGHTS", title: "도쿄 미식 & 야경 탐방 일정", dates: "2026.09.12 – 09.16", link: "planner.html?city=tokyo" },
        { tag: "베트남 · 다낭", nights: "4 DAYS · 3 NIGHTS", title: "다낭 해변 & 온천 휴양 일정", dates: "2026.10.03 – 10.06", link: "planner.html?city=danang" },
    ];

    function renderDestinations() {
        const grid = document.getElementById("destGrid");
        if (!grid) return;
        grid.innerHTML = DESTINATIONS.map((d) => {
            const photo = d.photo || ((window.DESTINATION_DETAILS || {})[d.city.toLowerCase().replace(/\s+/g, "")] || {}).heroImg;
            const photoStyle = photo
                ? `background-image:url('${photo}')`
                : "background:linear-gradient(135deg, var(--teal-soft), var(--gold-soft))";
            return `
            <div class="fav-dest-card" data-city="${d.city}">
                <div class="fav-dest-photo" style="${photoStyle}">
                    <span class="fav-dest-city">${d.city}</span>
                    <button type="button" class="fav-dest-heart" aria-label="즐겨찾기 해제">
                        <i data-lucide="heart" style="width:15px;height:15px"></i>
                    </button>
                </div>
                <div class="fav-dest-body">
                    <div class="fav-dest-match">
                        <span>AI MATCH</span>
                        <span>${d.match}%</span>
                    </div>
                    <div class="fav-dest-country"><span>${d.flag}</span> ${d.country}</div>
                    <div class="fav-dest-journey">
                        <a href="${d.link}">View Journey <i data-lucide="arrow-right" style="width:13px;height:13px"></i></a>
                    </div>
                </div>
            </div>`;
        }).join("");
        if (window.lucide) lucide.createIcons();
        wireHearts();
        updateCounts();
    }

    function renderItineraries() {
        const grid = document.getElementById("itinGrid");
        if (!grid) return;
        grid.innerHTML = ITINERARIES.map(
            (t) => `
            <div class="fav-itin-card">
                <div>
                    <div class="fav-itin-top">
                        <span class="fav-itin-tag">${t.tag}</span>
                        <span class="fav-itin-nights">${t.nights}</span>
                    </div>
                    <h4>${t.title}</h4>
                    <div class="fav-itin-dates">
                        <i data-lucide="calendar" style="width:15px;height:15px"></i>
                        <span>${t.dates}</span>
                    </div>
                </div>
                <a href="${t.link}" class="fav-itin-cta">일정 보기 <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
            </div>`
        ).join("");
        if (window.lucide) lucide.createIcons();
        updateCounts();
    }

    function wireHearts() {
        document.querySelectorAll(".fav-dest-heart").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const card = btn.closest(".fav-dest-card");
                if (card) card.remove();
                updateCounts();
                if (window.showToast) window.showToast("즐겨찾기에서 삭제했어요.");
            });
        });
    }

    function updateCounts() {
        const destCount = document.querySelectorAll(".fav-dest-card").length;
        const itinCount = document.querySelectorAll(".fav-itin-card").length;
        const destCountEl = document.getElementById("destCount");
        const itinCountEl = document.getElementById("itinCount");
        if (destCountEl) destCountEl.textContent = destCount;
        if (itinCountEl) itinCountEl.textContent = itinCount;
        document.getElementById("destEmpty")?.classList.toggle("show", destCount === 0);
        document.getElementById("itinEmpty")?.classList.toggle("show", itinCount === 0);
    }

    function wireTabs() {
        const tabBtnDest = document.getElementById("tabBtnDest");
        const tabBtnItin = document.getElementById("tabBtnItin");
        const tabDest = document.getElementById("tabDest");
        const tabItin = document.getElementById("tabItin");
        if (!tabBtnDest || !tabBtnItin || !tabDest || !tabItin) return;

        function activate(name) {
            const isDest = name === "destinations";
            tabBtnDest.classList.toggle("is-active", isDest);
            tabBtnItin.classList.toggle("is-active", !isDest);
            tabDest.classList.toggle("is-active", isDest);
            tabItin.classList.toggle("is-active", !isDest);
        }

        tabBtnDest.addEventListener("click", () => activate("destinations"));
        tabBtnItin.addEventListener("click", () => activate("itineraries"));
    }

    function init() {
        renderDestinations();
        renderItineraries();
        wireTabs();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
