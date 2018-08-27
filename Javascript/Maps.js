var markers = [];
var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), { center: {lat: -34.397, lng: 150.644},
          zoom: 8, disableDefaultUI: true, mapTypeId: 'terrain'});

  // and other stuff...
  $("#search #submit").click(function(event) {
    event.preventDefault();
    var longitude = $("#longitude_text").val();
    var latitude = $("#latitude_text").val();
    updateMap(latitude, longitude);
    console.log("Longitude: " + $("#longitude_text").val() + "\nLatitude: " + $("#latitude_text").val());
  });

  map.addListener('click', function(event) {
    var longitude = event.latLng.lng();
    var latitude = event.latLng.lat();
    addMarker(latitude, longitude, "Images/test.png");
    if(markers.length > 5){
      console.log("more than 5 markers");
      marker = markers.shift();
      marker.setMap(null);
    }
    console.log("Longitude: " + longitude + "\nLatitude" + latitude);
  });
}

function updateMap(latt, long ){
  map.panTo(new google.maps.LatLng(latt, long));
}

//Adds marker to map and returns it
//A custom icon can be used, if no argument is given, the default icon is used
function addMarker(latt, long, icon = null){
  marker = new google.maps.Marker({
    position: {lat: latt, lng: long},
    map: map,
    icon: icon
  });
  markers.push(marker);
  return marker;
}