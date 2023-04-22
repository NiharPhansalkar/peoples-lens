const urlParams = new URLSearchParams(window.location.search);
const label = urlParams.get('label');

fetch(`/display_information/displayInformation.html?label=${label}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {
    document.getElementById('user-name').textContent = data.name;
    document.getElementById('user-email').textContent = data.email;
    document.getElementById('user-bio').textContent = data.bio;
    document.getElementById('user-domain').textContent = data.domain;
})
.then(() => loadImage())
.catch(error => console.log(error));

function loadImage() {
    const userImage = document.getElementById('user-image');
    const response = await fetch(`/recognize_user/downloadLink?label=${label}`);
    const downloadUrl = await response.json();
    userImage.setAttribute('src', `${downloadUrl}`);
}
