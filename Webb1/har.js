//
document.addEventListener("DOMContentLoaded", function() {
  // letar efter element banner och lagrar den
  const bannerSection = document.querySelector(".banner");

  // animationen
  setTimeout(function() {
    bannerSection.classList.add("fade-in");
  }, 500); // delay innan fade sker
});
