document.addEventListener("DOMContentLoaded", function () {
    
    /* =========================================
       1. NAVIGATION & MOBILE MENU
       ========================================= */
    const menuToggle = document.getElementById("menu-toggle");
    const navMenu = document.getElementById("nav-menu");
    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });
    }

    // Dropdown Interactivity
    const menus = document.querySelectorAll(".menuu");
    menus.forEach(menu => {
        const downMenu = menu.querySelector(".dropdownmenu");
        if (downMenu) {
            menu.addEventListener("click", (e) => {
                menus.forEach(m => {
                    if (m !== menu) m.querySelector(".dropdownmenu")?.classList.remove("show");
                });
                downMenu.classList.toggle('show');
                e.stopPropagation();
            });
        }
    });


    window.addEventListener('click', () => {
        document.querySelectorAll(".dropdownmenu").forEach(m => m.classList.remove('show'));
    });

    /* =========================================
       2. MEMBER PROFILE & DONATION LOGIC (Friend's Logic Integrated)
       ========================================= */
    const tabs = document.querySelectorAll('.sidebar li');
    const sections = document.querySelectorAll('.section');

    function handleMemberDonation() {
        const urlParams = new URLSearchParams(window.location.search);
        const requestedTab = urlParams.get('tab');

        // Check if user is clicking "Donate" from navbar or footer
        if (requestedTab === 'donation') {
            const impactTab = document.querySelector('[data-target="my-impact"]');
            const impactSection = document.getElementById('my-impact');

            if (impactTab && impactSection) {
                // Remove active/show classes from Personal Details
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('show'));

                // Set only the donation tab/section to visible
                impactTab.classList.add('active');
                impactSection.classList.add('show');

                // Custom Personalized Heading Logic
                const formHeading = impactSection.querySelector('.section-heading');
                if (formHeading) {
                    // Extract name from profile element rendered by Django
                    const userName = document.getElementById('profile-name')?.innerText || "Member";
                    formHeading.innerHTML = `Welcome, <span style="color:#e60000; text-transform:capitalize;">${userName}</span>!<br><span style="font-size:0.7em; color:#333; font-family: var(--font-body); font-weight: 600;">Your Support Transforms Lives.</span>`;
                    formHeading.style.textAlign = "center";
                    formHeading.style.width = "100%";
                }
                
                impactSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    // Run tab check on page load
    handleMemberDonation();

    // Manual Sidebar Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('show'));

            this.classList.add('active');
            const targetEl = document.getElementById(target);
            if(targetEl) targetEl.classList.add('show');
        });
    });

    /* =========================================
       3. ANIMATIONS & SLIDESHOWS
       ========================================= */
    function runSimpleSlides(selector) {
        const section = document.querySelector(selector);
        if (section) {
            let slideIndex = 0;
            const elements = section.querySelectorAll(".slides").length > 0 
                ? section.querySelectorAll(".slides") 
                : section.querySelectorAll("img");

            function show() {
                if (elements.length > 0) {
                    elements.forEach(s => s.style.display = "none");
                    slideIndex++;
                    if (slideIndex > elements.length) slideIndex = 1;
                    elements[slideIndex - 1].style.display = "block";
                    setTimeout(show, 4000);
                }
            }
            show();
        }
    }
    runSimpleSlides('.image-slide'); 
    runSimpleSlides('.stickyimage');

    // Scroll Observer for Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("visible");
        });
    }, { threshold: 0.1 });
    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));

    // Stats Counters
    const counters = document.querySelectorAll('.counter');
    const countObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const updateCount = () => {
                    const count = +counter.innerText;
                    const inc = Math.max(target / 100, 1); 
                    if (count < target) {
                        counter.innerText = Math.ceil(count + inc);
                        setTimeout(updateCount, 20);
                    } else {
                        counter.innerText = `${target}+`;
                    }
                };
                updateCount();
                countObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => countObserver.observe(c));

    /* =========================================
       4. SECURITY & UTILS
       ========================================= */
    window.openChangePasswordModal = () => {
        document.getElementById('passwordModal').style.display = 'flex';
    };

    window.saveNewPassword = () => {
    const newPassEl = document.getElementById('newPass');
    const confirmPassEl = document.getElementById('confirmPass');
    const btn = document.getElementById('updatePassBtn');

    // 1. Validation
    if (!newPassEl.value || !confirmPassEl.value) {
        showToast("Please fill both fields", "error");
        return;
    }
    if (newPassEl.value !== confirmPassEl.value) {
        showToast("Passwords do not match!", "error");
        return;
    }

    // 2. UI Loading State
    const originalBtnText = btn.innerText;
    btn.innerText = "Updating...";
    btn.disabled = true;

    // 3. Prepare Data
    const formData = new FormData();
    formData.append('new_password', newPassEl.value);
    formData.append('confirm_password', confirmPassEl.value);
    
    // Grab CSRF from the hidden input generated by {% csrf_token %}
    const token = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

    fetch('/api/change-password/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': token
        },
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error("Server error " + res.status);
        return res.json();
    })
    .then(data => {
        if (data.status === 'success') {
            showToast("Password updated in database!");
            document.getElementById('passwordModal').style.display = 'none';
            newPassEl.value = "";
            confirmPassEl.value = "";
        } else {
            showToast(data.message, "error");
        }
    })
    .catch(err => {
        console.error("Password Update Error:", err);
        showToast("Failed to connect to database", "error");
    })
    .finally(() => {
        btn.innerText = originalBtnText;
        btn.disabled = false;
    });
};

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const passwordInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");
    const eyeClosedIcon = document.getElementById("eyeSlashIcon");


    if (eyeClosedIcon && eyeIcon && passwordInput) {
        eyeClosedIcon.addEventListener("click", () => {
            passwordInput.type = "text";
            eyeIcon.style.display = "inline";
            eyeClosedIcon.style.display = "none";
        });
        eyeIcon.addEventListener("click", () => {
            passwordInput.type = "password";
            eyeIcon.style.display = "none";
            eyeClosedIcon.style.display = "inline";
        });
    }
});

/* --- TOAST NOTIFICATION LOGIC --- */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class='bx bx-check-circle'></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

/* =========================================
       SUPPORT PAGE LOGIC: MEMBER REDIRECT
       ========================================= */
    function handleSupportPageMemberView() {
        // Check if we are on the Support Us page
        if (window.location.pathname.includes('Supportourmission.html')) {
            
            // 1. Check if user is logged in via Django's data attribute or local storage
            // Using your friend's logic:
            const userRole = localStorage.getItem('userRole') || (document.body.dataset.authenticated === "true" ? 'member' : null);
            const userName = document.getElementById('profile-name')?.innerText || localStorage.getItem('userName') || "Member";

            if (userRole === 'member') {
                const createAccForm = document.getElementById('create-account-form');
                const oneTimeForm = document.getElementById('onetime-form');
                const tabContainer = document.querySelector('.donation-tabs');
                const tabToggles = document.querySelectorAll('.tab-toggle');

                if (oneTimeForm) {
                    // 2. Hide Create Account and Tabs
                    if (createAccForm) createAccForm.style.display = 'none';
                    if (tabContainer) tabContainer.style.display = 'none';
                    if (tabToggles) tabToggles.forEach(t => t.style.display = 'none');

                    // 3. Force Show One-Time Form
                    oneTimeForm.style.display = 'block';

                    // 4. Update the heading with personalized text
                    const formHeading = oneTimeForm.querySelector('h2') || oneTimeForm.querySelector('h3') || document.querySelector('.donationform h3');
                    if (formHeading) {
                        formHeading.innerHTML = `Welcome back, <span style="color:#e60000; text-transform:capitalize;">${userName}</span>!<br><span style="font-size:0.7em; color:#333; font-family: var(--font-body); font-weight: 600;">Your Support Transforms Lives.</span>`;
                        formHeading.style.textAlign = "center";
                    }

                    // 5. Smooth scroll to the form
                    oneTimeForm.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }

    // Run the check
    handleSupportPageMemberView();
    /* =========================================
   FORCE ONE-TIME DONATION VIEW FOR MEMBERS
   ========================================= */
function showMemberDonationOnly() {
    // 1. Detect if we are on the Support Us page
    const isSupportPage = window.location.pathname.includes('Supportourmission.html');
    
    // 2. Identify if user is logged in (using your friend's userRole logic)
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName') || "Member";

    if (isSupportPage && userRole === 'member') {
        const createAccForm = document.getElementById('create-account-form');
        const oneTimeForm = document.getElementById('onetime-form');
        const tabContainer = document.querySelector('.donation-tabs');
        const tabToggles = document.querySelectorAll('.tab-toggle');

        // Hide everything except the one-time form
        if (createAccForm) createAccForm.style.display = 'none';
        if (tabContainer) tabContainer.style.display = 'none';
        if (tabToggles) tabToggles.forEach(t => t.style.display = 'none');

        if (oneTimeForm) {
            oneTimeForm.style.display = 'block';
            
            // 3. Apply your personalized heading
            const formHeading = oneTimeForm.querySelector('h3') || oneTimeForm.querySelector('h2');
            if (formHeading) {
                formHeading.innerHTML = `Welcome, <span style="color:#e60000; text-transform:capitalize;">${userName}</span>!<br><span style="font-size:0.7em; color:#333; font-family: 'Open Sans', sans-serif;">Your Support Transforms Lives.</span>`;
                formHeading.style.textAlign = "center";
            }
            
            // 4. Smooth scroll so user doesn't have to look for the form
            oneTimeForm.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Ensure it runs after the DOM is fully loaded
window.addEventListener('load', showMemberDonationOnly);

document.addEventListener("DOMContentLoaded", function () {
    // --- Country Data ---
    const countries = [
        { name: "United States", currency: "USD" },
        { name: "India", currency: "INR" },
        { name: "United Kingdom", currency: "GBP" },
        { name: "Canada", currency: "CAD" },
        { name: "Australia", currency: "AUD" }
    ];

    // --- Populate Dropdown ---
    const countrySelects = document.querySelectorAll('#member-country, #onetime-country');
    countrySelects.forEach(select => {
        let options = '<option value="">Select a Country</option>';
        countries.forEach(country => {
            options += `<option value="${country.name}" data-currency="${country.currency}">${country.name}</option>`;
        });
        select.innerHTML = options;

        // Handle Currency Change
        select.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const currency = selectedOption.getAttribute('data-currency') || 'Rs';
            const form = this.closest('form');
            if (form) {
                const currencySpan = form.querySelector('.currency-code');
                if (currencySpan) currencySpan.textContent = currency;
            }
        });
    });
});
document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll('.tab-toggle');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 1. Manage Active Tab UI
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // 2. Hide both containers first
            const regForm = document.getElementById('create-account-form');
            const donateForm = document.getElementById('onetime-form');
            
            if(regForm) regForm.style.display = 'none';
            if(donateForm) donateForm.style.display = 'none';

            // 3. Show the requested form
            const targetId = this.getAttribute('data-form');
            const targetForm = document.getElementById(targetId);
            
            if(targetForm) {
                targetForm.style.display = 'block';
            }
        });
    });
});
/* =========================================
   SUPPORT PAGE: TAB TOGGLE LOGIC
   ========================================= */
document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll('.tab-toggle');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active status from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Find both containers
            const regForm = document.getElementById('create-account-form');
            const donateForm = document.getElementById('onetime-form');
            
            // Hide both first
            if(regForm) regForm.style.display = 'none';
            if(donateForm) donateForm.style.display = 'none';

            // Show the one requested by data-form attribute
            const targetId = this.getAttribute('data-form');
            const targetContainer = document.getElementById(targetId);
            
            if(targetContainer) {
                targetContainer.style.display = 'block';
            }
        });
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault(); // This stops the redirect

            const submitBtn = this.querySelector('.formsubmit');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            const formData = new FormData(this);

            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showToast(data.message, 'success');
                    contactForm.reset(); // Clear the form
                } else {
                    showToast(data.message || "Error submitting form", 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast("Connection error. Please try again.", 'error');
            })
            .finally(() => {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            });
        });
    }
});
document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('.formsubmit');
            const originalText = "Submit"; 
            
            // UI Feedback: Start
            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";

            const formData = new FormData(this);

            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => {
                // If the server crashes or sends 404/500, this catches it
                if (!response.ok) throw new Error('Server returned an error');
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    showToast(data.message, 'success');
                    contactForm.reset();
                } else {
                    showToast(data.message || "Error submitting form", 'error');
                }
            })
            .catch(error => {
                console.error('Fetch Error:', error);
                showToast("Failed to send. Please check your internet.", "error");
            })
            .finally(() => {
                // UI Feedback: Reset (This ALWAYS runs even if there is an error)
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
            });
        });
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const step1 = document.getElementById('register-step-1');
    const step2 = document.getElementById('register-step-2');
    const step3 = document.getElementById('register-step-3');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // --- TOAST FUNCTION ---
    function showToast(msg, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
    }

    // --- STEP 1: SEND OTP ---
    const sendOtpBtn = document.getElementById('send-otp-btn');
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', function () {
            const email = document.getElementById('reg-email').value;
            if (!email) { showToast("Enter email first", "error"); return; }

            sendOtpBtn.innerText = "Sending...";
            sendOtpBtn.disabled = true;

            const formData = new FormData();
            formData.append('email', email);
            formData.append('csrfmiddlewaretoken', csrfToken);

            fetch('/api/send-otp/', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        showToast("OTP sent to " + email);
                        step1.style.display = 'none';
                        step2.style.display = 'block';
                    } else {
                        showToast(data.message, "error");
                        sendOtpBtn.innerText = "Send OTP";
                        sendOtpBtn.disabled = false;
                    }
                })
                .catch(() => {
                    showToast("Server unreachable", "error");
                    sendOtpBtn.disabled = false;
                });
        });
    }

    // --- STEP 2: VERIFY OTP ---
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', function () {
            const otp = document.getElementById('reg-otp').value;
            if (!otp) { showToast("Enter OTP code", "error"); return; }

            verifyOtpBtn.innerText = "Verifying...";
            verifyOtpBtn.disabled = true;

            const formData = new FormData();
            formData.append('otp', otp);
            formData.append('csrfmiddlewaretoken', csrfToken);

            fetch('/api/verify-otp/', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        showToast("Verification Successful!");
                        step2.style.display = 'none';
                        step3.style.display = 'block';
                    } else {
                        showToast(data.message || "Invalid OTP", "error");
                        verifyOtpBtn.innerText = "Verify OTP";
                        verifyOtpBtn.disabled = false;
                    }
                })
                .catch(() => {
                    showToast("Network Error", "error");
                    verifyOtpBtn.disabled = false;
                    verifyOtpBtn.innerText = "Verify OTP";
                });
        });
    }
});

// --- STEP 3: FINAL ACCOUNT CREATION ---
const createAccountBtn = document.getElementById('create-account-btn');
const regForm = document.getElementById('register-flow-form');

if (regForm) {
    regForm.addEventListener('submit', function (e) {
        e.preventDefault(); 

        const pass = document.getElementById('reg-password').value;
        const confirmPass = document.getElementById('reg-confirm-password').value;

        if (pass !== confirmPass) {
            showToast("Passwords do not match!", "error");
            return;
        }

        createAccountBtn.innerText = "Creating Account...";
        createAccountBtn.disabled = true;

        // GRAB THE TOKEN AGAIN TO BE SURE
        const token = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const formData = new FormData(regForm);

        fetch('/api/create-account/', {
            method: 'POST',
            body: formData,
            headers: {
                // This header is VITAL for Django to accept the final step
                'X-CSRFToken': token 
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                showToast("Account Created Successfully!");
                setTimeout(() => {
                    window.location.href = "/profile/"; 
                }, 2000);
            } else {
                showToast(data.message || "Registration Failed", "error");
                createAccountBtn.innerText = "Create Account";
                createAccountBtn.disabled = false;
            }
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            showToast("Server Error. Please check your console.", "error");
            createAccountBtn.innerText = "Create Account";
            createAccountBtn.disabled = false;
        });
    });
}
document.addEventListener("DOMContentLoaded", function () {
    const passwordForm = document.getElementById('password-form');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function (e) {
            e.preventDefault(); // STOPS the page from refreshing

            // Selecting by 'name' since you won't change HTML
            const newPass = passwordForm.querySelector('input[name="new_password"]').value;
            const confirmPass = passwordForm.querySelector('input[name="confirm_password"]').value;
            const btn = passwordForm.querySelector('button[type="submit"]');

            if (newPass !== confirmPass) {
                showToast("Passwords do not match!", "error");
                return;
            }

            const originalText = btn.innerText;
            btn.innerText = "Updating...";
            btn.disabled = true;

            const formData = new FormData(passwordForm);

            // Fetch to the endpoint defined in your urls.py
            fetch('/api/change-password/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    showToast("Password changed in database!");
                    document.getElementById('passwordModal').style.display = 'none';
                    passwordForm.reset();
                } else {
                    showToast(data.message, "error");
                }
            })
            .catch(err => {
                console.error("Error:", err);
                showToast("Server connection failed", "error");
            })
            .finally(() => {
                btn.innerText = originalText;
                btn.disabled = false;
            });
        });
    }
});


// Define this if you haven't already
window.openChangePasswordModal = () => {
    document.getElementById('passwordModal').style.display = 'block';
};

/* =========================================
   ADMIN DASHBOARD: CONTENT & MODAL LOGIC
   ========================================= */

// --- MODAL TOGGLES ---
/* =========================================
   ADMIN DASHBOARD: ARTICLE & EVENT CONTROLS
   ========================================= */

// 1. MODAL OPEN/CLOSE
window.getCSRF = () => {
    const token = document.querySelector('[name=csrfmiddlewaretoken]') || document.querySelector('input[name="csrfmiddlewaretoken"]');
    return token ? token.value : "";
};

// Open Modals
window.getCSRF = () => {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
};

// 2. Modal Controls
window.openArticleForm = () => {
    const modal = document.getElementById('articleModal');
    if (modal) modal.style.display = 'flex';
};

window.closeModal = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
};

// 3. Publish Article Logic
window.publishArticle = async () => {
    const title = document.getElementById('articleTitle')?.value;
    const content = document.getElementById('articleContent')?.value;
    const imageInput = document.getElementById('articleImage');
    const btn = document.getElementById('articleBtn');

    if (!title || !content) {
        showToast("Please enter a title and content", "error");
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (imageInput?.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    // UI Feedback
    if (btn) {
        btn.innerText = "Publishing...";
        btn.disabled = true;
    }

    try {
        const response = await fetch('/api/article/add/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.getCSRF() // Uses helper from step 1
            },
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            showToast("Article Published Successfully!");
            location.reload(); // Refresh to update counts
        } else {
            showToast("Error: " + (data.message || "Failed to save"), "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Server Connection Failed", "error");
    } finally {
        if (btn) {
            btn.innerText = "Publish";
            btn.disabled = false;
        }
    }
};

// 3. ADD EVENT
window.addEvent = async () => {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const desc = document.getElementById('eventDesc').value;
    const imageInput = document.getElementById('eventImage');

    if (!title || !date) {
        showToast("Name and Date are required!", "error");
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('date', date);
    formData.append('description', desc);
    if (imageInput.files[0]) formData.append('image', imageInput.files[0]);

    try {
        const response = await fetch('/api/event/add/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRF() },
            body: formData
        });
        if (response.ok) {
            showToast("Event Added Successfully!");
            location.reload();
        }
    } catch (err) {
        showToast("Connection Error", "error");
    }
};

// --- FORM SUBMISSION FOR EVENTS ---
window.addEvent = async () => {
    const title = document.getElementById('eventTitle');
    const date = document.getElementById('eventDate');
    const desc = document.getElementById('eventDesc');
    const image = document.getElementById('eventImage');

    if (!title.value || !date.value) {
        showToast("Name and Date are required", "error");
        return;
    }

    const formData = new FormData();
    formData.append('title', title.value);
    formData.append('date', date.value);
    formData.append('description', desc.value);
    if (image.files[0]) formData.append('image', image.files[0]);

    try {
        const response = await fetch('/api/event/add/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: formData
        });

        if (response.ok) {
            showToast("Event added successfully!");
            location.reload();
        }
    } catch (error) {
        showToast("Failed to connect to server", "error");
    }
};

// --- DELETE LOGIC ---
window.deleteContent = async (type, id) => {
    if (!confirm(`Permanently delete this ${type}?`)) return;
    
    const res = await fetch(`/api/delete/${type}/${id}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRF() }
    });
    if (res.ok) {
        showToast("Deleted successfully");
        location.reload();
    }
};


document.addEventListener("DOMContentLoaded", function () {
    const sendBtn = document.getElementById('forgot-send-otp-btn');

    if (sendBtn) {
        sendBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent any default behavior
            
            const emailInput = document.getElementById('forgot-email');
            const email = emailInput.value;
            
            if (!email) {
                showToast("Please enter your email", "error");
                return;
            }

            sendBtn.innerText = "Sending...";
            sendBtn.disabled = true;

            const formData = new FormData();
            formData.append('email', email);
            
            // Explicitly grab the token from the hidden input Django generated
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            formData.append('csrfmiddlewaretoken', csrfToken);

            fetch('/api/send-reset-otp/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken // Adding it to headers is safer for Django
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    showToast("OTP sent successfully!");
                    document.getElementById('forgot-step-1').style.display = 'none';
                    document.getElementById('forgot-step-2').style.display = 'block';
                } else {
                    showToast(data.message, "error");
                    sendBtn.innerText = "Send OTP";
                    sendBtn.disabled = false;
                }
            })
            .catch(err => {
                console.error("Error:", err);
                showToast("Server error. Check your connection.", "error");
                sendBtn.innerText = "Send OTP";
                sendBtn.disabled = false;
            });
        });
    }
});

const verifyBtn = document.getElementById('forgot-verify-btn');

if (verifyBtn) {
    verifyBtn.addEventListener('click', function() {
        const otp = document.getElementById('forgot-otp-code').value;
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        if (!otp) {
            showToast("Please enter the OTP", "error");
            return;
        }

        const formData = new FormData();
        formData.append('otp', otp);

        fetch('/api/verify-reset-otp/', { 
            method: 'POST', 
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                showToast("OTP Verified!");
                document.getElementById('forgot-step-2').style.display = 'none';
                document.getElementById('forgot-step-3').style.display = 'block';
            } else {
                showToast(data.message, "error");
            }
        })
        .catch(err => {
            console.error("Verification Error:", err);
            showToast("Server error during verification", "error");
        });
    });
}
const finalizeBtn = document.getElementById('finalize-reset-btn');

if (finalizeBtn) {
    finalizeBtn.addEventListener('click', function() {
        // 1. Grab values from the Step 3 inputs
        const pass = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-new-password').value;
        const token = document.querySelector('[name=csrfmiddlewaretoken]').value;

        if (pass !== confirm) {
            showToast("Passwords do not match", "error");
            return;
        }

        const formData = new FormData();
        formData.append('password', pass);
        formData.append('confirm_password', confirm);

        // 2. The Fetch call MUST match your urls.py
        fetch('/api/finalize-reset/', { 
            method: 'POST', 
            body: formData,
            headers: { 'X-CSRFToken': token }
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                showToast("Success! Redirecting...");
                setTimeout(() => window.location.href = "/login/", 2000);
            } else {
                showToast(data.message, "error");
            }
        });
    });
}


