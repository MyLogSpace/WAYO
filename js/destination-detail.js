/**
 * js/destination-detail.js — destination-detail.html(여행지 상세) 전용 로직
 * URL의 ?city=슬러그 값을 읽어서 js/destination-detail-data.js(window.DESTINATION_DETAILS)에서
 * 해당 도시 데이터를 찾아 페이지 텍스트/이미지/그래프를 채워 넣는다.
 * city 파라미터가 없거나 매칭되는 데이터가 없으면 도쿄(tokyo)를 기본값으로 보여준다.
 */
(function () {
    function getCitySlug() {
        const params = new URLSearchParams(window.location.search);
        return (params.get("city") || "tokyo").trim().toLowerCase();
    }

    // 히어로 칩에 쓸 도시별 시간대 (데이터 파일을 건드리지 않고 이 파일에서만 관리)
    const TIMEZONES = {
        tokyo: "JST GMT+9", kyoto: "JST GMT+9", osaka: "JST GMT+9",
        taipei: "CST GMT+8", danang: "ICT GMT+7", lisbon: "WET GMT+0",
        prague: "CET GMT+1", hallstatt: "CET GMT+1", giethoorn: "CET GMT+1",
        sydney: "AEST GMT+10",
    };

    function getData() {
        const slug = getCitySlug();
        const all = window.DESTINATION_DETAILS || {};
        return all[slug] || all.tokyo;
    }

    // 드로어 메뉴의 "최근 본 여행지"에서 쓸 수 있도록, 방문한 도시를 브라우저에 기록해둔다.
    // 최신 항목이 앞에 오도록 하고, 중복은 제거하며 최대 6개까지만 보관한다.
    const RECENT_KEY = "wayoRecentViews";
    const RECENT_MAX = 6;

    function recordRecentView(slug, data) {
        if (!slug || !data) return;
        let list = [];
        try {
            list = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
        } catch (e) {
            list = [];
        }
        list = list.filter((item) => item.slug !== slug);
        list.unshift({ slug, city: data.city, countryKo: data.countryKo, heroImg: data.heroImg });
        list = list.slice(0, RECENT_MAX);
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(list));
        } catch (e) {
            // localStorage를 못 쓰는 환경(프라이빗 모드 등)이면 조용히 무시한다.
        }
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function setHtml(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = value;
    }

    function renderMeta(data) {
        setHtml("pageTitle", `${data.city} — 여행지 상세 | WAYO`);
        document.title = `${data.city} — 여행지 상세 | WAYO`;
        const desc = document.getElementById("pageDescription");
        if (desc) desc.setAttribute("content", `WAYO AI가 분석한 ${data.city} 여행 적합도와 맞춤 정보를 확인해보세요.`);
    }

    function renderHero(data) {
        const heroImg = document.getElementById("detailHeroImg");
        if (heroImg) {
            heroImg.src = data.heroImg;
            heroImg.alt = data.heroAlt || `${data.city} 여행 사진`;
        }
        setText("detailWeather", data.weather);
        setText("detailChipLocation", `${data.city}, ${(data.countryEn || "").toUpperCase()}`);
        setText("detailChipTime", TIMEZONES[getCitySlug()] || TIMEZONES.tokyo);

        const thumbsWrap = document.getElementById("detailThumbs");
        if (thumbsWrap) {
            if (data.thumbs && data.thumbs.length) {
                const thumbImgs = data.thumbs
                    .slice(0, 3)
                    .map((t) => `<img src="${t.src}" alt="${t.alt || ""}">`)
                    .join("");
                const extra = data.thumbExtraImg
                    ? `<div class="detail-thumb-more">
                            <img src="${data.thumbExtraImg}" alt="">
                            <span>+${data.thumbExtraCount || 1}</span>
                        </div>`
                    : "";
                thumbsWrap.innerHTML = thumbImgs + extra;
                thumbsWrap.style.display = "";
            } else {
                // 도쿄 외에는 아직 다각도 사진 에셋이 없어 썸네일 줄을 생략한다.
                thumbsWrap.style.display = "none";
            }
        }
    }

    function renderInfo(data) {
        setText("detailCountryText", data.countryEn);
        setText("detailCityName", data.city);
        setText("detailLocationText", data.countryEn);
        setText("detailMatchValue", data.match);
    }

    function renderReasons(data) {
        const r = data.reasons || {};
        [
            ["reasonFoodFill", "reasonFoodValue", r.food],
            ["reasonCityFill", "reasonCityValue", r.city],
            ["reasonCultureFill", "reasonCultureValue", r.culture],
            ["reasonRelaxFill", "reasonRelaxValue", r.relax],
        ].forEach(([fillId, valueId, percent]) => {
            const fillEl = document.getElementById(fillId);
            if (fillEl) fillEl.style.width = `${percent}%`;
            setText(valueId, `${percent}%`);
        });
    }

    function renderWhy(data) {
        setText("detailWhyTitle", `WHY ${data.city}?`);
        setText("detailWhyBody", data.whyBody);
        setText("detailInsightBody", data.insightBody);
    }

    function renderCards(data) {
        setHtml("detailBestTime", data.bestTime);
        setText("detailBestTimeDesc", data.bestTimeDesc);
        const bestTimeImg = document.getElementById("detailBestTimeImg");
        if (bestTimeImg) {
            bestTimeImg.src = data.bestTimeImg;
            bestTimeImg.alt = data.bestTimeImgAlt || `${data.city} 여행 사진`;
        }

        setText("detailCostTotal", data.costTotal);
        const c = data.cost || {};
        [
            ["costFlightFill", "costFlightValue", c.flight],
            ["costStayFill", "costStayValue", c.stay],
            ["costFoodFill", "costFoodValue", c.food],
            ["costEtcFill", "costEtcValue", c.etc],
        ].forEach(([fillId, valueId, item]) => {
            if (!item) return;
            const fillEl = document.getElementById(fillId);
            if (fillEl) fillEl.style.width = `${item.percent}%`;
            setText(valueId, item.value);
        });

        setText("detailRecDays", data.recDays);
        setText("detailRecDesc", data.recDesc);
        const recImg = document.getElementById("detailRecImg");
        if (recImg) {
            recImg.src = data.recImg;
            recImg.alt = data.recImgAlt || `${data.city} 여행 사진`;
        }
    }

    function wireFavoriteButton() {
        const btn = document.getElementById("detailFavorite");
        if (!btn) return;
        btn.addEventListener("click", () => {
            const isActive = btn.classList.toggle("is-active");
            if (window.showToast) {
                window.showToast(isActive ? "즐겨찾기에 추가했어요." : "즐겨찾기에서 제거했어요.");
            }
        });
    }

    function render() {
        const data = getData();
        renderMeta(data);
        renderHero(data);
        renderInfo(data);
        renderReasons(data);
        renderWhy(data);
        renderCards(data);
        recordRecentView(getCitySlug(), data);
        const cta = document.querySelector(".detail-cta-btn");
        if (cta) {
            const slug = (window.DESTINATION_DETAILS || {})[getCitySlug()] ? getCitySlug() : "tokyo";
            cta.href = `planner.html?city=${slug}`;
        }
        if (window.lucide) lucide.createIcons();
    }

    function init() {
        render();
        wireFavoriteButton();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
