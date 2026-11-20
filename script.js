
/* =================================
   GOOGLE APPS SCRIPT CONNECTION
================================= */

const BACKEND_URL =
"https://script.google.com/macros/s/AKfycbwlojt7SRVbvkqdYmKuok4KBGC9GZEx4p8p1VwA3YB6RFznzyDj8JgZw_J1q5LWp2zFOw/exec";


/* =================================
   ELEMENTS
================================= */

const verificationForm =
    document.getElementById("verification-form");

const verificationScreen =
    document.getElementById("verification-screen");

const invitationScreen =
    document.getElementById("invitation-screen");

const verificationMessage =
    document.getElementById("verification-message");

const guestNameInput =
    document.getElementById("guest-name");

const suggestionsBox =
    document.getElementById("guest-suggestions");

const music =
    document.getElementById("background-music");

const musicButton =
    document.getElementById("music-button");

const rsvpForm =
    document.getElementById("rsvp-form");

const rsvpMessage =
    document.getElementById("rsvp-message");

let verifiedGuestName = "";
let verifiedGuestCategory = "";
let autocompleteTimer = null;


/* =================================
   BACKEND REQUEST
================================= */

async function backendRequest(data) {

    const response = await fetch(BACKEND_URL, {
        method: "POST",
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error("Backend request failed.");
    }

    return await response.json();
}


/* =================================
   MESSAGE DISPLAY
================================= */

function showVerificationMessage(message, type = "error") {

    verificationMessage.textContent = message;

    verificationMessage.classList.remove(
        "message-error",
        "message-success"
    );

    if (type === "success") {
        verificationMessage.classList.add("message-success");
    } else {
        verificationMessage.classList.add("message-error");
    }
}


/* =================================
   AUTOCOMPLETE SUGGESTIONS
================================= */

function closeSuggestions() {

    suggestionsBox.innerHTML = "";
    suggestionsBox.hidden = true;

}


function displaySuggestions(names) {

    suggestionsBox.innerHTML = "";

    if (!names || names.length === 0) {
        closeSuggestions();
        return;
    }

    names.forEach(function(name) {

        const option = document.createElement("button");

        option.type = "button";
        option.className = "suggestion-item";
        option.textContent = name;
        option.setAttribute("role", "option");

        option.addEventListener("click", function() {

            guestNameInput.value = name;

            closeSuggestions();

            guestNameInput.focus();

        });

        suggestionsBox.appendChild(option);

    });

    suggestionsBox.hidden = false;

}


async function getNameSuggestions(query) {

    try {

        const result = await backendRequest({
            action: "autocomplete",
            query: query
        });

        if (result.success) {

            displaySuggestions(result.suggestions);

        } else {

            closeSuggestions();

        }

    } catch (error) {

        console.error("Autocomplete error:", error);

        closeSuggestions();

    }

}


if (guestNameInput) {

    guestNameInput.addEventListener("input", function() {

        clearTimeout(autocompleteTimer);

        const query = guestNameInput.value.trim();

        if (query.length < 2) {
            closeSuggestions();
            return;
        }

        autocompleteTimer = setTimeout(function() {
            getNameSuggestions(query);
        }, 300);

    });

    guestNameInput.addEventListener("focus", function() {

        const query = guestNameInput.value.trim();

        if (query.length >= 2) {
            getNameSuggestions(query);
        }

    });

    guestNameInput.addEventListener("keydown", function(event) {

        if (event.key === "Escape") {
            closeSuggestions();
        }

    });

    document.addEventListener("click", function(event) {

        if (!event.target.closest(".autocomplete-wrapper")) {
            closeSuggestions();
        }

    });

}


/* =================================
   INVITATION CATEGORY ACCESS
================================= */

function applyInvitationAccess(category) {

    const normalizedCategory =
        String(category || "").trim().toUpperCase();

    const restrictedVisitorPages = [
        "2.2",
        "3",
        "4",
        "5"
    ];

    const invitationSections = document.querySelectorAll(
        ".invitation-image-section[data-invitation-number]"
    );

    invitationSections.forEach(function(section) {

        const pageNumber =
            section.dataset.invitationNumber;

        if (normalizedCategory === "VISITOR") {

            section.hidden =
                restrictedVisitorPages.includes(pageNumber);

        } else if (normalizedCategory === "GUEST") {

            section.hidden = false;

        }

    });

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

        console.log("Music playback requires user interaction.");

        if (musicButton) {
            musicButton.textContent = "PLAY MUSIC";
        }

    }

}


playMusic();


if (musicButton) {

    musicButton.addEventListener("click", async function() {

        if (!music) return;

        if (music.paused) {

            await playMusic();

        } else {

            music.pause();

            musicButton.textContent = "PLAY MUSIC";

        }

    });

}


/* =================================
   GUEST NAME VERIFICATION
================================= */

if (verificationForm) {

    verificationForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        closeSuggestions();

        const guestName = guestNameInput.value.trim();

        const verifyButton =
            document.getElementById("verify-button");

        if (!guestName) {

            showVerificationMessage(
                "Please enter your full name."
            );

            return;

        }

        showVerificationMessage(
            "Checking your invitation...",
            "success"
        );

        verifyButton.disabled = true;

        try {

            const result = await backendRequest({
                action: "verify",
                name: guestName
            });

            if (result.success) {

                verifiedGuestName = result.name;

                verifiedGuestCategory =
                    String(result.category || "")
                    .trim()
                    .toUpperCase();

                if (
                    verifiedGuestCategory !== "VISITOR" &&
                    verifiedGuestCategory !== "GUEST"
                ) {
                    throw new Error("Invalid guest category.");
                }

                document.getElementById("rsvp-name").value =
                    verifiedGuestName;

                // Apply category access.
                applyInvitationAccess(verifiedGuestCategory);

                // Switch screens.
                verificationScreen.hidden = true;
                invitationScreen.hidden = false;

                // Start music after guest interaction.
                playMusic();

                // Start countdown.
                updateCountdown();

                // Scroll to invitation beginning.
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            } else {

                showVerificationMessage(
                    result.message ||
                    "Sorry, we couldn't find your name on the guest list."
                );

            }

        } catch (error) {

            console.error("Verification error:", error);

            showVerificationMessage(
                "Unable to verify your invitation. Please try again."
            );

        } finally {

            verifyButton.disabled = false;

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

    if (!days || !hours || !minutes || !seconds) {
        return;
    }

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

    rsvpForm.addEventListener("submit", async function(event) {

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

        submitButton.disabled = true;

        try {

            const result = await backendRequest({
                action: "rsvp",
                name: verifiedGuestName,
                attendance: attendance
            });

            if (result.success) {

                rsvpMessage.textContent =
                    "Thank you! Your RSVP has been recorded.";

            } else {

                rsvpMessage.textContent =
                    result.message || "Unable to submit your RSVP.";

                submitButton.disabled = false;

            }

        } catch (error) {

            console.error("RSVP error:", error);

            rsvpMessage.textContent =
                "Something went wrong. Please try again.";

            submitButton.disabled = false;

        }

    });

}
