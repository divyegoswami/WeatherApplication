// This script initializes and controls responsive content sliders (carousels).

// Wait for the DOM to be fully loaded before initializing sliders.
document.addEventListener("DOMContentLoaded", () => {
  // Find all elements with the class 'slider-wrapper' on the page.
  const sliderWrappers = document.querySelectorAll('.slider-wrapper');
  // Initialize each found slider individually.
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
  // Object to hold references to key slider elements.
  const elements = {
    slidesContainer: sliderWrapper.querySelector(".slides"), // The element containing all individual slides.
    slides: sliderWrapper.querySelectorAll(".slide"),       // A NodeList of all individual slide elements.
    prevBtn: sliderWrapper.querySelector(".slider-nav.prev"), // The 'previous' navigation button.
    nextBtn: sliderWrapper.querySelector(".slider-nav.next"), // The 'next' navigation button.
    // The 'sliderWindow' is the visible area of the slider. If not explicitly defined
    // with class '.slider-window', the 'sliderWrapper' itself is used.
    sliderWindow: sliderWrapper.querySelector(".slider-window") || sliderWrapper
  };

  // If essential elements like slides or their container are missing, abort initialization.
  if (!elements.slides.length || !elements.slidesContainer) {
    console.warn("Slider initialization aborted: Missing .slides container or .slide elements within", sliderWrapper);
    return;
  }

  // --- Slider State Variables ---
  let currentIndex = 0;      // Index of the first visible slide in the current view.
  let isAnimating = false;   // Flag to prevent multiple navigations during an animation.
  let slidesPerView = 1;     // Number of slides visible at one time.
  let slideWidth = 0;        // Calculated width of a single slide.
  const totalSlides = elements.slides.length; // Total number of slides.
  const slideGap = 16;       // Gap (in pixels) between slides.

  // --- Responsive Helper Functions ---

  /**
   * Determines how many slides should be visible based on the window's current width.
   * @returns {number} The number of slides to display.
   */
  const getSlidesPerView = () => {
    const windowWidth = window.innerWidth;
    if (windowWidth >= 1200) return Math.min(4, totalSlides); // Large desktops: up to 4 slides.
    if (windowWidth >= 992) return Math.min(3, totalSlides);  // Desktops: up to 3 slides.
    if (windowWidth >= 768) return Math.min(2, totalSlides);  // Tablets: up to 2 slides.
    return 1; // Mobile: 1 slide.
  };

  /**
   * Updates the dimensions of the slides and their container.
   * This is called on initialization and window resize.
   */
  const updateDimensions = () => {
    const containerWidth = elements.sliderWindow.clientWidth; // Width of the visible slider area.
    slidesPerView = getSlidesPerView(); // Recalculate slides per view.

    // Calculate the width of a single slide based on container width, number of slides, and gaps.
    const totalGapsWidth = (slidesPerView - 1) * slideGap;
    slideWidth = (containerWidth - totalGapsWidth) / slidesPerView;

    // Calculate the total width required for all slides including gaps.
    const containerTotalWidth = (slideWidth * totalSlides) + (slideGap * (totalSlides - 1));
    elements.slidesContainer.style.width = `${containerTotalWidth}px`;

    // Apply calculated width and margin (for gap) to each slide.
    elements.slides.forEach((slide, index) => {
      slide.style.width = `${slideWidth}px`;
      slide.style.minWidth = `${slideWidth}px`; // Ensure minWidth is set for flex items.
      // Apply right margin for gap, except for the last slide in the series.
      slide.style.marginRight = index < totalSlides - 1 ? `${slideGap}px` : '0';
    });

    updateNavButtons(); // Update navigation button states based on new dimensions.
  };

  /**
   * Updates the state (enabled/disabled, opacity) of navigation buttons.
   */
  const updateNavButtons = () => {
    if (!elements.prevBtn || !elements.nextBtn) return; // Skip if nav buttons aren't present.

    // Maximum index the slider can go to (0-based).
    const maxIndex = Math.max(0, totalSlides - slidesPerView);

    elements.prevBtn.disabled = currentIndex <= 0;
    elements.nextBtn.disabled = currentIndex >= maxIndex;

    // Visual feedback for disabled state.
    elements.prevBtn.style.opacity = elements.prevBtn.disabled ? '0.3' : '0.7';
    elements.nextBtn.style.opacity = elements.nextBtn.disabled ? '0.3' : '0.7';
  };

  // --- Navigation Logic ---

  /**
   * Moves the slider to a specified slide index.
   * @param {number} newIndex - The target index to navigate to.
   */
  const navigateToIndex = (newIndex) => {
    if (isAnimating) return; // Prevent navigation if an animation is in progress.

    // Clamp the newIndex to be within valid bounds.
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    currentIndex = Math.max(0, Math.min(newIndex, maxIndex));

    isAnimating = true; // Set animation lock.

    // Calculate the translation amount to move the slidesContainer.
    // Each step moves by (slideWidth + gap).
    const translateX = currentIndex * (slideWidth + slideGap);
    elements.slidesContainer.style.transform = `translateX(-${translateX}px)`;

    updateNavButtons(); // Update navigation button states.

    // Release the animation lock after the CSS transition completes (500ms).
    setTimeout(() => {
      isAnimating = false;
    }, 500);
  };

  // --- Initialization ---

  /**
   * Sets up initial styles and properties for the slider to function.
   */
  const setupSliderStyles = () => {
    elements.slidesContainer.style.display = 'flex'; // Arrange slides in a row.
    elements.slidesContainer.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'; // Smooth transition.
    elements.slidesContainer.style.transform = 'translateX(0)'; // Initial position.
    elements.sliderWindow.style.overflow = 'hidden'; // Clip slides outside the window.
    elements.sliderWindow.style.width = '100%'; // Ensure slider window takes full available width.

    updateDimensions(); // Calculate and apply initial dimensions.
    navigateToIndex(0); // Go to the first slide (index 0).
  };

  // --- Event Listeners ---

  // Previous button click.
  if (elements.prevBtn) {
    elements.prevBtn.addEventListener('click', () => {
      navigateToIndex(currentIndex - 1); // Navigate one step back.
    });
  }

  // Next button click.
  if (elements.nextBtn) {
    elements.nextBtn.addEventListener('click', () => {
      navigateToIndex(currentIndex + 1); // Navigate one step forward.
    });
  }

  // Handle window resize to keep the slider responsive.
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout); // Clear previous timeout to debounce.
    // Debounce the resize handling for performance.
    resizeTimeout = setTimeout(() => {
      updateDimensions(); // Recalculate dimensions.
      navigateToIndex(currentIndex); // Adjust position based on new dimensions.
    }, 150); // Wait 150ms after resize stops before recalculating.
  });

  // A small delay before final initialization can help ensure all DOM elements
  // are fully rendered and measurable, especially if other scripts are modifying the layout.
  setTimeout(setupSliderStyles, 150);
}