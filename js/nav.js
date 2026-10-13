/**
 * js/nav.js — 모든 페이지 공통 네비게이션 로직
 * - 모바일 메뉴 토글
 * - 토스트 알림 (준비 중 안내 등, 다른 페이지 스크립트에서도 window.showToast로 재사용)
 * - 아직 만들지 않은 페이지로 가는 링크는 "준비 중" 토스트로 안내 (깨진 링크로 보이지 않게)
 */
(function () {
  function toggleMobileNav() {
    const links = document.getElementById("navLinks");
    const toggle = document.getElementById("navToggle");
    if (!links || !toggle) return;
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }
  window.showToast = showToast;

  // data-coming-soon 속성이 있는 링크는 아직 만들어지지 않은 페이지로 가는 자리표시자입니다.
  // 페이지가 만들어지면 이 속성과 핸들러를 지우고 실제 href만 남기면 됩니다.
  function wireComingSoonLinks() {
    document.querySelectorAll("[data-coming-soon]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        showToast(el.getAttribute("data-coming-soon") || "곧 만나요! 다음 페이지를 준비하고 있어요.");
      });
    });
  }

  // 홈 화면(#siteNavbar)에만 있는 2단 내비바. 스크롤을 조금이라도 내리면 상단(로고·유틸)
  // 줄이 자동으로 숨겨지고, 다시 맨 위로 올라오면 자동으로 나타난다. 하단 카테고리 줄은
  // 항상 고정 노출된다.
  function wireNavbarScroll() {
    const navbar = document.getElementById("siteNavbar");
    if (!navbar) return;

    const THRESHOLD = 10;

    function update() {
      navbar.classList.toggle("is-scrolled", window.scrollY > THRESHOLD);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // 상단 유틸 영역의 검색 아이콘 — 누르면 입력창이 펼쳐지고, 한 번 더 누르거나
  // Enter를 치면 검색 기능은 아직 준비 중이라는 토스트를 보여준다.
  // 검색 자동완성 — window.DESTINATION_DETAILS(js/destination-detail-data.js)에서
  // 도시명/국가명이 일치하는 여행지를 찾아 드롭다운으로 보여준다. 항목을 클릭하면 해당
  // 도시 상세 페이지로, Enter나 "전체 결과 보기"를 누르면 검색어를 들고 여행지 추천
  // 페이지(destination.html)로 이동한다.
  function buildSearchDropdown(input) {
    const dropdown = document.createElement("div");
    dropdown.className = "navbar-search-dropdown";
    dropdown.id = "navSearchDropdown";
    input.insertAdjacentElement("afterend", dropdown);
    return dropdown;
  }

  function searchDestinations(query) {
    const all = window.DESTINATION_DETAILS || {};
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.entries(all)
      .filter(([slug, d]) => {
        return (
          d.city.toLowerCase().includes(q) ||
          (d.countryKo || "").toLowerCase().includes(q) ||
          (d.countryEn || "").toLowerCase().includes(q) ||
          slug.toLowerCase().includes(q)
        );
      })
      .map(([slug, d]) => ({ slug, ...d }))
      .slice(0, 6);
  }

  function renderSearchDropdown(dropdown, query, results) {
    if (!query.trim()) {
      dropdown.classList.remove("is-open");
      dropdown.innerHTML = "";
      return;
    }

    if (!results.length) {
      dropdown.innerHTML = `<div class="navbar-search-empty">"${query}"에 대한 검색 결과가 없어요.</div>`;
      dropdown.classList.add("is-open");
      return;
    }

    const items = results
      .map(
        (d) => `
        <a href="destination-detail.html?city=${d.slug}" class="navbar-search-item">
          <img src="${d.heroImg}" alt="${d.city}" class="navbar-search-item-img">
          <span class="navbar-search-item-text">
            <span class="navbar-search-item-city">${d.city}</span>
            <span class="navbar-search-item-country">${d.countryKo}</span>
          </span>
          <span class="navbar-search-item-match">${d.match}%</span>
        </a>`
      )
      .join("");

    dropdown.innerHTML = `
      ${items}
      <a href="destination.html?q=${encodeURIComponent(query)}" class="navbar-search-viewall">
        "${query}" 전체 결과 보기
        <i data-lucide="arrow-right" style="width:13px;height:13px"></i>
      </a>`;
    dropdown.classList.add("is-open");
    if (window.lucide) lucide.createIcons();
  }

  function wireNavSearch() {
    const btn = document.getElementById("navSearchBtn");
    const input = document.getElementById("navSearchInput");
    if (!btn || !input) return;

    const dropdown = buildSearchDropdown(input);

    btn.addEventListener("click", () => {
      const isOpen = input.classList.toggle("is-open");
      if (isOpen) {
        input.focus();
      } else {
        dropdown.classList.remove("is-open");
      }
    });

    input.addEventListener("input", () => {
      const results = searchDestinations(input.value);
      renderSearchDropdown(dropdown, input.value, results);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = input.value.trim();
        if (query) {
          window.location.href = `destination.html?q=${encodeURIComponent(query)}`;
        }
      } else if (e.key === "Escape") {
        dropdown.classList.remove("is-open");
      }
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        dropdown.classList.remove("is-open");
      }
    });
  }

  // 우측 하단 플로팅 버튼: 일정 스크롤 이상 내려가면 나타나고, 누르면 맨 위로 스크롤한다.
  function wireScrollTopButton() {
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return;
    const THRESHOLD = 400;

    function update() {
      btn.classList.toggle("is-visible", window.scrollY > THRESHOLD);
    }

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // 로그인 팝업 모달 — 모든 페이지에서 공통으로 쓰는 컴포넌트라 HTML에 직접 넣지 않고
  // 여기서 body에 동적으로 삽입한다. class="js-login-trigger"가 붙은 링크를 누르면
  // 페이지 이동 없이 이 모달이 뜬다. 모달 안의 "회원가입"/"로그인" 전환 링크를 누르면
  // 페이지 이동 없이 같은 팝업 안에서 로그인 폼 ↔ 회원가입 폼이 바뀐다.
  function loginFormMarkup() {
    return `
      <div class="login-modal-brand">
        <img src="assets/logo/w3_logo_3_2.png" alt="WAYO 로고">
      </div>
      <form class="login-modal-form" id="loginModalForm">
        <div class="login-modal-field">
          <input type="email" id="loginModalEmail" placeholder="you@example.com" aria-label="이메일" required>
        </div>
        <div class="login-modal-field">
          <input type="password" id="loginModalPassword" placeholder="비밀번호를 입력하세요" aria-label="비밀번호" required>
        </div>
        <div class="login-modal-row">
          <label class="login-modal-checkbox">
            <input type="checkbox">
            아이디 저장
          </label>
        </div>
        <button type="submit" class="login-modal-submit">로그인</button>
      </form>
      <div class="login-modal-utility-row">
        <a href="#" id="loginModalFindId">아이디 찾기</a>
        <span class="login-modal-utility-divider">|</span>
        <a href="#" id="loginModalFindPw">비밀번호 찾기</a>
        <span class="login-modal-utility-divider">|</span>
        <a href="#" id="loginModalGoSignup">회원가입</a>
      </div>
      <p class="login-modal-sns-label">또는</p>
      <div class="login-modal-sns-row">
        <button type="button" class="login-modal-sns-btn is-naver" data-provider="네이버" aria-label="네이버로 로그인">
          <span class="login-modal-sns-icon"><img src="assets/회원가입/naver.ico" alt="네이버"></span>
          <span class="login-modal-sns-text">네이버</span>
        </button>
        <button type="button" class="login-modal-sns-btn is-kakao" data-provider="카카오" aria-label="카카오로 로그인">
          <span class="login-modal-sns-icon"><img src="assets/회원가입/kakao.png" alt="카카오"></span>
          <span class="login-modal-sns-text">카카오</span>
        </button>
        <button type="button" class="login-modal-sns-btn is-google" data-provider="구글" aria-label="구글로 로그인">
          <span class="login-modal-sns-icon"><img src="assets/회원가입/google.png" alt="구글"></span>
          <span class="login-modal-sns-text">구글</span>
        </button>
      </div>`;
  }

  function signupFormMarkup() {
    return `
      <div class="login-modal-brand">
        <img src="assets/logo/w3_logo_3_2.png" alt="WAYO 로고">
      </div>
      <form class="login-modal-form" id="loginModalForm">
        <div class="login-modal-field">
          <label for="signupModalName">이름</label>
          <input type="text" id="signupModalName" placeholder="이름을 입력하세요" required>
        </div>
        <div class="login-modal-field">
          <label for="signupModalEmail">이메일</label>
          <input type="email" id="signupModalEmail" placeholder="you@example.com" required>
        </div>
        <div class="login-modal-field">
          <label for="signupModalPassword">비밀번호</label>
          <input type="password" id="signupModalPassword" placeholder="8자 이상 입력하세요" required>
        </div>
        <div class="login-modal-field">
          <label for="signupModalPasswordConfirm">비밀번호 확인</label>
          <input type="password" id="signupModalPasswordConfirm" placeholder="비밀번호를 다시 입력하세요" required>
        </div>
        <label class="login-modal-checkbox">
          <input type="checkbox" required>
          이용약관 및 개인정보처리방침에 동의합니다
        </label>
        <button type="submit" class="login-modal-submit">회원가입</button>
      </form>
      <p class="login-modal-sns-label">또는</p>
      <div class="login-modal-sns-row">
        <button type="button" class="login-modal-sns-btn is-naver" data-provider="네이버" aria-label="네이버로 회원가입">
          <span class="login-modal-sns-icon"><img src="assets/회원가입/naver.ico" alt="네이버"></span>
          <span class="login-modal-sns-text">네이버</span>
        </button>
        <button type="button" class="login-modal-sns-btn is-kakao" data-provider="카카오" aria-label="카카오로 회원가입">
          <span class="login-modal-sns-icon"><img src="assets/회원가입/kakao.png" alt="카카오"></span>
          <span class="login-modal-sns-text">카카오</span>
        </button>
        <button type="button" class="login-modal-sns-btn is-google" data-provider="구글" aria-label="구글로 회원가입">
          <span class="login-modal-sns-icon"><img src="assets/회원가입/google.png" alt="구글"></span>
          <span class="login-modal-sns-text">구글</span>
        </button>
      </div>
      <p class="login-modal-foot">
        이미 계정이 있으신가요?
        <a href="#" id="loginModalGoLogin">로그인</a>
      </p>`;
  }

  function injectLoginModal() {
    if (document.getElementById("loginModalOverlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "login-modal-overlay";
    overlay.id = "loginModalOverlay";
    overlay.innerHTML = `
      <div class="login-modal-card" id="loginModalCard" role="dialog" aria-modal="true" aria-label="로그인">
        <button type="button" class="login-modal-close" id="loginModalClose" aria-label="닫기">
          <i data-lucide="x" style="width:18px;height:18px"></i>
        </button>
        <div id="loginModalBody"></div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function wireLoginModal() {
    injectLoginModal();
    const overlay = document.getElementById("loginModalOverlay");
    const body = document.getElementById("loginModalBody");
    if (!overlay || !body) return;

    function openModal(e) {
      if (e) e.preventDefault();
      renderMode("login");
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    // 모드(로그인/회원가입)에 따라 팝업 내용을 다시 그리고, 그때마다 이벤트를 새로 연결한다.
    function renderMode(mode) {
      body.innerHTML = mode === "signup" ? signupFormMarkup() : loginFormMarkup();
      overlay.setAttribute("aria-label", mode === "signup" ? "회원가입" : "로그인");
      if (window.lucide) lucide.createIcons();

      document.getElementById("loginModalForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast(
          mode === "signup"
            ? "회원가입 기능은 아직 준비 중이에요. 곧 만나요!"
            : "로그인 기능은 아직 준비 중이에요. 곧 만나요!"
        );
      });

      document.getElementById("loginModalFindId")?.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("아이디 찾기 기능을 준비하고 있어요!");
      });

      document.getElementById("loginModalFindPw")?.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("비밀번호 찾기 기능을 준비하고 있어요!");
      });

      body.querySelectorAll(".login-modal-sns-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          showToast(`${btn.dataset.provider} ${mode === "signup" ? "회원가입" : "로그인"}은 준비 중이에요!`);
        });
      });

      document.getElementById("loginModalGoSignup")?.addEventListener("click", (e) => {
        e.preventDefault();
        renderMode("signup");
      });

      document.getElementById("loginModalGoLogin")?.addEventListener("click", (e) => {
        e.preventDefault();
        renderMode("login");
      });
    }

    // 사이트 전체에서 class="js-login-trigger"가 붙은 "로그인" 링크를 전부 가로챈다.
    document.querySelectorAll(".js-login-trigger").forEach((link) => {
      link.addEventListener("click", openModal);
    });

    document.getElementById("loginModalClose")?.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeModal();
    });
  }

  // 사이드 드로어 메뉴(햄버거 → 카테고리 목록) — 전 페이지 공통.
  // destination-detail.js가 방문 시 저장해둔 "최근 본 여행지" 목록을 드로어 메뉴에 그린다.
  const RECENT_KEY = "wayoRecentViews";
  let currentSort = "none";

  function sortRecentList(list, sortKey) {
    const sorted = [...list];
    if (sortKey === "name") {
      sorted.sort((a, b) => a.city.localeCompare(b.city));
    } else if (sortKey === "country") {
      sorted.sort((a, b) => (a.countryKo || "").localeCompare(b.countryKo || ""));
    }
    // "none"은 저장된 순서(최근 방문순) 그대로 둔다.
    return sorted;
  }

  function renderDrawerRecent() {
    const wrap = document.getElementById("drawerRecentList");
    if (!wrap) return;

    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch (e) {
      list = [];
    }

    if (!list.length) {
      wrap.innerHTML = "";
    } else {
      wrap.innerHTML = sortRecentList(list, currentSort)
        .map(
          (item) => `
          <a href="destination-detail.html?city=${item.slug}" class="wayo-drawer-recent-item">
            <span class="wayo-drawer-recent-icon"><i data-lucide="map-pin" style="width:15px;height:15px"></i></span>
            <span class="wayo-drawer-recent-text">
              <span class="wayo-drawer-recent-city">${item.city}</span>
              <span class="wayo-drawer-recent-country">${item.countryKo || ""}</span>
            </span>
          </a>`
        )
        .join("");
    }
    if (window.lucide) lucide.createIcons();
  }

  // "최근 본 여행지" 옆 정렬 아이콘 → 드롭다운(없음/이름순/국가별)
  function wireDrawerSort() {
    const btn = document.getElementById("drawerSortBtn");
    const menu = document.getElementById("drawerSortMenu");
    if (!btn || !menu) return;

    function closeMenu() {
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    menu.querySelectorAll(".wayo-drawer-sort-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        currentSort = opt.dataset.sort;
        menu.querySelectorAll(".wayo-drawer-sort-option").forEach((o) => o.classList.remove("is-active"));
        opt.classList.add("is-active");
        renderDrawerRecent();
        closeMenu();
      });
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== btn) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  function wireDrawerMenu() {
    const toggleBtn = document.getElementById("drawerToggleBtn");
    const closeBtn = document.getElementById("drawerCloseBtn");
    const backdrop = document.getElementById("drawerBackdrop");
    const panel = document.getElementById("drawerPanel");
    if (!toggleBtn || !panel || !backdrop) return;

    function openDrawer() {
      renderDrawerRecent();
      panel.classList.add("is-open");
      backdrop.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      toggleBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      panel.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      toggleBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    toggleBtn.addEventListener("click", openDrawer);
    renderDrawerRecent();
    closeBtn?.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) closeDrawer();
    });
  }

  function init() {
    const toggle = document.getElementById("navToggle");
    if (toggle) toggle.addEventListener("click", toggleMobileNav);
    wireComingSoonLinks();
    wireNavbarScroll();
    wireNavSearch();
    wireScrollTopButton();
    wireLoginModal();
    wireDrawerMenu();
    wireDrawerSort();
    if (window.lucide) lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", init);
})();


// 이미지 파일이 없거나 깨지면 깨진 아이콘 대신 자리표시 이미지로 바꾼다.
(function () {
    const FALLBACK = "no-photo.svg";
    function fix(img) {
        if (img.getAttribute("src") && !img.src.endsWith(FALLBACK)) img.src = FALLBACK;
    }
    document.addEventListener("error", (e) => {
        if (e.target instanceof HTMLImageElement) fix(e.target);
    }, true);
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("img").forEach((img) => {
            if (img.complete && img.naturalWidth === 0) fix(img);
        });
    });
})();
