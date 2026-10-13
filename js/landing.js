/**
 * js/landing.js — index.html(랜딩 페이지) 전용 로직
 * 공통 네비게이션/토스트 로직은 js/nav.js 참고.
 */
(function () {
  function updateFindDestinationLink() {
    const btn = document.getElementById("findDestinationBtn");
    if (!btn) return;
    // destination.html의 여행 목적 chip data-value가 홈 화면 취향 카드와 동일한 값
    // (shopping/food/activity/staycation)을 쓰므로 매핑 없이 그대로 전달하면 된다.
    const purposes = Array.from(document.querySelectorAll(".way-card.is-selected")).map(
      (card) => card.dataset.value
    );
    btn.href = purposes.length
      ? `destination.html?purpose=${purposes.join(",")}`
      : "destination.html";
  }

  function wireWayChips() {
    const cards = document.querySelectorAll(".way-card");
    cards.forEach((card) => {
      const bookmark = card.querySelector(".way-card-bookmark");
      const originalIcon = bookmark.getAttribute("data-icon");
      card.addEventListener("click", () => {
        const selected = card.classList.toggle("is-selected");
        bookmark.innerHTML = `<i data-lucide="${selected ? "check" : originalIcon}" style="width:17px;height:17px"></i>`;
        if (window.lucide) lucide.createIcons();
        updateFindDestinationLink();
      });
    });
  }

  function wireWayCardSlideshow() {
    document.querySelectorAll(".way-card").forEach((card) => {
      const slides = card.querySelectorAll(".way-card-slide");
      const tagsEl = card.querySelector(".way-card-tags");
      if (slides.length <= 1) return;

      function renderTags(slide) {
        if (!tagsEl) return;
        const tags = (slide.dataset.tags || "").split(",").filter(Boolean);
        tagsEl.innerHTML = tags.map((tag) => `<span class="way-card-tag">${tag}</span>`).join("");
      }

      let index = 0;
      renderTags(slides[index]);
      setInterval(() => {
        slides[index].classList.remove("is-active");
        index = (index + 1) % slides.length;
        slides[index].classList.add("is-active");
        renderTags(slides[index]);
      }, 3000);
    });
  }

  function wireHeroRotation() {
    const cards = [
      {
        img: document.getElementById("heroImg1"),
        pin: document.getElementById("heroPin1"),
        title: document.getElementById("heroTitle1"),
        match: document.getElementById("heroMatch1"),
        textWrap: document.getElementById("heroText1"),
        items: [
          { img: "assets/image/PAGE 01/hero/도쿄.jpg", pin: "TOKYO", title: "TOKYO", match: 94 },
          { img: "assets/image/PAGE 01/hero/네덜란드.jpg", pin: "GIETHOORN", title: "GIETHOORN", match: 88 },
        ],
      },
      {
        img: document.getElementById("heroImg2"),
        pin: document.getElementById("heroPin2"),
        title: document.getElementById("heroTitle2"),
        loc: document.getElementById("heroLoc2"),
        match: document.getElementById("heroMatch2"),
        textWrap: document.getElementById("heroText2"),
        matchWrap: document.getElementById("heroMatchWrap2"),
        items: [
          { img: "assets/image/PAGE 01/hero/이탈리아1.jpg", pin: "VENICE", title: "VENICE", loc: "Venice, Italy", match: 92 },
          { img: "assets/image/PAGE 01/hero/이탈리아2.jpg", pin: "VENICE", title: "VENICE", loc: "Venice, Italy", match: 92 },
          { img: "assets/image/PAGE 01/hero/체코.jpg", pin: "PRAGUE", title: "PRAGUE", loc: "Prague, Czech Republic", match: 85 },
        ],
      },
      {
        img: document.getElementById("heroImg3"),
        pin: document.getElementById("heroPin3"),
        title: document.getElementById("heroTitle3"),
        match: document.getElementById("heroMatch3"),
        textWrap: document.getElementById("heroText3"),
        items: [
          { img: "assets/image/PAGE 01/hero/미국.jpg", pin: "NEW YORK", title: "NEW YORK", match: 90 },
          { img: "assets/image/PAGE 01/hero/오스트리아.jpg", pin: "HALLSTATT", title: "HALLSTATT", match: 86 },
        ],
      },
    ];

    cards.forEach((card, cardIndex) => {
      if (!card.img) return;
      let index = 0;
      setInterval(() => {
        index = (index + 1) % card.items.length;
        const next = card.items[index];
        card.img.style.opacity = "0";
        card.textWrap.style.opacity = "0";
        if (card.matchWrap) card.matchWrap.style.opacity = "0";
        setTimeout(() => {
          card.img.src = next.img;
          card.pin.textContent = next.pin;
          card.title.textContent = next.title;
          if (card.loc) card.loc.textContent = next.loc;
          card.match.textContent = next.match;
          card.img.style.opacity = "1";
          card.textWrap.style.opacity = "1";
          if (card.matchWrap) card.matchWrap.style.opacity = "1";
        }, 500);
      }, 4000 + cardIndex * 1300);
    });
  }

  function wireChecklistReveal() {
    const list = document.getElementById("planChecklist");
    if (!list) return;
    const items = list.querySelectorAll(".check-item");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          items.forEach((item) => item.classList.add("is-visible"));
          observer.disconnect();
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(list);
  }

  // "From Place to Plan" 카드의 1/2/3일차 일정 이미지를 우→좌 슬라이드로 자동 전환한다.
  // 마지막 장 다음에도 계속 왼쪽으로 넘어가서 1번으로 돌아가도록, 트랙 끝에 1번의 복제본을
  // 하나 붙여두고(HTML), 그 복제본에 도착하면 트랜지션 없이 진짜 1번 위치로 순간 이동한다.
  function wireItinSlider() {
    const track = document.getElementById("itinSliderTrack");
    if (!track) return;
    const slides = track.querySelectorAll(".itin-slide");
    if (slides.length <= 1) return;

    const step = 100 / slides.length;
    let index = 0;

    setInterval(() => {
      index += 1;
      track.style.transform = `translateX(-${index * step}%)`;

      if (index === slides.length - 1) {
        track.addEventListener(
          "transitionend",
          () => {
            track.classList.add("no-transition");
            index = 0;
            track.style.transform = "translateX(0%)";
            track.offsetHeight; // 강제 리플로우 — 트랜지션 없는 상태로 즉시 반영
            track.classList.remove("no-transition");
          },
          { once: true }
        );
      }
    }, 4000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireWayChips();
    wireWayCardSlideshow();
    wireHeroRotation();
    wireChecklistReveal();
    wireItinSlider();
  });
})();
