document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    slidesContainer: document.querySelector(".slides"),
    slides: document.querySelectorAll(".slide"),
    prevBtn: document.querySelector(".slider-nav.prev"),
    nextBtn: document.querySelector(".slider-nav.next")
  };
  
  if (!elements.slides.length || !elements.slidesContainer) return;
  
  let index = 0;
  let isAnimating = false;
  
  // Calculate dimensions based on viewport
  const calculateDimensions = () => {
    const wrapper = elements.slidesContainer.parentElement;
    const containerWidth = wrapper.clientWidth;
    const gap = parseInt(getComputedStyle(elements.slidesContainer).gap) || 24;
    
    // Determine slides per view based on screen width
    let slidesPerView = 1;
    if (window.innerWidth >= 1200) slidesPerView = 4;
    else if (window.innerWidth >= 1024) slidesPerView = 3;
    else if (window.innerWidth >= 768) slidesPerView = 2;
    
    // Calculate slide width accounting for gap and navigation padding
    const navPadding = 16;
    const availableWidth = containerWidth - (2 * navPadding);
    const slideWidth = (availableWidth - (gap * (slidesPerView - 1))) / slidesPerView;
    
    // Apply calculated width to each slide
    elements.slides.forEach(slide => {
      slide.style.width = `${slideWidth}px`;
      slide.style.minWidth = `${slideWidth}px`;
      slide.style.maxWidth = `${slideWidth}px`;
    });
    
    return { slideWidth, gap, slidesPerView };
  };
  
  // Update which slides are visible
  const updateVisibility = () => {
    const { slidesPerView } = calculateDimensions();
    elements.slides.forEach((slide, i) => {
      slide.classList.toggle('active', i >= index && i < index + slidesPerView);
    });
  };
  
  // Handle navigation between slides
  const navigateTo = (newIndex) => {
    if (isAnimating) return;
    isAnimating = true;
    
    const { slideWidth, gap, slidesPerView } = calculateDimensions();
    const maxIndex = Math.max(0, elements.slides.length - slidesPerView);
    index = Math.max(0, Math.min(newIndex, maxIndex));
    
    elements.slidesContainer.style.transform = `translateX(-${index * (slideWidth + gap)}px)`;
    updateVisibility();
    
    setTimeout(() => { isAnimating = false; }, 500);
  };
  
  // Initialize the slider
  const initSlider = () => {
    calculateDimensions();
    elements.slidesContainer.style.transform = 'translateX(0)';
    updateVisibility();
    
    // Adjust button positioning for small screens
    if (window.innerWidth < 500) {
      elements.prevBtn.style.left = '0';
      elements.nextBtn.style.right = '0';
    }
    
    // Add transition after initial positioning
    setTimeout(() => {
      elements.slidesContainer.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 50);
  };
  
  // Event listeners
  window.addEventListener('resize', () => {
    calculateDimensions();
    navigateTo(index);
  });
  
  elements.prevBtn.addEventListener('click', () => navigateTo(index - 1));
  elements.nextBtn.addEventListener('click', () => navigateTo(index + 1));
  
  // Initialize with a short delay
  setTimeout(initSlider, 300);
});
