const btns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.post-card');
btns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    btns.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    cards.forEach(function(card) {
      if (cat === 'all' || card.dataset.cat === cat) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
});
