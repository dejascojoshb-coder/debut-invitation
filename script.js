
/* =================================
   GOOGLE APPS SCRIPT CONNECTION
================================= */

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwlojt7SRVbvkqdYmKuok4KBGC9GZEx4p8p1VwA3YB6RFznzyDj8JgZw_J1q5LWp2zFOw/exec";


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

const music =
    document.getElementById("background-music");

const musicButton =
    document.getElementById("music-button");

const rsvpForm =
    document.getElementById("rsvp-form");

const rsvpMessage =
    document.getElementById("rsvp-message");

let verifiedGuestName = "";


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

        console.log(
            "Autoplay was blocked. Visitor can start music manually."
        );

        if (musicButton) {
            musicButton.textContent = "PLAY MUSIC";
        }

    }
}

// Attempt autoplay when the website opens.
playMusic();

// Manual music control after the invitation opens.
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
   GUEST NAME VERIFICATION
================================= */

if (verificationForm) {

    verificationForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const guestName = document
                .getElementById("guest-name")
                .value.trim();

            const verifyButton =
                document.getElementById("verify-button");

            if (!guestName) {

                verificationMessage.textContent =
                    "Please enter your full name.";

                return;

            }

            verificationMessage.textContent =
                "Checking your invitation...";

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

                    document.getElementById("rsvp-name").value =
                        verifiedGuestName;

                    // Hide verification screen.
                    verificationScreen.hidden = true;

                    // Show invitation website.
                    invitationScreen.hidden = false;

                    // Attempt music playback again.
                    playMusic();

                    // Update countdown.
                    updateCountdown();

                    // Start invitation from the top.
                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
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

                if (verifyButton) {
                    verifyButton.disabled = false;
                }

            }

        }
    );

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


// Run countdown immediately and update every second.
updateCountdown();

setInterval(updateCountdown, 1000);


/* =================================
   RSVP SUBMISSION
================================= */

if (rsvpForm) {

    rsvpForm.addEventListener(
        "submit",
        async function (event) {

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

            rsvpMessage.textContent =
                "Submitting your RSVP...";

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
                        result.message ||
                        "Unable to submit your RSVP.";

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

        }
    );

}
