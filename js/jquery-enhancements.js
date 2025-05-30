// jQuery enhancements for the weather app
$(function() {
    // --- Flags and Constants ---
    let isAnimatingScroll = false; // Tracks if a scroll animation is active.
    const SCROLL_THROTTLE_LIMIT = 150; // Min delay for throttled scroll events (ms).

    // --- Cached jQuery Selectors ---
    const $window = $(window); // Caches the window object.
    const $document = $(document); // Caches the document object.
    const $htmlBody = $('html, body'); // Selects html and body for scroll animations.
    const $header = $('#header'); // Selects the site header.

    // --- Utility Functions ---

    // Throttles a function to limit its execution frequency.
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const context = this;
            const args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // --- Feature Initializations ---

    // Fades in main weather sections for a smooth visual effect.
    function showWeatherSections() {
        $('#current-weather-preview, #weekly-forecast, #hourly-forecast').hide().fadeIn(800);
    }

    // Calculates scroll offset for a target, adjusting for a sticky header.
    function getScrollTargetOffset(targetElement) {
        let offset = targetElement.offset().top;
        // Adjusts offset if a sticky header is visible.
        if ($header.length && $header.hasClass('sticky') && $header.is(':visible')) {
            offset -= $header.outerHeight();
        }
        return offset;
    }

    // Enables smooth scrolling for internal anchor links.
    function enableSmoothScroll() {
        $('a[href^="#"]').not('#back-to-top').on('click', function(e) {
            const targetSelector = $(this).attr('href');
            const $targetElement = $(targetSelector);

            if (targetSelector.length > 1 && $targetElement.length) {
                e.preventDefault(); // Prevents default anchor jump.
                const targetOffset = getScrollTargetOffset($targetElement);

                isAnimatingScroll = true;
                $htmlBody.animate({ scrollTop: targetOffset }, 800, function() {
                    isAnimatingScroll = false;
                    if ($header.length) {
                        handleStickyHeader(true); // Updates sticky header state post-scroll.
                    }
                    // Focuses on the target element for accessibility.
                    $targetElement.attr('tabindex', -1).focus();
                });
            }
        });
    }

    // Manages the sticky state of the header on scroll.
    const handleStickyHeader = (forceUpdate = false) => {
        if (!forceUpdate && isAnimatingScroll) return; // Skips if animating scroll unless forced.
        if (!$header.length) return; // Skips if header doesn't exist.

        // Toggles 'sticky' class based on scroll position.
        if ($window.scrollTop() > 100) {
            $header.addClass('sticky');
        } else {
            $header.removeClass('sticky');
        }
    };

    // Initializes sticky header functionality.
    function stickyHeader() {
        if (!$header.length) return; // Skips if header doesn't exist.
        // Attaches throttled scroll handler for sticky header.
        $window.on('scroll', throttle(handleStickyHeader, SCROLL_THROTTLE_LIMIT));
        handleStickyHeader(true); // Checks initial sticky state.
    }

    // Sets up form validation for the feedback form.
    function setupFormValidation() {
        const $form = $('#feedback-form');
        if ($form.length === 0) return; // Skips if form doesn't exist.

        const $inputs = {
            name: $('#name'),
            email: $('#email'),
            phone: $('#phone'),
            subject: $('#subject'),
            message: $('#message')
        };

        // Defines validation patterns.
        const validators = {
            name: val => /^[A-Za-z\s'-]+$/.test(val) && val.trim().length > 0,
            email: val => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(val),
            phone: val => /^\d{10}$/.test(val),
            required: val => val.trim().length > 0
        };

        // Validates a single form input field.
        function checkInput($el, validatorFn, errorMessage, isRequired = true) {
            $el.next('.error-msg').remove(); // Clears previous error message.
            const value = $el.val().trim();
            let isValid = true;

            if (isRequired && value === '') {
                $el.after($('<span>').addClass('error-msg').text('This field is required.'));
                isValid = false;
            } else if (value !== '' && validatorFn && !validatorFn(value)) {
                $el.after($('<span>').addClass('error-msg').text(errorMessage));
                isValid = false;
            }

            // Toggles validation classes if field has content or is invalid.
            if (value !== '' || !isValid) {
                $el.toggleClass('valid', isValid).toggleClass('invalid', !isValid);
            } else {
                $el.removeClass('valid invalid'); // Clears classes if empty and valid.
            }
            return isValid;
        }

        // Enables live validation on input/change.
        $form.on('input change', 'input, textarea', function() {
            const $el = $(this);
            const id = $el.attr('id');
            switch (id) {
                case 'name':
                    checkInput($el, validators.name, 'Use letters, spaces, apostrophes, or hyphens.');
                    break;
                case 'email':
                    checkInput($el, validators.email, 'Invalid email format.');
                    break;
                case 'phone':
                    checkInput($el, validators.phone, 'Use a 10-digit number.');
                    break;
                case 'subject': // Validates only for requirement on live input.
                case 'message':
                    checkInput($el, validators.required, 'This field is required.');
                    break;
            }
        });

        // Handles form submission.
        $form.on('submit', function(e) {
            e.preventDefault(); // Prevents default submission.
            $('.error-msg', this).remove(); // Clears all error messages.
            $('input, textarea', this).removeClass('invalid valid'); // Resets classes.
            let allValid = true;

            // Validates all fields on submission.
            if (!checkInput($inputs.name, validators.name, 'Use letters, spaces, apostrophes, or hyphens.')) allValid = false;
            if (!checkInput($inputs.email, validators.email, 'Invalid email format.')) allValid = false;
            if (!checkInput($inputs.phone, validators.phone, 'Use a 10-digit number.')) allValid = false;
            if (!checkInput($inputs.subject, validators.required, 'Subject is required.')) allValid = false;
            if (!checkInput($inputs.message, validators.required, 'Message is required.')) allValid = false;

            if (allValid) {
                alert('Details Submitted!'); // Placeholder for success.
                // Creates and triggers a mailto link.
                const mailtoSubject = encodeURIComponent($inputs.subject.val());
                const mailtoBody = encodeURIComponent(
                    `Name: ${$inputs.name.val()}\n` +
                    `Email: ${$inputs.email.val()}\n` +
                    `Phone: ${$inputs.phone.val()}\n\n` +
                    `${$inputs.message.val()}`
                );
                window.location.href = `mailto:dgoswami1@learn.athabascau.ca?subject=${mailtoSubject}&body=${mailtoBody}`;

                $form[0].reset(); // Resets the form.
                $('input, textarea', this).removeClass('valid invalid'); // Clears classes.
            } else {
                // Focuses on the first invalid field.
                $(this).find('input.invalid, textarea.invalid').first().focus();
            }
        });
    }

    // Enables collapsible FAQ answers.
    function setupFAQToggle() {
        $('.faq-question').on('click', function() {
            $(this).toggleClass('open'); // Toggles class for styling.
            $(this).next('.faq-answer').slideToggle(300); // Animates answer visibility.
        });
    }

    // Displays temporary toast notifications for theme changes.
    function setupThemeToast() {
        $('#toggle-theme-control, #high-contrast').on('click', function() {
            const buttonId = this.id;
            // Waits for theme attribute to update before reading.
            setTimeout(() => {
                const currentTheme = $('html').attr('data-theme') || 'light';
                let message = '';

                if (buttonId === 'toggle-theme-control') {
                    message = currentTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
                } else if (buttonId === 'high-contrast') {
                    message = currentTheme === 'high-contrast' ? 'High contrast mode enabled' : 'High contrast mode disabled';
                }

                if (message) {
                    $('#toast-message').remove(); // Removes existing toast.
                    // Creates and shows new toast message.
                    $('<div>').attr('id', 'toast-message')
                        .text(message)
                        .appendTo('body')
                        .fadeIn(400)
                        .delay(2000)
                        .fadeOut(400, function() { $(this).remove(); });
                }
            }, 100);
        });
    }

    // Handles loading weather data from localStorage and announces updates.
    function handleWeatherCache() {
        const $announcer = $('#live-announcer'); // ARIA live region.

        // Loads cached weather data.
        const cachedWeatherData = localStorage.getItem('cachedWeather');
        if (cachedWeatherData) {
            try {
                const { name: cachedLocationName } = JSON.parse(cachedWeatherData);
                if (cachedLocationName) {
                    $('#location, #search-hero').val(cachedLocationName);
                    if ($announcer.length) $announcer.text(`Weather loaded for ${cachedLocationName}.`);
                }
            } catch (err) {
                console.error('Error parsing weather cache:', err); // Essential error logging.
            }
        }

        // Observes weather preview for changes to announce.
        const currentWeatherPreviewElement = document.getElementById('current-weather-preview');
        if (currentWeatherPreviewElement && $announcer.length) {
            const observer = new MutationObserver(() => {
                const $locationElement = $('#current-weather-preview p:nth-of-type(1) span');
                if ($locationElement.length) {
                    const locationText = $locationElement.text();
                    // Announces weather data status.
                    if (locationText === 'Error') $announcer.text('Error loading weather data.');
                    else if (locationText === 'Loading...') $announcer.text('Loading weather data.');
                    else if (locationText && locationText !== 'N/A') $announcer.text(`Current weather updated for ${locationText}.`);
                }
            });
            observer.observe(currentWeatherPreviewElement, { childList: true, subtree: true, characterData: true });
        }
    }

    // Initializes and displays a real-time digital clock.
    function startClock() {
        const $clockElement = $('#clock');
        if ($clockElement.length) { // Checks if clock element exists.
            const updateTime = () => {
                // Updates clock with current time.
                $clockElement.text(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            };
            setInterval(updateTime, 1000); // Updates every second.
            updateTime(); // Initial display.
        }
    }

    // Adds a "Back to Top" button.
    function setupBackToTop() {
        if ($('#back-to-top').length > 0) return; // Skips if button already exists.

        // Creates the button.
        const $backToTopBtn = $('<button>')
            .attr('id', 'back-to-top')
            .attr('aria-label', 'Back to top')
            .html('▲')
            .appendTo('body')
            .hide();

        // Handles button click to scroll to top.
        $backToTopBtn.on('click', function() {
            isAnimatingScroll = true;
            $htmlBody.animate({ scrollTop: 0 }, 800, function() {
                isAnimatingScroll = false;
                if ($header.length) handleStickyHeader(true); // Updates sticky header.
                $('#logo').focus(); // Focuses on a top element.
            });
        });

        // Shows/hides button based on scroll position.
        const handleBackToTopVisibility = () => {
            if (isAnimatingScroll) return; // Skips if animating.
            if ($window.scrollTop() > 300) {
                $backToTopBtn.fadeIn();
            } else {
                $backToTopBtn.fadeOut();
            }
        };

        $window.on('scroll', throttle(handleBackToTopVisibility, SCROLL_THROTTLE_LIMIT));
        handleBackToTopVisibility(); // Initial check.
    }

    // Sets up a tooltip for the current weather icon.
    function setupWeatherTooltip() {
        const $weatherIcon = $('#current-weather-icon-img');
        if (!$weatherIcon.length) return; // Skips if icon doesn't exist.

        let $tooltip = $('#weather-tooltip');
        // Creates tooltip element if it doesn't exist.
        if (!$tooltip.length) {
            $tooltip = $('<div>').attr('id', 'weather-tooltip').appendTo('body');
        }

        // Shows tooltip on mouse enter.
        $weatherIcon.on('mouseenter', function(e) {
            const descriptionText = $(this).attr('alt');
            if (descriptionText?.trim()) {
                $tooltip.text(descriptionText)
                    .css({ top: e.pageY + 15, left: e.pageX + 15 }) // Positions near cursor.
                    .fadeIn(200);
            } else {
                $tooltip.hide(); // Hides if no alt text.
            }
        });

        // Updates tooltip position on mouse move.
        $weatherIcon.on('mousemove', function(e) {
            if ($tooltip.is(':visible')) {
                $tooltip.css({ top: e.pageY + 15, left: e.pageX + 15 });
            }
        });

        // Hides tooltip on mouse leave.
        $weatherIcon.on('mouseleave', function() {
            $tooltip.fadeOut(200);
        });
    }

    // --- Initialize all enhancements ---
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
