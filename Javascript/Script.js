//Javascript
$(document).ready(function() {
    $("#search #submit").click(function(event) {
        console.log("Longitude: " + $("#longitude_text").val() + "\nLatitude: " + $("#latitude_text").val());
        event.preventDefault();
    })
});