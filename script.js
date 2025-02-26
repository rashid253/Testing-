document.addEventListener("DOMContentLoaded", function() {
  // Global function to open pages in a new tab/window
  window.openPage = function(url) {
    window.open(url, '_blank');
  };

  // Toggle mobile side menu
  window.toggleSideMenu = function() {
    const sideMenu = document.getElementById("side-menu");
    if (sideMenu) {
      sideMenu.classList.toggle("visible");
    }
  };
});
