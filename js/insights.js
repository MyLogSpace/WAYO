/**
 * js/insights.js — insights.html(인사이트) 전용 로직
 * TRENDING DESTINATIONS 순위, POPULAR TRAVEL STYLE, TRAVEL TREND 라인 차트를 렌더링한다.
 * RANKING과 TRAVEL_STYLES는 실제 여행객 설문 데이터(하나투어, 응답 2,210건)를 기반으로 한
 * "방문국가"/"여행목적" 컬럼 집계값이다 — 성장률(월 대비 증감)이 아니라 전체 응답 대비 비중(%)이다.
 * TRAVEL TREND 라인 차트(월별 추이)는 설문에 시계열 데이터가 없어 기존 데모 값을 유지한다.
 * 차트 계열색은 dataviz 스킬의 검증된 카테고리컬 팔레트(슬롯 1~4)를 그대로 쓴다 — 임의 브랜드
 * 색상이 아니라 색맹 접근성 체크(인접쌍 CVD ΔE, 명도 밴드, 대비)를 통과한 값이라 바꾸지 않는다.
 */
(function () {
    const RANKING = [
        { flag: "🇯🇵", name: "Japan", share: 39.6 },
        { flag: "🇻🇳", name: "Vietnam", share: 23.7 },
        { flag: "🇹🇭", name: "Thailand", share: 8.6 },
        { flag: "🇨🇳", name: "China", share: 5.8 },
        { flag: "🇹🇼", name: "Taiwan", share: 5.7 },
        { flag: "🇵🇭", name: "Philippines", share: 4.3 },
    ];

    const TRAVEL_STYLES = [
        { icon: "leaf", label: "자연·풍경", value: 36.7 },
        { icon: "utensils", label: "음식관광", value: 18.0 },
        { icon: "armchair", label: "휴식·휴양", value: 15.9 },
        { icon: "landmark", label: "역사유적", value: 6.2 },
        { icon: "building-2", label: "시티투어", value: 5.8 },
    ];

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const SERIES = [
        { key: "japan", name: "Japan", color: "var(--series-1)", data: [28, 58, 70, 80, 86, 82, 75, 68, 72, 78, 88, 92] },
        { key: "taiwan", name: "Taiwan", color: "var(--series-2)", data: [22, 48, 55, 60, 63, 65, 60, 55, 58, 62, 68, 72] },
        { key: "vietnam", name: "Vietnam", color: "var(--series-3)", data: [22, 28, 40, 55, 48, 50, 45, 42, 46, 50, 55, 58] },
        { key: "thailand", name: "Thailand", color: "var(--series-4)", data: [10, 20, 28, 35, 32, 30, 26, 24, 27, 30, 34, 38] },
    ];

    function renderRanking() {
        const list = document.getElementById("rankList");
        if (!list) return;
        list.innerHTML = RANKING.map(
            (r, i) => `
            <div class="ins-rank-item">
                <span class="ins-rank-num">${String(i + 1).padStart(2, "0")}</span>
                <span class="ins-rank-flag">${r.flag}</span>
                <span class="ins-rank-name">${r.name}</span>
                <span class="ins-rank-delta">${r.share}%</span>
            </div>`
        ).join("");
        if (window.lucide) lucide.createIcons();
    }

    function renderStyleRow() {
        const row = document.getElementById("styleRow");
        if (!row) return;
        row.innerHTML = TRAVEL_STYLES.map(
            (s) => `
            <div class="ins-style-pill">
                <i data-lucide="${s.icon}" style="width:17px;height:17px"></i>
                <span>${s.label}</span>
                <strong>${s.value}%</strong>
            </div>`
        ).join("");
        if (window.lucide) lucide.createIcons();
    }

    // 상세 페이지 방문 시 저장된 "최근 본 여행지"(wayoRecentViews)를 보여준다.
    function renderRecent() {
        const row = document.getElementById("recentRow");
        if (!row) return;
        let list = [];
        try { list = JSON.parse(localStorage.getItem("wayoRecentViews")) || []; } catch (e) { list = []; }
        if (!list.length) {
            row.innerHTML = '<p style="grid-column:1/-1;font-size:13px;color:var(--muted)">아직 본 여행지가 없어요. 여행지 추천에서 마음에 드는 곳을 살펴보세요.</p>';
            return;
        }
        row.innerHTML = list.map((r) => `
            <a href="destination-detail.html?city=${r.slug}" class="ins-style-pill">
                <i data-lucide="map-pin" style="width:17px;height:17px"></i>
                <span>${r.city}</span>
                <strong>${r.countryKo || ""}</strong>
            </a>`).join("");
        if (window.lucide) lucide.createIcons();
    }

    function renderLegend() {
        const legend = document.getElementById("chartLegend");
        if (!legend) return;
        legend.innerHTML = SERIES.map(
            (s) => `
            <span class="ins-legend-item">
                <span class="ins-legend-key" style="background:${s.color}"></span> ${s.name}
            </span>`
        ).join("");
    }

    // ── TRAVEL TREND 라인 차트 (SVG, 크로스헤어 + 툴팁 포함) ──
    const CHART_W = 600;
    const CHART_H = 280;
    const PAD = { top: 10, right: 10, bottom: 26, left: 34 };
    const PLOT_W = CHART_W - PAD.left - PAD.right;
    const PLOT_H = CHART_H - PAD.top - PAD.bottom;

    let months = MONTHS.slice(0, 6);
    let series = SERIES.map((s) => ({ ...s, data: s.data.slice(0, 6) }));

    function xAt(i, n) {
        return PAD.left + (n === 1 ? 0 : (i / (n - 1)) * PLOT_W);
    }
    function yAt(v) {
        return PAD.top + (1 - v / 100) * PLOT_H;
    }

    function buildChartSvg() {
        const wrap = document.getElementById("chartWrap");
        if (!wrap) return;

        const gridLines = [0, 25, 50, 75, 100]
            .map(
                (v) => `
            <line class="ins-chart-gridline" x1="${PAD.left}" x2="${CHART_W - PAD.right}" y1="${yAt(v)}" y2="${yAt(v)}"></line>
            <text class="ins-chart-axis-label" x="${PAD.left - 8}" y="${yAt(v) + 3}" text-anchor="end">${v}</text>`
            )
            .join("");

        const xLabels = months
            .map((m, i) => `<text class="ins-chart-axis-label" x="${xAt(i, months.length)}" y="${CHART_H - 4}" text-anchor="middle">${m}</text>`)
            .join("");

        const lines = series
            .map((s) => {
                const points = s.data.map((v, i) => `${xAt(i, months.length)},${yAt(v)}`).join(" ");
                return `<polyline class="ins-chart-line" points="${points}" stroke="${s.color}"></polyline>`;
            })
            .join("");

        const dots = series
            .map((s) =>
                s.data
                    .map((v, i) => `<circle class="ins-chart-dot" data-series="${s.key}" data-i="${i}" cx="${xAt(i, months.length)}" cy="${yAt(v)}" r="3.5" fill="${s.color}"></circle>`)
                    .join("")
            )
            .join("");

        const hitWidth = PLOT_W / months.length;
        const hitAreas = months
            .map((_, i) => `<rect class="ins-chart-hit" data-i="${i}" x="${PAD.left + i * hitWidth}" y="${PAD.top}" width="${hitWidth}" height="${PLOT_H}"></rect>`)
            .join("");

        wrap.innerHTML = `
            <svg viewBox="0 0 ${CHART_W} ${CHART_H}" role="img" aria-label="국가별 여행 관심도 추이 라인 차트">
                ${gridLines}
                ${xLabels}
                ${lines}
                ${dots}
                <line class="ins-chart-crosshair" id="chartCrosshair" x1="0" x2="0" y1="${PAD.top}" y2="${PAD.top + PLOT_H}"></line>
                ${hitAreas}
            </svg>
            <div class="ins-chart-tooltip" id="chartTooltip"></div>
        `;

        wireChartHover();
    }

    function wireChartHover() {
        const wrap = document.getElementById("chartWrap");
        const svg = wrap?.querySelector("svg");
        const crosshair = document.getElementById("chartCrosshair");
        const tooltip = document.getElementById("chartTooltip");
        if (!wrap || !svg || !crosshair || !tooltip) return;

        function showAt(i) {
            const x = xAt(i, months.length);
            crosshair.setAttribute("x1", x);
            crosshair.setAttribute("x2", x);
            crosshair.style.opacity = "1";

            svg.querySelectorAll(".ins-chart-dot").forEach((dot) => {
                dot.setAttribute("r", Number(dot.dataset.i) === i ? "5" : "3.5");
            });

            const monthEl = document.createElement("div");
            monthEl.className = "ins-chart-tooltip-month";
            monthEl.textContent = months[i];

            tooltip.innerHTML = "";
            tooltip.appendChild(monthEl);
            series.forEach((s) => {
                const row = document.createElement("div");
                row.className = "ins-chart-tooltip-row";

                const key = document.createElement("span");
                key.className = "ins-chart-tooltip-key";
                key.style.background = s.color;

                const name = document.createElement("span");
                name.className = "ins-chart-tooltip-name";
                name.textContent = s.name;

                const value = document.createElement("span");
                value.className = "ins-chart-tooltip-value";
                value.textContent = s.data[i];

                row.append(key, name, value);
                tooltip.appendChild(row);
            });

            // SVG는 viewBox 좌표를 실제 렌더 크기로 반응형 확대/축소하므로, 툴팁 위치는
            // 픽셀이 아니라 퍼센트로 둬야 스케일이 달라져도 커서를 정확히 따라간다.
            const topValue = yAt(Math.max(...series.map((s) => s.data[i]))) - 12;
            tooltip.style.left = (x / CHART_W) * 100 + "%";
            tooltip.style.top = (topValue / CHART_H) * 100 + "%";
            tooltip.classList.add("is-visible");
        }

        function hide() {
            crosshair.style.opacity = "0";
            tooltip.classList.remove("is-visible");
            svg.querySelectorAll(".ins-chart-dot").forEach((dot) => dot.setAttribute("r", "3.5"));
        }

        svg.querySelectorAll(".ins-chart-hit").forEach((hit) => {
            hit.addEventListener("pointermove", () => showAt(Number(hit.dataset.i)));
            hit.addEventListener("pointerenter", () => showAt(Number(hit.dataset.i)));
        });
        wrap.addEventListener("pointerleave", hide);
    }

    function wireRangeToggle() {
        const toggle = document.getElementById("rangeToggle");
        if (!toggle) return;
        toggle.querySelectorAll("button").forEach((btn) => {
            btn.addEventListener("click", () => {
                toggle.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
                btn.classList.add("is-active");

                const range = btn.dataset.range;
                const count = range === "6m" ? 6 : 12;
                months = MONTHS.slice(0, count);
                series = SERIES.map((s) => ({ ...s, data: s.data.slice(0, count) }));
                buildChartSvg();
            });
        });
    }

    function wireComingSoonButtons() {
        ["moreRankBtn", "moreDataBtn"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener("click", () => {
                if (window.showToast) window.showToast("더 많은 데이터를 준비하고 있어요!");
            });
        });
    }

    function init() {
        renderRanking();
        renderStyleRow();
        renderRecent();
        renderLegend();
        buildChartSvg();
        wireRangeToggle();
        wireComingSoonButtons();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
