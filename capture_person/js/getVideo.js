const video = document.querySelector(".video");
const camBtn = document.querySelector(".camera");
const canvas = document.querySelector(".canvas");

navigator.mediaDevices.getUserMedia({ video: true })
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
        } else {
            console.log("Error uploading image");
        }
    })
    .catch(error => {
        console.error('Error uploading image', error);
    });
    //const downloadLink = document.createElement("a");
    //downloadLink.href = image_data_url;
    //downloadLink.download = "selfie.jpeg";
    //document.body.appendChild(downloadLink);
    //downloadLink.click();
    //document.body.removeChild(downloadLink);

    //window.location.href = '/user_image/userImage.html';
});
