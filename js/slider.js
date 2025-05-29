// slider.js - Responsive slider initialization and navigation

document.addEventListener("DOMContentLoaded", () => {
  // Initialize all sliders on the page
  const sliders = document.querySelectorAll('.slider-wrapper');
  sliders.forEach(sliderWrapper => {
    initializeSlider(sliderWrapper);
  });
});

function initializeSlider(sliderWrapper) {
  const elements = {
    slidesContainer: sliderWrapper.querySelector(".slides"),
    slides: sliderWrapper.querySelectorAll(".slide"),
    prevBtn: sliderWrapper.querySelector(".slider-nav.prev"),
    nextBtn: sliderWrapper.querySelector(".slider-nav.next"),
    sliderWindow: sliderWrapper.querySelector(".slider-window") || sliderWrapper
  };

  // Abort if required elements are not available
  if (!elements.slides.length || !elements.slidesContainer) return;

  let currentIndex = 0;
  let isAnimating = false;
  let slidesPerView = 1;
  let slideWidth = 0;
  const totalSlides = elements.slides.length;

  // Determine how many slides should be visible based on screen width
  const getSlidesPerView = () => {
    const width = window.innerWidth;
    if (width >= 1200) return Math.min(4, totalSlides);
    if (width >= 992) return Math.min(3, totalSlides);
    if (width >= 768) return Math.min(2, totalSlides);
    return 1;
  };

  // Adjust slide dimensions and spacing for responsive layout
  const updateDimensions = () => {
    const containerWidth = elements.sliderWindow.clientWidth;
    slidesPerView = getSlidesPerView();

    const gap = 16;
    const totalGaps = (slidesPerView - 1) * gap;
    slideWidth = (containerWidth - totalGaps) / slidesPerView;

    const containerTotalWidth = (slideWidth * totalSlides) + (gap * (totalSlides - 1));
    elements.slidesContainer.style.width = `${containerTotalWidth}px`;

    elements.slides.forEach((slide, index) => {
      slide.style.width = `${slideWidth}px`;
      slide.style.minWidth = `${slideWidth}px`;
      slide.style.marginRight = index < totalSlides - 1 ? `${gap}px` : '0';
    });

    updateNavButtons();
  };

  // Enable/disable navigation buttons based on the current position
  const updateNavButtons = () => {
    if (!elements.prevBtn || !elements.nextBtn) return;

    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    elements.prevBtn.disabled = currentIndex <= 0;
    elements.nextBtn.disabled = currentIndex >= maxIndex;

    elements.prevBtn.style.opacity = currentIndex <= 0 ? '0.3' : '0.7';
    elements.nextBtn.style.opacity = currentIndex >= maxIndex ? '0.3' : '0.7';
  };

  // Move the slider to a specific index
  const navigateToIndex = (newIndex) => {
    if (isAnimating) return;

    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    currentIndex = Math.max(0, Math.min(newIndex, maxIndex));
    isAnimating = true;

    const gap = 16;
    const translateX = currentIndex * (slideWidth + gap);
    elements.slidesContainer.style.transform = `translateX(-${translateX}px)`;

    updateNavButtons();

    // Unlock animation after transition completes
    setTimeout(() => {
      isAnimating = false;
    }, 500);
  };

  // Initialize layout and event listeners
  const initSlider = () => {
    elements.slidesContainer.style.display = 'flex';
    elements.slidesContainer.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    elements.slidesContainer.style.transform = 'translateX(0)';
    elements.sliderWindow.style.overflow = 'hidden';
    elements.sliderWindow.style.width = '100%';

    updateDimensions();
    navigateToIndex(0);
  };

  // Navigation button events
  if (elements.prevBtn) {
    elements.prevBtn.addEventListener('click', () => {
      navigateToIndex(currentIndex - 1);
    });
  }

  if (elements.nextBtn) {
    elements.nextBtn.addEventListener('click', () => {
      navigateToIndex(currentIndex + 1);
    });
  }

  // Recalculate layout on window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateDimensions();
      navigateToIndex(currentIndex);
    }, 150);
  });

  // Initialize slider after DOM is fully ready
  setTimeout(initSlider, 150);
}
