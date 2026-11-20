
// ==========================================
// QUINZEYA | EIGHTEEN EVER AFTER
// COMPLETE JAVASCRIPT
// ==========================================


// 1. CONFIGURATION

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwlojt7SRVbvkqdYmKuok4KBGC9GZEx4p8p1VwA3YB6RFznzyDj8JgZw_J1q5LWp2zFOw/exec";

const COUNTDOWN_DATE = new Date("2026-12-18T16:00:00+08:00");

let verifiedGuestName = "";
let verifiedGuestCategory = "";
let verifiedTableNumber = "";
let guestAlreadyResponded = false;
let previousRSVPResponse = "";
let autocompleteTimer = null;


// 2. HTML ELEMENTS

const verificationScreen = document.getElementById("verification-screen");
const invitationScreen = document.getElementById("invitation-screen");
const thankYouScreen = document.getElementById("thank-you-screen");

const verificationForm = document.getElementById("verification-form");
const guestNameInput = document.getElementById("guest-name");
const verifyButton = document.getElementById("verify-button");
const verificationMessage = document.getElementById("verification-message");
const guestSuggestions = document.getElementById("guest-suggestions");

const rsvpForm = document.getElementById("rsvp-form");
const rsvpNameInput = document.getElementById("rsvp-name");
const rsvpSubmitButton = document.getElementById("rsvp-submit-button");
const rsvpMessage = document.getElementById("rsvp-message");

const viewConfirmationButton = document.getElementById("view-confirmation-button");
const previousConfirmation = document.getElementById("previous-confirmation");
const previousConfirmationName = document.getElementById("previous-confirmation-name");
const previousConfirmationTable = document.getElementById("previous-confirmation-table");
const previousConfirmationResponse = document.getElementById("previous-confirmation-response");

const confirmationName = document.getElementById("confirmation-name");
const confirmationTable = document.getElementById("confirmation-table");
const confirmationResponse = document.getElementById("confirmation-response");

const backToInvitationButton = document.getElementById("back-to-invitation-button");

const backgroundMusic = document.getElementById("background-music");
const musicToggle =
    document.getElementById("music-toggle") ||
    document.getElementById("music-button");


// 3. BACKEND REQUEST

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


// 4. MESSAGE HELPERS

function showVerificationMessage(message, isError = false) {
    if (!verificationMessage) return;

    verificationMessage.textContent = message;
    verificationMessage.classList.toggle("error", isError);
    verificationMessage.classList.toggle("success", !isError && Boolean(message));
}

function showRSVPMessage(message, isError = false) {
    if (!rsvpMessage) return;

    rsvpMessage.textContent = message;
    rsvpMessage.classList.toggle("error", isError);
    rsvpMessage.classList.toggle("success", !isError && Boolean(message));
}


// 5. NAME AUTOCOMPLETE

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


// 6. INVITATION ACCESS

function applyInvitationAccess(category) {
    const invitationSections = document.querySelectorAll(
        ".invitation-image-section"
    );

    const restrictedForVisitors = ["2.2", "3", "4", "5"];

    invitationSections.forEach(section => {
        const invitationNumber = section.dataset.invitationNumber;

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


// 7. BACKGROUND MUSIC

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


// 8. COUNTDOWN

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

    const difference = COUNTDOWN_DATE.getTime() - Date.now();

    if (difference <= 0) {
        daysElement.textContent = "00";
        hoursElement.textContent = "00";
        minutesElement.textContent = "00";
        secondsElement.textContent = "00";
        return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    daysElement.textContent = String(days).padStart(2, "0");
    hoursElement.textContent = String(hours).padStart(2, "0");
    minutesElement.textContent = String(minutes).padStart(2, "0");
    secondsElement.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);


// 9. SHOW / HIDE INVITATION SECTIONS

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

    if (thankYouScreen) {
        thankYouScreen.hidden = true;
    }
}


// 10. PREVENT DUPLICATE RSVP

function lockRSVPForm() {
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

function unlockRSVPForm() {
    if (rsvpSubmitButton) {
        rsvpSubmitButton.disabled = false;
        rsvpSubmitButton.textContent = "Submit RSVP";
    }

    if (rsvpForm) {
        rsvpForm.querySelectorAll("input").forEach(input => {
            input.disabled = false;
        });
    }
}


// 11. DISPLAY PREVIOUS CONFIRMATION

function displayPreviousConfirmation() {
    if (!previousConfirmation) return;

    if (previousConfirmationName) {
        previousConfirmationName.textContent = verifiedGuestName || "Guest";
    }

    if (previousConfirmationTable) {
        previousConfirmationTable.textContent =
            verifiedTableNumber && String(verifiedTableNumber).trim()
                ? verifiedTableNumber
                : "To be announced";
    }

    if (previousConfirmationResponse) {
        previousConfirmationResponse.textContent =
            previousRSVPResponse || "Response already recorded";
    }

    previousConfirmation.hidden = false;

    previousConfirmation.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// 12. VIEW MY CONFIRMATION BUTTON

if (viewConfirmationButton) {
    viewConfirmationButton.addEventListener("click", () => {
        if (!guestAlreadyResponded) return;

        displayPreviousConfirmation();
    });
}


// 13. RETURNING GUEST DISPLAY

function prepareReturningGuest() {
    if (viewConfirmationButton) {
        viewConfirmationButton.hidden = !guestAlreadyResponded;
    }

    if (previousConfirmation) {
        previousConfirmation.hidden = true;
    }

    if (guestAlreadyResponded) {
        lockRSVPForm();

        showRSVPMessage(
            "Your RSVP has already been recorded. You may view your confirmation below.",
            false
        );
    } else {
        unlockRSVPForm();
        showRSVPMessage("");
    }
}


// 14. THANK YOU SCREEN

function showThankYouScreen(name, tableNumber, response) {
    if (!thankYouScreen) return;

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

    hideInvitationSections();

    if (invitationScreen) {
        invitationScreen.hidden = false;
    }

    if (verificationScreen) {
        verificationScreen.hidden = true;
    }

    thankYouScreen.hidden = false;

    // Make the previous confirmation button available
    // when the guest returns to the invitation.
    if (viewConfirmationButton) {
        viewConfirmationButton.hidden = false;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    lockRSVPForm();
}


// 15. BACK TO INVITATION AFTER RSVP

function returnToInvitation() {
    if (!thankYouScreen || !invitationScreen) return;

    // Hide the Thank You screen.
    thankYouScreen.hidden = true;

    // Restore invitation gallery, countdown, and RSVP section.
    showInvitationSections();

    // Keep the submitted RSVP protected.
    if (guestAlreadyResponded) {
        lockRSVPForm();

        if (viewConfirmationButton) {
            viewConfirmationButton.hidden = false;
        }

        showRSVPMessage(
            "Your RSVP has already been recorded. You may view your confirmation below.",
            false
        );
    }

    // Return to the beginning of the invitation.
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

if (backToInvitationButton) {
    backToInvitationButton.addEventListener(
        "click",
        returnToInvitation
    );
}


// 16. GUEST VERIFICATION

if (verificationForm) {
    verificationForm.addEventListener("submit", async event => {
        event.preventDefault();

        const enteredName = guestNameInput.value.trim();

        if (!enteredName) {
            showVerificationMessage("Please enter your full name.", true);
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

            // Save verified guest details.
            verifiedGuestName = result.name;
            verifiedGuestCategory = result.category;
            verifiedTableNumber = result.tableNumber || "";

            guestAlreadyResponded = Boolean(result.alreadyResponded);
            previousRSVPResponse = result.existingRSVP || "";

            if (rsvpNameInput) {
                rsvpNameInput.value = verifiedGuestName;
            }

            // Apply invitation access restrictions.
            applyInvitationAccess(verifiedGuestCategory);

            // Show invitation screen.
            if (verificationScreen) {
                verificationScreen.hidden = true;
            }

            if (invitationScreen) {
                invitationScreen.hidden = false;
            }

            showInvitationSections();

            if (guestAlreadyResponded) {
                prepareReturningGuest();
            } else {
                previousRSVPResponse = "";

                if (viewConfirmationButton) {
                    viewConfirmationButton.hidden = true;
                }

                if (previousConfirmation) {
                    previousConfirmation.hidden = true;
                }

                unlockRSVPForm();
                showRSVPMessage("");
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


// 17. RSVP SUBMISSION

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
                "Your RSVP has already been recorded. You cannot submit another response.",
                true
            );
            return;
        }

        const selectedAttendance = rsvpForm.querySelector(
            'input[name="attendance"]:checked'
        );

        if (!selectedAttendance) {
            showRSVPMessage("Please select your RSVP response.", true);
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

                if (result.alreadyResponded) {
                    guestAlreadyResponded = true;
                    previousRSVPResponse = result.response || "";
                    lockRSVPForm();
                } else {
                    rsvpSubmitButton.disabled = false;
                    rsvpSubmitButton.textContent = "Submit RSVP";
                }

                return;
            }

            // Save local RSVP state.
            guestAlreadyResponded = true;

            verifiedGuestName = result.name || verifiedGuestName;

            verifiedTableNumber =
                result.tableNumber || verifiedTableNumber;

            const finalResponse = result.response || (
                attendance === "yes"
                    ? "Yes, I will gladly attend!"
                    : "Regretfully, I won't be able to make it."
            );

            previousRSVPResponse = finalResponse;

            // Show Thank You screen after successful submission.
            showThankYouScreen(
                verifiedGuestName,
                verifiedTableNumber,
                finalResponse
            );

        } catch (error) {
            console.error("RSVP submission error:", error);

            showRSVPMessage(
                "Something went wrong. Please check your connection and try again.",
                true
            );

            rsvpSubmitButton.disabled = false;
            rsvpSubmitButton.textContent = "Submit RSVP";
        }
    });
}


// 18. INITIAL PAGE STATE

if (thankYouScreen) {
    thankYouScreen.hidden = true;
}

if (previousConfirmation) {
    previousConfirmation.hidden = true;
}

if (viewConfirmationButton) {
    viewConfirmationButton.hidden = true;
}

if (backToInvitationButton) {
    // The button belongs only on the Thank You screen.
    // Its parent screen starts hidden.
    backToInvitationButton.hidden = false;
}
