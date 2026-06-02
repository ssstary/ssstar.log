(function () {
  // ── 페이지 페이드인 ──
  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('page-in');
    initStrip();
  });

  // ── 내부 링크 페이드아웃 후 이동 ──
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href[0] === '#' || /^(https?:|mailto:)/.test(href)) return;
    e.preventDefault();
    var dest = href;
    document.body.classList.remove('page-in');
    setTimeout(function () { window.location.href = dest; }, 230);
  });

  // ── 슬라이딩 인디케이터 바 ──
  function initStrip() {
    var bar    = document.querySelector('.ps-bar');
    var active = document.querySelector('.ps-item.active');
    var items  = document.querySelectorAll('.ps-item');
    var wrap   = document.querySelector('.ps-items');
    if (!bar || !active || !wrap) return;

    function move(el, animate) {
      var wr = wrap.getBoundingClientRect();
      var er = el.getBoundingClientRect();
      bar.style.transition = animate
        ? 'left .26s cubic-bezier(.4,0,.2,1), width .26s cubic-bezier(.4,0,.2,1)'
        : 'none';
      bar.style.left  = (er.left - wr.left) + 'px';
      bar.style.width = er.width + 'px';
      if (!animate) bar.getBoundingClientRect(); // force reflow
    }

    move(active, false);

    items.forEach(function (item) {
      item.addEventListener('mouseenter', function () { move(item, true); });
      item.addEventListener('mouseleave', function () { move(active, true); });
    });
  }
})();
