
/* =====================================
   QUINZEYA'S DEBUT INVITATION WEBSITE
   EIGHTEEN EVER AFTER
   ===================================== */

// 1. GOOGLE APPS SCRIPT CONNECTION

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwlojt7SRVbvkqdYmKuok4KBGC9GZEx4p8p1VwA3YB6RFznzyDj8JgZw_J1q5LWp2zFOw/execHERE";


/* =====================================
   2. GUEST VERIFICATION
   ===================================== */

const verificationForm = document.getElementById("verification-form");
const verificationMessage = document.getElementById("verification-message");
const verificationScreen = document.getElementById("verification-screen");
const invitationScreen = document.getElementById("invitation-screen");

let verifiedGuestName = "";

verificationForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const guestName = document.getElementById("guest-name").value.trim();

    if (!guestName) {
        verificationMessage.textContent = "Please enter your full name.";
        return;
    }

    if (!BACKEND_URL || BACKEND_URL.includes("PASTE_YOUR")) {
        verificationMessage.textContent =
            "The verification system is not configured yet.";
        return;
    }

    verificationMessage.textContent = "Checking your invitation...";

    const verifyButton = document.getElementById("verify-button");
    verifyButton.disabled = true;

    try {

        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "verify",
                name: guestName
            })
        });

        const result = await response.json();

        if (result.success) {

            verifiedGuestName = result.name;

            verificationScreen.hidden = true;
            invitationScreen.hidden = false;

            document.getElementById("rsvp-name").value =
                verifiedGuestName;

            // Attempt automatic music playback after guest interaction.
            const music = document.getElementById("background-music");
            const musicButton = document.getElementById("music-button");

            music.play()
                .then(() => {
                    musicButton.textContent = "PAUSE MUSIC";
                })
                .catch(() => {
                    musicButton.textContent = "PLAY MUSIC";
                });

        } else {

            verificationMessage.textContent =
                result.message ||
                "Sorry, this invitation is reserved for invited guests only.";

        }

    } catch (error) {

        console.error("Verification error:", error);

        verificationMessage.textContent =
            "Unable to verify your invitation. Please try again.";

    } finally {

        verifyButton.disabled = false;

    }

});


/* =====================================
   3. COUNTDOWN TIMER
   ===================================== */

// December 18, 2026 — 4:00 PM Philippine time

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

    days.textContent =
        Math.floor(difference / (1000 * 60 * 60 * 24));

    hours.textContent =
        Math.floor((difference / (1000 * 60 * 60)) % 24);

    minutes.textContent =
        Math.floor((difference / (1000 * 60)) % 60);

    seconds.textContent =
        Math.floor((difference / 1000) % 60);

}

updateCountdown();
setInterval(updateCountdown, 1000);


/* =====================================
   4. BACKGROUND MUSIC
   ===================================== */

const music = document.getElementById("background-music");
const musicButton = document.getElementById("music-button");

musicButton.addEventListener("click", function () {

    if (music.paused) {

        music.play()
            .then(() => {
                musicButton.textContent = "PAUSE MUSIC";
            })
            .catch((error) => {
                console.error("Music playback error:", error);
            });

    } else {

        music.pause();
        musicButton.textContent = "PLAY MUSIC";

    }

});


/* =====================================
   5. RSVP SUBMISSION
   ===================================== */

const rsvpForm = document.getElementById("rsvp-form");
const rsvpMessage = document.getElementById("rsvp-message");

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

    submitButton.disabled = true;

    try {

        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "rsvp",
                name: verifiedGuestName,
                attendance: attendance
            })
        });

        const result = await response.json();

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
