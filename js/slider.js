// js/slider.js
document.addEventListener("DOMContentLoaded", () => {
  const slidesEl = document.querySelector(".slides");
  const slides   = document.querySelectorAll(".slide");
  const prevBtn  = document.querySelector(".slider-nav.prev");
  const nextBtn  = document.querySelector(".slider-nav.next");
  let index = 0;
  let slideWidth;

  function updateSlideWidth() {
    slideWidth = slides[0].clientWidth;
  }

  window.addEventListener("resize", updateSlideWidth);
  updateSlideWidth();

  function showSlide(i) {
    index = (i + slides.length) % slides.length;
    slidesEl.style.transform = `translateX(-${index * slideWidth}px)`;
  }

  prevBtn.addEventListener("click", () => showSlide(index - 1));
  nextBtn.addEventListener("click", () => showSlide(index + 1));

  setInterval(() => showSlide(index + 1), 5000);
});
