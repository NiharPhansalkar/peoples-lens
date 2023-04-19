const urlParams = new URLSearchParams(window.location.search);
const label = urlParams.get('label');
const userImage = document.getElementById('user-image');

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

    const photoID = data.photoID;

    fetch('/api/flickrApiKey')
    .then(response => response.text())
    .then(apiKey => {
        const photoUrl = `https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=${apiKey}&photo_id=${photoID}&format=json&nojsoncallback=1`;

        fetch(photoUrl)
        .then(response => response.json())
        .then(data => {
            const sizes = data.sizes.size;
            const mediumSize = sizes.find(size => size.label === 'Medium');
            const imageUrl = mediumSize.source;
            const userImage = document.getElementById('user-image');
            userImage.setAttribute('src', imageUrl);
        })
    })
})
.catch(error => console.log(error));
