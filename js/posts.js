const CATS = { ux:'UX 분석', a11y:'웹접근성', plan:'기획 공부', front:'프론트 팁', story:'이직 기록' };

(async () => {
  try {
    const res   = await fetch('posts/posts.json');
    const posts = await res.json();
    const list  = document.getElementById('postList');

    posts.filter(p => p.type === 'career').forEach(p => {
      const tagSpans = (p.tags || []).map(t => `<span class="tag">#${t}</span>`).join('');
      const a = document.createElement('a');
      a.className = 'post-card';
      a.href = `posts/${p.slug}.html`;
      a.dataset.cat = p.cat;
      a.innerHTML = `
        <div class="post-meta"><span class="cat-badge cat-${p.cat}">${CATS[p.cat]||p.cat}</span><span class="post-date">${p.date}</span></div>
        <div class="post-title">${p.title}</div>
        <div class="post-desc">${p.desc||''}</div>
        <div class="post-tags">${tagSpans}</div>`;
      list.appendChild(a);
    });
  } catch (e) {
    console.warn('posts.json 로드 실패:', e);
  }
})();

const btns = document.querySelectorAll('.filter-btn');
btns.forEach(btn => {
  btn.addEventListener('click', () => {
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    document.querySelectorAll('.post-card').forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.cat === cat) ? 'block' : 'none';
    });
  });
});
