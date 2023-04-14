document.getElementById("profile-image").addEventListener("change", function() {
  let reader = new FileReader();
  reader.onload = function() {
    let preview = document.getElementById("preview");
    preview.src = reader.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(this.files[0]);
});
