function initMap() {} 

$(() => {
  initMap = function() {
    // your code like...
    var map = new google.maps.Map(document.getElementById('map'), { center: {lat: -34.397, lng: 150.644},
          zoom: 8});
    // and other stuff...
  }
});

function updateMap(latt, long ){
    map.longitude = long;
    map.latitude = latt;
}

