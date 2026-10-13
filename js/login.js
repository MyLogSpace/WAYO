/**
 * js/login.js — login.html(로그인) 전용 로직
 * 데모 프로토타입이라 실제 인증은 없고, 시도 시 안내 토스트만 표시합니다.
 */
(function () {
    function wireForm() {
        const form = document.getElementById("loginForm");
        if (!form) return;
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            window.showToast && window.showToast("로그인 기능은 아직 준비 중이에요. 곧 만나요!");
        });
    }

    function wireSocialButtons() {
        document.querySelectorAll(".social-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                window.showToast && window.showToast(`${btn.dataset.provider} 로그인은 준비 중이에요!`);
            });
        });
    }

    function init() {
        wireForm();
        wireSocialButtons();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
