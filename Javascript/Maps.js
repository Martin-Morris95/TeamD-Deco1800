function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), { center: {lat: -34.397, lng: 150.644},
          zoom: 8});
  // and other stuff...
  $("#search #submit").click(function(event) {
    event.preventDefault();
    var longitude = $("#longitude_text").val();
    var latitude = $("#latitude_text").val();
    map.panTo(new google.maps.LatLng(latitude, longitude));
    console.log("Longitude: " + $("#longitude_text").val() + "\nLatitude: " + $("#latitude_text").val());
  });

  map.addListener('click', function(event) {
    var longitude = event.latLng.lng();
    var latitude = event.latLng.lat();
    console.log("Longitude: " + longitude + "\nLatitude" + latitude);
  });
} 

/*
$(() => {
  initMap = function() {
    // your code like...
    var map = new google.maps.Map(document.getElementById('map'), { center: {lat: -34.397, lng: 150.644},
          zoom: 8});
    // and other stuff...
    $("#search #submit").click(function(event) {
      event.preventDefault();
      var longitude = $("#longitude_text").val();
      var latitude = $("#latitude_text").val();
      map.panTo(new google.maps.LatLng(latitude, longitude));
      console.log("Longitude: " + $("#longitude_text").val() + "\nLatitude: " + $("#latitude_text").val());
    });
  }
});
*/

function updateMap(latt, long ){
    map.longitude = long;
    map.latitude = latt;
}

