const loginBtn = document.getElementById("login-button");
const signUpBtn = document.getElementById("sign-up");

loginBtn.addEventListener("click", () => {
    window.location.href = '/login/userLogin.html';  
});

signUpBtn.addEventListener("click", () => {
    window.location.href = '/signUp/userSignUp.html';  
});
