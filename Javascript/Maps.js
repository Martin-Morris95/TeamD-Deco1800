var markers = [];
var map;
var root;
var current;

$(document).ready(function() {
  $("#back_button").click(function() {
    current.hideChildren();
    current.hideChildrenPopups();
    current = current.getParent();
    current.showChildren();
    current.changeZoom();
    if(current.isRoot()) {
      $("#back").addClass("hidden"); 
    }
    else {
      updateMap(current.getPosition().lat(), current.getPosition().lng());
    }
  })
})

function Node(zoom) {
  this.zoom = zoom;
  this.children = [];
}

Node.prototype.addChild = function(marker) {
  this.children.push(marker);
  marker.setParent(this);
}

Node.prototype.hideChildren = function() {
  this.children.forEach(function(child) {
    child.hide();
  });
}

Node.prototype.showChildren = function() {
  this.children.forEach(function(child) {
    child.show();
  })
}

Node.prototype.hideChildrenPopups = function() {
  this.children.forEach(function(child) {
    child.hidePopup();
  })
}

Node.prototype.changeZoom = function() {
  map.setZoom(this.zoom);
}

Node.prototype.isRoot = function() {
  return false;
}

Node.prototype.isBottom = function() {
  return this.children.length == 0;
}

function Root(zoom) {
  Node.call(this, zoom);
}

Root.prototype = Object.create(Node.prototype);

Root.prototype.isRoot = function() {
  return true;
}

function Marker(latt, long, zoom=null, icon=null, popup=null) {
  Node.call(this, zoom);

  this.marker = new google.maps.Marker({
    position: {lat: latt, lng: long},
    map: map,
    icon: icon
  });
  this.parent = null;
  this.popup = popup;
  
  var self = this;
  //this.marker.addListener('click', this.click);
  this.marker.addListener('click', function(event) {
    self.changeZoom();
    self.showPopup();
    if(!self.isBottom()) {
      if(self.parent != null) {
        self.parent.hideChildren();
        self.parent.hideChildrenPopups();
      }
      else {
        self.hide();
      }
      self.showChildren();
      updateMap(self.marker.getPosition().lat(), self.marker.getPosition().lng());
      showBack();
      current = self;
    }
  });
}

Marker.prototype = Object.create(Node.prototype);

Marker.prototype.setParent = function(marker) {
  this.parent = marker;
}

Marker.prototype.getParent = function(marker) {
  return this.parent;
}

Marker.prototype.hide = function() {
  this.marker.setMap(null);
}

Marker.prototype.show = function() {
  this.marker.setMap(map);
}

Marker.prototype.getPosition = function() {
  return this.marker.getPosition();
}

Marker.prototype.showPopup = function() {
  if(this.popup != null) {
 //   var position = LattLongToPixels(this.marker.getPosition());
  //  this.popup.setPosition(position);
    this.popup.show();
  }
}

Marker.prototype.hidePopup = function() {
  if(this.popup != null) {
    this.popup.hide();
  }
}

Popup = function(position, content, hidden=true) {
  this.content = content;
  this.position = position;
  this.content.style.left = position[0] + 'px';
  this.content.style.top = position[1] + 'px';
  this.content.classList.add("popup");
  document.getElementById("popups").appendChild(this.content);
  if(hidden) {
    this.content.classList.add("hidden");
  }
}

Popup.prototype.show = function() {
  this.content.classList.remove("hidden");
}

Popup.prototype.hide = function() {
  this.content.classList.add("hidden");
}

Popup.prototype.setPosition = function(position) {
  self.position = position;
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), { center: {lat: -34.397, lng: 150.644},
          zoom: 8, disableDefaultUI: true, mapTypeId: 'terrain'});

  map.set('styles', [{
    featureType: 'all',
    elementType: 'labels',
    stylers: [
      {visibility: 'off'}
    ]
  }, {
    featureType: 'administrative.country',
    elementType: 'labels',
    stylers: [
      {visibility: 'on'}
    ]
  }, {
    featureType: 'road',
    styles: [
      {visibility: 'off'}
    ]
  }])


  var content = document.createElement("p");
  content.innerHTML = "popup";
  var popup = new Popup([100, 100], content);  

  root = new Root(8);
  current = root;

  var marker1 = new Marker(-35, 150, 10);
  var marker2 = new Marker(-34.7, 150, 12);
  var marker3 = new Marker(-35.1, 150.5, null, null, popup);
  var marker4 = new Marker(-34.71, 150.02);
  var marker5 = new Marker(-35.5, 149, 10);
  var marker6 = new Marker(-35.6, 148.7);
  marker2.hide();
  marker3.hide();
  marker4.hide();
  marker6.hide();
  root.addChild(marker1);
  marker1.addChild(marker2);
  marker1.addChild(marker3);
  marker2.addChild(marker4);
  root.addChild(marker5);
  marker5.addChild(marker6);

  // and other stuff...
  $("#search #submit").click(function(event) {
    event.preventDefault();
    var longitude = $("#longitude_text").val();
    var latitude = $("#latitude_text").val();
    updateMap(latitude, longitude);
    console.log("Longitude: " + $("#longitude_text").val() + "\nLatitude: " + $("#latitude_text").val());
  });

  /*
  map.addListener('click', function(event) {
    var longitude = event.latLng.lng();
    var latitude = event.latLng.lat();
    marker = addMarker(latitude, longitude);
    setMarkerFocus(marker, 8);
    if(markers.length > 5){
      console.log("more than 5 markers");
      marker = markers.shift();
      marker.setMap(null);
    }
    console.log("Longitude: " + longitude + "\nLatitude" + latitude);
  });
  */
}

function showBack() {
  $("#back").removeClass("hidden");
}

function hideBack() {
  $("back").addClass("hidden");
}

function updateMap(latt, long){
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

function setMarkerFocus(marker, zoom) {
  marker.addListener('click', function(event) {
    var latt = marker.getPosition().lat();
    var long = marker.getPosition().lng();
    updateMap(latt, long);
    map.setZoom(zoom);
  })
}

function LattLongToPixels(lattlong) {
  var project = map.getProjection().fromLatLngToPoint;
  var bounds = map.getBounds();
  console.log(bounds);
  var left = project(bounds.getSouthWest()).x;
  var top = project(bounds.getNorthWest()).y;
  var scale = Math.pow(2, map.getZoom());
  var position = project(lattlong);
  var x = (position.x - left) * scale;
  var y = (position.y - top) * scale;
  return [x, y];
}