const otpErr = document.getElementById('otp-error');
const currUrl = window.location.href;
let paramString = currUrl.split("?")[1];

window.addEventListener("load", () => {
    console.log(paramString);
    if(paramString.includes("error=-1")) {
        otpErr.textContent = "Incorrect OTP";
        otpErr.style.color = "red";
        otpErr.style.display = "inline-block";
        otpErr.style.marginTop = "13px";
    }
});
