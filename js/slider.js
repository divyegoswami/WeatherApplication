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
  
  if (!elements.slides.length || !elements.slidesContainer) return;
  
  let currentIndex = 0;
  let isAnimating = false;
  let slidesPerView = 1;
  let slideWidth = 0;
  let totalSlides = elements.slides.length;
  
  // Calculate responsive slides per view
  const getSlidesPerView = () => {
    const width = window.innerWidth;
    if (width >= 1200) return Math.min(4, totalSlides);
    if (width >= 992) return Math.min(3, totalSlides);
    if (width >= 768) return Math.min(2, totalSlides);
    return 1;
  };
  
  // Calculate dimensions and update layout
  const updateDimensions = () => {
    const containerWidth = elements.sliderWindow.clientWidth;
    slidesPerView = getSlidesPerView();
    
    // Calculate slide width with proper gap handling
    const gap = 16; // Fixed gap for consistency
    const totalGaps = (slidesPerView - 1) * gap;
    slideWidth = (containerWidth - totalGaps) / slidesPerView;
    
    // Set container width to show exact number of slides
    const containerTotalWidth = (slideWidth * totalSlides) + (gap * (totalSlides - 1));
    elements.slidesContainer.style.width = `${containerTotalWidth}px`;
    
    // Apply dimensions to all slides
    elements.slides.forEach((slide, index) => {
      slide.style.width = `${slideWidth}px`;
      slide.style.minWidth = `${slideWidth}px`;
      slide.style.marginRight = index < totalSlides - 1 ? `${gap}px` : '0';
    });
    
    // Update navigation buttons visibility
    updateNavButtons();
  };
  
  // Update navigation button states
  const updateNavButtons = () => {
    if (!elements.prevBtn || !elements.nextBtn) return;
    
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    
    elements.prevBtn.disabled = currentIndex <= 0;
    elements.nextBtn.disabled = currentIndex >= maxIndex;
    
    elements.prevBtn.style.opacity = currentIndex <= 0 ? '0.3' : '0.7';
    elements.nextBtn.style.opacity = currentIndex >= maxIndex ? '0.3' : '0.7';
  };
  
  // Navigate to specific index
  const navigateToIndex = (newIndex) => {
    if (isAnimating) return;
    
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    currentIndex = Math.max(0, Math.min(newIndex, maxIndex));
    
    isAnimating = true;
    
    // Calculate translation with gap consideration
    const gap = 16;
    const translateX = currentIndex * (slideWidth + gap);
    
    elements.slidesContainer.style.transform = `translateX(-${translateX}px)`;
    updateNavButtons();
    
    // Reset animation lock
    setTimeout(() => {
      isAnimating = false;
    }, 500);
  };
  
  // Initialize slider
  const initSlider = () => {
    // Set up container styles
    elements.slidesContainer.style.display = 'flex';
    elements.slidesContainer.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    elements.slidesContainer.style.transform = 'translateX(0)';
    
    // Set up slider window
    elements.sliderWindow.style.overflow = 'hidden';
    elements.sliderWindow.style.width = '100%';
    
    // Calculate initial dimensions
    updateDimensions();
    navigateToIndex(0);
  };
  
  // Event listeners
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
  
  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateDimensions();
      navigateToIndex(currentIndex);
    }, 150);
  });
  
  // Initialize after a brief delay to ensure DOM is ready
  setTimeout(initSlider, 100);
}