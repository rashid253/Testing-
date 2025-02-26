document.addEventListener("DOMContentLoaded", function() {
  // Live Chat Toggle Functionality
  var chatToggle = document.getElementById("open-chat");
  var chatWindow = document.getElementById("chat-window");
  var closeChat = document.getElementById("close-chat");

  if (chatToggle && chatWindow && closeChat) {
    chatToggle.addEventListener("click", function() {
      chatWindow.classList.remove("hidden");
    });
    closeChat.addEventListener("click", function() {
      chatWindow.classList.add("hidden");
    });
  }

  // Global openPage function to open links in a new tab/window
  window.openPage = function(url) {
    window.open(url, '_blank');
  };

  // Countdown Timer Functionality for Offer Countdown
  function updateCountdowns() {
    var countdownElements = document.querySelectorAll('.countdown');
    countdownElements.forEach(function(elem) {
      var endTime = new Date(elem.getAttribute('data-offer-end')).getTime();
      var now = new Date().getTime();
      var distance = endTime - now;
      if (distance < 0) {
        elem.querySelector('.timer').textContent = "Expired";
      } else {
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        elem.querySelector('.timer').textContent =
          hours.toString().padStart(2, '0') + ":" +
          minutes.toString().padStart(2, '0') + ":" +
          seconds.toString().padStart(2, '0');
      }
    });
  }
  setInterval(updateCountdowns, 1000);

  // Carousel Functionality (if a carousel exists on the page)
  var nextBtn = document.querySelector('.carousel-nav button:nth-child(2)');
  var prevBtn = document.querySelector('.carousel-nav button:nth-child(1)');
  var currentSlide = 0;
  function showSlide(index) {
    var slides = document.querySelectorAll('.carousel-images img');
    if (slides.length) {
      if (index >= slides.length) { currentSlide = 0; }
      else if (index < 0) { currentSlide = slides.length - 1; }
      else { currentSlide = index; }
      var carouselWidth = document.querySelector('.carousel').clientWidth;
      document.querySelector('.carousel-images').style.transform = 'translateX(' + (-carouselWidth * currentSlide) + 'px)';
    }
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function() { showSlide(currentSlide + 1); });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", function() { showSlide(currentSlide - 1); });
  }
  window.addEventListener('resize', function() { showSlide(currentSlide); });
});
