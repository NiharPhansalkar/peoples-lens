const signUpBtn = document.getElementById("sign-up");

signUpBtn.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = '/signUp/userSignUp.html';  
});
