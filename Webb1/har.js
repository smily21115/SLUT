document.addEventListener('DOMContentLoaded', function () {
  // Fade-in effect using IntersectionObserver
  const sections = document.querySelectorAll('section');
  const observerOptions = {
    root: null,
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));

  // Burger menu toggle for collapsible navigation
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      navLinks.classList.toggle('show');
    });
  }
});
