const nameCount = document.getElementById("name-length");
const userName = document.getElementById("user-name");
const domainCount = document.getElementById("domain-length");
const domain = document.getElementById("user-domain");
const bioCount = document.getElementById("bio-length");
const bio = document.getElementById("user-bio");
const numRemaining = document.getElementById("phone-length");
const number = document.getElementById("user-phone");

userName.addEventListener("input", () => {
    const nameLen = userName.value.length;
    nameCount.textContent = `${nameLen} / 50 characters`;
});

domain.addEventListener("input", () => {
    const domainLen = domain.value.length;
    domainCount.textContent = `${domainLen} / 25 characters`;
});

bio.addEventListener("input", () => {
    const bioLen = bio.value.length;
    bioCount.textContent = `${bioLen} / 300 characters`;
});

number.addEventListener("input", () => {
    const numLen = number.value.length;
    numRemaining.textContent = `${10 - numLen} digits remaining`;
});
