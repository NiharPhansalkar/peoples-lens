const pswdErr = document.getElementById('password-error');
const currUrl = window.location.href;
let paramString = currUrl.split("?")[1];

window.addEventListener("load", () => {
    console.log(paramString);
    if(paramString.includes("error=-1")) {
        pswdErr.textContent = "Password and Confirm Password do not match!";
        pswdErr.style.color = "red";
        pswdErr.style.display = "inline-block";
        pswdErr.style.marginTop = "13px";
    }
});
