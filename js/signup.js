/**
 * js/signup.js — login.html(회원가입) 전용 로직
 * 데모 프로토타입이라 실제 회원가입 처리는 없고, 시도 시 안내 토스트만 표시합니다.
 * (로그인 자체는 이제 팝업 모달로 처리되며, 그 로직은 js/nav.js에 있습니다.)
 */
(function () {
    function wireForm() {
        const form = document.getElementById("signupForm");
        if (!form) return;
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            window.showToast && window.showToast("회원가입 기능은 아직 준비 중이에요. 곧 만나요!");
        });
    }

    function wireSocialButtons() {
        document.querySelectorAll(".login-modal-sns-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                window.showToast && window.showToast(`${btn.dataset.provider} 회원가입은 준비 중이에요!`);
            });
        });
    }

    function init() {
        wireForm();
        wireSocialButtons();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
