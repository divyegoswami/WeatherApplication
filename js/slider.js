// This script initializes and controls responsive content sliders (carousels).

// Waits for the DOM to be fully loaded before initializing sliders.
document.addEventListener("DOMContentLoaded", () => {
  // Finds all elements with the class 'slider-wrapper'.
  const sliderWrappers = document.querySelectorAll('.slider-wrapper');
  // Initializes each found slider.
  sliderWrappers.forEach(sliderWrapper => {
    initializeSlider(sliderWrapper);
  });
});

/**
 * Initializes a single slider instance.
 * Sets up its dimensions, navigation, and responsiveness.
 * @param {HTMLElement} sliderWrapper - The main container element for the slider.
 */
function initializeSlider(sliderWrapper) {
  // Holds references to key slider elements.
  const elements = {
    slidesContainer: sliderWrapper.querySelector(".slides"),
    slides: sliderWrapper.querySelectorAll(".slide"),
    prevBtn: sliderWrapper.querySelector(".slider-nav.prev"),
    nextBtn: sliderWrapper.querySelector(".slider-nav.next"),
    sliderWindow: sliderWrapper.querySelector(".slider-window") || sliderWrapper
  };

  // Aborts initialization if essential slide elements are missing.
  if (!elements.slides.length || !elements.slidesContainer) {
    console.warn("Slider initialization aborted: Missing .slides container or .slide elements within", sliderWrapper);
    return;
  }

  // --- Slider State Variables ---
  let currentIndex = 0;      // Index of the first visible slide.
  let isAnimating = false;   // Prevents navigation during animation.
  let slidesPerView = 1;     // Number of slides visible at once.
  let slideWidth = 0;        // Calculated width of a single slide.
  const totalSlides = elements.slides.length;
  const slideGap = 16;       // Gap (in pixels) between slides.

  // --- Responsive and Update Functions ---

  // Determines slides per view based on window width.
  const getSlidesPerView = () => {
    const windowWidth = window.innerWidth;
    if (windowWidth >= 1200) return Math.min(4, totalSlides);
    if (windowWidth >= 992) return Math.min(3, totalSlides);
    if (windowWidth >= 768) return Math.min(2, totalSlides);
    return 1;
  };

  // Updates the state (enabled/disabled) of navigation buttons.
  const updateNavButtons = () => {
    if (!elements.prevBtn || !elements.nextBtn) return; // Skips if nav buttons aren't present.

    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    elements.prevBtn.disabled = currentIndex <= 0;
    elements.nextBtn.disabled = currentIndex >= maxIndex;

    elements.prevBtn.style.opacity = elements.prevBtn.disabled ? '0.3' : '0.7';
    elements.nextBtn.style.opacity = elements.nextBtn.disabled ? '0.3' : '0.7';
  };

  // Updates slide and container dimensions for responsiveness.
  const updateDimensions = () => {
    const containerWidth = elements.sliderWindow.clientWidth;
    slidesPerView = getSlidesPerView();

    const totalGapsWidth = (slidesPerView - 1) * slideGap;
    slideWidth = (containerWidth - totalGapsWidth) / slidesPerView;

    const containerTotalWidth = (slideWidth * totalSlides) + (slideGap * (totalSlides - 1));
    elements.slidesContainer.style.width = `${containerTotalWidth}px`;

    elements.slides.forEach((slide, index) => {
      slide.style.width = `${slideWidth}px`;
      slide.style.minWidth = `${slideWidth}px`;
      slide.style.marginRight = index < totalSlides - 1 ? `${slideGap}px` : '0';
    });

    updateNavButtons(); // Updates nav button states based on new dimensions.
  };

  // --- Navigation Logic ---

  // Moves the slider to a specified slide index.
  const navigateToIndex = (newIndex) => {
    if (isAnimating) return; // Prevents navigation if an animation is in progress.

    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    currentIndex = Math.max(0, Math.min(newIndex, maxIndex)); // Clamps index within bounds.

    isAnimating = true;

    const translateX = currentIndex * (slideWidth + slideGap);
    elements.slidesContainer.style.transform = `translateX(-${translateX}px)`;

    updateNavButtons();

    // Releases animation lock after CSS transition.
    setTimeout(() => {
      isAnimating = false;
    }, 500); // Matches CSS transition duration.
  };

  // --- Initial Setup ---
  // Sets initial styles for the slider.
  elements.slidesContainer.style.display = 'flex';
  elements.slidesContainer.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  elements.slidesContainer.style.transform = 'translateX(0)';
  elements.sliderWindow.style.overflow = 'hidden';
  elements.sliderWindow.style.width = '100%';

  updateDimensions(); // Calculates and applies initial dimensions.
  navigateToIndex(0); // Moves to the first slide.

  // --- Event Listeners ---

  // Handles previous button click.
  if (elements.prevBtn) {
    elements.prevBtn.addEventListener('click', () => {
      navigateToIndex(currentIndex - 1);
    });
  }

  // Handles next button click.
  if (elements.nextBtn) {
    elements.nextBtn.addEventListener('click', () => {
      navigateToIndex(currentIndex + 1);
    });
  }

  // Handles window resize for responsiveness.
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout); // Clears previous timeout to debounce.
    // Debounces resize handling for performance.
    resizeTimeout = setTimeout(() => {
      updateDimensions();
      navigateToIndex(currentIndex); // Adjusts position based on new dimensions.
    }, 150); // Waits 150ms after resize stops.
  });
}