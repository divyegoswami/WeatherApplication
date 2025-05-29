// jQuery enhancements for the weather app
$(function() {

    let isAnimatingScroll = false;
    const SCROLL_THROTTLE_LIMIT = 150;
    const $window = $(window);
    const $document = $(document);
    const $htmlBody = $('html, body'); // Cache for animations
    const $header = $('#header');

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    function showWeatherSections() {
        const sections = $('#current-weather-preview, #weekly-forecast, #hourly-forecast');
        if (sections.length > 0) {
            sections.hide().fadeIn(800);
        }
    }

    function getScrollTargetOffset(targetElement) {
        let offset = targetElement.offset().top;
        // If header is currently sticky and target is below header, adjust for header height
        // This is more for general anchor links, not for scroll-to-top (0)
        if ($header.hasClass('sticky') && $header.is(':visible')) {
            // Check if target is below the header's bottom edge
            if (offset > $header.offset().top + $header.outerHeight()) {
                 // No adjustment needed if target is already below a visible sticky header
                 // or adjust if you want space: offset -= $header.outerHeight();
            }
        }
        return offset;
    }


    function enableSmoothScroll() {
        $('a[href^="#"]').not('#back-to-top').on('click', function(e) {
            const targetSelector = $(this).attr('href');
            if (targetSelector.length > 1 && $(targetSelector).length) {
                e.preventDefault();
                const $targetElement = $(targetSelector);
                const targetOffset = getScrollTargetOffset($targetElement);

                isAnimatingScroll = true;
                $htmlBody.animate({
                    scrollTop: targetOffset
                }, 800, function() {
                    isAnimatingScroll = false;
                    // After animation, re-evaluate sticky header state immediately
                    if ($header.length) handleStickyHeader(true); // Force update
                    $targetElement.attr('tabindex', -1).focus();
                });
            }
        });
    }

    // Moved handleStickyHeader out to be callable directly
    const handleStickyHeader = (forceUpdate = false) => {
        if (!forceUpdate && isAnimatingScroll) return;
        if (!$header.length) return;

        if ($window.scrollTop() > 100) {
            $header.addClass('sticky');
        } else {
            $header.removeClass('sticky');
        }
    };

    function stickyHeader() {
        if ($header.length === 0) return;
        $window.on('scroll', throttle(handleStickyHeader, SCROLL_THROTTLE_LIMIT));
        handleStickyHeader(true); // Initial check on load, force update
    }

    function setupFormValidation() {
        const $form = $('#feedback-form');
        if ($form.length === 0) return;

        const $inputs = {
            name: $('#name'),
            email: $('#email'),
            phone: $('#phone'),
            subject: $('#subject'),
            message: $('#message')
        };

        const validators = {
            name: val => /^[A-Za-z\s'-]+$/.test(val) && val.trim().length > 0,
            email: val => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(val),
            phone: val => /^\d{10}$/.test(val),
            required: val => val.trim().length > 0
        };

        function makeError(msg) {
            return $('<span>').addClass('error-msg').text(msg);
        }

        function checkInput($el, testFn, msg, isRequired = true) {
            $el.next('.error-msg').remove();
            const val = $el.val().trim();
            let valid = true;

            if (isRequired && val === '') {
                $el.after(makeError('This field is required.'));
                valid = false;
            } else if (val !== '' && !testFn(val)) {
                $el.after(makeError(msg));
                valid = false;
            }

            if (val !== '' || !isRequired) {
                 $el.toggleClass('valid', valid).toggleClass('invalid', !valid);
            } else if (isRequired && val === '') {
                $el.removeClass('valid').addClass('invalid');
            } else {
                $el.removeClass('valid invalid');
            }
            return valid;
        }
        
        $form.on('input change', 'input, textarea', function() {
            const $el = $(this);
            const id = $el.attr('id');
            switch(id) {
                case 'name': checkInput($el, validators.name, 'Use letters, spaces, apostrophes, or hyphens.'); break;
                case 'email': checkInput($el, validators.email, 'Invalid email format.'); break;
                case 'phone': checkInput($el, validators.phone, 'Use a 10-digit number.'); break;
                case 'subject': case 'message': checkInput($el, validators.required, 'This field is required.'); break;
            }
        });

        $form.on('submit', function(e) {
            e.preventDefault();
            $('.error-msg').remove();
            $('input, textarea', this).removeClass('invalid valid');
            let allValid = true;
            if (!checkInput($inputs.name, validators.name, 'Use letters, spaces, apostrophes, or hyphens.')) allValid = false;
            if (!checkInput($inputs.email, validators.email, 'Invalid email format.')) allValid = false;
            if (!checkInput($inputs.phone, validators.phone, 'Use a 10-digit number.')) allValid = false; 
            if (!checkInput($inputs.subject, validators.required, 'Subject is required.')) allValid = false;
            if (!checkInput($inputs.message, validators.required, 'Message is required.')) allValid = false;
            
            if (allValid) {
                alert('Details Submitted!');
                const link = `mailto:dgoswami1@learn.athabascau.ca?subject=${encodeURIComponent($inputs.subject.val())}&body=${encodeURIComponent(`Name: ${$inputs.name.val()}\nEmail: ${$inputs.email.val()}\nPhone: ${$inputs.phone.val()}\n\n${$inputs.message.val()}`)}`;
                window.location.href = link;
                $form[0].reset();
                $('input, textarea', this).removeClass('valid invalid');
            } else {
                $(this).find('input.invalid, textarea.invalid').first().focus();
            }
        });
    }

    function setupFAQToggle() {
        $('.faq-question').on('click', function() {
            $(this).toggleClass('open');
            $(this).next('.faq-answer').slideToggle(300);
        });
    }

    function setupThemeToast() {
        $('#toggle-theme-control, #high-contrast').on('click', function() {
            const buttonId = this.id;
            setTimeout(() => {
                const theme = $('html').attr('data-theme') || 'light';
                let message = '';
                if (buttonId === 'toggle-theme-control') {
                    if (theme === 'dark') message = 'Dark mode enabled';
                    else if (theme === 'light') message = 'Light mode enabled';
                } else if (buttonId === 'high-contrast') {
                    if (theme === 'high-contrast') message = 'High contrast mode enabled';
                    else message = 'High contrast mode disabled';
                }
                if (message) {
                    $('#toast-message').remove();
                    $('<div>').attr('id', 'toast-message').text(message).appendTo('body').fadeIn(400).delay(2000).fadeOut(400, function() { $(this).remove(); });
                }
            }, 100);
        });
    }

    function handleWeatherCache() {
        const $announcer = $('#live-announcer');
        if (!$announcer.length) return;

        const cached = localStorage.getItem('cachedWeather');
        if (cached) {
            try {
                const { name: cachedName } = JSON.parse(cached);
                if (cachedName) {
                    $('#location, #search-hero').val(cachedName);
                    $announcer.text(`Weather loaded for ${cachedName}.`);
                }
            } catch (err) { console.error('Cache parse error:', err); }
        }

        const preview = document.getElementById('current-weather-preview');
        if (preview) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.target.id === 'current-weather-preview' || $(mutation.target).closest('#current-weather-preview').length) {
                        if (mutation.type === 'characterData' || mutation.type === 'childList') {
                            const locationElement = $('#current-weather-preview p:nth-of-type(1) span');
                            if (locationElement.length) {
                                const locationText = locationElement.text();
                                if (locationText && locationText !== 'Loading...' && locationText !== 'N/A' && locationText !== 'Error') {
                                    $announcer.text(`Current weather updated for ${locationText}.`);
                                } else if (locationText === 'Error') {
                                    $announcer.text(`Error loading weather data.`);
                                } else if (locationText === 'Loading...') {
                                     $announcer.text(`Loading weather data.`);
                                }
                            }
                        }
                    }
                });
            });
            observer.observe(preview, { childList: true, subtree: true, characterData: true });
        }
    }

    function startClock() {
        const $clock = $('#clock');
        if ($clock.length) {
            const updateTime = () => $clock.text(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setInterval(updateTime, 1000);
            updateTime();
        }
    }

    function setupBackToTop() {
        if ($('#back-to-top').length > 0) return;
        const $btn = $('<button>').attr('id', 'back-to-top').attr('aria-label', 'Back to top').html('▲').appendTo('body').hide();
        
        $btn.on('click', function() {
            isAnimatingScroll = true;
            $htmlBody.animate({ scrollTop: 0 }, 800, function() {
                isAnimatingScroll = false;
                // Crucially, after scrolling to top, ensure header state is correct
                if ($header.length) handleStickyHeader(true); // Force update
                $('#logo').focus(); // Focus on a logical top element
            });
        });

        const handleBackToTopVisibility = () => {
            if (isAnimatingScroll) return;
            $window.scrollTop() > 300 ? $btn.fadeIn() : $btn.fadeOut();
        };

        $window.on('scroll', throttle(handleBackToTopVisibility, SCROLL_THROTTLE_LIMIT));
        handleBackToTopVisibility();
    }

    function setupWeatherTooltip() {
        const $icon = $('#current-weather-icon-img');
        if ($icon.length) {
            let $tooltip = $('#weather-tooltip');
            if (!$tooltip.length) {
                $tooltip = $('<div>').attr('id', 'weather-tooltip').appendTo('body');
            }
            $icon.on('mouseenter', function(e) {
                const text = $(this).attr('alt');
                if (text && text.trim() !== "") {
                    $tooltip.text(text).css({ top: e.pageY + 15, left: e.pageX + 15 }).fadeIn(200);
                } else { $tooltip.hide(); }
            }).on('mousemove', function(e) {
                if ($tooltip.is(':visible')) {
                    $tooltip.css({ top: e.pageY + 15, left: e.pageX + 15 });
                }
            }).on('mouseleave', function() { $tooltip.fadeOut(200); });
        }
    }

    // Initialize everything
    showWeatherSections();
    enableSmoothScroll();
    stickyHeader(); // Initializes the sticky header logic
    setupFormValidation();
    setupFAQToggle();
    setupThemeToast();
    handleWeatherCache();
    startClock();
    setupBackToTop();
    setupWeatherTooltip();
});