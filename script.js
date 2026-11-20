
// ==========================================
// CONFIGURATION
// ==========================================

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwlojt7SRVbvkqdYmKuok4KBGC9GZEx4p8p1VwA3YB6RFznzyDj8JgZw_J1q5LWp2zFOw/exec";

const COUNTDOWN_DATE = new Date("2026-12-18T16:00:00+08:00");

let verifiedGuestName = "";
let verifiedGuestCategory = "";
let verifiedTableNumber = "";
let guestAlreadyResponded = false;
let autocompleteTimer = null;


// ==========================================
// ELEMENTS
// ==========================================

const verificationScreen = document.getElementById("verification-screen");
const invitationScreen = document.getElementById("invitation-screen");

const verificationForm = document.getElementById("verification-form");
const guestNameInput = document.getElementById("guest-name");
const verifyButton = document.getElementById("verify-button");
const verificationMessage = document.getElementById("verification-message");

const guestSuggestions = document.getElementById("guest-suggestions");

const rsvpForm = document.getElementById("rsvp-form");
const rsvpNameInput = document.getElementById("rsvp-name");
const rsvpSubmitButton = document.getElementById("rsvp-submit-button");
const rsvpMessage = document.getElementById("rsvp-message");

const thankYouScreen = document.getElementById("thank-you-screen");
const confirmationName = document.getElementById("confirmation-name");
const confirmationTable = document.getElementById("confirmation-table");
const confirmationResponse = document.getElementById("confirmation-response");

const backgroundMusic = document.getElementById("background-music");

// Supports both the new HTML ID and the older one.
const musicToggle =
    document.getElementById("music-toggle") ||
    document.getElementById("music-button");


// ==========================================
// BACKEND REQUEST
// ==========================================

async function backendRequest(data) {
    const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error("Unable to connect to the invitation server.");
    }

    return await response.json();
}


// ==========================================
// MESSAGE HELPERS
// ==========================================

function showVerificationMessage(message, isError = false) {
    if (!verificationMessage) return;

    verificationMessage.textContent = message;

    verificationMessage.classList.toggle("error", isError);
    verificationMessage.classList.toggle("success", !isError);
}

function showRSVPMessage(message, isError = false) {
    if (!rsvpMessage) return;

    rsvpMessage.textContent = message;

    rsvpMessage.classList.toggle("error", isError);
    rsvpMessage.classList.toggle("success", !isError);
}


// ==========================================
// NAME AUTOCOMPLETE
// ==========================================

function closeSuggestions() {
    if (!guestSuggestions) return;

    guestSuggestions.innerHTML = "";
    guestSuggestions.hidden = true;
}

function showSuggestions(names) {
    if (!guestSuggestions) return;

    guestSuggestions.innerHTML = "";

    if (!names || names.length === 0) {
        closeSuggestions();
        return;
    }

    names.forEach(name => {
        const option = document.createElement("button");

        option.type = "button";
        option.className = "suggestion-item";
        option.textContent = name;
        option.setAttribute("role", "option");

        option.addEventListener("click", () => {
            guestNameInput.value = name;
            closeSuggestions();

            showVerificationMessage("");
        });

        guestSuggestions.appendChild(option);
    });

    guestSuggestions.hidden = false;
}

if (guestNameInput) {
    guestNameInput.addEventListener("input", () => {
        clearTimeout(autocompleteTimer);

        const query = guestNameInput.value.trim();

        closeSuggestions();

        if (query.length < 2) return;

        autocompleteTimer = setTimeout(async () => {
            try {
                const result = await backendRequest({
                    action: "autocomplete",
                    query: query
                });

                if (result.success) {
                    showSuggestions(result.suggestions);
                }

            } catch (error) {
                console.error("Autocomplete error:", error);
            }
        }, 300);
    });

    guestNameInput.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeSuggestions();
        }
    });
}

document.addEventListener("click", event => {
    if (
        guestSuggestions &&
        guestNameInput &&
        !guestSuggestions.contains(event.target) &&
        event.target !== guestNameInput
    ) {
        closeSuggestions();
    }
});


// ==========================================
// INVITATION ACCESS
// ==========================================

function applyInvitationAccess(category) {
    const invitationSections = document.querySelectorAll(
        ".invitation-image-section"
    );

    invitationSections.forEach(section => {
        const invitationNumber = section.dataset.invitationNumber;

        const restrictedForVisitors = ["2.2", "3", "4", "5"];

        if (
            category === "VISITOR" &&
            restrictedForVisitors.includes(invitationNumber)
        ) {
            section.hidden = true;
        } else {
            section.hidden = false;
        }
    });
}


// ==========================================
// MUSIC
// ==========================================

async function playBackgroundMusic() {
    if (!backgroundMusic) return;

    try {
        await backgroundMusic.play();

        if (musicToggle) {
            musicToggle.classList.add("playing");
        }

    } catch (error) {
        console.log("Music playback requires user interaction.");
    }
}

function updateMusicButton() {
    if (!backgroundMusic || !musicToggle) return;

    const isPlaying = !backgroundMusic.paused;

    musicToggle.classList.toggle("playing", isPlaying);

    musicToggle.setAttribute(
        "aria-label",
        isPlaying ? "Pause background music" : "Play background music"
    );
}

if (musicToggle && backgroundMusic) {
    musicToggle.addEventListener("click", async () => {
        if (backgroundMusic.paused) {
            await playBackgroundMusic();
        } else {
            backgroundMusic.pause();
        }

        updateMusicButton();
    });

    backgroundMusic.addEventListener("play", updateMusicButton);
    backgroundMusic.addEventListener("pause", updateMusicButton);
}


// ==========================================
// COUNTDOWN
// ==========================================

function updateCountdown() {
    const daysElement = document.getElementById("days");
    const hoursElement = document.getElementById("hours");
    const minutesElement = document.getElementById("minutes");
    const secondsElement = document.getElementById("seconds");

    if (
        !daysElement ||
        !hoursElement ||
        !minutesElement ||
        !secondsElement
    ) {
        return;
    }

    const now = new Date();
    const difference = COUNTDOWN_DATE.getTime() - now.getTime();

    if (difference <= 0) {
        daysElement.textContent = "00";
        hoursElement.textContent = "00";
        minutesElement.textContent = "00";
        secondsElement.textContent = "00";
        return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (difference / (1000 * 60 * 60)) % 24
    );
    const minutes = Math.floor(
        (difference / (1000 * 60)) % 60
    );
    const seconds = Math.floor(
        (difference / 1000) % 60
    );

    daysElement.textContent = String(days).padStart(2, "0");
    hoursElement.textContent = String(hours).padStart(2, "0");
    minutesElement.textContent = String(minutes).padStart(2, "0");
    secondsElement.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);


// ==========================================
// SHOW INVITATION OR CONFIRMATION
// ==========================================

function hideInvitationSections() {
    const gallery = document.querySelector(".invitation-gallery");
    const countdown = document.getElementById("countdown-section");
    const rsvpSection = document.getElementById("rsvp-section");

    if (gallery) gallery.hidden = true;
    if (countdown) countdown.hidden = true;
    if (rsvpSection) rsvpSection.hidden = true;
}

function showInvitationSections() {
    const gallery = document.querySelector(".invitation-gallery");
    const countdown = document.getElementById("countdown-section");
    const rsvpSection = document.getElementById("rsvp-section");

    if (gallery) gallery.hidden = false;
    if (countdown) countdown.hidden = false;
    if (rsvpSection) rsvpSection.hidden = false;

    if (thankYouScreen) thankYouScreen.hidden = true;
}

function showThankYouScreen(name, tableNumber, response) {
    if (!thankYouScreen) return;

    // Fill in the guest's confirmation details.
    if (confirmationName) {
        confirmationName.textContent = name || verifiedGuestName;
    }

    if (confirmationTable) {
        confirmationTable.textContent =
            tableNumber && String(tableNumber).trim()
                ? tableNumber
                : "To be announced";
    }

    if (confirmationResponse) {
        confirmationResponse.textContent = response || "Response recorded";
    }

    // Hide the other invitation sections.
    hideInvitationSections();

    // Keep the parent invitation screen visible.
    if (invitationScreen) {
        invitationScreen.hidden = false;
    }

    if (verificationScreen) {
        verificationScreen.hidden = true;
    }

    thankYouScreen.hidden = false;

    // Scroll to the confirmation.
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    // Prevent another RSVP submission.
    if (rsvpSubmitButton) {
        rsvpSubmitButton.disabled = true;
        rsvpSubmitButton.textContent = "RSVP Already Recorded";
    }

    if (rsvpForm) {
        rsvpForm.querySelectorAll("input").forEach(input => {
            input.disabled = true;
        });
    }
}


// ==========================================
// GUEST VERIFICATION
// ==========================================

if (verificationForm) {
    verificationForm.addEventListener("submit", async event => {
        event.preventDefault();

        const enteredName = guestNameInput.value.trim();

        if (!enteredName) {
            showVerificationMessage(
                "Please enter your full name.",
                true
            );
            return;
        }

        closeSuggestions();

        verifyButton.disabled = true;
        verifyButton.textContent = "Checking Invitation...";

        showVerificationMessage("");

        try {
            const result = await backendRequest({
                action: "verify",
                name: enteredName
            });

            if (!result.success) {
                showVerificationMessage(
                    result.message || "Unable to verify your invitation.",
                    true
                );
                return;
            }

            verifiedGuestName = result.name;
            verifiedGuestCategory = result.category;
            verifiedTableNumber = result.tableNumber || "";

            guestAlreadyResponded = Boolean(result.alreadyResponded);

            if (rsvpNameInput) {
                rsvpNameInput.value = verifiedGuestName;
            }

            // Apply invitation access based on guest category.
            applyInvitationAccess(verifiedGuestCategory);

            // Show the invitation screen.
            if (verificationScreen) {
                verificationScreen.hidden = true;
            }

            if (invitationScreen) {
                invitationScreen.hidden = false;
            }

            showInvitationSections();

            // If the guest already submitted an RSVP,
            // display the confirmation instead of the RSVP form.
            if (guestAlreadyResponded) {
                showThankYouScreen(
                    verifiedGuestName,
                    verifiedTableNumber,
                    result.existingRSVP || "Response already recorded"
                );

                return;
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            await playBackgroundMusic();

        } catch (error) {
            console.error("Verification error:", error);

            showVerificationMessage(
                "Unable to connect. Please check your connection and try again.",
                true
            );

        } finally {
            verifyButton.disabled = false;
            verifyButton.textContent = "View My Invitation";
        }
    });
}


// ==========================================
// RSVP SUBMISSION
// ==========================================

if (rsvpForm) {
    rsvpForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!verifiedGuestName) {
            showRSVPMessage(
                "Please verify your invitation first.",
                true
            );
            return;
        }

        if (guestAlreadyResponded) {
            showRSVPMessage(
                "Your RSVP has already been recorded.",
                true
            );
            return;
        }

        const selectedAttendance = rsvpForm.querySelector(
            'input[name="attendance"]:checked'
        );

        if (!selectedAttendance) {
            showRSVPMessage(
                "Please select your RSVP response.",
                true
            );
            return;
        }

        const attendance = selectedAttendance.value;

        rsvpSubmitButton.disabled = true;
        rsvpSubmitButton.textContent = "Submitting...";

        showRSVPMessage("");

        try {
            const result = await backendRequest({
                action: "rsvp",
                name: verifiedGuestName,
                attendance: attendance
            });

            if (!result.success) {
                showRSVPMessage(
                    result.message || "Unable to submit your RSVP.",
                    true
                );

                return;
            }

            // Record the local state.
            guestAlreadyResponded = true;

            verifiedGuestName = result.name || verifiedGuestName;
            verifiedTableNumber = result.tableNumber || verifiedTableNumber;

            const finalResponse = result.response ||
                (attendance === "yes"
                    ? "Yes, I will gladly attend!"
                    : "Regretfully, I won't be able to make it.");

            // Show the confirmation screen.
            showThankYouScreen(
                verifiedGuestName,
                verifiedTableNumber,
                finalResponse
            );

        } catch (error) {
            console.error("RSVP submission error:", error);

            showRSVPMessage(
                "Something went wrong. Please try again.",
                true
            );

            rsvpSubmitButton.disabled = false;
            rsvpSubmitButton.textContent = "Submit RSVP";
        }
    });
}
