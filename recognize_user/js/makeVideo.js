const video = document.getElementById("video");

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/recognize_user/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/recognize_user/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/recognize_user/models'),
]).then(() => {
    startWebcam();
}).then(() => faceRecognition())


function startWebcam() {
    navigator.mediaDevices.getUserMedia({ video : true, audio: false})
    .then((stream) => {
        video.srcObject = stream;
    }).catch((err) => {
        console.error(err);
    })
}

async function getLabeledFaceDescriptions(labels) {
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            const image = await faceapi.fetchImage(`/recognize_user/labels/${label}/${label}.jpeg`);
            const detections = await faceapi
                .detectSingleFace(image)
                .withFaceLandmarks()
                .withFaceDescriptor();
            descriptions.push(detections.descriptor);
            return new faceapi.LabeledFaceDescriptors(label.toString(), descriptions);
        })
    );
}

async function getLabels() {
    try {
        const res = await fetch('/recognize_user/sendID');
        const labels = await res.json();
        return labels;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async function faceRecognition() {
    const labels = await getLabels();
    const labeledFaceDescriptors = await getLabeledFaceDescriptions(labels);
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    video.addEventListener("play", () => {
       const canvas = faceapi.createCanvasFromMedia(video); 

        document.body.append(canvas);
        const displaySize = {width: video.width, height: video.height};

        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptors();
            
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor);
            });

            results.forEach((result, i)=> {
                const box = resizedDetections[i].detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, {label: "Click to View Details"});
                drawBox.draw(canvas);
                canvas.addEventListener('click', (event) => {
                    const x = event.offsetX;
                    const y = event.offsetY;

                    if ((x >= box.x && x <= (box.x + box.width)) && 
                        (y >= box.y) && y <= (box.y + box.height)) {
                        const userLabel = result.toString().split(" ")[0]; 
                        window.location.href = `/display_information/displayInformation.html?label=${userLabel}`;
                    }
                });
            })
        }, 100);
    });
}
