// Header shrink effect (desktop)
window.addEventListener('scroll', function() {
  const header = document.getElementById('header');
  if (window.scrollY > 50) {
    header.classList.add('shrink');
  } else {
    header.classList.remove('shrink');
  }
});

// Mobile hamburger toggle (if applicable)
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger) {
  hamburger.addEventListener('click', function() {
    mobileMenu.style.display = mobileMenu.style.display === 'block' ? 'none' : 'block';
  });
}
function closeMobileMenu() {
  mobileMenu.style.display = 'none';
}

// Back-to-top functionality
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  backToTop.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
