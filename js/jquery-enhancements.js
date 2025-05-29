$(function() {
    // Flags and constants
    let isAnimatingScroll = false;
    const SCROLL_THROTTLE_LIMIT = 150; // Minimum delay between scroll events (ms)

    // Cached jQuery selectors for performance and readability
    const $window = $(window);
    const $document = $(document);
    const $htmlBody = $('html, body');
    const $header = $('#header');

    /**
     * Throttle function to limit how frequently a function can execute.
     * Useful for performance when binding to high-frequency events like scroll or resize.
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            if (!inThrottle) {
                func.apply(this, arguments);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    /**
     * Smoothly fades in the main weather sections once they are available.
     * Enhances visual appeal and improves perceived performance.
     */
    function showWeatherSections() {
        const sections = $('#current-weather-preview, #weekly-forecast, #hourly-forecast');
        if (sections.length > 0) {
            sections.hide().fadeIn(800);
        }
    }

    /**
     * Computes the vertical offset of a target element to scroll to.
     * Adjusts for sticky headers if applicable.
     */
    function getScrollTargetOffset(targetElement) {
        let offset = targetElement.offset().top;
        if ($header.hasClass('sticky') && $header.is(':visible')) {
            // Optionally adjust offset based on sticky header height
        }
        return offset;
    }

    /**
     * Enables smooth scrolling behavior for internal anchor links.
     * Skips the "back-to-top" button for special handling.
     */
    function enableSmoothScroll() {
        $('a[href^="#"]').not('#back-to-top').on('click', function(e) {
            const targetSelector = $(this).attr('href');
            if (targetSelector.length > 1 && $(targetSelector).length) {
                e.preventDefault();
                const $targetElement = $(targetSelector);
                const targetOffset = getScrollTargetOffset($targetElement);

                isAnimatingScroll = true;
                $htmlBody.animate({ scrollTop: targetOffset }, 800, function() {
                    isAnimatingScroll = false;
                    if ($header.length) handleStickyHeader(true);
                    $targetElement.attr('tabindex', -1).focus();
                });
            }
        });
    }

    /**
     * Determines whether the header should stick to the top of the viewport.
     * Adds/removes the 'sticky' class based on scroll position.
     */
    const handleStickyHeader = (forceUpdate = false) => {
        if (!forceUpdate && isAnimatingScroll) return;
        if (!$header.length) return;
        $window.scrollTop() > 100 ? $header.addClass('sticky') : $header.removeClass('sticky');
    };

    /**
     * Initializes sticky header behavior and binds it to the scroll event.
     * Also performs an initial check on page load.
     */
    function stickyHeader() {
        if ($header.length === 0) return;
        $window.on('scroll', throttle(handleStickyHeader, SCROLL_THROTTLE_LIMIT));
        handleStickyHeader(true);
    }

    /**
     * Validates form inputs on the fly and on form submission.
     * Displays inline error messages and highlights fields with validity indicators.
     */
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

        /**
         * Validates a single form input based on provided rules.
         * Shows error messages, and adds appropriate CSS classes for feedback.
         */
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
                case 'subject':
                case 'message': checkInput($el, validators.required, 'This field is required.'); break;
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

    /**
     * Enables collapsible answers for FAQ items.
     * Uses slide animation and toggle class to manage state.
     */
    function setupFAQToggle() {
        $('.faq-question').on('click', function() {
            $(this).toggleClass('open');
            $(this).next('.faq-answer').slideToggle(300);
        });
    }

    /**
     * Displays temporary toast notifications when the theme or contrast mode changes.
     */
    function setupThemeToast() {
        $('#toggle-theme-control, #high-contrast').on('click', function() {
            const buttonId = this.id;
            setTimeout(() => {
                const theme = $('html').attr('data-theme') || 'light';
                let message = '';
                if (buttonId === 'toggle-theme-control') {
                    message = theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
                } else if (buttonId === 'high-contrast') {
                    message = theme === 'high-contrast' ? 'High contrast mode enabled' : 'High contrast mode disabled';
                }
                if (message) {
                    $('#toast-message').remove();
                    $('<div>').attr('id', 'toast-message').text(message).appendTo('body')
                        .fadeIn(400).delay(2000).fadeOut(400, function() { $(this).remove(); });
                }
            }, 100);
        });
    }

    /**
     * Loads and announces weather data from cache for accessibility.
     * Also observes DOM changes to announce weather updates dynamically.
     */
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
                    const locationElement = $('#current-weather-preview p:nth-of-type(1) span');
                    if (locationElement.length) {
                        const locationText = locationElement.text();
                        if (locationText === 'Error') $announcer.text('Error loading weather data.');
                        else if (locationText === 'Loading...') $announcer.text('Loading weather data.');
                        else if (locationText && locationText !== 'N/A') $announcer.text(`Current weather updated for ${locationText}.`);
                    }
                });
            });
            observer.observe(preview, { childList: true, subtree: true, characterData: true });
        }
    }

    /**
     * Displays a real-time digital clock in the UI.
     */
    function startClock() {
        const $clock = $('#clock');
        if ($clock.length) {
            const updateTime = () => $clock.text(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setInterval(updateTime, 1000);
            updateTime();
        }
    }

    /**
     * Adds a floating button that scrolls back to the top of the page.
     * Becomes visible when user scrolls past a certain threshold.
     */
    function setupBackToTop() {
        if ($('#back-to-top').length > 0) return;
        const $btn = $('<button>').attr('id', 'back-to-top').attr('aria-label', 'Back to top').html('▲').appendTo('body').hide();

        $btn.on('click', function() {
            isAnimatingScroll = true;
            $htmlBody.animate({ scrollTop: 0 }, 800, function() {
                isAnimatingScroll = false;
                if ($header.length) handleStickyHeader(true);
                $('#logo').focus();
            });
        });

        const handleBackToTopVisibility = () => {
            if (isAnimatingScroll) return;
            $window.scrollTop() > 300 ? $btn.fadeIn() : $btn.fadeOut();
        };

        $window.on('scroll', throttle(handleBackToTopVisibility, SCROLL_THROTTLE_LIMIT));
        handleBackToTopVisibility();
    }

    /**
     * Shows a tooltip with the weather description when hovering over the icon.
     */
    function setupWeatherTooltip() {
        const $icon = $('#current-weather-icon-img');
        if ($icon.length) {
            let $tooltip = $('#weather-tooltip');
            if (!$tooltip.length) {
                $tooltip = $('<div>').attr('id', 'weather-tooltip').appendTo('body');
            }
            $icon.on('mouseenter', function(e) {
                const text = $(this).attr('alt');
                if (text?.trim()) {
                    $tooltip.text(text).css({ top: e.pageY + 15, left: e.pageX + 15 }).fadeIn(200);
                } else {
                    $tooltip.hide();
                }
            }).on('mousemove', function(e) {
                if ($tooltip.is(':visible')) {
                    $tooltip.css({ top: e.pageY + 15, left: e.pageX + 15 });
                }
            }).on('mouseleave', function() {
                $tooltip.fadeOut(200);
            });
        }
    }

    // Initialize all features once DOM is ready
    showWeatherSections();
    enableSmoothScroll();
    stickyHeader();
    setupFormValidation();
    setupFAQToggle();
    setupThemeToast();
    handleWeatherCache();
    startClock();
    setupBackToTop();
    setupWeatherTooltip();
});
