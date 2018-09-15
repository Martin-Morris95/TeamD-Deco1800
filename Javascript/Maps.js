var markers = [];
var map;
var root;
var current;

$(document).ready(function() {
  $("#back_button").click(function() {
    current.hideChildren();
    current.hideChildrenPopups();
    current.hidePopup();
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
  if(this.zoom == null) {
    return false;
  }
  map.setZoom(this.zoom);
  return true;
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
    if(self.changeZoom()) {
      current = self;
      updateMap(self.marker.getPosition().lat(), self.marker.getPosition().lng());
    }
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
      showBack();
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
    this.popup.show();
  }
}

Marker.prototype.hidePopup = function() {
  if(this.popup != null) {
    this.popup.hide();
  }
}

Popup = function(content, hidden=true) {
  this.content = content;
  //this.position = position;
  //this.content.style.left = position[0] + 'px';
  //this.content.style.top = position[1] + 'px';
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
/*
Popup.prototype.setPosition = function(position) {
  self.position = position;
}
*/

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), { center: {lat: 31, lng: 68},
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
  }, {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [
      {visibility: 'off'}
  ]}])

/*
  var content = document.createElement("p");
  content.innerHTML = "popup";
  var popup = new Popup([100, 100], content);  

  root = new Root(8);
  current = root;

  var marker1 = new Marker(-35, 150, 10);
  var marker2 = new Marker(-34.7, 150, 12);
  var marker3 = new Marker(-35.1, 150.5, 13, null, popup);
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
*/

  root = new Root(2.5);
  var turkey = new Marker(39, 35, 6);
  root.addChild(turkey);
  root.changeZoom();
  var stats = {"casualties" : "115000", "involved" : "Australia, Turkey"};
  var popupContent = createPopupContent("Gallipoli", ["Lorem Ipsum"], stats);
  var popup = new Popup(popupContent);
  var gallipoli = new Marker(40.3, 26.5, 7, null, popup);
  turkey.addChild(gallipoli);
  gallipoli.hide();
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
    console.log("Longitude: " + longitude + "\nLatitude" + latitude);
  });
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

function createPopupContent(title, text, statistics) {
  var content = document.createElement("div");
  var h = document.createElement("h2");
  h.innerHTML = title;
  content.appendChild(h);
  text.forEach(function(p) {
    var paragraph = document.createElement("p");
    paragraph.innerHTML = p;
    content.appendChild(paragraph);
  })
  var statsH = document.createElement("h3");
  statsH.innerHTML = "Stats";
  content.appendChild(statsH);
  var stats = document.createElement("div");
  stats.classList.add("stats");
  for(var key in statistics) {
    var stat = document.createElement("h4");
    stat.innerHTML = key;
    stats.appendChild(stat);
    var value = document.createElement("p");
    value.innerHTML = statistics[key];
    stats.appendChild(value);
  }
  content.appendChild(stats);
  /*for(var key in statistics) {
    var value = statistics[key];
    var stat = document.createElement("div");
    stat.classList.add("stat");
    var name = document.createElement("h3");
    name.innerHTML = key;
    stat.appendChild(name);
    var num = document.createElement("p");
    num.innerHTML = value;
    stat.appendChild(num);
    content.appendChild(stat);
  }*/
  return content;
}