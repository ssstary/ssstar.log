const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const app = express();
const PORT = 3001;
const SITE_ROOT  = path.resolve(__dirname, '..');
const POSTS_DIR  = path.join(SITE_ROOT, 'posts');
const POSTS_JSON = path.join(SITE_ROOT, 'posts', 'posts.json');

const CAT_LABELS = {
  ux: 'UX 분석', a11y: '웹접근성', plan: '기획 공부',
  front: '프론트 팁', story: '이직 기록'
};

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sanitizeSlug(slug) {
  return slug.toLowerCase()
    .replace(/\s+/g, '-').replace(/[^a-z0-9\-가-힣]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

function safePostPath(slug) {
  const p = path.join(POSTS_DIR, `${slug}.html`);
  if (!p.startsWith(POSTS_DIR + path.sep)) throw new Error('잘못된 슬러그');
  return p;
}

// ── HTML builders ──────────────────────────────────────────────────────────

function buildCareerPostHTML({ title, slug, cat, date, desc, tags, body }) {
  const tagSpans = tags.map(t => `      <span class="tag">#${t}</span>`).join('\n');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(title)} — ssstar.log</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/common.css">
<link rel="stylesheet" href="../css/post.css">
</head>
<body>

<nav>
  <a class="nav-logo" href="../index.html">✦ <em>ssstar</em>.log</a>
  <ul class="nav-links">
    <li><a href="../index.html">홈</a></li>
    <li><a href="../posts.html">포스팅</a></li>
    <li><a href="../portfolio.html">포트폴리오</a></li>
    <li><a href="../about.html">소개</a></li>
  </ul>
</nav>

<div class="post-wrap">
  <a class="back-link" href="../posts.html">← 목록으로</a>

  <div class="post-header">
    <div class="post-meta">
      <span class="cat-badge cat-${cat}">${CAT_LABELS[cat]}</span>
      <span class="post-date">${date}</span>
    </div>
    <h1 class="post-title">${escapeHTML(title)}</h1>
    <p class="post-desc">${escapeHTML(desc)}</p>
    <div class="post-tags">
${tagSpans}
    </div>
  </div>

  <div class="ad-slot">Google AdSense 광고 슬롯</div>

  <div class="post-body">
${marked.parse(body)}  </div>

  <div class="ad-slot">Google AdSense 광고 슬롯</div>

</div>

<footer>© 2025 ssstar.log — made with ✦</footer>
</body>
</html>`;
}

function buildDailyPostHTML({ title, date, body }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(title)} — ssstar.log</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/common.css">
<link rel="stylesheet" href="../css/post.css">
</head>
<body>

<nav>
  <a class="nav-logo" href="../index.html">✦ <em>ssstar</em>.log</a>
  <ul class="nav-links">
    <li><a href="../index.html">홈</a></li>
    <li><a href="../posts.html">포스팅</a></li>
    <li><a href="../portfolio.html">포트폴리오</a></li>
    <li><a href="../about.html">소개</a></li>
  </ul>
</nav>

<div class="post-wrap">
  <a class="back-link" href="../index.html">← 돌아가기</a>

  <div class="post-header">
    <div class="post-meta">
      <span class="cat-badge" style="background:rgba(130,200,170,.14);color:#6dbf99;">일상</span>
      <span class="post-date">${date}</span>
    </div>
    <h1 class="post-title">${escapeHTML(title)}</h1>
  </div>

  <div class="post-body">
${marked.parse(body)}  </div>

</div>

<footer>© 2025 ssstar.log — made with ✦</footer>
</body>
</html>`;
}

// posts.html 카드
function buildPostsListCard({ title, slug, cat, date, desc, tags }) {
  const tagSpans = tags.map(t => `<span class="tag">#${t}</span>`).join('');
  return `  <!-- post-start:${slug} -->
  <a class="post-card" href="posts/${slug}.html" data-cat="${cat}">
    <div class="post-meta"><span class="cat-badge cat-${cat}">${CAT_LABELS[cat]}</span><span class="post-date">${date}</span></div>
    <div class="post-title">${escapeHTML(title)}</div>
    <div class="post-desc">${escapeHTML(desc)}</div>
    <div class="post-tags">${tagSpans}</div>
  </a>
  <!-- post-end:${slug} -->`;
}

// index.html Career 창 카드
function buildCareerIndexCard({ slug, cat, date, title }) {
  const shortDate = date.split('.').slice(1).join('.');
  return `          <!-- post-start:${slug} -->
          <a class="wc-post-card" href="posts/${slug}.html"
             data-post="posts/${slug}.html">
            <div class="wc-post-meta">
              <span class="wc-cat wc-cat-${cat}">${CAT_LABELS[cat]}</span>
              <span class="wc-date">${shortDate}</span>
            </div>
            <div class="wc-post-title">${escapeHTML(title)}</div>
          </a>
          <!-- post-end:${slug} -->`;
}

// index.html Daily 창 카드 (날짜+제목만, body는 별도 파일에)
function buildDailyIndexCard({ slug, date, title }) {
  const shortDate = date.split('.').slice(1).join('.');
  return `          <!-- post-start:${slug} -->
          <a class="wc-post-card" href="posts/${slug}.html"
             data-post="posts/${slug}.html">
            <div class="wc-post-meta">
              <span class="wc-cat wc-cat-daily">일상</span>
              <span class="wc-date">${shortDate}</span>
            </div>
            <div class="wc-post-title">${escapeHTML(title)}</div>
          </a>
          <!-- post-end:${slug} -->`;
}

function removeByMarker(html, slug) {
  return html.replace(
    new RegExp(`\\s*<!-- post-start:${slug} -->[\\s\\S]*?<!-- post-end:${slug} -->`, 'g'),
    ''
  );
}

// ── Routes ─────────────────────────────────────────────────────────────────

function readPostsJson() {
  try { return JSON.parse(fs.readFileSync(POSTS_JSON, 'utf8')); }
  catch { return []; }
}

app.get('/api/posts', (req, res) => {
  try {
    res.json(readPostsJson().map(p => ({ slug: p.slug, type: p.type })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', (req, res) => {
  try {
    const { title, date, body } = req.body;
    const type = req.body.type === 'daily' ? 'daily' : 'career';
    const cat  = req.body.cat  || '';
    const desc = req.body.desc || '';
    const tags = (req.body.tags || []).map(t => String(t).trim()).filter(Boolean);
    let { slug } = req.body;

    if (!title || !date || !body)
      return res.status(400).json({ error: '제목, 날짜, 본문은 필수입니다' });
    if (type === 'career' && (!cat || !desc))
      return res.status(400).json({ error: '카테고리와 요약은 필수입니다' });
    if (type === 'career' && !CAT_LABELS[cat])
      return res.status(400).json({ error: '올바르지 않은 카테고리' });

    const base = sanitizeSlug(slug || title);
    slug = type === 'daily'
      ? (base.startsWith('daily-') ? base : `daily-${base || Date.now()}`)
      : (base || `post-${Date.now()}`);

    const postPath = safePostPath(slug);
    if (fs.existsSync(postPath))
      return res.status(409).json({ error: `이미 존재하는 슬러그: ${slug}` });

    const data = { title, slug, cat, date, desc, tags, body };
    const shortDate = date.split('.').slice(1).join('.');

    // HTML 파일 생성
    fs.writeFileSync(postPath,
      type === 'daily' ? buildDailyPostHTML(data) : buildCareerPostHTML(data),
      'utf8'
    );

    // posts.json 맨 앞에 추가
    const entry = type === 'career'
      ? { slug, type, title, date, shortDate, cat, desc, tags }
      : { slug, type, title, date, shortDate };

    const posts = readPostsJson();
    posts.unshift(entry);
    fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2), 'utf8');

    res.json({ success: true, slug, type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:slug', (req, res) => {
  try {
    const slug = sanitizeSlug(req.params.slug);
    const postPath = safePostPath(slug);

    if (!fs.existsSync(postPath))
      return res.status(404).json({ error: '존재하지 않는 포스트' });

    fs.unlinkSync(postPath);

    const posts = readPostsJson().filter(p => p.slug !== slug);
    fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2), 'utf8');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✦  ssstar.log 관리자 서버 실행 중\n   → http://localhost:${PORT}\n`);
});
