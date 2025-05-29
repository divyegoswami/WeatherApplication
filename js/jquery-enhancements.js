// jQuery enhancements for the weather app
$(function() {
    // Fade in weather sections
    function showWeatherSections() {
        const sections = $('#current-weather-preview, #weekly-forecast, #hourly-forecast');
        if (sections.length > 0) {
            sections.hide().fadeIn(800);
        }
    }

    // Smooth scrolling for anchor links
    function enableSmoothScroll() {
        $('a[href^="#"]').on('click', function(e) {
            const target = $(this).attr('href');
            if (target.length > 1 && $(target).length) {
                e.preventDefault();
                $('html, body').animate({
                    scrollTop: $(target).offset().top
                }, 800);
            }
        });
    }

    // Validate contact form inputs
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
            name: val => /^[A-Za-z\s]+$/.test(val) && val.trim().length > 0,
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
            } else if (val && !testFn(val)) {
                $el.after(makeError(msg));
                valid = false;
            }

            if (val) {
                $el.toggleClass('valid', valid).toggleClass('invalid', !valid);
            } else {
                $el.removeClass('valid invalid');
                if (!valid) $el.addClass('invalid');
            }
            return valid;
        }

        $form.on('input', 'input', function() {
            const id = this.id;
            const $el = $(this);
            if (id in validators) {
                const isValid = validators[id]($el.val());
                $el.toggleClass('valid', isValid).toggleClass('invalid', !isValid && $el.val().length > 0);
            }
        });

        $form.on('submit', function(e) {
            e.preventDefault();
            $('.error-msg').remove();
            $('input, textarea').removeClass('invalid valid');

            const valid = {
                name: checkInput($inputs.name, validators.name, 'Use letters and spaces only.'),
                email: checkInput($inputs.email, validators.email, 'Invalid email format.'),
                phone: checkInput($inputs.phone, validators.phone, 'Use a 10-digit number.'),
                subject: checkInput($inputs.subject, validators.required, 'Subject is required.'),
                message: checkInput($inputs.message, validators.required, 'Message is required.')
            };

            const allValid = Object.values(valid).every(Boolean);
            if (allValid) {
                alert('Details Submitted!');
                const link = `mailto:dgoswami1@learn.athabascau.ca?subject=${encodeURIComponent($inputs.subject.val())}&body=${encodeURIComponent(`Name: ${$inputs.name.val()}\nEmail: ${$inputs.email.val()}\nPhone: ${$inputs.phone.val()}\n\n${$inputs.message.val()}`)}`;
                window.location.href = link;
                $form[0].reset();
                $('input, textarea').removeClass('valid invalid');
            }
        });
    }

    // FAQ toggle
    function setupFAQToggle() {
        $('.faq-question').on('click', function() {
            $(this).toggleClass('open');
            $(this).next('.faq-answer').slideToggle(300);
        });
    }

    // Theme change notification toast
    function setupThemeToast() {
        $('#toggle-theme-control').on('click', function() {
            setTimeout(() => {
                const theme = $('html').attr('data-theme') || 'light';
                const messages = {
                    dark: 'Dark mode enabled',
                    light: 'Light mode enabled',
                    'high-contrast': 'High contrast mode enabled'
                };

                const message = messages[theme];
                if (message) {
                    $('#toast-message').remove();
                    $('<div>').attr('id', 'toast-message').text(message).appendTo('body').fadeIn(400).delay(2000).fadeOut(400, function() { $(this).remove(); });
                }
            }, 50);
        });

        $('#high-contrast').on('click', function() {
            setTimeout(() => {
                $('#toast-message').remove();
                $('<div>').attr('id', 'toast-message').text('High contrast mode toggled').appendTo('body').fadeIn(400).delay(2000).fadeOut(400, function() { $(this).remove(); });
            }, 50);
        });
    }

    // ARIA live announcement and auto-fill last location
    function handleWeatherCache() {
        const $announcer = $('#live-announcer');
        const cached = localStorage.getItem('cachedWeather');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data?.name) {
                    $('#location, #search-hero').val(data.name);
                    $announcer.text(`Weather loaded for ${data.name}.`);
                }
            } catch (err) {
                console.error('Cache parse error:', err);
            }
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.target.id === 'current-weather-preview' || $(m.target).closest('#current-weather-preview').length) {
                    const location = $('#current-weather-preview p:nth-of-type(1) span').text();
                    if (location && location !== 'Loading...' && location !== 'N/A') {
                        $announcer.text(`Current weather updated for ${location}.`);
                    }
                }
            });
        });

        const preview = document.getElementById('current-weather-preview');
        if (preview) {
            observer.observe(preview, { childList: true, subtree: true, characterData: true });
        }
    }

    // Live clock in the footer
    function startClock() {
        const $clock = $('#clock');
        if ($clock.length) {
            setInterval(() => {
                $clock.text(new Date().toLocaleTimeString());
            }, 1000);
        }
    }

    // Back to Top button
    function setupBackToTop() {
        const $btn = $('<button>').attr('id', 'back-to-top').html('▲').appendTo('body');
        $btn.on('click', function() {
            $('html, body').animate({ scrollTop: 0 }, 800);
        });

        $(window).on('scroll', function() {
            $(window).scrollTop() > 300 ? $btn.fadeIn() : $btn.fadeOut();
        });
    }

    // Tooltip for weather icon
    function setupWeatherTooltip() {
        const $icon = $('#current-weather-icon-img');
        if ($icon.length) {
            const $tooltip = $('<div>').attr('id', 'weather-tooltip').appendTo('body');

            $icon.on('mouseenter', function(e) {
                const text = $(this).attr('alt');
                if (text) {
                    $tooltip.text(text).css({ top: e.pageY + 15, left: e.pageX + 15 }).fadeIn(200);
                }
            }).on('mousemove', function(e) {
                $tooltip.css({ top: e.pageY + 15, left: e.pageX + 15 });
            }).on('mouseleave', function() {
                $tooltip.fadeOut(200);
            });
        }
    }

    // Initialize everything
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
