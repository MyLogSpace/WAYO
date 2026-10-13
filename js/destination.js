/**
 * js/destination.js — destination.html(여행지 추천) 전용 로직
 * 여행 스타일(중복 선택) + 예산/기간을 고르고 "WAYO에게 찾아보기"를 누르면
 * 조건에 맞는 여행지가 아래 결과 영역에 나타나는 데모.
 * 실제 백엔드가 없는 프로토타입이라 여행지 목록은 고정돼 있지만, AI MATCH %와
 * 카드에 표시되는 항목은 실제로 선택한 여행 스타일에 따라 계산/선별된다.
 */
(function () {
    const STYLE_LABELS = {
        relax: "호캉스", shopping: "관광쇼핑", food: "미식탐방", adventure: "액티비티",
        city_nightlife: "도시야경",
        nature: "자연", city: "도시", culture: "문화",
        nightlife: "야경", wellness: "웰빙", festival: "축제",
    };

    // stats: 10개 스타일 각각에 대한 이 여행지의 적합도(1~5). 검색 시 선택한 스타일만 골라
    // AI MATCH %와 카드 하단 항목을 계산하는 데 쓴다 — 그래서 무엇을 고르냐에 따라 결과가 달라진다.
    // Taipei는 프로젝트에 실사 사진이 아직 없어서 그라디언트로 채워뒀다.
    const DESTINATIONS = [
        {
            city: "TOKYO", country: "일본", flag: "🇯🇵", slug: "tokyo",
            photo: "assets/image/PAGE 01/hero/도쿄.jpg",
            stats: { nature: 2, food: 5, city: 5, relax: 2, culture: 4, adventure: 3, shopping: 5, nightlife: 5, wellness: 2, festival: 3, city_nightlife: 5 },
        },
        {
            city: "TAIPEI", country: "대만", flag: "🇹🇼", slug: "taipei",
            photo: null,
            stats: { nature: 2, food: 5, city: 4, relax: 3, culture: 3, adventure: 3, shopping: 4, nightlife: 5, wellness: 2, festival: 3, city_nightlife: 5 },
        },
        {
            city: "OSAKA", country: "일본", flag: "🇯🇵", slug: "osaka",
            photo: "https://images.unsplash.com/photo-1734427842844-29f08e51763a?fm=jpg&auto=format&fit=crop&q=80&w=800",
            stats: { nature: 3, food: 5, city: 4, relax: 3, culture: 4, adventure: 2, shopping: 4, nightlife: 4, wellness: 3, festival: 5, city_nightlife: 4 },
        },
        {
            city: "DA NANG", country: "베트남", flag: "🇻🇳", slug: "danang",
            photo: "assets/image/PAGE 01/hero/다낭.webp",
            stats: { nature: 4, food: 4, city: 2, relax: 5, culture: 2, adventure: 3, shopping: 2, nightlife: 2, wellness: 5, festival: 2, city_nightlife: 2 },
        },
        {
            city: "PRAGUE", country: "체코", flag: "🇨🇿", slug: "prague",
            photo: "assets/image/PAGE 01/hero/체코.jpg",
            stats: { nature: 2, food: 3, city: 5, relax: 3, culture: 5, adventure: 2, shopping: 3, nightlife: 4, wellness: 2, festival: 4, city_nightlife: 5 },
        },
        {
            city: "HALLSTATT", country: "오스트리아", flag: "🇦🇹", slug: "hallstatt",
            photo: "assets/image/PAGE 01/hero/오스트리아.jpg",
            stats: { nature: 5, food: 2, city: 1, relax: 5, culture: 3, adventure: 2, shopping: 1, nightlife: 1, wellness: 5, festival: 2, city_nightlife: 1 },
        },
        {
            city: "GIETHOORN", country: "네덜란드", flag: "🇳🇱", slug: "giethoorn",
            photo: "assets/image/PAGE 01/hero/네덜란드.jpg",
            stats: { nature: 5, food: 2, city: 1, relax: 5, culture: 2, adventure: 2, shopping: 1, nightlife: 1, wellness: 4, festival: 2, city_nightlife: 1 },
        },
        {
            city: "SYDNEY", country: "호주", flag: "🇦🇺", slug: "sydney",
            photo: "assets/image/PAGE 01/hero/호주.jpg",
            stats: { nature: 4, food: 3, city: 5, relax: 3, culture: 3, adventure: 4, shopping: 4, nightlife: 4, wellness: 3, festival: 3, city_nightlife: 5 },
        },
    ];

    let currentResults = [];
    let currentStyles = [];

    function renderDots(rating) {
        return Array.from({ length: 5 })
            .map((_, i) => `<span class="dot${i < rating ? " is-filled" : ""}"></span>`)
            .join("");
    }

    // 선택한 스타일들에 대한 이 여행지의 평균 적합도로 AI MATCH %를 계산한다.
    function computeMatch(dest, styles) {
        // 텍스트 검색처럼 선택된 스타일이 없을 때는 이 여행지의 전체 스탯 평균으로 대체한다.
        const keys = styles.length ? styles : Object.keys(dest.stats);
        const avg = keys.reduce((sum, s) => sum + (dest.stats[s] || 1), 0) / keys.length;
        return Math.min(98, Math.round(55 + avg * 8.5));
    }

    // 카드에는 선택한 스타일 중 이 여행지가 특히 강한 항목 위주로 최대 4개만 보여준다.
    function pickDisplayStats(dest, styles) {
        const keys = styles.length ? styles : Object.keys(dest.stats);
        return [...keys]
            .sort((a, b) => (dest.stats[b] || 0) - (dest.stats[a] || 0))
            .slice(0, 4)
            .map((key) => [STYLE_LABELS[key] || key, dest.stats[key] || 1]);
    }

    function renderCard(dest, styles) {
        const photo = dest.photo || ((window.DESTINATION_DETAILS || {})[dest.slug] || {}).heroImg;
        const photoStyle = photo
            ? `background-image:url('${photo}')`
            : "background:linear-gradient(135deg, var(--teal-soft), var(--gold-soft))";
        const match = computeMatch(dest, styles);
        const statsHtml = pickDisplayStats(dest, styles)
            .map(([label, rating]) => `
                <div class="find-stat">
                    <span>${label}</span>
                    <span class="find-dots">${renderDots(rating)}</span>
                </div>`)
            .join("");

        return `
            <div class="find-card">
                <div class="find-card-photo" style="${photoStyle}">
                    <button type="button" class="find-card-heart" aria-label="즐겨찾기">
                        <i data-lucide="heart" style="width:17px;height:17px"></i>
                    </button>
                </div>
                <div class="find-card-body">
                    <div class="find-card-country"><span class="find-flag">${dest.flag}</span> ${dest.country}</div>
                    <h3 class="find-card-city">${dest.city}</h3>
                    <div class="find-card-match">
                        <span class="find-card-match-label">AI MATCH</span>
                        <span class="find-card-match-value" data-match="${match}">${match}%</span>
                    </div>
                    <div class="find-card-stats">${statsHtml}</div>
                </div>
                <a href="destination-detail.html?city=${dest.slug}" class="find-card-link">
                    자세히 보기 <i data-lucide="arrow-right" style="width:14px;height:14px"></i>
                </a>
            </div>`;
    }

    function renderGrid(list) {
        const grid = document.getElementById("findGrid");
        if (!grid) return;
        grid.innerHTML = list.map((dest) => renderCard(dest, currentStyles)).join("");
        if (window.lucide) lucide.createIcons();
        wireCardHearts();
    }

    function wireCardHearts() {
        document.querySelectorAll(".find-card-heart").forEach((btn) => {
            btn.addEventListener("click", () => btn.classList.toggle("is-active"));
        });
    }

    // ── 여행 스타일: 중복 선택 가능 ──────────────────────────────
    function getSelectedStyles() {
        return Array.from(document.querySelectorAll(".style-chip.is-selected")).map((c) => c.dataset.value);
    }

    function wireStyleChips() {
        document.querySelectorAll(".style-chip").forEach((chip) => {
            chip.addEventListener("click", () => chip.classList.toggle("is-selected"));
        });
    }

    // ── 여행 스타일: "더보기"로 자연/문화/웰빙/축제 펼치기 ──────────
    function wireStyleMoreToggle() {
        const moreBtn = document.getElementById("styleMoreBtn");
        const extra = document.getElementById("styleExtra");
        if (!moreBtn || !extra) return;

        moreBtn.addEventListener("click", () => {
            const willExpand = extra.hidden;
            extra.hidden = !willExpand;
            moreBtn.setAttribute("aria-expanded", String(willExpand));
            moreBtn.innerHTML = willExpand
                ? '<i data-lucide="chevron-up" style="width:15px;height:15px"></i> 간략히'
                : '<i data-lucide="chevron-down" style="width:15px;height:15px"></i> 더보기';
            if (window.lucide) lucide.createIcons();
        });
    }

    // 홈 화면 취향 카드(shopping/food/activity/staycation)에서 넘어온 ?purpose= 값을
    // 이 페이지의 여행 스타일 칩에 매핑한다.
    const PURPOSE_TO_STYLE = {
        shopping: "shopping",
        food: "food",
        activity: "adventure",
        staycation: "relax",
        nature: "nature",
        culture: "culture",
    };

    function applyPurposeFromURL() {
        const params = new URLSearchParams(window.location.search);
        const purposeParam = params.get("purpose");
        if (!purposeParam) return false;
        const values = purposeParam.split(",").map((v) => PURPOSE_TO_STYLE[v.trim()]).filter(Boolean);
        let applied = false;
        values.forEach((value) => {
            const chip = document.querySelector(`.style-chip[data-value="${value}"]`);
            if (chip) {
                chip.classList.add("is-selected");
                applied = true;

                const extra = chip.closest("#styleExtra");
                if (extra && extra.hidden) {
                    extra.hidden = false;
                    const moreBtn = document.getElementById("styleMoreBtn");
                    if (moreBtn) {
                        moreBtn.setAttribute("aria-expanded", "true");
                        moreBtn.innerHTML = '<i data-lucide="chevron-up" style="width:15px;height:15px"></i> 간략히';
                        if (window.lucide) lucide.createIcons();
                    }
                }
            }
        });
        return applied;
    }

    // ── 검색: 선택된 스타일과 겹치는 여행지만, 매치율 높은 순으로 보여준다 ──────────────
    function matchDestinations(styles) {
        if (!styles.length) return [];
        return DESTINATIONS
            .filter((dest) => styles.some((s) => (dest.stats[s] || 0) >= 3))
            .sort((a, b) => computeMatch(b, styles) - computeMatch(a, styles));
    }

    // 매치율 순으로 정렬된 목록에서 나라별 1곳만 남기고 limit개까지 자른다.
    function pickOnePerCountry(list, limit = 4) {
        const seen = new Set();
        const picked = [];
        for (const dest of list) {
            if (seen.has(dest.country)) continue;
            seen.add(dest.country);
            picked.push(dest);
            if (picked.length === limit) break;
        }
        return picked;
    }

    function sortResults(list) {
        const sortSelect = document.getElementById("sortSelect");
        const sorted = [...list];
        if (sortSelect && sortSelect.value === "match") {
            sorted.sort((a, b) => computeMatch(b, currentStyles) - computeMatch(a, currentStyles));
        }
        return sorted;
    }

    function showEmpty() {
        document.getElementById("matchesEmpty")?.classList.remove("hidden");
        document.getElementById("matchesLoading")?.classList.add("hidden");
        document.getElementById("findGrid")?.classList.add("hidden");
    }

    function showLoading() {
        document.getElementById("matchesEmpty")?.classList.add("hidden");
        document.getElementById("matchesLoading")?.classList.remove("hidden");
        document.getElementById("findGrid")?.classList.add("hidden");
    }

    function showResults(list) {
        currentResults = list;
        document.getElementById("matchesEmpty")?.classList.add("hidden");
        document.getElementById("matchesLoading")?.classList.add("hidden");
        document.getElementById("findGrid")?.classList.remove("hidden");
        renderGrid(sortResults(list));
    }

    function runSearch({ scroll = true } = {}) {
        const styles = getSelectedStyles();
        if (!styles.length) {
            if (window.showToast) window.showToast("여행 스타일을 하나 이상 선택해주세요.");
            return;
        }
        currentStyles = styles;

        const matchesSection = document.querySelector(".find-matches");
        if (scroll) matchesSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        showLoading();

        setTimeout(() => {
            const results = pickOnePerCountry(matchDestinations(styles), 4);
            showResults(results);
            if (window.showToast) {
                const styleNames = styles.map((s) => STYLE_LABELS[s] || s).join(", ");
                window.showToast(
                    results.length
                        ? `"${styleNames}" 취향에 맞는 여행지 ${results.length}곳을 찾았어요 (데모)`
                        : "조건에 맞는 여행지를 찾지 못했어요. 스타일을 바꿔보세요."
                );
            }
        }, 700);
    }

    function wireSearchButton() {
        const btn = document.getElementById("findSearchBtn");
        if (!btn) return;
        btn.addEventListener("click", () => runSearch());
    }

    function wireSortSelect() {
        const select = document.getElementById("sortSelect");
        if (!select) return;
        select.addEventListener("change", () => {
            if (currentResults.length) renderGrid(sortResults(currentResults));
        });
    }

    function wireViewToggle() {
        const toggle = document.getElementById("viewToggle");
        const grid = document.getElementById("findGrid");
        if (!toggle || !grid) return;
        toggle.querySelectorAll("button").forEach((btn) => {
            btn.addEventListener("click", () => {
                toggle.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
                btn.classList.add("is-active");
                grid.classList.toggle("is-list", btn.dataset.view === "list");
            });
        });
    }

    // 상단바 검색창에서 Enter로 넘어온 ?q= 텍스트 검색어를 도시/국가명 기준으로 찾는다.
    function textSearchDestinations(query) {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return DESTINATIONS.filter(
            (dest) => dest.city.toLowerCase().includes(q) || dest.country.toLowerCase().includes(q)
        );
    }

    function applySearchQueryFromURL() {
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q");
        if (!q) return false;

        const matchesSection = document.querySelector(".find-matches");
        matchesSection?.scrollIntoView({ behavior: "smooth", block: "start" });

        const results = textSearchDestinations(q);
        showResults(results);
        if (window.showToast) {
            window.showToast(
                results.length
                    ? `"${q}" 검색 결과 ${results.length}곳을 찾았어요.`
                    : `"${q}"에 대한 검색 결과가 없어요.`
            );
        }
        return true;
    }

    function init() {
        wireStyleChips();
        wireStyleMoreToggle();
        wireSearchButton();
        wireSortSelect();
        wireViewToggle();

        const cameFromSearch = applySearchQueryFromURL();
        if (cameFromSearch) return;

        const cameFromHome = applyPurposeFromURL();
        if (cameFromHome) {
            runSearch({ scroll: false });
        } else {
            showEmpty();
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
