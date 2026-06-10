/* ═══════════════════════════════════════
   StaryOS — os.js
═══════════════════════════════════════ */

'use strict';

/* ─── Toast ─── */
function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons  = { info: '✦', success: '✓', error: '✕' };
  const colors = { info: 'var(--accent)', success: 'var(--dot-g)', error: 'var(--dot-r)' };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML =
    `<span class="toast-icon" style="color:${colors[type]}">${icons[type]}</span>` +
    `<span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/* ─── Blog 2-pane ─── */
async function fetchPost(url, inner) {
  inner.innerHTML = '<div class="blog-loading">loading...</div>';
  try {
    const res  = await fetch(url);
    const html = await res.text();
    const doc  = new DOMParser().parseFromString(html, 'text/html');

    inner.innerHTML = '';
    const header = doc.querySelector('.post-header');
    const body   = doc.querySelector('.post-body');
    if (header) inner.appendChild(document.importNode(header, true));
    if (body)   inner.appendChild(document.importNode(body,   true));
  } catch {
    inner.innerHTML = '<div class="blog-loading" style="color:var(--dot-r)">불러오기에 실패했습니다<br><small style="color:var(--muted2)">GitHub Pages 배포 후 정상 동작합니다</small></div>';
    showToast('포스트 로드 실패 — 배포 환경에서 이용하세요', 'error', 4000);
  }
}

/* ─── Stars (canvas background) ─── */
function initStars() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 140; i++) {
    stars.push({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.1 + 0.2,
      base:  Math.random() * 0.45 + 0.08,
      phase: Math.random() * Math.PI * 2,
      freq:  Math.random() * 0.6 + 0.2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const t = performance.now() * 0.001;
    stars.forEach(s => {
      const a = s.base * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,226,244,${a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ─── Clock ─── */
function initClock() {
  const timeEl = document.getElementById('tbTime');
  const dateEl = document.getElementById('tbDate');
  if (!timeEl) return;

  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const yy = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    timeEl.textContent = `${hh}:${mm}`;
    dateEl.textContent = `${yy}.${mo}.${dd}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ─── Interactive Terminal ─── */
const TERM_HOST = '<span class="term-prompt">ssstar</span>'
                + '<span style="color:var(--muted)">@staryos</span>'
                + '<span style="color:var(--muted)">:~$</span> ';

const TERM_COMMANDS = {
  help: [
    'Available commands:',
    '  help               명령어 목록 보기',
    '  whoami             ssstar 소개',
    '  cat profile.txt    프로필 정보',
    '  ls skills/         보유 스킬 목록',
    '  contact            연락처 정보',
    '  clear              화면 지우기',
  ],
  whoami: [
    'ssstar  —  Web Publisher → Planner',
  ],
  'cat profile.txt': [
    'Name    ssstar',
    'Role    예비 웹기획자',
    'BG      웹 퍼블리셔 출신',
    'Focus   UX 기획 / 웹접근성 / IA 설계',
    'Mail    yoonssstar@gmail.com',
  ],
  'ls skills/': [
    'UX흐름설계  정보구조(IA)  웹접근성  WAI-ARIA',
    'HTML/CSS    JavaScript    Figma     Git',
  ],
  contact: [
    'Email     yoonssstar@gmail.com',
    'GitHub    github.com/ssstar',
    'LinkedIn  추가 예정',
  ],
};

function termAppendCmdLine(history, cmdText) {
  const div = document.createElement('div');
  div.className = 'term-line';
  div.innerHTML = TERM_HOST;
  const cmdSpan = document.createElement('span');
  cmdSpan.className = 'term-cmd';
  cmdSpan.textContent = cmdText;
  div.appendChild(cmdSpan);
  history.appendChild(div);
}

function termAppendOutLine(history, text, isError) {
  const div = document.createElement('div');
  div.className = 'term-line';
  const span = document.createElement('span');
  span.className = isError ? 'term-out term-error' : 'term-out';
  span.textContent = text;
  div.appendChild(span);
  history.appendChild(div);
}

function termAppendBlank(history) {
  const div = document.createElement('div');
  div.className = 'term-blank';
  history.appendChild(div);
}

function termRunCommand(history, raw) {
  const cmd = raw.trim();
  termAppendCmdLine(history, cmd);
  if (cmd === '') return;

  if (cmd === 'clear') {
    history.innerHTML = '';
    return;
  }

  const out = TERM_COMMANDS[cmd];
  if (out) {
    out.forEach(line => termAppendOutLine(history, line));
  } else {
    termAppendOutLine(history, `command not found: ${cmd} (type 'help')`, true);
  }
  termAppendBlank(history);
}

/* Build the terminal DOM & wire up input (run once) */
function initTerminal() {
  const body = document.getElementById('terminalBody');
  if (!body) return;

  body.innerHTML =
    `<div class="term-history" id="termHistory" role="log" aria-live="polite"></div>` +
    `<div class="term-line">${TERM_HOST}<span class="term-cmd" id="termTyped"></span><span class="term-cursor" id="termCursor"></span></div>`;

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'termInput';
  input.className = 'term-hidden-input';
  input.autocomplete = 'off';
  input.autocapitalize = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', '터미널 명령 입력');
  body.appendChild(input);

  const history = document.getElementById('termHistory');
  const typed   = document.getElementById('termTyped');

  let cmdHistory = [];
  let histIndex  = 0;

  body.addEventListener('click', () => {
    if (body.dataset.locked !== 'true') input.focus();
  });

  input.addEventListener('input', () => {
    typed.textContent = input.value;
    body.scrollTop = body.scrollHeight;
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input.value;
      termRunCommand(history, cmd);
      if (cmd.trim() !== '') cmdHistory.push(cmd);
      histIndex = cmdHistory.length;
      input.value = '';
      typed.textContent = '';
      body.scrollTop = body.scrollHeight;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIndex > 0) {
        histIndex--;
        input.value = cmdHistory[histIndex];
        typed.textContent = input.value;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIndex = Math.min(histIndex + 1, cmdHistory.length);
      input.value = cmdHistory[histIndex] || '';
      typed.textContent = input.value;
    }
  });

  body._term = { history, typed, input };
}

/* Reset & replay the 'help' intro every time the window opens */
function openTerminal() {
  const body = document.getElementById('terminalBody');
  const term = body && body._term;
  if (!term) return;
  const { history, typed, input } = term;

  history.innerHTML = '';
  typed.textContent = '';
  input.value = '';
  body.dataset.locked = 'true';

  const helpCmd = 'help';
  let i = 0;
  setTimeout(function typeNext() {
    if (i < helpCmd.length) {
      typed.textContent += helpCmd[i++];
      setTimeout(typeNext, 38);
    } else {
      setTimeout(() => {
        termRunCommand(history, typed.textContent);
        typed.textContent = '';
        body.dataset.locked = 'false';
        body.scrollTop = body.scrollHeight;
        input.focus();
      }, 250);
    }
  }, 300);
}

/* ─── OS Window Manager ─── */
class StaryOS {
  constructor() {
    this.wins    = {};  // { id: { el, open, minimized, savedGeom } }
    this.topZ    = 10;
    this.init();
  }

  init() {
    this.registerWindows();
    this.initDesktopIcons();
    this.initMobileIcons();
    this.initTaskbar();
    this.initStartPanel();
    this.initBlogPane();
    this.initDailyPane();
    this.loadPosts();
    this.loadWindowContents();
    this.initContact();
    initClock();
    initStars();
    initTerminal();
    this.boot();
  }

  /* ── Boot sequence ── */
  boot() {
    const screen = document.getElementById('bootScreen');
    const fill   = document.getElementById('bootFill');
    const status = document.getElementById('bootStatus');
    if (!screen) return;

    const steps = [
      { p: 20,  msg: 'loading components...' },
      { p: 55,  msg: 'rendering stars...' },
      { p: 80,  msg: 'starting services...' },
      { p: 100, msg: 'welcome, ssstar ✦' },
    ];
    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        setTimeout(() => {
          screen.classList.add('done');
          setTimeout(() => {
            screen.remove();
            showToast('환영합니다 ✦ ssstar.log');
          }, 600);
        }, 400);
        return;
      }
      const s = steps[i++];
      fill.style.width   = s.p + '%';
      status.textContent = s.msg;
      setTimeout(run, i === steps.length ? 300 : 320);
    };
    setTimeout(run, 200);
  }

  /* ── Register all .win elements ── */
  registerWindows() {
    document.querySelectorAll('.win').forEach(el => {
      const id = el.id.replace('win-', '');
      this.wins[id] = { el, open: false, minimized: false, savedGeom: null };

      /* Drag */
      const handle = el.querySelector('[data-handle]');
      if (handle) this.makeDraggable(el, handle);

      /* Focus on click */
      el.addEventListener('mousedown', () => this.focus(id), true);

      /* Window control buttons */
      el.querySelectorAll('.win-dot').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const act = btn.dataset.action;
          if (act === 'close') this.close(id);
          if (act === 'min')   this.minimize(id);
          if (act === 'max')   this.toggleMax(id);
        });
      });
    });
  }

  /* ── Open window ── */
  open(id) {
    const w = this.wins[id];
    if (!w) return;
    w.el.classList.add('active');
    w.el.classList.remove('minimized', 'maximized');
    w.open      = true;
    w.minimized = false;
    this.resetWindow(id);
    this.focus(id);
    this.setTaskbarBtn(id, true);
    if (id === 'terminal') openTerminal();
  }

  /* ── Reset window state on every open ── */
  resetWindow(id) {
    const w = this.wins[id];
    if (!w) return;

    /* Scroll to top */
    const body = w.el.querySelector('.win-body');
    if (body) body.scrollTop = 0;

    /* Custom event — future components listen here */
    w.el.dispatchEvent(new CustomEvent('staryos:open', { bubbles: false }));
  }

  /* ── Close window ── */
  close(id) {
    const w = this.wins[id];
    if (!w || !w.open) return;
    this.setTaskbarBtn(id, false);
    w.el.classList.add('closing');
    setTimeout(() => {
      w.el.classList.remove('active', 'minimized', 'maximized', 'closing');
      w.open      = false;
      w.minimized = false;
    }, 150);
  }

  /* ── Minimize window ── */
  minimize(id) {
    const w = this.wins[id];
    if (!w || !w.open) return;
    this.setTaskbarBtn(id, true, true);
    w.el.classList.add('closing');
    setTimeout(() => {
      w.el.classList.remove('closing');
      w.el.classList.add('minimized');
      w.minimized = true;
    }, 130);
  }

  /* ── Restore minimized window ── */
  restore(id) {
    const w = this.wins[id];
    if (!w) return;
    w.el.classList.remove('minimized');
    w.minimized = false;
    this.focus(id);
    this.setTaskbarBtn(id, true, false);
  }

  /* ── Toggle maximize ── */
  toggleMax(id) {
    const w = this.wins[id];
    if (!w) return;
    const el  = w.el;
    const isMx = el.classList.contains('maximized');

    if (isMx) {
      /* Restore */
      const g = w.savedGeom;
      if (g) {
        el.style.width  = g.width;
        el.style.height = g.height;
        el.style.top    = g.top;
        el.style.left   = g.left;
      }
      el.classList.remove('maximized');
    } else {
      /* Save current geometry */
      w.savedGeom = {
        width:  el.style.width  || el.offsetWidth  + 'px',
        height: el.style.height || el.offsetHeight + 'px',
        top:    el.style.top    || el.offsetTop    + 'px',
        left:   el.style.left   || el.offsetLeft   + 'px',
      };
      el.classList.add('maximized');
    }
  }

  /* ── Bring to front ── */
  focus(id) {
    this.topZ++;
    const w = this.wins[id];
    if (w) w.el.style.zIndex = this.topZ;
  }

  /* ── Update taskbar button state ── */
  setTaskbarBtn(id, running, minimized = false) {
    const btn = document.querySelector(`.tb-app[data-win="${id}"]`);
    if (!btn) return;
    btn.classList.toggle('running',   running && !minimized);
    btn.classList.toggle('minimized', running &&  minimized);
  }

  /* ── Desktop icons (PC) ── */
  initDesktopIcons() {
    document.querySelectorAll('.d-icon').forEach(icon => {
      /* Single click → select */
      icon.addEventListener('click', () => {
        document.querySelectorAll('.d-icon').forEach(i => i.classList.remove('sel'));
        icon.classList.add('sel');
      });
      /* Double click → open window */
      icon.addEventListener('dblclick', () => {
        const id = icon.dataset.win;
        const w  = this.wins[id];
        if (w && w.open && !w.minimized) {
          this.focus(id);
        } else if (w && w.minimized) {
          this.restore(id);
        } else {
          this.open(id);
        }
      });
    });

    /* Click on blank desktop → deselect icons */
    document.getElementById('osDesktop')?.addEventListener('click', e => {
      if (!e.target.closest('.d-icon, .win, .taskbar')) {
        document.querySelectorAll('.d-icon').forEach(i => i.classList.remove('sel'));
      }
    });
  }

  /* ── Mobile icon grid ── */
  initMobileIcons() {
    document.querySelectorAll('.m-icon').forEach(icon => {
      icon.addEventListener('click', () => {
        const id = icon.dataset.win;
        const w  = this.wins[id];
        if (w && w.open && !w.minimized) {
          this.focus(id);
        } else {
          this.open(id);
        }
      });
    });
  }

  /* ── Taskbar buttons ── */
  initTaskbar() {
    document.querySelectorAll('.tb-app').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.win;
        const w  = this.wins[id];
        if (!w) return;

        if (!w.open) {
          this.open(id);
        } else if (w.minimized) {
          this.restore(id);
        } else {
          /* Already visible → minimize */
          this.minimize(id);
        }
      });
    });
  }

  /* ── Blog 2-pane ── */
  initBlogPane() {
    const wrap  = document.getElementById('blogWrap');
    const inner = document.getElementById('blogPostInner');
    const back  = document.getElementById('blogBack');
    if (!wrap || !inner) return;

    const reset = () => {
      wrap.classList.remove('has-post');
      inner.innerHTML = '<div class="blog-empty"><span>✦</span><p>포스트를 선택하세요</p></div>';
      wrap.querySelectorAll('.wc-post-card').forEach(c => c.classList.remove('active'));
    };

    wrap.addEventListener('click', async e => {
      const card = e.target.closest('#blogWrap .wc-post-card[data-post]');
      if (!card) return;
      e.preventDefault();
      wrap.querySelectorAll('.wc-post-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      wrap.classList.add('has-post');
      await fetchPost(card.dataset.post, inner);
    });

    back?.addEventListener('click', reset);
    this.wins['blog']?.el.addEventListener('staryos:open', reset);
  }

  /* ── Daily 2-pane ── */
  initDailyPane() {
    const wrap  = document.getElementById('dailyWrap');
    const inner = document.getElementById('dailyPostInner');
    const back  = document.getElementById('dailyBack');
    if (!wrap || !inner) return;

    const reset = () => {
      wrap.classList.remove('has-post');
      inner.innerHTML = '<div class="blog-empty"><span>💬</span><p>포스트를 선택하세요</p></div>';
      wrap.querySelectorAll('.wc-post-card').forEach(c => c.classList.remove('active'));
    };

    wrap.addEventListener('click', async e => {
      const card = e.target.closest('#dailyWrap .wc-post-card[data-post]');
      if (!card) return;
      e.preventDefault();
      wrap.querySelectorAll('.wc-post-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      wrap.classList.add('has-post');
      await fetchPost(card.dataset.post, inner);
    });

    back?.addEventListener('click', reset);
    this.wins['daily']?.el.addEventListener('staryos:open', reset);
  }

  /* ── posts.json 로드 후 카드 렌더링 ── */
  async loadPosts() {
    const CATS = { ux:'UX 분석', a11y:'웹접근성', plan:'기획 공부', front:'프론트 팁', story:'이직 기록' };
    try {
      const res = await fetch('posts/posts.json');
      const posts = await res.json();

      const blogList  = document.querySelector('#blogWrap .blog-list');
      const dailyList = document.querySelector('#dailyWrap .daily-list');

      posts.filter(p => p.type === 'career').forEach(p => {
        const a = document.createElement('a');
        a.className = 'wc-post-card';
        a.href = `posts/${p.slug}.html`;
        a.dataset.post = `posts/${p.slug}.html`;
        a.innerHTML = `<div class="wc-post-meta">
          <span class="wc-cat wc-cat-${p.cat}">${CATS[p.cat]||p.cat}</span>
          <span class="wc-date">${p.shortDate}</span>
        </div>
        <div class="wc-post-title">${p.title}</div>`;
        blogList?.appendChild(a);
      });

      posts.filter(p => p.type === 'daily').forEach(p => {
        const a = document.createElement('a');
        a.className = 'wc-post-card';
        a.href = `posts/${p.slug}.html`;
        a.dataset.post = `posts/${p.slug}.html`;
        a.innerHTML = `<div class="wc-post-meta">
          <span class="wc-cat wc-cat-daily">일상</span>
          <span class="wc-date">${p.shortDate}</span>
        </div>
        <div class="wc-post-title">${p.title}</div>`;
        dailyList?.appendChild(a);
      });
    } catch (e) {
      console.warn('posts.json 로드 실패:', e);
    }
  }

  /* ── 창 콘텐츠 pages/*.html 에서 로드 ── */
  async loadWindowContents() {
    const pages = [
      { id: 'win-works-body',     url: 'pages/works.html' },
      { id: 'win-about-body',     url: 'pages/about.html' },
      { id: 'win-contact-body',   url: 'pages/contact.html' },
      { id: 'win-portfolio-body', url: 'pages/portfolio.html' },
    ];
    await Promise.all(pages.map(async ({ id, url }) => {
      const el = document.getElementById(id);
      if (!el) return;
      try {
        const res = await fetch(url);
        el.innerHTML = await res.text();
      } catch {
        el.innerHTML = '<div style="padding:20px;font-size:12px;color:var(--muted2)">콘텐츠를 불러올 수 없습니다</div>';
      }
    }));
    this.initContact();
  }

  /* ── Contact: 이메일 복사 ── */
  initContact() {
    const btn = document.getElementById('copyEmail');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      navigator.clipboard.writeText(val)
        .then(() => showToast('이메일 복사됨 ✓', 'success', 2500))
        .catch(() => showToast('복사 실패 — 직접 선택하세요', 'error'));
    });
  }

  /* ── Start Panel (✦ button) ── */
  initStartPanel() {
    const btn   = document.querySelector('.tb-start');
    const panel = document.getElementById('startPanel');
    const close = document.getElementById('spClose');
    if (!btn || !panel) return;

    const toggle = (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
    };
    const hide = (e) => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('open');
      }
    };

    btn.addEventListener('click', toggle);
    close?.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.remove('open');
    });
    document.addEventListener('click', hide);

    /* ESC to close */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') panel.classList.remove('open');
    });
  }

  /* ── Drag (mouse + touch) ── */
  makeDraggable(win, handle) {
    let dragging = false, sx, sy, sl, st;

    const start = (cx, cy) => {
      if (win.classList.contains('maximized')) return;
      dragging = true;
      sx = cx; sy = cy;
      sl = win.offsetLeft;
      st = win.offsetTop;
    };
    const move = (cx, cy) => {
      if (!dragging) return;
      const dx = cx - sx, dy = cy - sy;
      const maxL = window.innerWidth  - 60;
      const maxT = window.innerHeight - 60;
      win.style.left = Math.min(maxL, Math.max(-win.offsetWidth + 60, sl + dx)) + 'px';
      win.style.top  = Math.min(maxT, Math.max(0,                     st + dy)) + 'px';
    };
    const end = () => { dragging = false; };

    /* Mouse */
    handle.addEventListener('mousedown', e => {
      if (e.target.closest('.win-dot')) return;
      start(e.clientX, e.clientY);
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    document.addEventListener('mouseup',   end);

    /* Touch */
    handle.addEventListener('touchstart', e => {
      if (e.target.closest('.win-dot')) return;
      const t = e.touches[0];
      start(t.clientX, t.clientY);
    }, { passive: true });
    handle.addEventListener('touchmove', e => {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    handle.addEventListener('touchend', end);
  }
}

/* ─── Boot ─── */
document.addEventListener('DOMContentLoaded', () => {
  window.OS = new StaryOS();
});
