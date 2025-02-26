document.addEventListener("DOMContentLoaded", function() {
  // Global function to open pages in a new tab/window
  window.openPage = function(url) {
    window.open(url, '_blank');
  };

  // Toggle mobile side menu (for hamburger)
  window.toggleMenu = function() {
    var mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.toggle('visible');
    }
  };
});
