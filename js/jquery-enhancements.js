$(function() {
    // --- Flags and Constants ---

    // Flag to indicate if a scroll animation is currently in progress.
    // Prevents conflicts if multiple scroll-related actions are triggered.
    let isAnimatingScroll = false;

    // Minimum delay (in milliseconds) between throttled scroll event executions.
    // Helps optimize performance by limiting the frequency of scroll event handling.
    const SCROLL_THROTTLE_LIMIT = 150;

    // --- Cached jQuery Selectors ---
    // Caching frequently used jQuery selectors improves performance by reducing DOM traversals
    // and makes the code more readable.
    const $window = $(window); // Represents the browser window.
    const $document = $(document); // Represents the HTML document.
    const $htmlBody = $('html, body'); // Selects both <html> and <body> for cross-browser scroll animation.
    const $header = $('#header'); // Selects the site header element.

    // --- Utility Functions ---

    /**
     * Throttles a function to limit its execution frequency.
     * This is useful for performance-intensive event handlers like 'scroll' or 'resize'.
     * @param {Function} func - The function to be throttled.
     * @param {number} limit - The minimum time interval (in ms) between function calls.
     * @returns {Function} A throttled version of the input function.
     */
    function throttle(func, limit) {
        let inThrottle; // Flag to track if the function is currently in its throttle cooldown period.
        return function() {
            const context = this; // Preserve the context ('this') of the original function.
            const args = arguments; // Preserve the arguments passed to the original function.
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // --- Feature Initializations ---

    /**
     * Fades in the main weather sections smoothly once they are available in the DOM.
     * This enhances visual appeal and improves the perceived loading performance.
     */
    function showWeatherSections() {
        const $sections = $('#current-weather-preview, #weekly-forecast, #hourly-forecast');
        if ($sections.length > 0) {
            // Hide sections initially and then fade them in.
            $sections.hide().fadeIn(800);
        }
    }

    /**
     * Calculates the vertical scroll offset for a target element.
     * It can optionally adjust this offset if a sticky header is present and visible,
     * ensuring the target element isn't obscured by the header.
     * @param {jQuery} targetElement - The jQuery object of the element to scroll to.
     * @returns {number} The calculated vertical offset from the top of the document.
     */
    function getScrollTargetOffset(targetElement) {
        let offset = targetElement.offset().top;
        // Check if the header is sticky and visible.
        if ($header.hasClass('sticky') && $header.is(':visible')) {
            // Placeholder: Optionally adjust 'offset' by subtracting the sticky header's height.
            // Example: offset -= $header.outerHeight();
        }
        return offset;
    }

    /**
     * Enables smooth scrolling for internal anchor links (e.g., <a href="#some-id">).
     * It excludes the '#back-to-top' link, which has its own dedicated handler.
     */
    function enableSmoothScroll() {
        // Select all anchor links whose href starts with '#' but are not '#back-to-top'.
        $('a[href^="#"]').not('#back-to-top').on('click', function(e) {
            const targetSelector = $(this).attr('href');
            // Ensure the target selector is valid and the target element exists.
            if (targetSelector.length > 1 && $(targetSelector).length) {
                e.preventDefault(); // Prevent the default jump-scroll behavior.
                const $targetElement = $(targetSelector);
                const targetOffset = getScrollTargetOffset($targetElement);

                isAnimatingScroll = true; // Set flag to indicate scroll animation is active.
                $htmlBody.animate({ scrollTop: targetOffset }, 800, function() {
                    isAnimatingScroll = false; // Reset flag when animation completes.
                    // After scrolling, if a sticky header exists, re-evaluate its state.
                    if ($header.length) {
                        handleStickyHeader(true); // Force update sticky header status.
                    }
                    // Improve accessibility by focusing on the target element.
                    // tabindex -1 allows elements not normally focusable to receive focus.
                    $targetElement.attr('tabindex', -1).focus();
                });
            }
        });
    }

    /**
     * Manages the sticky state of the header based on scroll position.
     * It adds or removes a 'sticky' class to the header.
     * @param {boolean} [forceUpdate=false] - If true, updates header state regardless of scroll animation.
     */
    const handleStickyHeader = (forceUpdate = false) => {
        // If not forcing an update and a scroll animation is in progress, do nothing.
        if (!forceUpdate && isAnimatingScroll) return;
        // If the header element doesn't exist, do nothing.
        if (!$header.length) return;

        // Add 'sticky' class if scrolled more than 100px, otherwise remove it.
        if ($window.scrollTop() > 100) {
            $header.addClass('sticky');
        } else {
            $header.removeClass('sticky');
        }
    };

    /**
     * Initializes the sticky header functionality.
     * It binds the throttled 'handleStickyHeader' function to the window's scroll event
     * and performs an initial check on page load.
     */
    function stickyHeader() {
        if ($header.length === 0) return; // Do nothing if no header element is found.
        // Throttle the scroll event handler for performance.
        $window.on('scroll', throttle(handleStickyHeader, SCROLL_THROTTLE_LIMIT));
        handleStickyHeader(true); // Initial check for sticky state on page load.
    }

    /**
     * Sets up real-time and on-submission form validation for the feedback form.
     * Displays inline error messages and visual indicators (valid/invalid classes).
     */
    function setupFormValidation() {
        const $form = $('#feedback-form');
        if ($form.length === 0) return; // Do nothing if the form doesn't exist.

        // Cache jQuery objects for form input fields.
        const $inputs = {
            name: $('#name'),
            email: $('#email'),
            phone: $('#phone'),
            subject: $('#subject'),
            message: $('#message')
        };

        // Define validation functions (regex patterns and simple checks).
        const validators = {
            name: val => /^[A-Za-z\s'-]+$/.test(val) && val.trim().length > 0, // Allows letters, spaces, apostrophes, hyphens.
            email: val => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(val), // Standard email format.
            phone: val => /^\d{10}$/.test(val), // 10-digit phone number.
            required: val => val.trim().length > 0 // Checks if the field is not empty.
        };

        /**
         * Creates a <span> element for displaying an error message.
         * @param {string} msg - The error message text.
         * @returns {jQuery} A jQuery object representing the error message span.
         */
        function makeError(msg) {
            return $('<span>').addClass('error-msg').text(msg);
        }

        /**
         * Validates a single form input field.
         * Shows/hides error messages and toggles 'valid'/'invalid' CSS classes.
         * @param {jQuery} $el - The jQuery object of the input element to validate.
         * @param {Function} testFn - The validation function to use for this input.
         * @param {string} msg - The error message to display if validation fails (and not empty).
         * @param {boolean} [isRequired=true] - Whether the field is mandatory.
         * @returns {boolean} True if the input is valid, false otherwise.
         */
        function checkInput($el, testFn, msg, isRequired = true) {
            $el.next('.error-msg').remove(); // Remove any existing error message for this field.
            const val = $el.val().trim();
            let valid = true;

            if (isRequired && val === '') {
                $el.after(makeError('This field is required.'));
                valid = false;
            } else if (val !== '' && !testFn(val)) { // Only validate non-empty fields against testFn if not required check.
                $el.after(makeError(msg));
                valid = false;
            }

            // Toggle classes based on validity, but only if the field has been touched or is not required.
            if (val !== '' || !isRequired) {
                $el.toggleClass('valid', valid).toggleClass('invalid', !valid);
            } else {
                // If field is empty and not strictly required (e.g. during initial live validation), remove classes.
                $el.removeClass('valid invalid');
            }
            return valid;
        }

        // Live validation on input or change events for relevant fields.
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
                case 'subject': // Subject and message are only checked for 'required' on live input.
                case 'message':
                    checkInput($el, validators.required, 'This field is required.');
                    break;
            }
        });

        // Handle form submission.
        $form.on('submit', function(e) {
            e.preventDefault(); // Prevent default form submission.
            $('.error-msg').remove(); // Clear all previous error messages.
            $('input, textarea', this).removeClass('invalid valid'); // Reset validation classes.
            let allValid = true;

            // Perform validation for all fields.
            if (!checkInput($inputs.name, validators.name, 'Use letters, spaces, apostrophes, or hyphens.')) allValid = false;
            if (!checkInput($inputs.email, validators.email, 'Invalid email format.')) allValid = false;
            if (!checkInput($inputs.phone, validators.phone, 'Use a 10-digit number.')) allValid = false;
            if (!checkInput($inputs.subject, validators.required, 'Subject is required.')) allValid = false;
            if (!checkInput($inputs.message, validators.required, 'Message is required.')) allValid = false;

            if (allValid) {
                alert('Details Submitted!'); // Placeholder for successful submission.
                // Construct a mailto link with form data.
                const mailtoSubject = encodeURIComponent($inputs.subject.val());
                const mailtoBody = encodeURIComponent(
                    `Name: ${$inputs.name.val()}\n` +
                    `Email: ${$inputs.email.val()}\n` +
                    `Phone: ${$inputs.phone.val()}\n\n` +
                    `${$inputs.message.val()}`
                );
                const link = `mailto:dgoswami1@learn.athabascau.ca?subject=${mailtoSubject}&body=${mailtoBody}`;
                window.location.href = link; // Open default email client.

                $form[0].reset(); // Reset the form fields.
                $('input, textarea', this).removeClass('valid invalid'); // Clear validation classes.
            } else {
                // If not all fields are valid, focus on the first invalid input.
                $(this).find('input.invalid, textarea.invalid').first().focus();
            }
        });
    }

    /**
     * Enables collapsible/expandable answers for FAQ items.
     * Toggles an 'open' class and uses a slide animation for the answer.
     */
    function setupFAQToggle() {
        $('.faq-question').on('click', function() {
            $(this).toggleClass('open'); // Toggle 'open' class for styling (e.g., arrow icon).
            $(this).next('.faq-answer').slideToggle(300); // Animate the display of the answer.
        });
    }

    /**
     * Displays temporary "toast" notifications for theme or contrast mode changes.
     * The toast message appears, stays for a short duration, then fades out.
     */
    function setupThemeToast() {
        $('#toggle-theme-control, #high-contrast').on('click', function() {
            const buttonId = this.id;
            // Use a small delay to allow theme attributes on <html> to update before reading them.
            setTimeout(() => {
                const currentTheme = $('html').attr('data-theme') || 'light';
                let message = '';

                if (buttonId === 'toggle-theme-control') {
                    message = currentTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
                } else if (buttonId === 'high-contrast') {
                    // Note: High contrast might set data-theme to 'high-contrast' or revert to 'light'.
                    // The message logic should align with how `toggle-theme.js` handles these states.
                    message = currentTheme === 'high-contrast' ? 'High contrast mode enabled' : 'High contrast mode disabled';
                }

                if (message) {
                    $('#toast-message').remove(); // Remove any existing toast.
                    // Create and display the new toast message.
                    $('<div>').attr('id', 'toast-message')
                        .text(message)
                        .appendTo('body')
                        .fadeIn(400)
                        .delay(2000) // Keep toast visible for 2 seconds.
                        .fadeOut(400, function() { $(this).remove(); }); // Fade out and remove.
                }
            }, 100); // 100ms delay.
        });
    }

    /**
     * Handles loading weather data from localStorage and announcing updates for accessibility.
     * Uses a MutationObserver to detect and announce dynamic changes to weather information.
     */
    function handleWeatherCache() {
        const $announcer = $('#live-announcer'); // ARIA live region for screen readers.
        if (!$announcer.length) return;

        // Attempt to load cached weather data on page load.
        const cachedWeatherData = localStorage.getItem('cachedWeather');
        if (cachedWeatherData) {
            try {
                const { name: cachedLocationName } = JSON.parse(cachedWeatherData);
                if (cachedLocationName) {
                    // Populate input fields with cached location.
                    $('#location, #search-hero').val(cachedLocationName);
                    $announcer.text(`Weather loaded for ${cachedLocationName}.`);
                }
            } catch (err) {
                console.error('Error parsing weather cache:', err);
            }
        }

        // Observe the current weather preview section for changes.
        const currentWeatherPreviewElement = document.getElementById('current-weather-preview');
        if (currentWeatherPreviewElement) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    // Check if the location text within the preview has changed.
                    const $locationElement = $('#current-weather-preview p:nth-of-type(1) span');
                    if ($locationElement.length) {
                        const locationText = $locationElement.text();
                        // Announce updates based on the location text content.
                        if (locationText === 'Error') {
                            $announcer.text('Error loading weather data.');
                        } else if (locationText === 'Loading...') {
                            $announcer.text('Loading weather data.');
                        } else if (locationText && locationText !== 'N/A') {
                            $announcer.text(`Current weather updated for ${locationText}.`);
                        }
                    }
                });
            });
            // Configure observer to watch for changes in child nodes, subtree, and character data.
            observer.observe(currentWeatherPreviewElement, { childList: true, subtree: true, characterData: true });
        }
    }

    /**
     * Initializes and displays a real-time digital clock in the UI.
     * Updates every second.
     */
    function startClock() {
        const $clockElement = $('#clock');
        if ($clockElement.length) {
            const updateTime = () => {
                const now = new Date();
                // Format time as HH:MM:SS.
                $clockElement.text(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            };
            setInterval(updateTime, 1000); // Update every second.
            updateTime(); // Initial call to display time immediately.
        }
    }

    /**
     * Adds a "Back to Top" button that appears on scroll.
     * Clicking the button smoothly scrolls the page to the top.
     */
    function setupBackToTop() {
        // If a back-to-top button already exists (e.g. hardcoded), do nothing.
        if ($('#back-to-top').length > 0) return;

        // Create the button dynamically.
        const $backToTopBtn = $('<button>')
            .attr('id', 'back-to-top')
            .attr('aria-label', 'Back to top')
            .html('▲') // Upwards arrow character.
            .appendTo('body')
            .hide(); // Initially hidden.

        // Handle button click: scroll to top.
        $backToTopBtn.on('click', function() {
            isAnimatingScroll = true;
            $htmlBody.animate({ scrollTop: 0 }, 800, function() {
                isAnimatingScroll = false;
                if ($header.length) handleStickyHeader(true); // Re-check sticky header.
                $('#logo').focus(); // Set focus to a sensible element at the top (e.g., logo).
            });
        });

        // Show/hide the button based on scroll position.
        const handleBackToTopVisibility = () => {
            if (isAnimatingScroll) return; // Don't interfere if already scrolling.
            if ($window.scrollTop() > 300) {
                $backToTopBtn.fadeIn();
            } else {
                $backToTopBtn.fadeOut();
            }
        };

        // Throttle the visibility check on scroll.
        $window.on('scroll', throttle(handleBackToTopVisibility, SCROLL_THROTTLE_LIMIT));
        handleBackToTopVisibility(); // Initial check on page load.
    }

    /**
     * Sets up a tooltip for the current weather icon.
     * The tooltip displays the weather description (from the icon's 'alt' attribute)
     * on mouse hover and follows the mouse cursor.
     */
    function setupWeatherTooltip() {
        const $weatherIcon = $('#current-weather-icon-img');
        if ($weatherIcon.length) {
            let $tooltip = $('#weather-tooltip');
            // If tooltip element doesn't exist, create it.
            if (!$tooltip.length) {
                $tooltip = $('<div>').attr('id', 'weather-tooltip').appendTo('body');
            }

            // Show tooltip on mouse enter.
            $weatherIcon.on('mouseenter', function(e) {
                const descriptionText = $(this).attr('alt'); // Get description from alt text.
                if (descriptionText?.trim()) { // Check if alt text exists and is not empty.
                    $tooltip.text(descriptionText)
                        .css({ top: e.pageY + 15, left: e.pageX + 15 }) // Position near cursor.
                        .fadeIn(200);
                } else {
                    $tooltip.hide(); // Hide if no alt text.
                }
            });

            // Update tooltip position on mouse move.
            $weatherIcon.on('mousemove', function(e) {
                if ($tooltip.is(':visible')) {
                    $tooltip.css({ top: e.pageY + 15, left: e.pageX + 15 });
                }
            });

            // Hide tooltip on mouse leave.
            $weatherIcon.on('mouseleave', function() {
                $tooltip.fadeOut(200);
            });
        }
    }

    // --- Initialize all enhancements once the DOM is ready ---
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