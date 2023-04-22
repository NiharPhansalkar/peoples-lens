const video = document.querySelector(".video");
const camBtn = document.querySelector(".camera");
const canvas = document.querySelector(".canvas");

navigator.mediaDevices.getUserMedia({ 
        video: {
            facingMode: 'user'
        }, 
        audio: false
    })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })

camBtn.addEventListener("click", () => {
   video.classList.toggle("effect");
    setTimeout(() => {
        video.classList.toggle("effect");
    }, 400);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg");
    fetch('/capture_person/capturePerson.html', {
        method: 'POST',
        headers: {
            'Content-type' : 'application/json'
        },
        body: JSON.stringify({ imageDataUrl })
    })
    .then(res => {
        if (res.ok) {
            return res.json();
        } else {
            console.log("Error uploading image");
        }
    })
    .then(data => {
        window.location.href = '/login/userLogin.html';
    })
    .catch(error => {
        console.error('Error uploading image', error);
    });
});
