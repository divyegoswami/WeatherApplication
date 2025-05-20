document.addEventListener("DOMContentLoaded", () => {
  const slidesEl = document.querySelector(".slides");
  const slides = document.querySelectorAll(".slide");
  const prevBtn = document.querySelector(".slider-nav.prev");
  const nextBtn = document.querySelector(".slider-nav.next");
  let index = 0;
  let isAnimating = false;

  if (!slides.length || !slidesEl) return;

  function calculateDimensions() {
    const sliderWrapper = slidesEl.parentElement;
    const containerWidth = sliderWrapper.clientWidth;
    const computedStyle = getComputedStyle(slidesEl);
    const gap = parseInt(computedStyle.gap) || 24;
    
    // Calculate slide width based on responsive design
    let slidesPerView = 1;
    if (window.innerWidth >= 1200) {
      slidesPerView = 4;
    } else if (window.innerWidth >= 1024) {
      slidesPerView = 3;
    } else if (window.innerWidth >= 768) {
      slidesPerView = 2;
    }
    
    // Add padding for the navigation buttons (left and right)
    const navButtonPadding = 16;
    
    // Calculate slide width including gap and accounting for button padding
    const availableWidth = containerWidth - (2 * navButtonPadding);
    const slideWidth = (availableWidth - (gap * (slidesPerView - 1))) / slidesPerView;
    
    // Apply calculated width to each slide
    slides.forEach(slide => {
      slide.style.width = `${slideWidth}px`;
      slide.style.minWidth = `${slideWidth}px`;
      slide.style.maxWidth = `${slideWidth}px`;
    });
    
    return { slideWidth, gap, slidesPerView };
  }

  function updateVisibility() {
    const { slidesPerView } = calculateDimensions();
    
    slides.forEach((slide, i) => {
      const shouldShow = i >= index && i < index + slidesPerView;
      slide.classList.toggle('active', shouldShow);
    });
  }

  function handleNavigation(newIndex) {
    if (isAnimating) return;
    
    isAnimating = true;
    const { slideWidth, gap, slidesPerView } = calculateDimensions();
    const maxIndex = Math.max(0, slides.length - slidesPerView);
    index = Math.max(0, Math.min(newIndex, maxIndex));
    
    // Calculate the exact position
    const totalMove = index * (slideWidth + gap);
    
    slidesEl.style.transform = `translateX(-${totalMove}px)`;
    updateVisibility();
    
    setTimeout(() => {
      isAnimating = false;
    }, 500);
  }

  // Event Listeners
  window.addEventListener('resize', () => {
    calculateDimensions();
    handleNavigation(index);
  });

  prevBtn.addEventListener('click', () => handleNavigation(index - 1));
  nextBtn.addEventListener('click', () => handleNavigation(index + 1));

  // Initialization
  function initSlider() {
    calculateDimensions();
    slidesEl.style.transform = 'translateX(0)';
    updateVisibility();
    
    // Add edge case handling for small screens
    if (window.innerWidth < 500) {
      prevBtn.style.left = '0';
      nextBtn.style.right = '0';
    }
    
    // Handle initial active state
    setTimeout(() => {
      slidesEl.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 50);
  }

  // Start with shorter delay
  setTimeout(initSlider, 300);
});