const loginErr = document.getElementById('login-error');
const currUrl = window.location.href;
let paramString = currUrl.split("?")[1];

window.addEventListener("load", () => {
    console.log(paramString);
    if(paramString.includes("error=-1")) {
        loginErr.textContent = "INCORRECT PASSWORD";
        loginErr.style.color = "red";
        loginErr.style.display = "inline-block";
        loginErr.style.marginTop = "13px";
    } else if (paramString.includes("error=-2")) {
        loginErr.textContent = "PLEASE SIGN UP";
        loginErr.style.color = "red";
        loginErr.style.display = "inline-block";
        loginErr.style.marginTop = "13px";
    }
});
