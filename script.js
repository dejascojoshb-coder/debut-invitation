
/* =================================
   GOOGLE APPS SCRIPT CONNECTION
================================= */

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwlojt7SRVbvkqdYmKuok4KBGC9GZEx4p8p1VwA3YB6RFznzyDj8JgZw_J1q5LWp2zFOw/exec";


/* =================================
   ELEMENTS
================================= */

const verificationForm = document.getElementById("verification-form");
const verificationScreen = document.getElementById("verification-screen");
const invitationScreen = document.getElementById("invitation-screen");
const verificationMessage = document.getElementById("verification-message");
const guestNameInput = document.getElementById("guest-name");
const guestSuggestions = document.getElementById("guest-suggestions");

const music = document.getElementById("background-music");
const musicButton = document.getElementById("music-button");

const rsvpForm = document.getElementById("rsvp-form");
const rsvpMessage = document.getElementById("rsvp-message");

let verifiedGuestName = "";
let verifiedGuestCategory = "";
let autocompleteTimer = null;


/* =================================
   MESSAGE STYLING
================================= */

function showVerificationMessage(message, isError = false) {
    if (!verificationMessage) return;

    verificationMessage.textContent = message;
    verificationMessage.classList.toggle("message-error", isError);
    verificationMessage.classList.toggle("message-success", !isError);
}


/* =================================
   BACKGROUND MUSIC
================================= */

async function playMusic() {
    if (!music) return;

    try {
        await music.play();

        if (musicButton) {
            musicButton.textContent = "PAUSE MUSIC";
        }

    } catch (error) {
        console.log("Autoplay was blocked.");

        if (musicButton) {
            musicButton.textContent = "PLAY MUSIC";
        }
    }
}

playMusic();

if (musicButton) {
    musicButton.addEventListener("click", async function () {
        if (music.paused) {
            await playMusic();
        } else {
            music.pause();
            musicButton.textContent = "PLAY MUSIC";
        }
    });
}


/* =================================
   NAME AUTOCOMPLETE
================================= */

if (guestNameInput && guestSuggestions) {

    guestNameInput.addEventListener("input", function () {
        const query = guestNameInput.value.trim();

        clearTimeout(autocompleteTimer);

        if (query.length < 2) {
            guestSuggestions.innerHTML = "";
            return;
        }

        autocompleteTimer = setTimeout(async function () {
            try {
                const response = await fetch(BACKEND_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "autocomplete",
                        query: query
                    })
                });

                const result = await response.json();

                guestSuggestions.innerHTML = "";

                if (result.success && Array.isArray(result.suggestions)) {
                    result.suggestions.forEach(function (name) {
                        const option = document.createElement("option");
                        option.value = name;
                        guestSuggestions.appendChild(option);
                    });
                }

            } catch (error) {
                console.error("Autocomplete error:", error);
            }
        }, 300);
    });
}


/* =================================
   INVITATION ACCESS
================================= */

function applyInvitationAccess(category) {

    const normalizedCategory = String(category || "").toUpperCase();

    const invitationImages = document.querySelectorAll(
        '#invitation-screen img[src*="invitation-"]'
    );

    invitationImages.forEach(function (img) {

        const match = img.getAttribute("src").match(
            /invitation-(\d+)\.(png|jpg|jpeg|webp)/i
        );

        if (!match) return;

        const pageNumber = Number(match[1]);

        const imageSection =
            img.closest(".invitation-image-section") || img.parentElement;

        if (!imageSection) return;

        const isRestrictedPage = [3, 4, 5].includes(pageNumber);

        if (normalizedCategory === "VISITOR" && isRestrictedPage) {
            imageSection.hidden = true;
        } else {
            imageSection.hidden = false;
        }
    });
}


/* =================================
   GUEST NAME VERIFICATION
================================= */

if (verificationForm) {

    verificationForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const guestName = guestNameInput.value.trim();

        const verifyButton = document.getElementById("verify-button");

        if (!guestName) {
            showVerificationMessage("Please enter your full name.", true);
            return;
        }

        showVerificationMessage("Checking your invitation...", false);

        if (verifyButton) {
            verifyButton.disabled = true;
        }

        try {
            const response = await fetch(BACKEND_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "verify",
                    name: guestName
                })
            });

            if (!response.ok) {
                throw new Error("Server request failed.");
            }

            const result = await response.json();

            if (result.success) {

                verifiedGuestName = result.name;
                verifiedGuestCategory = result.category;

                document.getElementById("rsvp-name").value =
                    verifiedGuestName;

                // Apply VISITOR or GUEST access.
                applyInvitationAccess(verifiedGuestCategory);

                showVerificationMessage("", false);

                verificationScreen.hidden = true;
                invitationScreen.hidden = false;

                playMusic();
                updateCountdown();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            } else {
                showVerificationMessage(
                    result.message ||
                    "Sorry, we couldn't find your name on the guest list. Please contact the celebrant for assistance.",
                    true
                );
            }

        } catch (error) {

            console.error("Verification error:", error);

            showVerificationMessage(
                "Unable to verify your invitation. Please try again.",
                true
            );

        } finally {

            if (verifyButton) {
                verifyButton.disabled = false;
            }

        }
    });
}


/* =================================
   LIVE COUNTDOWN
================================= */

const eventDate = new Date(
    "2026-12-18T16:00:00+08:00"
).getTime();

function updateCountdown() {

    const now = Date.now();
    const difference = eventDate - now;

    const days = document.getElementById("days");
    const hours = document.getElementById("hours");
    const minutes = document.getElementById("minutes");
    const seconds = document.getElementById("seconds");

    if (!days || !hours || !minutes || !seconds) return;

    if (difference <= 0) {
        days.textContent = "0";
        hours.textContent = "0";
        minutes.textContent = "0";
        seconds.textContent = "0";
        return;
    }

    days.textContent = Math.floor(
        difference / (1000 * 60 * 60 * 24)
    );

    hours.textContent = Math.floor(
        (difference / (1000 * 60 * 60)) % 24
    );

    minutes.textContent = Math.floor(
        (difference / (1000 * 60)) % 60
    );

    seconds.textContent = Math.floor(
        (difference / 1000) % 60
    );
}

updateCountdown();
setInterval(updateCountdown, 1000);


/* =================================
   RSVP SUBMISSION
================================= */

if (rsvpForm) {

    rsvpForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!verifiedGuestName) {
            rsvpMessage.textContent =
                "Please verify your invitation first.";
            return;
        }

        const attendance =
            document.getElementById("attendance").value;

        if (!attendance) {
            rsvpMessage.textContent =
                "Please select your attendance response.";
            return;
        }

        rsvpMessage.textContent = "Submitting your RSVP...";

        const submitButton =
            document.getElementById("rsvp-submit-button");

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {

            const response = await fetch(BACKEND_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "rsvp",
                    name: verifiedGuestName,
                    attendance: attendance
                })
            });

            if (!response.ok) {
                throw new Error("RSVP request failed.");
            }

            const result = await response.json();

            if (result.success) {
                rsvpMessage.textContent =
                    "Thank you! Your RSVP has been recorded.";
            } else {
                rsvpMessage.textContent =
                    result.message || "Unable to submit your RSVP.";

                if (submitButton) {
                    submitButton.disabled = false;
                }
            }

        } catch (error) {

            console.error("RSVP error:", error);

            rsvpMessage.textContent =
                "Something went wrong. Please try again.";

            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}
