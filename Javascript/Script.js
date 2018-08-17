//Javascript
$(document).ready(function() {
    $("#search #submit").click(function(event) {
        event.preventDefault();
        console.log("Longitude: " + $("#longitude_text").val() + "\nLatitude: " + $("#latitude_text").val());
    })
});