var serverSide = false;
var markers = [];
var map;
var root;
var current;
var showBattles = false;
var showTerritories = false;
var showDeployment = false;
var territoryManager;

$(document).ready(function() {
  $("#backButton").click(function() {
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
  $("#timeline p").click(function() {
    $(".current").removeClass("current");
    $(this).addClass("current");
    var year = parseInt($(this).text());
    root.setCurrentYear(year);
    territoryManager.changeYear(year);
    current.showChildren();
  })
})
    
function Node(zoom) {
  this.zoom = zoom;
  this.children = [];
  this.year = [];
  this.currentYear = 1914;
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

Node.prototype.setCurrentYear = function(year) {
  this.currentYear = year;
  this.children.forEach(function(child) {
    child.setCurrentYear(year);
  })
}

function Root(zoom) {
  Node.call(this, zoom);
}

Root.prototype = Object.create(Node.prototype);

Root.prototype.isRoot = function() {
  return true;
}

function Marker(latt, long,  year = [], zoom=null, icon=null, popup=null) {
  Node.call(this, zoom);

  this.marker = new google.maps.Marker({
    position: {lat: latt, lng: long},
    map: map,
    icon: icon
  });
  this.parent = null;
  this.popup = popup;
  this.year = year;

  this.marker.addListener('click', this.click.bind(this));
}

Marker.prototype = Object.create(Node.prototype);

Marker.prototype.click = function(event) {
  if(this.changeZoom()) {
    current = this;
    updateMap(this.marker.getPosition().lat(), this.marker.getPosition().lng());
    showBack();
  }
  this.showPopup();
  if(!this.isBottom()) {
    if(this.parent != null) {
      this.parent.hideChildren();
      this.parent.hideChildrenPopups();
    }
    else {
      this.hide();
    }
    this.showChildren();
  }
}

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
  if(this.year.length == 0 || this.year.indexOf(this.currentYear) >= 0)
    this.marker.setMap(map);
  else
    this.marker.setMap(null);
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

Marker.prototype.addYear = function(year) {
  this.year.push(year);
}

Popup = function(content, hidden=true) {
  this.content = content;
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

Question = function(question, answer, getNextQuestion, correct) {
  this.question = question;
  this.answer = answer;
  this.correct = correct;
  this.getNextQuestion = getNextQuestion;
  
  this.content = createQuestionContent(question, this.answerQuestion.bind(this));
  this.content.classList.add("question");
 // this.content.getElementsByTagName("form")[0].setAttribute("action", )
  document.getElementById("questions").appendChild(this.content);
}

Question.prototype.answerQuestion = function() {
  var ans = this.content.getElementsByTagName("input")[0].value;
  if(ans == this.answer) {
    var question = this.question;
    var nextQuestion = this.getNextQuestion();
    if(nextQuestion != null) {
      this.changeQuestion(nextQuestion[0], nextQuestion[1]);
      this.content.getElementsByTagName("input")[0].value = "";
    }
    else {
      this.content.classList.add("hidden");
    }
    this.correct(question);
  }
  else {
    alert("Incorrect");
  }
}

Question.prototype.changeQuestion = function(question, answer) {
  this.question = question;
  this.answer = answer;
  this.content.getElementsByTagName("label")[0].innerHTML = question;
}

function createQuestionContent(question, callback) {
  var content = document.getElementById("questionTemplate").cloneNode(true);
  content.removeAttribute("id");
  content.classList.remove("template");
  content.getElementsByTagName("label")[0].innerHTML = question;
  content.getElementsByTagName("form")[0].addEventListener('submit', function(event) {event.preventDefault(); callback();});
  
  return content;
}

$('input[type=checkbox]').change(function(){
    if(this.checked){
        if(this.id == "battles" ){
            showBattles = true;
            current.showChildren();
        }else if(this.id == "deployment"){
            showDeployment = true;
        }else if(this.id == "territories"){
            showTerritories = true;
        }
    }else{
        if(this.id == "battles" ){
            showBattles = false;
            current.hideChildren();
        }else if(this.id == "deployment"){
            showDeployment = false;
        }else if(this.id == "territories"){
            showTerritories = false;
        }
    }

});

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), { center: {lat: 31, lng: 68},
          zoom: 6, disableDefaultUI: true, mapTypeId: 'terrain',zoomControl: false,
          scaleControl: false,scrollwheel: false,disableDoubleClickZoom: true,});

  
  var retroStyle =[
    {
        "featureType": "administrative",
        "stylers": [{"visibility": "off"}
        ]
    },  
    {
        featureType: 'all',
        elementType: 'labels',
        stylers: [
          {visibility: 'off'}
        ]
    }, 
    {
        featureType: 'administrative.country',
        elementType: 'labels',
        stylers: [
          {visibility: 'on'}
        ]
    }, 
    {
        featureType: 'road',
        styles: [
          {visibility: 'off'}
        ]
    }, 
    {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [
          {visibility: 'off'}
        ]
    },      
    {
        "featureType": "poi",
        "stylers": [{"visibility": "simplified"}
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {"visibility": "simplified"}
        ]
    },
    {
        "featureType": "water",
        "stylers": [{"visibility": "simplified"}
        ]
    },
    {
        "featureType": "transit",
        "stylers": [{"visibility": "simplified"}
        ]
    },
    {
        "featureType": "landscape",
        "stylers": [{"visibility": "simplified"}
        ]
    },
    {
        "featureType": "road.highway",
        "stylers": [{"visibility": "off"}
        ]
    },
    {
        "featureType": "road.local",
        "stylers": [{"visibility": "on"}
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{"visibility": "on"}
        ]
    },
    {
        "featureType": "water",
        "stylers": [{"color": "#84afa3"},{"lightness": 52}
        ]
    },
    {
        "stylers": [{"saturation": -17},{"gamma": 0.36}
        ]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [{"color": "#3f518c"}
        ]
    }]
  
 
      
map.set('styles', retroStyle);
 
function Territory(shape) {
  this.shape = shape;
}

Territory.prototype.hide = function() {
  this.shape.setMap(null);
}

Territory.prototype.show = function() {
  this.shape.setMap(map);
}

function TerritoryManager(years, currentYear) {
  this.territories = {};
  this.year = currentYear;
  years.forEach(function(year) {
    this.territories[year] = [];
  }.bind(this));
}

TerritoryManager.prototype.addTerritory = function(year, territory) {
  if(this.territories[year] == null) {
    this.territories[year] = [];
  }
  this.territories[year].push(territory);
  if(year != this.year) {
    territory.hide();
  }
}

TerritoryManager.prototype.changeYear = function(newYear) {
  this.territories[this.year].forEach(function(territory) {
    territory.hide();
  });
  this.year = newYear;
  this.territories[newYear].forEach(function(territory) {
    territory.show();
  })
}

territoryManager = new TerritoryManager([1914, 1915, 1916, 1917, 1918], 1914);

//1914 Territories-------------------------------------------------------------------------------------

var shapes = [];
var path = [
new google.maps.LatLng(12.600821132255435, 43.791418059509965),
new google.maps.LatLng(17.186074753471466, 45.109777434509965),
new google.maps.LatLng(21.905478632532134, 43.000402434509965),
new google.maps.LatLng(23.526863029977417, 40.978918059509965),
new google.maps.LatLng(26.316204852141713, 39.045324309509965),
new google.maps.LatLng(31.09352820322539, 37.639074309509965),
new google.maps.LatLng(33.836785412771924, 39.572668059509965),
new google.maps.LatLng(36.42405827231705, 41.154699309509965),
new google.maps.LatLng(37.3379671651693, 42.824621184509965),
new google.maps.LatLng(33.69065210737621, 43.264074309509965),
new google.maps.LatLng(31.54402988920859, 44.318761809509965),
new google.maps.LatLng(29.957923384793325, 45.373449309509965),
new google.maps.LatLng(28.963106980336363, 46.428136809509965),
new google.maps.LatLng(29.039976697050065, 47.834386809509965),
new google.maps.LatLng(30.034041970529938, 48.976964934509965),
new google.maps.LatLng(30.867471340316207, 47.658605559509965),
new google.maps.LatLng(31.749787672743146, 47.922277434509965),
new google.maps.LatLng(32.5497210550939, 47.372961028259965),
new google.maps.LatLng(33.011556321467516, 46.164464934509965),
new google.maps.LatLng(37.07022591717478, 44.50342064173333),
new google.maps.LatLng(37.105281655968206, 44.76709251673333),
new google.maps.LatLng(37.76825322645267, 44.56933861048333),
new google.maps.LatLng(37.87239535214543, 44.21777611048333),
new google.maps.LatLng(38.373674201771465, 44.59131126673333),
new google.maps.LatLng(38.35644605524822, 44.32763939173333),
new google.maps.LatLng(39.39983812965472, 43.99804954798333),
new google.maps.LatLng(39.43378796025994, 44.39355736048333),
new google.maps.LatLng(39.77237617680897, 44.76709251673333),
new google.maps.LatLng(40.042053679052835, 44.37158470423333),
new google.maps.LatLng(40.10930711322221, 43.66845970423333),
new google.maps.LatLng(40.8114524414331, 43.80029564173333),
new google.maps.LatLng(41.06043814601203, 43.44873314173333),
new google.maps.LatLng(41.35798139403791, 43.07519798548333),
new google.maps.LatLng(41.588467878053414, 42.74560814173333),
new google.maps.LatLng(41.48978831023597, 41.53711204798333),
new google.maps.LatLng(40.927762553136965, 40.24072532923333),
new google.maps.LatLng(41.14322476616149, 39.36181907923333),
new google.maps.LatLng(40.927762553136965, 38.32910423548333),
new google.maps.LatLng(41.42391829549029, 36.72510032923333),
new google.maps.LatLng(41.703403693273465, 35.95605736048333),
new google.maps.LatLng(41.67058581142774, 35.34082298548333),
new google.maps.LatLng(42.04698028109663, 35.01123314173333),
new google.maps.LatLng(41.93265998635855, 34.37402611048333),
new google.maps.LatLng(41.99631472101583, 33.18157486310042),
new google.maps.LatLng(41.57032414460038, 31.907160800600423),
new google.maps.LatLng(41.1745921757099, 31.335871738100423),
new google.maps.LatLng(41.141505883449575, 30.369074863100423),
new google.maps.LatLng(41.1745921757099, 29.446223300600423),
new google.maps.LatLng(41.43868099975906, 28.391535800600423),
new google.maps.LatLng(41.61962131167342, 28.050959628725423),
new google.maps.LatLng(41.971815290181354, 28.039973300600423),
new google.maps.LatLng(41.939134718641895, 27.523615878725423),
new google.maps.LatLng(42.11052073018518, 27.248957675600423),
new google.maps.LatLng(41.971815290181354, 26.589777988100423),
new google.maps.LatLng(41.84099247202095, 26.545832675600423),
new google.maps.LatLng(41.75909210477077, 26.337092441225423),
new google.maps.LatLng(41.59706962135493, 26.600764316225423),
new google.maps.LatLng(41.34187348243152, 26.628230136537923),
new google.maps.LatLng(41.32949980789231, 26.507380527162923),
new google.maps.LatLng(41.20976645891417, 26.320612949037923),
new google.maps.LatLng(40.94475071505737, 26.353571933412923),
new google.maps.LatLng(40.72863911797578, 26.056941074037923),
new google.maps.LatLng(40.586954622757176, 26.084406894350423),
new google.maps.LatLng(40.60363900376062, 26.463435214662923),
new google.maps.LatLng(40.65783448460456, 26.776545566225423),
new google.maps.LatLng(40.62031922107448, 26.853449863100423),
new google.maps.LatLng(40.53687650137499, 26.749079745912923),
new google.maps.LatLng(40.32362670290174, 26.227229159975423),
new google.maps.LatLng(40.19786990588656, 26.282160800600423),
new google.maps.LatLng(40.046653319759635, 26.155818027162923),
new google.maps.LatLng(40.05506306361343, 26.227229159975423),
new google.maps.LatLng(40.18528137143623, 26.386530917787923),
new google.maps.LatLng(40.3445634390008, 26.606257480287923),
new google.maps.LatLng(40.43660789019881, 26.677668613100423),
new google.maps.LatLng(40.670334887143504, 27.248957675600423),
new google.maps.LatLng(40.84509444680162, 27.441218417787923),
new google.maps.LatLng(40.98622984692568, 27.523615878725423),
new google.maps.LatLng(40.998668502202655, 27.798274081850423),
new google.maps.LatLng(40.95719719212197, 27.880671542787923),
new google.maps.LatLng(41.002814199113615, 27.968562167787923),
new google.maps.LatLng(41.07325114506876, 28.089411777162923),
new google.maps.LatLng(41.02768290430425, 28.429987949037923),
new google.maps.LatLng(40.948899801444156, 28.841975253725423),
new google.maps.LatLng(41.019394379042645, 28.984797519350423),
new google.maps.LatLng(40.84093884475759, 29.286921542787923),
new google.maps.LatLng(40.573288092898906, 29.131245586745308),
new google.maps.LatLng(40.473073940000816, 28.823628399245308),
new google.maps.LatLng(40.53990002323058, 27.812886211745308),
new google.maps.LatLng(40.272196362421, 27.768940899245308),
new google.maps.LatLng(40.439635932580345, 27.285542461745308),
new google.maps.LatLng(40.355968122039506, 26.977925274245308),
new google.maps.LatLng(40.36433958162144, 26.736226055495308),
new google.maps.LatLng(40.0370828569733, 26.296772930495308),
new google.maps.LatLng(39.96975811421875, 26.219868633620308),
new google.maps.LatLng(39.479670480353455, 26.066060039870308),
new google.maps.LatLng(39.58982050002821, 26.933979961745308),
new google.maps.LatLng(39.30986780244034, 26.659321758620308),
new google.maps.LatLng(38.91775499940567, 26.780171367995308),
new google.maps.LatLng(38.977565043237156, 26.933979961745308),
new google.maps.LatLng(38.87372879709823, 27.012292959960178),
new google.maps.LatLng(38.678010524881344, 26.747212383620308),
new google.maps.LatLng(38.46327202723098, 27.021870586745308),
new google.maps.LatLng(38.43746029365953, 27.186665508620308),
new google.maps.LatLng(38.403030288240465, 26.703267071120308),
new google.maps.LatLng(38.652275799703226, 26.450581524245308),
new google.maps.LatLng(38.643695502785, 26.362690899245308),
new google.maps.LatLng(38.39442022296264, 26.450581524245308),
new google.maps.LatLng(38.28239608715271, 26.252827617995308),
new google.maps.LatLng(38.13564177075248, 26.637349102370308),
new google.maps.LatLng(38.213372091248296, 26.780171367995308),
new google.maps.LatLng(38.03619909137595, 26.862568828932808),
new google.maps.LatLng(38.06215369937559, 27.005391094557808),
new google.maps.LatLng(37.992920965707974, 27.137227032057808),
new google.maps.LatLng(37.97127232148749, 27.247090313307808),
new google.maps.LatLng(37.71037572877042, 27.225663414394262),
new google.maps.LatLng(37.66690586530987, 27.027909508144262),
new google.maps.LatLng(37.44045215606625, 27.291581383144262),
new google.maps.LatLng(37.33570313155953, 27.280595055019262),
new google.maps.LatLng(37.353171464562564, 27.412430992519262),
new google.maps.LatLng(37.292014523507234, 27.599198570644262),
new google.maps.LatLng(37.0994832176934, 27.489335289394262),
new google.maps.LatLng(37.07319092177279, 27.225663414394262),
new google.maps.LatLng(36.97670783567405, 27.324540367519262),
new google.maps.LatLng(37.0030335567265, 27.533280601894262),
new google.maps.LatLng(37.04688950672561, 28.247391930019262),
new google.maps.LatLng(36.8537340507309, 28.027665367519262),
new google.maps.LatLng(36.73056210965264, 27.379472008144262),
new google.maps.LatLng(36.668901908793515, 27.566239586269262),
new google.maps.LatLng(36.79217283412598, 28.093583336269262),
new google.maps.LatLng(36.55425895176153, 28.016679039394262),
new google.maps.LatLng(36.73056210965264, 28.236405601894262),
new google.maps.LatLng(36.81856227668565, 28.500077476894262),
new google.maps.LatLng(36.6248286340854, 28.840653648769262),
new google.maps.LatLng(36.71294995663481, 29.049393883144262),
new google.maps.LatLng(36.668901908793515, 29.148270836269262),
new google.maps.LatLng(36.58955185879836, 29.016434898769262),
new google.maps.LatLng(36.331354219271326, 29.192254045937034),
new google.maps.LatLng(36.17384301408883, 29.631669273769262),
new google.maps.LatLng(36.32446226299044, 30.180985680019262),
new google.maps.LatLng(36.24475882353405, 30.389725914394262),
new google.maps.LatLng(36.29790349467305, 30.499589195644262),
new google.maps.LatLng(36.86465861532305, 30.96187739350694),
new google.maps.LatLng(36.75910985873538, 31.44527583100694),
new google.maps.LatLng(36.08726358861817, 32.63179926850694),
new google.maps.LatLng(36.26462852274341, 34.12593989350694),
new google.maps.LatLng(36.72389461140152, 34.69722895600694),
new google.maps.LatLng(36.476935888922654, 35.31246333100694),
new google.maps.LatLng(36.79430894573741, 35.88375239350694),
new google.maps.LatLng(35.89830881905721, 35.8754857349187),
new google.maps.LatLng(34.606448979122554, 35.8315404224187),
new google.maps.LatLng(33.51428853717999, 35.1723607349187),
new google.maps.LatLng(31.363396518692774, 34.4692357349187),
new google.maps.LatLng(30.949726596586153, 32.4038060474187),
new google.maps.LatLng(29.69798106656325, 32.4038060474187),
new google.maps.LatLng(27.810319361293597, 34.2055638599187),
new google.maps.LatLng(29.50693473626847, 34.8647435474187),
new google.maps.LatLng(27.965685934075964, 34.7329076099187),
new google.maps.LatLng(28.07221916073979, 35.11163199591965),
new google.maps.LatLng(25.701181806089718, 36.80352652716965),
new google.maps.LatLng(25.145529662369743, 37.24297965216965),
new google.maps.LatLng(24.7071611656434, 37.28692496466965),
new google.maps.LatLng(24.307299991465225, 37.55059683966965),
new google.maps.LatLng(24.086836393403402, 38.20977652716965),
new google.maps.LatLng(21.049127226317797, 39.145344022015934),
new google.maps.LatLng(20.06160381493625, 40.243976834515934),
new google.maps.LatLng(19.482643395938908, 41.034992459515934),
new google.maps.LatLng(18.131204401694994, 41.58567724434852),
new google.maps.LatLng(16.93648213075802, 42.617023709515934),
new google.maps.LatLng(15.374772719568043, 42.748859647015934),
new google.maps.LatLng(12.867343816845834, 43.276203397015934)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1914, territory);
    
var path = [
new google.maps.LatLng(51.09909115807639, 2.5111404848881875),
new google.maps.LatLng(50.71112326880887, 3.214265484888074),
new google.maps.LatLng(50.31991769234376, 4.093171734888074),
new google.maps.LatLng(49.84051725424638, 4.181062359888074),
new google.maps.LatLng(50.1794151119002, 4.884187359888074),
new google.maps.LatLng(49.812167850656955, 4.972077984888074),
new google.maps.LatLng(49.38493139227487, 6.290437359888074),
new google.maps.LatLng(48.982796467587356, 8.048249859888074),
new google.maps.LatLng(47.57917706276028, 7.476960797388074),
new google.maps.LatLng(47.57917706276028, 8.487702984888074),
new google.maps.LatLng(47.63843193783628, 9.190827984888074),
new google.maps.LatLng(47.519855049456716, 9.893952984888074),
new google.maps.LatLng(47.43074611826086, 9.630281109888074),
new google.maps.LatLng(47.162512391365446, 9.542390484888074),
new google.maps.LatLng(46.92293972114212, 9.893952984888074),
new google.maps.LatLng(46.982933753458035, 10.333406109888074),
new google.maps.LatLng(46.86287842938966, 10.509187359888074),
new google.maps.LatLng(46.71243087943887, 10.421296734888074),
new google.maps.LatLng(46.621960485676006, 10.333406109888074),
new google.maps.LatLng(46.86287842938966, 10.772859234888074),
new google.maps.LatLng(46.74255403053469, 11.124421734888074),
new google.maps.LatLng(47.012905550321236, 11.695710797388074),
new google.maps.LatLng(47.012905550321236, 12.179109234888074),
new google.maps.LatLng(46.630883414780875, 12.56660505340551),
new google.maps.LatLng(46.419231710855875, 14.63203474090551),
new google.maps.LatLng(46.6308834147809, 15.73066755340551),
new google.maps.LatLng(46.87176157087843, 16.34590192840551),
new google.maps.LatLng(45.90178614186274, 17.40058942840551),
new google.maps.LatLng(45.84059020917683, 18.76289411590551),
new google.maps.LatLng(46.14589614247131, 20.16914411590551),
new google.maps.LatLng(46.206755235745355, 21.04805036590551),
new google.maps.LatLng(45.9323588412286, 28.16719099090551),
new google.maps.LatLng(47.02176383543947, 27.90351911590551),
new google.maps.LatLng(47.942404098244495, 27.11250349090551),
new google.maps.LatLng(48.38208869471798, 26.62910505340551),
new google.maps.LatLng(48.235945876309195, 26.49726911590551),
new google.maps.LatLng(50.60792735631508, 23.99238630340551),
new google.maps.LatLng(51.90049729163585, 23.55293317840551),
new google.maps.LatLng(52.265067203708256, 23.15742536590551),
new google.maps.LatLng(52.6133243918968, 23.57490583465551),
new google.maps.LatLng(52.71992715326973, 23.99238630340551),
new google.maps.LatLng(54.19808455739131, 23.527848222086277),
new google.maps.LatLng(54.41601973650956, 22.780777909586277),
new google.maps.LatLng(55.06292276278822, 22.626969315836277),
new google.maps.LatLng(55.0880812990758, 22.033707597086277),
new google.maps.LatLng(55.83550494233878, 22.121598222086277),
new google.maps.LatLng(56.556726216496415, 22.429215409586277),
new google.maps.LatLng(56.91826687967319, 22.077652909586277),
new google.maps.LatLng(57.09773535033641, 21.396500565836277),
new google.maps.LatLng(56.978185929794925, 21.330582597086277),
new google.maps.LatLng(56.798139653519335, 21.088883378336277),
new google.maps.LatLng(56.15500273066435, 21.022965409586277),
new google.maps.LatLng(55.600352628693116, 21.154801347086277),
new google.maps.LatLng(54.92426782710217, 21.154801347086277),
new google.maps.LatLng(55.01255821381956, 20.188004472086277),
new google.maps.LatLng(54.79780180240182, 19.946305253336277),
new google.maps.LatLng(54.6836430327168, 20.385758378336277),
new google.maps.LatLng(54.28796233086162, 19.418961503336277),
new google.maps.LatLng(54.441583346267144, 18.584000565836277),
new google.maps.LatLng(54.861084390458394, 18.342301347086277),
new google.maps.LatLng(54.54367837599839, 16.452652909586277),
new google.maps.LatLng(54.3007860331635, 16.298844315836277),
new google.maps.LatLng(54.05645218613096, 14.826676347086277),
new google.maps.LatLng(54.10801088708297, 13.903824784586277),
new google.maps.LatLng(54.620082405439504, 13.552262284586277),
new google.maps.LatLng(54.65823071050048, 13.266617753336277),
new google.maps.LatLng(54.043552501314345, 11.508805253336277),
new google.maps.LatLng(54.05645218613096, 10.981461503336277),
new google.maps.LatLng(54.46713101021969, 11.311051347086277),
new google.maps.LatLng(54.352040917344134, 10.783707597086277),
new google.maps.LatLng(54.46713101021969, 10.190445878336277),
new google.maps.LatLng(54.75978462431221, 9.926774003336277),
new google.maps.LatLng(54.92426782710217, 8.674332597086277),
new google.maps.LatLng(54.54367837599839, 8.894059159586277),
new google.maps.LatLng(54.32642145905465, 8.652359940836277),
new google.maps.LatLng(53.96607026659494, 8.938004472086277),
new google.maps.LatLng(53.74575318251457, 8.498551347086277),
new google.maps.LatLng(53.61561259737761, 7.2144384167905855),
new google.maps.LatLng(53.43273960310655, 6.9947118542905855),
new google.maps.LatLng(53.367236379996825, 5.6104345105405855),
new google.maps.LatLng(53.07782294319852, 5.2149266980405855),
new google.maps.LatLng(53.143770506105255, 4.9512548230405855),
new google.maps.LatLng(52.439569089183564, 4.4678563855405855),
new google.maps.LatLng(51.96826451771474, 4.0503759167905855),
new google.maps.LatLng(51.737539034111904, 4.2481298230405855),
new google.maps.LatLng(51.655823921262666, 3.6988134167905855),
new google.maps.LatLng(51.21751478629626, 2.6441259167905855)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1914, territory);

var path = [
];
var path = [
new google.maps.LatLng(-28.6955544447906, 16.32513858446157),
new google.maps.LatLng(-28.11574280678953, 17.11615420946157),
new google.maps.LatLng(-28.77262223509073, 17.64349795946157),
new google.maps.LatLng(-29.003483922546256, 19.22552920946157),
new google.maps.LatLng(-28.348048092095336, 19.97259952196157),
new google.maps.LatLng(-21.98905169830721, 20.14838077196157),
new google.maps.LatLng(-22.02979437342771, 20.93939639696157),
new google.maps.LatLng(-18.401602772899263, 21.11517764696157),
new google.maps.LatLng(-17.98411860972236, 23.31244327196157),
new google.maps.LatLng(-18.52665204707377, 23.66400577196157),
new google.maps.LatLng(-17.942315425596558, 24.41107608446157),
new google.maps.LatLng(-18.15123216472724, 24.58685733446157),
new google.maps.LatLng(-17.81684668283538, 25.33392764696157),
new google.maps.LatLng(-17.356042727327146, 24.23529483446157),
new google.maps.LatLng(-18.0676952632615, 21.37884952196157),
new google.maps.LatLng(-17.73315172872348, 18.83002139696157),
new google.maps.LatLng(-17.356042727327146, 13.90814639696157),
new google.maps.LatLng(-16.97815639198699, 13.20502139696157),
new google.maps.LatLng(-16.97815639198699, 12.89740420946157),
new google.maps.LatLng(-17.314093473069118, 12.58978702196157),
new google.maps.LatLng(-17.23016625511157, 11.66693545946157),
new google.maps.LatLng(-18.52665204707377, 12.01849795946157),
new google.maps.LatLng(-22.5583764364442, 14.61127139696157),
new google.maps.LatLng(-24.29218771580328, 14.47943545946157),
new google.maps.LatLng(-24.971273042945267, 14.83099795946157),
new google.maps.LatLng(-27.259662930450887, 15.22650577196157)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1914, territory);
    
var path = [
new google.maps.LatLng(4.747012109930874, 8.571742279961427),
new google.maps.LatLng(7.194409360903305, 10.593226654961427),
new google.maps.LatLng(6.583619734553094, 11.384242279961427),
new google.maps.LatLng(11.873573442696983, 14.724086029961427),
new google.maps.LatLng(13.673516637877684, 13.405726654961427),
new google.maps.LatLng(12.989343598757106, 7.165492279961427),
new google.maps.LatLng(13.758900796282816, 5.759242279961427),
new google.maps.LatLng(13.502655597888278, 4.440882904961427),
new google.maps.LatLng(11.270848158301568, 3.298304779961427),
new google.maps.LatLng(6.4089672142475145, 2.770961029961427),
new google.maps.LatLng(6.234254872412507, 4.704554779961427),
new google.maps.LatLng(4.396568749419022, 5.407679779961427)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1914, territory);

        
var path = [
new google.maps.LatLng(-11.618604381942829, 34.794758084515934),
new google.maps.LatLng(-11.575556192343411, 36.113117459515934),
new google.maps.LatLng(-11.317128728742214, 37.958820584515934),
new google.maps.LatLng(-10.497258905970448, 40.419758084515934),
new google.maps.LatLng(-9.198354342388678, 39.628742459515934),
new google.maps.LatLng(-6.979585994157616, 39.496906522015934),
new google.maps.LatLng(-6.2811681540338355, 38.881672147015934),
new google.maps.LatLng(-4.750250127541356, 39.452961209515934),
new google.maps.LatLng(-3.435281986043419, 37.695148709515934),
new google.maps.LatLng(-1.0642339772205076, 34.003742459515934),
new google.maps.LatLng(-1.0202959365877038, 30.532062772015934),
new google.maps.LatLng(-1.503575697033644, 29.609211209515934),
new google.maps.LatLng(-2.381968117972524, 28.818195584515934),
new google.maps.LatLng(-4.881620595387186, 29.433429959515934),
new google.maps.LatLng(-6.6741502230193515, 29.697101834515934),
new google.maps.LatLng(-8.242745651210223, 30.927570584515934),
new google.maps.LatLng(-9.241731892458551, 32.861164334515934),
new google.maps.LatLng(-9.50188414655556, 34.003742459515934),
new google.maps.LatLng(-10.324371546215447, 34.706867459515934)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1914, territory);

//1914 territories end -----------------------------------------------------------------------------------------
//1915 territories ---------------------------------------------------------------------------------------------

var shapes = [];
var path = [
];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
map.setCenter(new google.maps.LatLng(53.66025375245039, 10.624108735885443), 8);
shapes.push(polyline);
var path = [
new google.maps.LatLng(54.913468281279215, 8.65220893507103),
new google.maps.LatLng(54.913468281279215, 8.84996284132103),
new google.maps.LatLng(54.856592391916685, 9.21251166944603),
new google.maps.LatLng(54.805968620839124, 9.25645698194603),
new google.maps.LatLng(54.837615916693366, 9.41026557569603),
new google.maps.LatLng(54.856592391916685, 9.55308784132103),
new google.maps.LatLng(54.76795912247512, 9.82774604444603),
new google.maps.LatLng(54.79330275766976, 9.94859565382103),
new google.maps.LatLng(54.69183290117088, 9.99254096632103),
new google.maps.LatLng(54.609201364445696, 10.04747260694603),
new google.maps.LatLng(54.51364840668795, 9.95958198194603),
new google.maps.LatLng(54.46259523647478, 9.86070502882103),
new google.maps.LatLng(54.46259523647478, 10.14634956007103),
new google.maps.LatLng(54.43065462578779, 10.35508979444603),
new google.maps.LatLng(54.31546203358111, 10.71763862257103),
new google.maps.LatLng(54.385895905505144, 10.93736518507103),
new google.maps.LatLng(54.398689096531825, 11.11314643507103),
new google.maps.LatLng(54.1935190109416, 11.08018745069603),
new google.maps.LatLng(54.00024254445991, 10.77257026319603),
new google.maps.LatLng(53.9744042736156, 10.88243354444603),
new google.maps.LatLng(54.0066996076226, 11.21202338819603),
new google.maps.LatLng(54.142066661027165, 11.67344916944603),
new google.maps.LatLng(54.167800834584995, 12.10191596632103),
new google.maps.LatLng(54.44982198182039, 12.50841010694603),
new google.maps.LatLng(53.948469354759276, 14.324054923710719),
new google.maps.LatLng(54.28332675236657, 16.16975804871072),
new google.maps.LatLng(54.564558428875024, 16.69710179871072),
new google.maps.LatLng(54.84386352524619, 18.19124242371072),
new google.maps.LatLng(54.462515617929455, 18.71858617371072),
new google.maps.LatLng(54.28332675236657, 19.59749242371072),
new google.maps.LatLng(54.590029313743095, 20.34456273621072),
new google.maps.LatLng(54.7425205317896, 19.86116429871072),
new google.maps.LatLng(54.96392709643538, 19.988028536557295),
new google.maps.LatLng(54.960773390818744, 21.229483614682295),
new google.maps.LatLng(55.48713093081188, 21.251456270932295),
new google.maps.LatLng(56.031110889694865, 20.987784395932295),
new google.maps.LatLng(56.90498100476699, 21.031729708432295),
new google.maps.LatLng(57.01280437324971, 21.405264864682295),
new google.maps.LatLng(57.570829779474494, 21.712882052182295),
new google.maps.LatLng(57.735418083336256, 22.525870333432295),
new google.maps.LatLng(57.39365556144623, 22.965323458432295),
new google.maps.LatLng(57.144165242647, 23.250967989682295),
new google.maps.LatLng(57.000839401259945, 23.976065645932295),
new google.maps.LatLng(55.89582683991222, 27.184073458432295),
new google.maps.LatLng(52.12896702738455, 23.712393770932295),
new google.maps.LatLng(50.683280699319084, 24.025653237689426),
new google.maps.LatLng(49.6417154632193, 22.663348550189426),
new google.maps.LatLng(49.1267842555292, 22.970965737689426),
new google.maps.LatLng(49.040437416004494, 22.575457925189426),
new google.maps.LatLng(48.40263475685953, 22.267840737689426),
new google.maps.LatLng(47.96312705776569, 22.883075112689426),
new google.maps.LatLng(46.92293240035043, 23.674090737689426),
new google.maps.LatLng(46.19775521481319, 23.586200112689426),
new google.maps.LatLng(44.780718130170996, 28.903582925189426),
new google.maps.LatLng(43.51953086362521, 28.595965737689426),
new google.maps.LatLng(43.51953086362521, 28.244403237689426),
new google.maps.LatLng(42.458779449554925, 27.629168862689426),
new google.maps.LatLng(41.379749687786806, 28.376239175189426),
new google.maps.LatLng(40.98285706924146, 31.320575112689426),
new google.maps.LatLng(41.7414531760136, 32.375262612689426),
new google.maps.LatLng(42.00323790147027, 34.660418862689426),
new google.maps.LatLng(42.11743147229781, 35.077899331439426),
new google.maps.LatLng(41.70865471522189, 35.341571206439426),
new google.maps.LatLng(41.65942563401991, 35.649188393939426),
new google.maps.LatLng(41.77423489289322, 36.000750893939426),
new google.maps.LatLng(41.49505674141226, 36.154559487689426),
new google.maps.LatLng(41.33026967893497, 36.132586831439426),
new google.maps.LatLng(41.24771942801469, 36.462176675189426),
new google.maps.LatLng(41.42919208018204, 36.813739175189426),
new google.maps.LatLng(41.31376798487136, 37.055438393939426),
new google.maps.LatLng(41.131973646951316, 37.121356362689426),
new google.maps.LatLng(41.065741346636514, 37.626727456439426),
new google.maps.LatLng(41.016023298121176, 38.000262612689426),
new google.maps.LatLng(41.032600153937416, 39.538348550189426),
new google.maps.LatLng(40.949674152964405, 40.241473550189426),
new google.maps.LatLng(41.54441133042169, 41.581805581439426),
new google.maps.LatLng(41.49505674141226, 42.548602456439426),
new google.maps.LatLng(41.64300757072882, 42.856219643939426),
new google.maps.LatLng(41.0988658451933, 43.449481362689426),
new google.maps.LatLng(40.71692672501888, 43.757098550189426),
new google.maps.LatLng(40.416480314957944, 43.647235268939426),
new google.maps.LatLng(40.16507876842633, 43.691180581439426),
new google.maps.LatLng(39.996958485907165, 44.438250893939426),
new google.maps.LatLng(39.727103201433806, 44.679950112689426),
new google.maps.LatLng(39.6932966965011, 44.504168862689426),
new google.maps.LatLng(39.439220172296636, 44.372332925189426),
new google.maps.LatLng(39.40527298800885, 44.130633706439426),
new google.maps.LatLng(38.413629506330054, 44.460223550189426),
new google.maps.LatLng(37.964613560239975, 44.262469643939426),
new google.maps.LatLng(37.28591324001402, 44.811786050189426),
new google.maps.LatLng(37.145927826536735, 44.723895425189426),
new google.maps.LatLng(35.8209914324737, 45.536883706439426),
new google.maps.LatLng(35.8209914324737, 46.305926675189426),
new google.maps.LatLng(35.58903912750998, 45.954364175189426),
new google.maps.LatLng(35.14108439012217, 46.174090737689426),
new google.maps.LatLng(34.45545051031178, 45.470965737689426),
new google.maps.LatLng(33.52634637913563, 45.976336831439426),
new google.maps.LatLng(32.34615282191288, 47.448504800189426),
new google.maps.LatLng(31.61930373794055, 47.800067300189426),
new google.maps.LatLng(30.03444878382187, 48.569110268939426),
new google.maps.LatLng(29.90120352050263, 48.547137612689426),
new google.maps.LatLng(29.863100651091877, 48.327411050189426),
new google.maps.LatLng(30.072486018598454, 47.800067300189426),
new google.maps.LatLng(30.072486018598454, 47.052996987689426),
new google.maps.LatLng(31.56315434564757, 45.602801675189426),
new google.maps.LatLng(34.85309160174945, 42.966082925189426),
new google.maps.LatLng(37.26842927094211, 42.966082925189426),
new google.maps.LatLng(37.16344020599948, 42.394793862689426),
new google.maps.LatLng(37.23344915139954, 40.856707925189426),
new google.maps.LatLng(37.05830510539422, 40.988543862689426),
new google.maps.LatLng(32.10451001264012, 40.109637612689426),
new google.maps.LatLng(27.219041829429212, 39.977801675189426),
new google.maps.LatLng(23.68836357243868, 41.208270425189426),
new google.maps.LatLng(13.671146846925241, 46.174090737689426),
new google.maps.LatLng(12.729907586215793, 43.801043862689426),
new google.maps.LatLng(16.892410307552186, 42.482684487689426),
new google.maps.LatLng(21.211112842415872, 39.142840737689426),
new google.maps.LatLng(24.050043393741433, 38.351825112689426),
new google.maps.LatLng(27.140856423287346, 35.978778237689426),
new google.maps.LatLng(29.691457790089295, 34.924090737689426),
new google.maps.LatLng(31.38328970602119, 34.263820205444176),
new google.maps.LatLng(34.15419158269677, 35.582179580444176),
new google.maps.LatLng(35.917180760155034, 35.933742080444176),
new google.maps.LatLng(36.41514100999709, 35.85709266810886),
new google.maps.LatLng(36.776779347184224, 36.21964149623386),
new google.maps.LatLng(36.96555849334231, 35.97223060447709),
new google.maps.LatLng(36.60058214874635, 35.53848915248386),
new google.maps.LatLng(36.565294284322874, 35.28580360560886),
new google.maps.LatLng(36.803174092891595, 34.74747352748386),
new google.maps.LatLng(36.803174092891595, 34.54971962123386),
new google.maps.LatLng(36.16719595275904, 33.71475868373386),
new google.maps.LatLng(36.06957356792411, 32.51724891810886),
new google.maps.LatLng(36.881921010840536, 30.549794384256074),
new google.maps.LatLng(36.388227965412476, 30.461903759256074),
new google.maps.LatLng(36.21114354744117, 29.275380321756074),
new google.maps.LatLng(37.0574722132744, 27.209950634256074),
new google.maps.LatLng(38.37836997044555, 26.199208446756074),
new google.maps.LatLng(40.44913561665174, 26.155263134256074),
new google.maps.LatLng(40.44913561665174, 28.835927196756074),
new google.maps.LatLng(40.7161356648977, 29.319325634256074),
new google.maps.LatLng(41.04838573797768, 27.869130321756074),
new google.maps.LatLng(40.749435710734474, 27.253895946756074),
new google.maps.LatLng(40.68281895431652, 26.243153759256074),
new google.maps.LatLng(41.28779732611595, 25.21895469988965),
new google.maps.LatLng(41.55142805544397, 24.34004844988965),
new google.maps.LatLng(41.38678425366512, 23.32930626238965),
new google.maps.LatLng(41.28779732611595, 22.23067344988965),
new google.maps.LatLng(40.92355900100248, 20.86836876238965),
new google.maps.LatLng(39.64977510259546, 20.12129844988965),
new google.maps.LatLng(40.557302123876845, 19.33028282488965),
new google.maps.LatLng(41.74844847568821, 19.72579063738965),
new google.maps.LatLng(42.17325752243153, 18.36348594988965),
new google.maps.LatLng(43.494457799444234, 16.21016563738965),
new google.maps.LatLng(44.31763989226934, 14.97969688738965),
new google.maps.LatLng(45.098421316587256, 13.88106407488965),
new google.maps.LatLng(45.72154363445005, 13.353008403793751),
new google.maps.LatLng(45.537158865429305, 12.342266216293751),
new google.maps.LatLng(47.02522759211125, 12.210430278793751),
new google.maps.LatLng(47.56172212711548, 13.089336528793751),
new google.maps.LatLng(47.68020427069783, 12.254375591293751),
new google.maps.LatLng(47.41324176326755, 9.705547466293751),
new google.maps.LatLng(47.73934466139819, 8.562969341293751),
new google.maps.LatLng(47.59136783729562, 7.508281841293751),
new google.maps.LatLng(48.99465676492192, 8.123516216293751),
new google.maps.LatLng(49.31081952882665, 6.497539653793751),
new google.maps.LatLng(50.38752799725181, 6.365703716293751),
new google.maps.LatLng(50.219114886328775, 6.233867778793751),
new google.maps.LatLng(49.681867392621555, 5.486797466293751),
new google.maps.LatLng(49.08108310963096, 4.080547466293751),
new google.maps.LatLng(49.05229101335044, 2.5864068412937513),
new google.maps.LatLng(50.05010511597425, 1.5317193412937513),
new google.maps.LatLng(50.86307289803893, 1.6246692235609999),
new google.maps.LatLng(51.09824350336703, 2.569493442311),
new google.maps.LatLng(51.34595052162621, 3.250645786061),
new google.maps.LatLng(51.02919931497788, 3.843907504811),
new google.maps.LatLng(50.96697147683376, 4.338292270436),
new google.maps.LatLng(51.48587538754308, 4.769901410007606),
new google.maps.LatLng(52.32632009603902, 4.506229535007606),
new google.maps.LatLng(52.93974448323276, 4.671024456882606),
new google.maps.LatLng(52.93312301569614, 4.989627972507606),
new google.maps.LatLng(52.74065945796691, 5.264286175632606),
new google.maps.LatLng(52.66076974586597, 5.253299847507606),
new google.maps.LatLng(52.62077004013247, 5.033573285007606),
new google.maps.LatLng(52.32632009603902, 5.044559613132606),
new google.maps.LatLng(52.49386287927991, 5.341190472507606),
new google.maps.LatLng(52.60075646873048, 5.637821331882606),
new google.maps.LatLng(52.77639524256169, 5.606325363559563),
new google.maps.LatLng(52.85773175518162, 5.664003586215813),
new google.maps.LatLng(52.83948578679276, 5.548647140903313),
new google.maps.LatLng(52.841144828080125, 5.430544113559563),
new google.maps.LatLng(52.88591498828891, 5.359132980747063),
new google.maps.LatLng(53.09753059784505, 5.353639816684563),
new google.maps.LatLng(53.24241536403436, 5.463503097934563),
new google.maps.LatLng(53.399913976147474, 5.930422043247063),
new google.maps.LatLng(53.45882616477777, 6.798341965122063),
new google.maps.LatLng(53.33764027870576, 6.941164230747063),
new google.maps.LatLng(53.248989414664884, 7.133424972934563),
new google.maps.LatLng(53.248989414664884, 7.243288254184563),
new google.maps.LatLng(53.34747902028606, 7.171877121372063),
new google.maps.LatLng(53.34747902028606, 6.996095871372063),
new google.maps.LatLng(53.53398407237047, 7.062013840122063),
new google.maps.LatLng(53.657563610776045, 7.20425277637537),
new google.maps.LatLng(53.726171771807564, 8.017824386997063),
new google.maps.LatLng(53.59597059551856, 8.166139816684563),
new google.maps.LatLng(53.61552641717495, 8.308962082309563),
new google.maps.LatLng(53.88835810241297, 8.638551926059563),
new google.maps.LatLng(53.83890405161603, 8.995385591354193),
new google.maps.LatLng(54.023249903158295, 8.852563325729193),
new google.maps.LatLng(54.35430420778696, 8.577905122604193),
new google.maps.LatLng(54.4246715468984, 8.858056489791693),
new google.maps.LatLng(54.47896369276714, 9.017358247604193),
new google.maps.LatLng(54.67953678251997, 8.748193208541693),
new google.maps.LatLng(54.86015795571547, 8.605370942916693)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0,fillColor:'#FF0000',fillOpacity:0.35, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1915, territory);
    
//Below is same as 1914////////////////////////////////////////////////////////////////////////!!!!!!!!!!!!!!!!!
var path = [
new google.maps.LatLng(-28.6955544447906, 16.32513858446157),
new google.maps.LatLng(-28.11574280678953, 17.11615420946157),
new google.maps.LatLng(-28.77262223509073, 17.64349795946157),
new google.maps.LatLng(-29.003483922546256, 19.22552920946157),
new google.maps.LatLng(-28.348048092095336, 19.97259952196157),
new google.maps.LatLng(-21.98905169830721, 20.14838077196157),
new google.maps.LatLng(-22.02979437342771, 20.93939639696157),
new google.maps.LatLng(-18.401602772899263, 21.11517764696157),
new google.maps.LatLng(-17.98411860972236, 23.31244327196157),
new google.maps.LatLng(-18.52665204707377, 23.66400577196157),
new google.maps.LatLng(-17.942315425596558, 24.41107608446157),
new google.maps.LatLng(-18.15123216472724, 24.58685733446157),
new google.maps.LatLng(-17.81684668283538, 25.33392764696157),
new google.maps.LatLng(-17.356042727327146, 24.23529483446157),
new google.maps.LatLng(-18.0676952632615, 21.37884952196157),
new google.maps.LatLng(-17.73315172872348, 18.83002139696157),
new google.maps.LatLng(-17.356042727327146, 13.90814639696157),
new google.maps.LatLng(-16.97815639198699, 13.20502139696157),
new google.maps.LatLng(-16.97815639198699, 12.89740420946157),
new google.maps.LatLng(-17.314093473069118, 12.58978702196157),
new google.maps.LatLng(-17.23016625511157, 11.66693545946157),
new google.maps.LatLng(-18.52665204707377, 12.01849795946157),
new google.maps.LatLng(-22.5583764364442, 14.61127139696157),
new google.maps.LatLng(-24.29218771580328, 14.47943545946157),
new google.maps.LatLng(-24.971273042945267, 14.83099795946157),
new google.maps.LatLng(-27.259662930450887, 15.22650577196157)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1915, territory);
    
var path = [
new google.maps.LatLng(4.747012109930874, 8.571742279961427),
new google.maps.LatLng(7.194409360903305, 10.593226654961427),
new google.maps.LatLng(6.583619734553094, 11.384242279961427),
new google.maps.LatLng(11.873573442696983, 14.724086029961427),
new google.maps.LatLng(13.673516637877684, 13.405726654961427),
new google.maps.LatLng(12.989343598757106, 7.165492279961427),
new google.maps.LatLng(13.758900796282816, 5.759242279961427),
new google.maps.LatLng(13.502655597888278, 4.440882904961427),
new google.maps.LatLng(11.270848158301568, 3.298304779961427),
new google.maps.LatLng(6.4089672142475145, 2.770961029961427),
new google.maps.LatLng(6.234254872412507, 4.704554779961427),
new google.maps.LatLng(4.396568749419022, 5.407679779961427)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1915, territory);

        
var path = [
new google.maps.LatLng(-11.618604381942829, 34.794758084515934),
new google.maps.LatLng(-11.575556192343411, 36.113117459515934),
new google.maps.LatLng(-11.317128728742214, 37.958820584515934),
new google.maps.LatLng(-10.497258905970448, 40.419758084515934),
new google.maps.LatLng(-9.198354342388678, 39.628742459515934),
new google.maps.LatLng(-6.979585994157616, 39.496906522015934),
new google.maps.LatLng(-6.2811681540338355, 38.881672147015934),
new google.maps.LatLng(-4.750250127541356, 39.452961209515934),
new google.maps.LatLng(-3.435281986043419, 37.695148709515934),
new google.maps.LatLng(-1.0642339772205076, 34.003742459515934),
new google.maps.LatLng(-1.0202959365877038, 30.532062772015934),
new google.maps.LatLng(-1.503575697033644, 29.609211209515934),
new google.maps.LatLng(-2.381968117972524, 28.818195584515934),
new google.maps.LatLng(-4.881620595387186, 29.433429959515934),
new google.maps.LatLng(-6.6741502230193515, 29.697101834515934),
new google.maps.LatLng(-8.242745651210223, 30.927570584515934),
new google.maps.LatLng(-9.241731892458551, 32.861164334515934),
new google.maps.LatLng(-9.50188414655556, 34.003742459515934),
new google.maps.LatLng(-10.324371546215447, 34.706867459515934)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1915, territory);

//1915 territories end ----------------------------------------------------------------------------------------
//1916 territories ---------------------------------------------------------------------------------------------

var shapes = [];
var path = [
new google.maps.LatLng(35.82595510092581, 45.74242230015466),
new google.maps.LatLng(34.53293396241662, 44.42406292515466),
new google.maps.LatLng(37.02811504725675, 42.22679730015466),
new google.maps.LatLng(37.02811504725675, 41.34789105015466),
new google.maps.LatLng(33.58638013693317, 38.97484417515466),
new google.maps.LatLng(28.93041993441453, 37.83226605015466),
new google.maps.LatLng(25.650578510677395, 38.88695355015466),
new google.maps.LatLng(22.521832810279854, 41.61156292515466),
new google.maps.LatLng(17.06638405214318, 44.51195355015466),
new google.maps.LatLng(13.249719761392805, 45.39085980015466),
new google.maps.LatLng(12.650136108919016, 44.33617230015466),
new google.maps.LatLng(12.564364610431175, 43.19359417515466),
new google.maps.LatLng(16.22431629206241, 42.84203167515466),
new google.maps.LatLng(18.57246613329152, 41.26000042515466),
new google.maps.LatLng(21.052862607760993, 38.97484417515466),
new google.maps.LatLng(24.53626976870969, 37.48070355015466),
new google.maps.LatLng(28.235816925654966, 34.66820355015466),
new google.maps.LatLng(29.401730322282347, 35.00483754195466),
new google.maps.LatLng(31.344657183106598, 34.24678090132966),
new google.maps.LatLng(34.72172548604873, 35.919873554876176),
new google.maps.LatLng(35.97620493479093, 36.183545429876176),
new google.maps.LatLng(36.825093066571135, 34.601514179876176),
new google.maps.LatLng(36.26019746158657, 33.854443867376176),
new google.maps.LatLng(36.01176015088194, 32.492139179876176),
new google.maps.LatLng(36.789908123833314, 31.349561054876176),
new google.maps.LatLng(36.965671066524834, 30.514600117376176),
new google.maps.LatLng(36.50784712142793, 30.514600117376176),
new google.maps.LatLng(36.33103497350659, 29.987256367376176),
new google.maps.LatLng(36.7547070156328, 28.581006367376176),
new google.maps.LatLng(37.070934545726175, 27.789990742376176),
new google.maps.LatLng(38.28818956646447, 26.559521992376176),
new google.maps.LatLng(39.85744618539407, 26.251904804876176),
new google.maps.LatLng(40.49539975378953, 26.823193867376176),
new google.maps.LatLng(40.49539975378953, 29.020459492376176),
new google.maps.LatLng(40.86199632943321, 29.415967304876176),
new google.maps.LatLng(41.08026721718047, 28.086621601751176),
new google.maps.LatLng(40.98910890058694, 27.504346211126176),
new google.maps.LatLng(40.68155962778617, 27.284619648626176),
new google.maps.LatLng(40.46459092038562, 26.691357929876176),
new google.maps.LatLng(40.07900130996382, 26.207959492376176),
new google.maps.LatLng(40.32357288489124, 26.227811520148407),
new google.maps.LatLng(40.50759329317271, 26.617826168585907),
new google.maps.LatLng(40.58272926612573, 26.821073238898407),
new google.maps.LatLng(40.65778093395568, 26.785367672492157),
new google.maps.LatLng(40.60587146013426, 26.098612799051352),
new google.maps.LatLng(41.00503326857028, 24.956034674051352),
new google.maps.LatLng(40.72254162134085, 24.099101080301352),
new google.maps.LatLng(41.484147005387804, 23.725565924051352),
new google.maps.LatLng(40.87224612190244, 21.594218267801352),
new google.maps.LatLng(40.855628961963724, 21.022929205301352),
new google.maps.LatLng(40.65589794767057, 21.022929205301352),
new google.maps.LatLng(40.03628812953271, 20.363749517801352),
new google.maps.LatLng(39.90157070152905, 20.363749517801352),
new google.maps.LatLng(39.71590095944581, 20.078104986551352),
new google.maps.LatLng(40.371919199244715, 19.418925299051352),
new google.maps.LatLng(41.423037440418625, 19.4312144599744),
new google.maps.LatLng(41.784499215272454, 19.6179820380994),
new google.maps.LatLng(44.01343711560565, 15.212464459974399),
new google.maps.LatLng(44.767092046291616, 14.794983991224399),
new google.maps.LatLng(45.34140976467181, 14.377503522474399),
new google.maps.LatLng(45.12477867526, 14.157776959974399),
new google.maps.LatLng(44.8138732188812, 13.916077741224399),
new google.maps.LatLng(45.433998882412766, 13.498597272474399),
new google.maps.LatLng(45.618722152664766, 14.047913678724399),
new google.maps.LatLng(45.649450391168656, 14.531312116224399),
new google.maps.LatLng(45.51104063048483, 15.344300397474399),
new google.maps.LatLng(45.86407632794942, 15.673890241224399),
new google.maps.LatLng(46.18446765546172, 15.388245709974399),
new google.maps.LatLng(46.45761120323379, 16.7066050849744),
new google.maps.LatLng(46.804644112460295, 16.3330699287244),
new google.maps.LatLng(46.51812460621107, 13.674378522474399),
new google.maps.LatLng(46.75950513030424, 12.290101178724399),
new google.maps.LatLng(47.04474630861735, 11.828675397474399),
new google.maps.LatLng(46.819682029966636, 11.125550397474399),
new google.maps.LatLng(46.879791654332465, 10.576233991224399),
new google.maps.LatLng(46.819682029966636, 10.114808209974399),
new google.maps.LatLng(47.08964568098639, 9.653382428724399),
new google.maps.LatLng(47.625489659698204, 9.763245709974399),
new google.maps.LatLng(47.47718990493976, 7.609925397474399),
new google.maps.LatLng(48.99903032544622, 8.225159772474399),
new google.maps.LatLng(49.28650908439376, 6.423401959974399),
new google.maps.LatLng(49.486752533452915, 5.105042584974399),
new google.maps.LatLng(49.486752533452915, 4.138245709974399),
new google.maps.LatLng(49.799773159594736, 3.083558209974399),
new google.maps.LatLng(50.25148770732793, 2.512269147474399),
new google.maps.LatLng(50.948804251837636, 1.7651988349743988),
new google.maps.LatLng(51.16976632473261, 2.644105084974399),
new google.maps.LatLng(51.69033169719054, 4.094300397474399),
new google.maps.LatLng(51.087029118021285, 6.203675397474399),
new google.maps.LatLng(53.65957342752569, 7.302308209974399),
new google.maps.LatLng(53.711623629987244, 8.181214459974399),
new google.maps.LatLng(53.945054133335205, 8.972230084974399),
new google.maps.LatLng(55.01727621671333, 8.664612897474399),
new google.maps.LatLng(54.86582019905451, 9.631409772474399),
new google.maps.LatLng(54.43358997559048, 10.290589459974399),
new google.maps.LatLng(54.51020010465373, 11.037659772474399),
new google.maps.LatLng(54.305587416083554, 10.993714459974399),
new google.maps.LatLng(53.945054133335255, 10.949769147474399),
new google.maps.LatLng(54.22859426085772, 12.180237897474399),
new google.maps.LatLng(54.561193852423564, 13.454651959974399),
new google.maps.LatLng(54.0225754509035, 14.069886334974399),
new google.maps.LatLng(54.35683632064875, 16.2671519599744),
new google.maps.LatLng(54.89110249750804, 18.1568003974744),
new google.maps.LatLng(54.33121985171547, 18.5083628974744),
new google.maps.LatLng(54.35683632064875, 19.4751597724744),
new google.maps.LatLng(54.662990312627834, 20.2661753974744),
new google.maps.LatLng(54.86582019905451, 19.7388316474744),
new google.maps.LatLng(54.94161952466512, 21.1450816474744),
new google.maps.LatLng(56.8116771187644, 21.03658710541788),
new google.maps.LatLng(57.50281255516048, 21.69576679291788),
new google.maps.LatLng(57.76159961440761, 22.57467304291788),
new google.maps.LatLng(57.12067737211883, 23.412546336382775),
new google.maps.LatLng(56.955731446814816, 24.02486835541788),
new google.maps.LatLng(55.83705130342841, 27.67232929291788),
new google.maps.LatLng(51.68478597267019, 23.71725116791788),
new google.maps.LatLng(48.99316112433883, 23.18990741791788),
new google.maps.LatLng(46.54220355422952, 24.28854023041788),
new google.maps.LatLng(45.19593834700732, 29.56197773041788),
new google.maps.LatLng(44.94765841449289, 29.51803241791788),
new google.maps.LatLng(44.7919357426041, 29.07857929291788),
new google.maps.LatLng(43.499121949572874, 28.55123554291788),
new google.maps.LatLng(43.403414419485685, 28.02389179291788),
new google.maps.LatLng(42.340643843617435, 27.54049335541788),
new google.maps.LatLng(41.62197509699563, 28.19967304291788),
new google.maps.LatLng(41.12732822708362, 30.26510273041788),
new google.maps.LatLng(41.193498417651455, 31.18795429291788),
new google.maps.LatLng(42.01056662146752, 33.12999904454841),
new google.maps.LatLng(42.01056662146755, 35.01964748204841),
new google.maps.LatLng(41.78158993365673, 35.81066310704841),
new google.maps.LatLng(41.321175593997275, 36.95324123204841),
new google.maps.LatLng(40.9239271331395, 38.75499904454841),
new google.maps.LatLng(41.12285193908117, 39.63390529454841),
new google.maps.LatLng(40.4908639252427, 40.86437404454841),
new google.maps.LatLng(39.61630604527907, 43.01769435704841),
new google.maps.LatLng(39.44683681280336, 44.02843654454841),
new google.maps.LatLng(38.44525689091702, 44.51255487283356),
new google.maps.LatLng(37.72949177985093, 44.51183498204841),
new google.maps.LatLng(37.056825244983756, 44.949066649267024)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0,fillColor:'#FF0000',fillOpacity:0.35, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1916, territory);
    
//Below is same as 1914////////////////////////////////////////////////////////////////////////!!!!!!!!!!!!!!!!!
var path = [
new google.maps.LatLng(-28.6955544447906, 16.32513858446157),
new google.maps.LatLng(-28.11574280678953, 17.11615420946157),
new google.maps.LatLng(-28.77262223509073, 17.64349795946157),
new google.maps.LatLng(-29.003483922546256, 19.22552920946157),
new google.maps.LatLng(-28.348048092095336, 19.97259952196157),
new google.maps.LatLng(-21.98905169830721, 20.14838077196157),
new google.maps.LatLng(-22.02979437342771, 20.93939639696157),
new google.maps.LatLng(-18.401602772899263, 21.11517764696157),
new google.maps.LatLng(-17.98411860972236, 23.31244327196157),
new google.maps.LatLng(-18.52665204707377, 23.66400577196157),
new google.maps.LatLng(-17.942315425596558, 24.41107608446157),
new google.maps.LatLng(-18.15123216472724, 24.58685733446157),
new google.maps.LatLng(-17.81684668283538, 25.33392764696157),
new google.maps.LatLng(-17.356042727327146, 24.23529483446157),
new google.maps.LatLng(-18.0676952632615, 21.37884952196157),
new google.maps.LatLng(-17.73315172872348, 18.83002139696157),
new google.maps.LatLng(-17.356042727327146, 13.90814639696157),
new google.maps.LatLng(-16.97815639198699, 13.20502139696157),
new google.maps.LatLng(-16.97815639198699, 12.89740420946157),
new google.maps.LatLng(-17.314093473069118, 12.58978702196157),
new google.maps.LatLng(-17.23016625511157, 11.66693545946157),
new google.maps.LatLng(-18.52665204707377, 12.01849795946157),
new google.maps.LatLng(-22.5583764364442, 14.61127139696157),
new google.maps.LatLng(-24.29218771580328, 14.47943545946157),
new google.maps.LatLng(-24.971273042945267, 14.83099795946157),
new google.maps.LatLng(-27.259662930450887, 15.22650577196157)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1916, territory);
    
var path = [
new google.maps.LatLng(4.747012109930874, 8.571742279961427),
new google.maps.LatLng(7.194409360903305, 10.593226654961427),
new google.maps.LatLng(6.583619734553094, 11.384242279961427),
new google.maps.LatLng(11.873573442696983, 14.724086029961427),
new google.maps.LatLng(13.673516637877684, 13.405726654961427),
new google.maps.LatLng(12.989343598757106, 7.165492279961427),
new google.maps.LatLng(13.758900796282816, 5.759242279961427),
new google.maps.LatLng(13.502655597888278, 4.440882904961427),
new google.maps.LatLng(11.270848158301568, 3.298304779961427),
new google.maps.LatLng(6.4089672142475145, 2.770961029961427),
new google.maps.LatLng(6.234254872412507, 4.704554779961427),
new google.maps.LatLng(4.396568749419022, 5.407679779961427)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1916, territory);

        
var path = [
new google.maps.LatLng(-11.618604381942829, 34.794758084515934),
new google.maps.LatLng(-11.575556192343411, 36.113117459515934),
new google.maps.LatLng(-11.317128728742214, 37.958820584515934),
new google.maps.LatLng(-10.497258905970448, 40.419758084515934),
new google.maps.LatLng(-9.198354342388678, 39.628742459515934),
new google.maps.LatLng(-6.979585994157616, 39.496906522015934),
new google.maps.LatLng(-6.2811681540338355, 38.881672147015934),
new google.maps.LatLng(-4.750250127541356, 39.452961209515934),
new google.maps.LatLng(-3.435281986043419, 37.695148709515934),
new google.maps.LatLng(-1.0642339772205076, 34.003742459515934),
new google.maps.LatLng(-1.0202959365877038, 30.532062772015934),
new google.maps.LatLng(-1.503575697033644, 29.609211209515934),
new google.maps.LatLng(-2.381968117972524, 28.818195584515934),
new google.maps.LatLng(-4.881620595387186, 29.433429959515934),
new google.maps.LatLng(-6.6741502230193515, 29.697101834515934),
new google.maps.LatLng(-8.242745651210223, 30.927570584515934),
new google.maps.LatLng(-9.241731892458551, 32.861164334515934),
new google.maps.LatLng(-9.50188414655556, 34.003742459515934),
new google.maps.LatLng(-10.324371546215447, 34.706867459515934)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1916, territory);
//1917 territories ---------------------------------------------------------------------------------------------

var shapes = [];
var path = [
new google.maps.LatLng(36.30799006617505, 45.21861401780234),
new google.maps.LatLng(35.59651910340393, 44.33970776780234),
new google.maps.LatLng(37.293231411092236, 43.06529370530234),
new google.maps.LatLng(37.153259590717845, 42.27427808030234),
new google.maps.LatLng(37.083176310882706, 40.91197339280234),
new google.maps.LatLng(36.94281523592548, 40.34068433030234),
new google.maps.LatLng(36.7669996464086, 39.63755933030234),
new google.maps.LatLng(36.73178802021663, 38.80259839280234),
new google.maps.LatLng(34.986749675227344, 37.87974683030234),
new google.maps.LatLng(31.30853651730221, 37.48423901780234),
new google.maps.LatLng(26.265773962548103, 38.62681714280234),
new google.maps.LatLng(22.66667694136948, 40.82408276780234),
new google.maps.LatLng(18.51288717669599, 44.64732495530234),
new google.maps.LatLng(14.170601181142889, 45.61412183030234),
new google.maps.LatLng(13.274101124991214, 45.83384839280234),
new google.maps.LatLng(12.76031071335082, 44.86705151780234),
new google.maps.LatLng(12.631698211059675, 43.81236401780234),
new google.maps.LatLng(14.426105008626871, 43.10923901780234),
new google.maps.LatLng(16.627707767332023, 42.62584058030234),
new google.maps.LatLng(18.012107252193378, 41.43931714280234),
new google.maps.LatLng(19.92371693769223, 40.25279370530234),
new google.maps.LatLng(20.418714828658096, 39.41783276780234),
new google.maps.LatLng(22.016336981771158, 38.84654370530234),
new google.maps.LatLng(23.797348135947626, 38.49498120530234),
new google.maps.LatLng(24.23889085540366, 37.39634839280234),
new google.maps.LatLng(28.064167135400076, 35.11119214280234),
new google.maps.LatLng(29.756690666191655, 35.06724683030234),
new google.maps.LatLng(31.007690058238097, 35.90220776780234),
new google.maps.LatLng(32.539348894233484, 35.81431714280234),
new google.maps.LatLng(33.16692988884467, 35.02330151780234),
new google.maps.LatLng(34.914710575733466, 36.03404370530234),
new google.maps.LatLng(36.55548767141037, 36.03404370530234),
new google.maps.LatLng(36.626056230723684, 35.46275464280234),
new google.maps.LatLng(36.87253753169779, 34.71568433030234),
new google.maps.LatLng(36.27256888385773, 33.52916089280234),
new google.maps.LatLng(36.05970439736909, 32.60630933030234),
new google.maps.LatLng(36.97792980492393, 30.804551517802338),
new google.maps.LatLng(36.23713162473874, 30.496934330302338),
new google.maps.LatLng(36.2016782950835, 29.442246830302338),
new google.maps.LatLng(36.59078001704644, 28.870957767802338),
new google.maps.LatLng(37.08317631088273, 27.420762455302338),
new google.maps.LatLng(38.2657367401, 26.541856205302338),
new google.maps.LatLng(39.216882934811906, 25.827744877177338),
new google.maps.LatLng(39.97033450421077, 26.168321049052338),
new google.maps.LatLng(40.39838778849204, 26.816514408427338),
new google.maps.LatLng(40.45692928257546, 27.277940189677338),
new google.maps.LatLng(40.31466870881055, 27.585557377177338),
new google.maps.LatLng(40.49871343394526, 27.761338627177338),
new google.maps.LatLng(40.39838778849204, 28.772080814677338),
new google.maps.LatLng(40.65725596426477, 28.958848392802338),
new google.maps.LatLng(40.74054844453156, 29.925645267802338),
new google.maps.LatLng(40.790473934981975, 29.376328861552338),
new google.maps.LatLng(40.964917695943534, 28.684190189677338),
new google.maps.LatLng(41.080958058547765, 28.189805424052338),
new google.maps.LatLng(40.9566212757081, 27.937119877177338),
new google.maps.LatLng(40.989800699258396, 27.541612064677338),
new google.maps.LatLng(40.76551587792658, 27.365830814677338),
new google.maps.LatLng(40.632247914263516, 27.135117924052338),
new google.maps.LatLng(40.58220370629115, 26.948350345927338),
new google.maps.LatLng(40.473646063714924, 26.717637455302338),
new google.maps.LatLng(40.0712958669854, 26.256211674052338),
new google.maps.LatLng(40.0712958669854, 26.168321049052338),
new google.maps.LatLng(40.364912630755306, 26.256211674052338),
new google.maps.LatLng(40.57385936188258, 26.574815189677338),
new google.maps.LatLng(40.632247914263516, 26.805528080302338),
new google.maps.LatLng(40.60723049451871, 26.355088627177338),
new google.maps.LatLng(40.62390981536909, 26.113389408427338),
new google.maps.LatLng(41.35367236777923, 24.377549564677338),
new google.maps.LatLng(41.526625537620326, 24.179795658427338),
new google.maps.LatLng(41.394893498323846, 23.619492924052338),
new google.maps.LatLng(41.3206766570652, 22.971299564677338),
new google.maps.LatLng(41.37840818075452, 22.751573002177338),
new google.maps.LatLng(41.13062704160555, 22.729600345927338),
new google.maps.LatLng(41.12235148679262, 21.938584720927338),
new google.maps.LatLng(40.898517137311096, 21.619981205302338),
new google.maps.LatLng(40.87359972497742, 21.037705814677338),
new google.maps.LatLng(40.53212202946928, 21.048692142802338),
new google.maps.LatLng(39.60733058089895, 20.191758549052338),
new google.maps.LatLng(40.180502039460016, 19.565537845927338),
new google.maps.LatLng(40.61557067543858, 19.345811283427338),
new google.maps.LatLng(41.4690256969105, 19.499619877177338),
new google.maps.LatLng(41.830230454978405, 19.576524174052338),
new google.maps.LatLng(42.53536801437334, 18.324375496259677),
new google.maps.LatLng(43.53112096237707, 15.995273933759677),
new google.maps.LatLng(44.180720739872434, 15.160312996259677),
new google.maps.LatLng(44.94778547848641, 13.798008308759677),
new google.maps.LatLng(45.70473492789828, 13.644199715009677),
new google.maps.LatLng(46.34549989854108, 13.270664558759677),
new google.maps.LatLng(46.5272117362482, 13.710117683759677),
new google.maps.LatLng(46.79864361418266, 12.413730965009677),
new google.maps.LatLng(47.03877264326129, 12.106113777509677),
new google.maps.LatLng(46.9638479207333, 11.161289558759677),
new google.maps.LatLng(46.76855180933868, 10.963535652509677),
new google.maps.LatLng(46.82871859941696, 10.458164558759677),
new google.maps.LatLng(46.971338707568286, 10.31601083427131),
new google.maps.LatLng(46.88881169183615, 10.17318856864631),
new google.maps.LatLng(46.918836228625686, 9.84359872489631),
new google.maps.LatLng(47.05373857559132, 9.65683114677131),
new google.maps.LatLng(47.441544811297064, 9.61288583427131),
new google.maps.LatLng(47.69357590329692, 8.93173349052131),
new google.maps.LatLng(47.69357590329692, 8.69003427177131),
new google.maps.LatLng(47.80438065493198, 8.52523934989631),
new google.maps.LatLng(47.723146903743014, 8.43734872489631),
new google.maps.LatLng(47.63438356564948, 8.51425302177131),
new google.maps.LatLng(47.58994526139573, 8.43734872489631),
new google.maps.LatLng(47.58994526139573, 7.65731942802131),
new google.maps.LatLng(47.79390244569865, 7.4691146657198715),
new google.maps.LatLng(48.63337257255198, 7.766483696463865),
new google.maps.LatLng(48.980677769623135, 8.227909477713865),
new google.maps.LatLng(49.2108790979359, 7.173221977713865),
new google.maps.LatLng(49.167797658130816, 6.733768852713865),
new google.maps.LatLng(49.497130518373545, 6.360233696463865),
new google.maps.LatLng(49.539924599986854, 5.766971977713865),
new google.maps.LatLng(49.13905585529695, 3.7674602589638653),
new google.maps.LatLng(49.05273037376185, 2.7127727589638653),
new google.maps.LatLng(49.19652278618427, 2.2293743214638653),
new google.maps.LatLng(49.368523522842274, 1.2625774464638653),
new google.maps.LatLng(49.80915214210119, 1.7306512480702168),
new google.maps.LatLng(50.35900639303848, 1.7416375761952168),
new google.maps.LatLng(50.666401444593376, 1.5438836699452168),
new google.maps.LatLng(50.93026979779439, 1.6867059355702168),
new google.maps.LatLng(51.013287267462744, 1.9833367949452168),
new google.maps.LatLng(51.09615639098721, 2.5765985136952168),
new google.maps.LatLng(51.116850503545635, 3.0270379668202168),
new google.maps.LatLng(50.87484235852796, 4.103698123070217),
new google.maps.LatLng(50.70816394256787, 4.147643435570217),
new google.maps.LatLng(50.43604283333735, 4.279479373070217),
new google.maps.LatLng(50.309918007501835, 4.905700076195217),
new google.maps.LatLng(51.391887311142945, 5.114440310570217),
new google.maps.LatLng(51.46038957702258, 4.916686404320217),
new google.maps.LatLng(51.480920234916006, 4.674987185570217),
new google.maps.LatLng(51.8353184633636, 3.9389032011952168),
new google.maps.LatLng(52.29458792415255, 4.488219607445217),
new google.maps.LatLng(52.98789003824206, 4.729918826195217),
new google.maps.LatLng(53.26476858798288, 5.520934451195217),
new google.maps.LatLng(53.46144813593783, 6.839293826195217),
new google.maps.LatLng(53.670240074618974, 7.234801638695217),
new google.maps.LatLng(53.71355169147024, 8.01642104864743),
new google.maps.LatLng(53.87578674686969, 8.58771011114743),
new google.maps.LatLng(54.01803493016549, 8.87335464239743),
new google.maps.LatLng(54.33952472272991, 8.65362807989743),
new google.maps.LatLng(54.88665730457891, 8.60968276739743),
new google.maps.LatLng(54.82341483785816, 9.52154800177243),
new google.maps.LatLng(54.80442275777797, 9.89508315802243),
new google.maps.LatLng(54.46742164140221, 10.11480972052243),
new google.maps.LatLng(54.35873469018315, 10.74103042364743),
new google.maps.LatLng(54.505712977563086, 10.99371597052243),
new google.maps.LatLng(54.46742164140221, 11.32330581427243),
new google.maps.LatLng(54.39712769207877, 11.33429214239743),
new google.maps.LatLng(54.04384613309241, 10.75201675177243),
new google.maps.LatLng(54.01157962575834, 11.07062026739743),
new google.maps.LatLng(54.14693079212344, 11.65289565802243),
new google.maps.LatLng(54.473806021080165, 12.52081557989743),
new google.maps.LatLng(54.6902826748893, 13.31183120489743),
new google.maps.LatLng(54.569452211551194, 13.65240737677243),
new google.maps.LatLng(54.1919498072325, 13.70733901739743),
new google.maps.LatLng(53.99866601201915, 14.56427261114743),
new google.maps.LatLng(54.35142974541854, 16.359339414058468),
new google.maps.LatLng(54.73381451345501, 17.370081601558468),
new google.maps.LatLng(54.83517930230784, 18.556605039058468),
new google.maps.LatLng(54.479289595276846, 18.644495664058468),
new google.maps.LatLng(54.35142974541854, 19.435511289058468),
new google.maps.LatLng(54.60675098030587, 20.226526914058468),
new google.maps.LatLng(54.70769416053669, 19.94799979754248),
new google.maps.LatLng(54.96710060316384, 19.96997245379248),
new google.maps.LatLng(54.94817615068891, 20.79394706316748),
new google.maps.LatLng(54.935554897024325, 21.22241386004248),
new google.maps.LatLng(56.652196616556296, 20.993523296619173),
new google.maps.LatLng(57.012822764541255, 21.367058452869173),
new google.maps.LatLng(57.58262896282122, 21.674675640369173),
new google.maps.LatLng(57.747163865592945, 22.597527202869173),
new google.maps.LatLng(57.405512120636864, 22.861199077869173),
new google.maps.LatLng(57.00085779846799, 23.586296734119173),
new google.maps.LatLng(57.096469818003804, 24.179558452869173),
new google.maps.LatLng(57.67674029670564, 24.399285015369173),
new google.maps.LatLng(57.617949292556105, 25.410027202869173),
new google.maps.LatLng(56.49484488805118, 26.266960796619173),
new google.maps.LatLng(53.809297143368525, 26.420769390369173),
new google.maps.LatLng(51.93974551284604, 25.651726421619173),
new google.maps.LatLng(50.48080868181272, 24.003777202869173),
new google.maps.LatLng(50.15812769441835, 23.366570171619173),
new google.maps.LatLng(49.37759990438422, 22.993035015369173),
new google.maps.LatLng(48.758598419195046, 23.256706890369173),
new google.maps.LatLng(47.955592888640105, 24.179558452869173),
new google.maps.LatLng(46.496735160556085, 26.100655984412697),
new google.maps.LatLng(46.284560365549865, 27.067452859412697),
new google.maps.LatLng(45.98002240828147, 28.034249734412697),
new google.maps.LatLng(45.42760934416277, 28.188058328162697),
new google.maps.LatLng(45.27319243319594, 28.803292703162697),
new google.maps.LatLng(45.473852267741115, 29.330636453162697),
new google.maps.LatLng(45.19582599138512, 29.726144265662697),
new google.maps.LatLng(44.93199223121998, 29.572335671912697),
new google.maps.LatLng(44.82300089280039, 29.440499734412697),
new google.maps.LatLng(44.77622712211175, 29.066964578162697),
new google.maps.LatLng(44.494788249161026, 28.737374734412697),
new google.maps.LatLng(43.45117136854438, 28.561593484412697),
new google.maps.LatLng(43.37136235445732, 28.166085671912697),
new google.maps.LatLng(42.777508491254174, 27.836495828162697),
new google.maps.LatLng(42.50272816376788, 27.484933328162697),
new google.maps.LatLng(42.14532965954995, 27.902413796912697),
new google.maps.LatLng(42.03054646337718, 28.01326528881077),
new google.maps.LatLng(41.89166639154813, 28.05721060131077),
new google.maps.LatLng(41.85076171363896, 27.98579946849827),
new google.maps.LatLng(41.59656867942566, 28.15608755443577),
new google.maps.LatLng(41.34137056473786, 28.68343130443577),
new google.maps.LatLng(41.22992202717784, 29.21626821849827),
new google.maps.LatLng(41.1761937416641, 29.73262564037327),
new google.maps.LatLng(41.074353829907096, 31.18637962723028),
new google.maps.LatLng(41.733581595012, 32.28501243973028),
new google.maps.LatLng(42.06068515370017, 33.55942650223028),
new google.maps.LatLng(42.06068515370017, 34.96567650223028),
new google.maps.LatLng(41.70077911525376, 36.02036400223028),
new google.maps.LatLng(41.125007151442716, 37.05406692538327),
new google.maps.LatLng(41.0412169766761, 39.14048118973028),
new google.maps.LatLng(41.008063431284, 39.93149681473028),
new google.maps.LatLng(40.24093135732421, 41.46958275223028),
new google.maps.LatLng(39.2951690406549, 42.91977806473028),
new google.maps.LatLng(39.1930677298346, 43.57895775223028),
new google.maps.LatLng(39.2951690406549, 44.01841087723028),
new google.maps.LatLng(38.50860096156532, 44.45786400223028),
new google.maps.LatLng(37.852272916829506, 44.32602806473028),
new google.maps.LatLng(37.782842218980406, 44.58969993973028),
new google.maps.LatLng(37.08495155499368, 44.67759056473028)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0,fillColor:'#FF0000',fillOpacity:0.35, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1917, territory);
    //Below is same as 1914////////////////////////////////////////////////////////////////////////!!!!!!!!!!!!!!!!!
var path = [
new google.maps.LatLng(-28.6955544447906, 16.32513858446157),
new google.maps.LatLng(-28.11574280678953, 17.11615420946157),
new google.maps.LatLng(-28.77262223509073, 17.64349795946157),
new google.maps.LatLng(-29.003483922546256, 19.22552920946157),
new google.maps.LatLng(-28.348048092095336, 19.97259952196157),
new google.maps.LatLng(-21.98905169830721, 20.14838077196157),
new google.maps.LatLng(-22.02979437342771, 20.93939639696157),
new google.maps.LatLng(-18.401602772899263, 21.11517764696157),
new google.maps.LatLng(-17.98411860972236, 23.31244327196157),
new google.maps.LatLng(-18.52665204707377, 23.66400577196157),
new google.maps.LatLng(-17.942315425596558, 24.41107608446157),
new google.maps.LatLng(-18.15123216472724, 24.58685733446157),
new google.maps.LatLng(-17.81684668283538, 25.33392764696157),
new google.maps.LatLng(-17.356042727327146, 24.23529483446157),
new google.maps.LatLng(-18.0676952632615, 21.37884952196157),
new google.maps.LatLng(-17.73315172872348, 18.83002139696157),
new google.maps.LatLng(-17.356042727327146, 13.90814639696157),
new google.maps.LatLng(-16.97815639198699, 13.20502139696157),
new google.maps.LatLng(-16.97815639198699, 12.89740420946157),
new google.maps.LatLng(-17.314093473069118, 12.58978702196157),
new google.maps.LatLng(-17.23016625511157, 11.66693545946157),
new google.maps.LatLng(-18.52665204707377, 12.01849795946157),
new google.maps.LatLng(-22.5583764364442, 14.61127139696157),
new google.maps.LatLng(-24.29218771580328, 14.47943545946157),
new google.maps.LatLng(-24.971273042945267, 14.83099795946157),
new google.maps.LatLng(-27.259662930450887, 15.22650577196157)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1917, territory);
    
var path = [
new google.maps.LatLng(4.747012109930874, 8.571742279961427),
new google.maps.LatLng(7.194409360903305, 10.593226654961427),
new google.maps.LatLng(6.583619734553094, 11.384242279961427),
new google.maps.LatLng(11.873573442696983, 14.724086029961427),
new google.maps.LatLng(13.673516637877684, 13.405726654961427),
new google.maps.LatLng(12.989343598757106, 7.165492279961427),
new google.maps.LatLng(13.758900796282816, 5.759242279961427),
new google.maps.LatLng(13.502655597888278, 4.440882904961427),
new google.maps.LatLng(11.270848158301568, 3.298304779961427),
new google.maps.LatLng(6.4089672142475145, 2.770961029961427),
new google.maps.LatLng(6.234254872412507, 4.704554779961427),
new google.maps.LatLng(4.396568749419022, 5.407679779961427)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1917, territory);

        
var path = [
new google.maps.LatLng(-11.618604381942829, 34.794758084515934),
new google.maps.LatLng(-11.575556192343411, 36.113117459515934),
new google.maps.LatLng(-11.317128728742214, 37.958820584515934),
new google.maps.LatLng(-10.497258905970448, 40.419758084515934),
new google.maps.LatLng(-9.198354342388678, 39.628742459515934),
new google.maps.LatLng(-6.979585994157616, 39.496906522015934),
new google.maps.LatLng(-6.2811681540338355, 38.881672147015934),
new google.maps.LatLng(-4.750250127541356, 39.452961209515934),
new google.maps.LatLng(-3.435281986043419, 37.695148709515934),
new google.maps.LatLng(-1.0642339772205076, 34.003742459515934),
new google.maps.LatLng(-1.0202959365877038, 30.532062772015934),
new google.maps.LatLng(-1.503575697033644, 29.609211209515934),
new google.maps.LatLng(-2.381968117972524, 28.818195584515934),
new google.maps.LatLng(-4.881620595387186, 29.433429959515934),
new google.maps.LatLng(-6.6741502230193515, 29.697101834515934),
new google.maps.LatLng(-8.242745651210223, 30.927570584515934),
new google.maps.LatLng(-9.241731892458551, 32.861164334515934),
new google.maps.LatLng(-9.50188414655556, 34.003742459515934),
new google.maps.LatLng(-10.324371546215447, 34.706867459515934)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1917, territory);
//1918 territories ---------------------------------------------------------------------------------------------

var shapes = [];

var path = [
new google.maps.LatLng(59.213593019864845, 23.498936066900797),
new google.maps.LatLng(59.303446232321726, 24.070225129400797),
new google.maps.LatLng(59.54932315604723, 24.509678254400797),
new google.maps.LatLng(59.61607090283489, 25.828037629400797),
new google.maps.LatLng(59.43778231226872, 26.882725129400797),
new google.maps.LatLng(59.43778231226872, 27.937412629400797),
new google.maps.LatLng(59.782361575973916, 28.036289582525797),
new google.maps.LatLng(59.87071261618754, 28.563633332525797),
new google.maps.LatLng(59.98082222586267, 29.134922395025797),
new google.maps.LatLng(59.90929255050324, 29.739170441900797),
new google.maps.LatLng(59.88174002581872, 30.189609895025797),
new google.maps.LatLng(58.75506383269787, 31.969395051275797),
new google.maps.LatLng(56.606037443771676, 32.2550395825258),
new google.maps.LatLng(52.27954762906807, 39.1544536450258),
new google.maps.LatLng(49.76490528359389, 40.6705669262758),
new google.maps.LatLng(47.262041422659706, 40.1432231762758),
new google.maps.LatLng(47.3216544804601, 39.1105083325258),
new google.maps.LatLng(46.601860241722825, 35.8585552075258),
new google.maps.LatLng(46.238329600865775, 35.0016216137758),
new google.maps.LatLng(46.05565517085103, 34.7818950512758),
new google.maps.LatLng(45.68848731775554, 35.0016216137758),
new google.maps.LatLng(45.33434158551947, 35.3092388012758),
new google.maps.LatLng(45.411519355273555, 35.8146098950258),
new google.maps.LatLng(45.488591805856096, 36.1441997387758),
new google.maps.LatLng(45.426942270792246, 36.5616802075258),
new google.maps.LatLng(45.24158923536116, 36.4078716137758),
new google.maps.LatLng(45.102176328100214, 36.3639263012758),
new google.maps.LatLng(45.04010549389046, 36.4518169262758),
new google.maps.LatLng(45.00904479760616, 36.0563091137758),
new google.maps.LatLng(45.05562952223158, 35.7267192700258),
new google.maps.LatLng(45.16417975149999, 35.4410747387758),
new google.maps.LatLng(45.02457725234951, 35.2652934887758),
new google.maps.LatLng(44.77555239420867, 35.0455669262758),
new google.maps.LatLng(44.79114804645361, 34.6720317700258),
new google.maps.LatLng(44.68189000686614, 34.3424419262758),
new google.maps.LatLng(44.41568963499104, 34.1886333325258),
new google.maps.LatLng(44.399992876638144, 33.7931255200258),
new google.maps.LatLng(44.619364156136584, 33.3097270825258),
new google.maps.LatLng(45.36522533197508, 32.4747661450258),
new google.maps.LatLng(45.90296334873111, 33.7711528637758),
new google.maps.LatLng(46.116614005651186, 33.4855083325258),
new google.maps.LatLng(46.04040493650095, 32.3429302075258),
new google.maps.LatLng(46.35977580328844, 31.859531770025797),
new google.maps.LatLng(46.616954757780604, 31.090488801275797),
new google.maps.LatLng(44.86906311099524, 29.596348176275797),
new google.maps.LatLng(43.38664181394285, 28.475742707525797),
new google.maps.LatLng(43.434527768581916, 28.058262238775797),
new google.maps.LatLng(42.46962018268195, 27.530918488775797),
new google.maps.LatLng(42.14462491286055, 27.948398957525797),
new google.maps.LatLng(41.76880740869472, 28.124180207525797),
new google.maps.LatLng(41.489605699078545, 28.365879426275797),
new google.maps.LatLng(41.1264921599728, 30.013828645025797),
new google.maps.LatLng(41.14304118147505, 30.475254426275797),
new google.maps.LatLng(41.1264921599728, 31.288242707525797),
new google.maps.LatLng(41.44020932023364, 31.705723176275797),
new google.maps.LatLng(41.850695365948425, 32.8263286450258),
new google.maps.LatLng(42.014157165250076, 34.0787700512758),
new google.maps.LatLng(42.046799249133535, 35.0016216137758),
new google.maps.LatLng(41.81795274449907, 35.3751567700258),
new google.maps.LatLng(41.65398844613717, 35.5289653637758),
new google.maps.LatLng(41.71962439500129, 36.0123638012758),
new google.maps.LatLng(41.57184936099631, 36.1881450512758),
new google.maps.LatLng(41.30830171396944, 36.4518169262758),
new google.maps.LatLng(41.39077531492993, 36.7374614575258),
new google.maps.LatLng(41.04368443781554, 37.5284770825258),
new google.maps.LatLng(41.027110372777585, 38.1656841137758),
new google.maps.LatLng(41.027110372777585, 39.9674419262758),
new google.maps.LatLng(40.993949724776336, 40.4508403637758),
new google.maps.LatLng(41.44020932023364, 41.4396098950258),
new google.maps.LatLng(42.2097581793852, 41.7032817700258),
new google.maps.LatLng(42.76068068928236, 41.3297466137758),
new google.maps.LatLng(43.76866912551207, 39.2423442700258),
new google.maps.LatLng(44.368586723141625, 38.4293559887758),
new google.maps.LatLng(44.744348450513414, 37.3746684887758),
new google.maps.LatLng(45.226115764767854, 36.6495708325258),
new google.maps.LatLng(45.36522533197508, 36.9132427075258),
new google.maps.LatLng(45.396092226985594, 37.3087505200258),
new google.maps.LatLng(45.5347847248236, 37.7262309887758),
new google.maps.LatLng(45.933535399681126, 38.0558208325258),
new google.maps.LatLng(43.56203853419681, 47.5480083325258),
new google.maps.LatLng(42.6153204795386, 47.9435161450258),
new google.maps.LatLng(41.44020932023364, 49.0201763012758),
new google.maps.LatLng(41.44020932023364, 47.9654888012758),
new google.maps.LatLng(41.27528302352753, 47.7018169262758),
new google.maps.LatLng(41.37428895313466, 47.1085552075258),
new google.maps.LatLng(41.80157515278066, 46.3175395825258),
new google.maps.LatLng(41.27528302352753, 46.6691020825258),
new google.maps.LatLng(41.04368443781554, 46.4493755200258),
new google.maps.LatLng(41.39077531492993, 45.5704692700258),
new google.maps.LatLng(41.423735498782584, 44.9552348950258),
new google.maps.LatLng(41.19266319421717, 44.3180278637758),
new google.maps.LatLng(41.109938963720865, 43.6149028637758),
new google.maps.LatLng(40.646014866871305, 43.71605921178502),
new google.maps.LatLng(40.19436171661422, 43.62816858678502),
new google.maps.LatLng(39.95897848523035, 44.41918421178502),
new google.maps.LatLng(39.73968032125771, 44.52904749303502),
new google.maps.LatLng(39.41790862454055, 44.35326624303502),
new google.maps.LatLng(39.38395106002332, 44.08959436803502),
new google.maps.LatLng(39.21391536562877, 43.49633264928502),
new google.maps.LatLng(38.70133381003877, 42.28783655553502),
new google.maps.LatLng(37.97750623312462, 42.00219202428502),
new google.maps.LatLng(37.28144324361601, 41.60668421178502),
new google.maps.LatLng(37.001196250654615, 41.45287561803502),
new google.maps.LatLng(37.106410529063524, 40.59594202428502),
new google.maps.LatLng(36.80792484017874, 39.89281702428502),
new google.maps.LatLng(36.75512953051749, 38.68432093053502),
new google.maps.LatLng(37.85616613845921, 38.42064905553502),
new google.maps.LatLng(37.96018419067496, 37.40990686803502),
new google.maps.LatLng(38.01213805565002, 36.79467249303502),
new google.maps.LatLng(37.873512691365804, 35.78393030553502),
new google.maps.LatLng(36.52592996071428, 34.28978968053502),
new google.maps.LatLng(36.402232587600096, 33.96019983678502),
new google.maps.LatLng(36.1187555863993, 33.34496546178502),
new google.maps.LatLng(36.10100413523125, 32.42211389928502),
new google.maps.LatLng(36.63179911201, 31.806879524285023),
new google.maps.LatLng(36.93097238817374, 30.598383430535023),
new google.maps.LatLng(36.29604928771995, 30.444574836785023),
new google.maps.LatLng(36.1187555863993, 29.895258430535023),
new google.maps.LatLng(36.33145981023679, 29.104242805535023),
new google.maps.LatLng(36.68467922891407, 28.686762336785023),
new google.maps.LatLng(36.59652552584292, 28.005609993035023),
new google.maps.LatLng(37.123932056266156, 27.214594368035023),
new google.maps.LatLng(38.27135510643314, 26.511469368035023),
new google.maps.LatLng(39.179858680072925, 25.830317024285023),
new google.maps.LatLng(40.0431373192043, 26.225824836785023),
new google.maps.LatLng(40.3452496356636, 26.687250618035023),
new google.maps.LatLng(40.36199417680312, 27.632074836785023),
new google.maps.LatLng(40.71266841855784, 29.280024055535023),
new google.maps.LatLng(40.92883198708523, 28.906488899285023),
new google.maps.LatLng(40.99520208527134, 28.445063118035023),
new google.maps.LatLng(41.02836210311354, 28.093500618035023),
new google.maps.LatLng(40.79589161799744, 27.412348274285023),
new google.maps.LatLng(40.4958007809074, 26.950922493035023),
new google.maps.LatLng(40.09358281950949, 26.050043586785023),
new google.maps.LatLng(40.29499106757465, 25.566645149285023),
new google.maps.LatLng(40.69601127888517, 26.775141243035023),
new google.maps.LatLng(40.62934106643129, 26.093988899285023),
new google.maps.LatLng(40.97861581802608, 25.500727180535023),
new google.maps.LatLng(42.17842954862817, 24.643793586785023),
new google.maps.LatLng(42.347284973420116, 23.900058421436256),
new google.maps.LatLng(42.23350605381027, 22.405917796436256),
new google.maps.LatLng(41.694353349906805, 21.109531077686256),
new google.maps.LatLng(40.885388665549904, 19.549472483936256),
new google.maps.LatLng(40.70240692638905, 19.351718577686256),
new google.maps.LatLng(41.497167322831345, 19.373691233936256),
new google.maps.LatLng(41.93998833179886, 19.747226390186256),
new google.maps.LatLng(41.93998833179886, 19.153964671436256),
new google.maps.LatLng(42.36352232596199, 18.560702952686256),
new google.maps.LatLng(43.724567947336176, 15.791598116606792),
new google.maps.LatLng(44.63846747216142, 14.956637179106792),
new google.maps.LatLng(45.21406906322484, 14.605074679106792),
new google.maps.LatLng(45.353208143044675, 14.099703585356792),
new google.maps.LatLng(44.810194747730584, 13.967867647856792),
new google.maps.LatLng(45.47660084887398, 13.506441866606792),
new google.maps.LatLng(45.70723551327772, 13.770113741606792),
new google.maps.LatLng(46.52474141226253, 13.579531042429494),
new google.maps.LatLng(47.528217475494095, 11.909609167429494),
new google.maps.LatLng(48.614644241851586, 9.382753698679494),
new google.maps.LatLng(48.97650292824523, 8.240175573679494),
new google.maps.LatLng(49.149268488691874, 7.295351354929494),
new google.maps.LatLng(49.47872488395835, 6.130800573679494),
new google.maps.LatLng(49.578557050828614, 5.493593542429494),
new google.maps.LatLng(49.87683112091972, 4.812441198679494),
new google.maps.LatLng(50.142263566326115, 4.893644603006123),
new google.maps.LatLng(50.18449065610879, 4.794767649881123),
new google.maps.LatLng(49.94824520534257, 4.509123118631123),
new google.maps.LatLng(50.00829826166819, 4.179533274881123),
new google.maps.LatLng(50.26181011935676, 4.212492259256123),
new google.maps.LatLng(50.67084309416406, 3.9703392186373776),
new google.maps.LatLng(50.7960072407184, 3.4759544530123776),
new google.maps.LatLng(50.95545274522031, 3.1243919530123776),
new google.maps.LatLng(51.15571572080422, 2.9815696873873776),
new google.maps.LatLng(51.272708805179185, 3.1024192967623776),
new google.maps.LatLng(51.25208456561707, 3.3441185155123776),
new google.maps.LatLng(51.06604976496139, 3.5418724217623776),
new google.maps.LatLng(50.152760830258366, 5.958864609262378),
new google.maps.LatLng(50.314393295094675, 6.387331406137378),
new google.maps.LatLng(50.67084309416406, 6.156618515512378),
new google.maps.LatLng(51.792107106825355, 5.299684921762378),
new google.maps.LatLng(52.08335610899563, 4.255983749887378),
new google.maps.LatLng(52.95177573607873, 4.78308490163181),
new google.maps.LatLng(53.32086005739826, 5.64001849538181),
new google.maps.LatLng(53.47153073537053, 6.66174701100681),
new google.maps.LatLng(53.47806953728042, 6.83752826100681),
new google.maps.LatLng(53.71279595054256, 7.18909076100681),
new google.maps.LatLng(53.73879620543293, 8.01306537038181),
new google.maps.LatLng(53.89446032532391, 8.57336810475681),
new google.maps.LatLng(54.178344877719894, 8.85901263600681),
new google.maps.LatLng(54.351588146926815, 8.62829974538181),
new google.maps.LatLng(54.47788067490484, 8.99466388963549),
new google.maps.LatLng(54.86696012094289, 8.59534076100681),
new google.maps.LatLng(54.8479885234227, 9.23254779225681),
new google.maps.LatLng(54.83533583348924, 9.58411029225681),
new google.maps.LatLng(54.80368675019995, 9.93567279225681),
new google.maps.LatLng(54.568711930674425, 10.00159076100681),
new google.maps.LatLng(54.50497153963467, 9.95764544850681),
new google.maps.LatLng(54.32596840639877, 10.74866107350681),
new google.maps.LatLng(54.54960026529934, 11.06726458913181),
new google.maps.LatLng(54.47306400429263, 11.36389544850681),
new google.maps.LatLng(54.036644923391854, 10.72668841725681),
new google.maps.LatLng(53.98499754883526, 10.90246966725681),
new google.maps.LatLng(54.04309633844723, 11.56164935475681),
new google.maps.LatLng(54.133311050696186, 11.71545794850681),
new google.maps.LatLng(54.17191447356375, 12.09997943288181),
new google.maps.LatLng(54.46667950881625, 12.48450091725681),
new google.maps.LatLng(54.67684226347999, 13.36340716725681),
new google.maps.LatLng(54.5750804955165, 13.66003802663181),
new google.maps.LatLng(53.959149817846935, 14.18738177663181),
new google.maps.LatLng(53.96561325372896, 14.57190326100681),
new google.maps.LatLng(54.22332971929941, 16.16492083913181),
new google.maps.LatLng(54.517727582244056, 16.50549701100681),
new google.maps.LatLng(54.854313380835016, 18.28528216725681),
new google.maps.LatLng(54.39638428512688, 18.71374896413181),
new google.maps.LatLng(54.30612512380055, 19.44579513196379),
new google.maps.LatLng(54.612657604376366, 20.32470138196379),
new google.maps.LatLng(54.87899352835281, 19.84130294446379),
new google.maps.LatLng(55.03040001149131, 20.14892013196379),
new google.maps.LatLng(54.90426756448001, 20.91796310071379),
new google.maps.LatLng(54.916898636363946, 21.18163497571379),
new google.maps.LatLng(56.525427952420614, 20.91796310071379),
new google.maps.LatLng(57.328760868567024, 21.53319747571379),
new google.maps.LatLng(57.81186147680532, 22.60985763196379),
new google.maps.LatLng(57.01907250471488, 23.40087325696379),
new google.maps.LatLng(57.2337484231473, 24.30175216321379),
new google.maps.LatLng(57.905378839642395, 24.43358810071379),
new google.maps.LatLng(58.380853679274566, 24.67528731946379),
new google.maps.LatLng(58.42690205358613, 24.36767013196379),
new google.maps.LatLng(58.27702469077773, 24.14794356946379),
new google.maps.LatLng(58.392371413816825, 23.77440841321379),
new google.maps.LatLng(58.884086107659314, 23.37890060071379)];
    
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0,fillColor:'#FF0000',fillOpacity:0.35, strokeWeight: 2,fillColor: '#FF0000',fillOpacity: 0.35});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territoryManager.addTerritory(1918, territory);
//Below is same as 1914////////////////////////////////////////////////////////////////////////!!!!!!!!!!!!!!!!!
var path = [
new google.maps.LatLng(-28.6955544447906, 16.32513858446157),
new google.maps.LatLng(-28.11574280678953, 17.11615420946157),
new google.maps.LatLng(-28.77262223509073, 17.64349795946157),
new google.maps.LatLng(-29.003483922546256, 19.22552920946157),
new google.maps.LatLng(-28.348048092095336, 19.97259952196157),
new google.maps.LatLng(-21.98905169830721, 20.14838077196157),
new google.maps.LatLng(-22.02979437342771, 20.93939639696157),
new google.maps.LatLng(-18.401602772899263, 21.11517764696157),
new google.maps.LatLng(-17.98411860972236, 23.31244327196157),
new google.maps.LatLng(-18.52665204707377, 23.66400577196157),
new google.maps.LatLng(-17.942315425596558, 24.41107608446157),
new google.maps.LatLng(-18.15123216472724, 24.58685733446157),
new google.maps.LatLng(-17.81684668283538, 25.33392764696157),
new google.maps.LatLng(-17.356042727327146, 24.23529483446157),
new google.maps.LatLng(-18.0676952632615, 21.37884952196157),
new google.maps.LatLng(-17.73315172872348, 18.83002139696157),
new google.maps.LatLng(-17.356042727327146, 13.90814639696157),
new google.maps.LatLng(-16.97815639198699, 13.20502139696157),
new google.maps.LatLng(-16.97815639198699, 12.89740420946157),
new google.maps.LatLng(-17.314093473069118, 12.58978702196157),
new google.maps.LatLng(-17.23016625511157, 11.66693545946157),
new google.maps.LatLng(-18.52665204707377, 12.01849795946157),
new google.maps.LatLng(-22.5583764364442, 14.61127139696157),
new google.maps.LatLng(-24.29218771580328, 14.47943545946157),
new google.maps.LatLng(-24.971273042945267, 14.83099795946157),
new google.maps.LatLng(-27.259662930450887, 15.22650577196157)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territory.hide();
territoryManager.addTerritory(1918, territory);
    
var path = [
new google.maps.LatLng(4.747012109930874, 8.571742279961427),
new google.maps.LatLng(7.194409360903305, 10.593226654961427),
new google.maps.LatLng(6.583619734553094, 11.384242279961427),
new google.maps.LatLng(11.873573442696983, 14.724086029961427),
new google.maps.LatLng(13.673516637877684, 13.405726654961427),
new google.maps.LatLng(12.989343598757106, 7.165492279961427),
new google.maps.LatLng(13.758900796282816, 5.759242279961427),
new google.maps.LatLng(13.502655597888278, 4.440882904961427),
new google.maps.LatLng(11.270848158301568, 3.298304779961427),
new google.maps.LatLng(6.4089672142475145, 2.770961029961427),
new google.maps.LatLng(6.234254872412507, 4.704554779961427),
new google.maps.LatLng(4.396568749419022, 5.407679779961427)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territory.hide();
territoryManager.addTerritory(1918, territory);

        
var path = [
new google.maps.LatLng(-11.618604381942829, 34.794758084515934),
new google.maps.LatLng(-11.575556192343411, 36.113117459515934),
new google.maps.LatLng(-11.317128728742214, 37.958820584515934),
new google.maps.LatLng(-10.497258905970448, 40.419758084515934),
new google.maps.LatLng(-9.198354342388678, 39.628742459515934),
new google.maps.LatLng(-6.979585994157616, 39.496906522015934),
new google.maps.LatLng(-6.2811681540338355, 38.881672147015934),
new google.maps.LatLng(-4.750250127541356, 39.452961209515934),
new google.maps.LatLng(-3.435281986043419, 37.695148709515934),
new google.maps.LatLng(-1.0642339772205076, 34.003742459515934),
new google.maps.LatLng(-1.0202959365877038, 30.532062772015934),
new google.maps.LatLng(-1.503575697033644, 29.609211209515934),
new google.maps.LatLng(-2.381968117972524, 28.818195584515934),
new google.maps.LatLng(-4.881620595387186, 29.433429959515934),
new google.maps.LatLng(-6.6741502230193515, 29.697101834515934),
new google.maps.LatLng(-8.242745651210223, 30.927570584515934),
new google.maps.LatLng(-9.241731892458551, 32.861164334515934),
new google.maps.LatLng(-9.50188414655556, 34.003742459515934),
new google.maps.LatLng(-10.324371546215447, 34.706867459515934)];
var polyline = new google.maps.Polygon({path:path, strokeColor: "#FF0000",fillColor:'#FF0000',fillOpacity:0.35, strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
shapes.push(polyline);
var territory = new Territory(polyline);
territory.hide();
territoryManager.addTerritory(1918, territory);

//End of 2018 Territories----------------------------------------------------------------------

    
//-DEPLOYMENT 2014
    
var shapes =[];
var path = [
new google.maps.LatLng(-24.01766347244327, 114.17641239405543),
new google.maps.LatLng(-23.050718641015717, 105.38734989405543),
new google.maps.LatLng(-21.750619409403846, 100.81703739405543),
new google.maps.LatLng(-17.446351338524966, 92.37953739405543),
new google.maps.LatLng(-13.722092752279414, 86.75453739405543),
new google.maps.LatLng(-5.059533843563482, 76.20766239405543),
new google.maps.LatLng(5.472413365688984, 64.25453739405543),
new google.maps.LatLng(12.070159150747406, 58.62953739405543),
new google.maps.LatLng(12.936103137373747, 57.4895974698004),
new google.maps.LatLng(13.492263381519333, 56.5228005948004),
new google.maps.LatLng(13.791202146517865, 54.8528787198004),
new google.maps.LatLng(13.620426324066294, 52.0403787198004),
new google.maps.LatLng(12.721861711270957, 49.2718240323004),
new google.maps.LatLng(11.734063976302549, 44.7894021573004),
new google.maps.LatLng(11.734063976302549, 44.2181130948004),
new google.maps.LatLng(12.163994008624263, 43.6028787198004),
new google.maps.LatLng(19.76262967643838, 38.7249490323004),
new google.maps.LatLng(24.40338616603699, 36.265438247393035),
new google.maps.LatLng(25.677424360049447, 35.078914809893035),
new google.maps.LatLng(25.677424360049447, 34.463680434893035)];
var polyline = new google.maps.Polyline({path:path, strokeColor: "#0F00FF", strokeOpacity: 1.0, strokeWeight: 4});
polyline.setMap(map);
map.setCenter(new google.maps.LatLng(25.002238901082606, 32.727840591143035), 5);
shapes.push(polyline);
    
root = new Root(2.5);
var egyptDeploy = new Marker(25.677424360049447, 34.463680434893035, [1914], 6, "Images/DeployMarker.png");
root.addChild(egyptDeploy);
    
//-DEPLOYMENT 2015

var shapes = [];
var path = [
];
var polyline = new google.maps.Polyline({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
map.setCenter(new google.maps.LatLng(34.69274609823993, 28.148780472061276), 6);
shapes.push(polyline);
var path = [
new google.maps.LatLng(40.419097797877555, 26.660393332790363),
new google.maps.LatLng(40.34796508290185, 26.654900168727863),
new google.maps.LatLng(40.247414582102444, 26.506584739040363),
new google.maps.LatLng(40.20263607900567, 26.39180462940203),
new google.maps.LatLng(40.15646994070826, 26.386998110847344),
new google.maps.LatLng(40.12339989073948, 26.387684756355156),
new google.maps.LatLng(40.01737690129916, 26.155841463120282),
new google.maps.LatLng(39.40724193243359, 25.654883987686276),
new google.maps.LatLng(38.20873769726523, 25.610938675186276),
new google.maps.LatLng(37.23547798451783, 25.764747268936276),
new google.maps.LatLng(36.07209012689822, 26.248145706436276),
new google.maps.LatLng(34.33063323250121, 27.061133987686276),
new google.maps.LatLng(31.114926066815908, 28.423438675186276),
new google.maps.LatLng(31.03965023706078, 28.467383987686276)];
var polyline = new google.maps.Polyline({path:path, strokeColor: "#0F00FF", strokeOpacity: 1.0, strokeWeight: 4});
polyline.setMap(map);
shapes.push(polyline);
    
root = new Root(2.5);
var gallipoliDeploy = new Marker(40.419097797877555, 26.660393332790363, [1915], 6, "Images/DeployMarker.png");
root.addChild(gallipoliDeploy);

//-Deployment 2016

var shapes = [];
var path = [
];
var polyline = new google.maps.Polyline({path:path, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2});
polyline.setMap(map);
map.setCenter(new google.maps.LatLng(39.566424929007745, 6.043997380848509), 6);
shapes.push(polyline);
var path = [
new google.maps.LatLng(31.020003256562816, 28.519938046482253),
new google.maps.LatLng(33.619209883979345, 26.498453671482253),
new google.maps.LatLng(34.13001076546804, 25.180094296482253),
new google.maps.LatLng(35.2142255061443, 19.027750546482253),
new google.maps.LatLng(36.567027599868375, 13.578531796482253),
new google.maps.LatLng(37.68818278328015, 10.853922421482253),
new google.maps.LatLng(38.10432051224594, 9.008219296482253),
new google.maps.LatLng(39.1343362566655, 7.0746255464822525),
new google.maps.LatLng(41.34796302184941, 5.4925942964822525),
new google.maps.LatLng(43.54347312782956, 3.8796907402235092)];
var polyline = new google.maps.Polyline({path:path, strokeColor: "#0F00FF", strokeOpacity: 1.0, strokeWeight: 4});
polyline.setMap(map);
shapes.push(polyline);

root = new Root(2.5);
var franceDeploy = new Marker(43.54347312782956, 3.8796907402235092, [1916], 6, "Images/DeployMarker.png");
root.addChild(franceDeploy);

//Deployment end-----------------------------------------------------------------------------------------
    
  if(serverSide) {
    getMarkers();
  } else {
    root = new Root(2.5);
    var turkey = new Marker(39, 35, [1914,1915], 6, "Images/BattleMarker.png");
    var france = new Marker(48, 0.8, [], 6);
    root.addChild(turkey);
    root.addChild(france);
    var stats = {"casualties" : "115000", "involved" : "Australia, Britain, New Zealand, Turkey"};
    var popupContent = createPopupContent("Gallipoli", ["Lorem Ipsum"], stats, 1914);
    var popup = new Popup(popupContent);
    var gallipoli = new Marker(40.3, 26.5, [1914], 7, null, popup);
    var marker1 = new Marker(50, 50, [], 6);
    var marker2 = new Marker(51, 49.5);
    marker2.hide();
    marker1.addChild(marker2);
    var marker3 = new Marker(49, 49.2);
    marker3.hide()
    marker1.addChild(marker3);
    root.addChild(marker1);
    var marker4 = new Marker(65, 45, [1917,1918], 6);
    root.addChild(marker4);
    var marker5 = new Marker(63, 49.6, [1918], null, null, null);
    marker5.hide();
    marker4.addChild(marker5);
    var marker6 = new Marker(67, 50, [1917]);
    marker6.hide();
    marker4.addChild(marker6);
    turkey.addChild(gallipoli);
    gallipoli.hide();
    marker7 = new Marker(41, 35, [1915]);
    turkey.addChild(marker7);
    marker7.hide();
  //this causes problems
  //marker8 = new Marker(45, 42, 1916);
  //france.addChild(marker8);
  //marker8.hide();
    root.changeZoom();
    root.showChildren();
    current = root
  }

  var questions = [
      ["How many soldiers died at Gallipoli", "115000"], 
      ["What countries were involved in Gallipoli", "Australia, Britain, New Zealand, Turkey"],
      ["How Many casualties were there in the battle of Rabaul, Papua New Guinea", "6"],
      ["Why were Australians sent to Papa New Guinea?, Papua New Guinea", "To occupy the New Guineas colonies"],
      ["At what rate were soldiers evacuated from Gallipoli on a weekly basis","10%"],
      ["What were the name of the rifles soldiers used to confuse the enemy (Gallipoli)","Drip rifles"],
      ["Which soldier that fought at Gallipoli invented the periscope rifle (Gallipoli)","Lance Corporal William Beech"],
      ["Was Gallipoli Australia’s first major battle","Yes"],
      ["How Many casualties were there in the battle of Pine, Israel","2000"],
      ["What date did the battle of Pine, Israel (1915) take place","6th of August "],
      ["What time did the Australians use artillery bombardment in Israel against Turkish positions","4:30pm"],
      ["How Many casualties were there in the battle of Nek, Israel, 1915","234"],
      ["What animals were used in the battle of Nek, Israel 1915","Horses"],
      ["What was the Australian brigade called in the battle of Nek, Israel 1915","3rd Light Horse Brigade"],
      ["How Many casualties were there in the battle of Suez Canal, Egypt 1916","190"],
      ["What date did the Turkish forces attack at the battle of Suez Canal, Egypt 1916","2nd of Feburary"],
      ["What were the Light Horses called by the Arabs (Suez Canal, Egypt 1916)","The Kings of the Feathers"],
      ["How Many casualties were there in the battle of Romani, Sinai Peninsula Egypt, 1916","8"],
      ["What Countries advance was stopped by the Australian soldiers in the battle of Romani, Sinai Peninsula Egypt, 1916","Turkey"],
      ["What date did the Ottoman troops attack in the battle of Romani, Sinai Peninsula Egypt, 1916", "4th of August"],
      ["How Many casualties were there in the battle of Hamel, France, 1918","250"],
      ["How Many casualties were there in the battle of Mont St Quentin, France, 1918","12187"],
      ["How Many casualties were there in the battle of Dernancourt, France, 1918","137"],
      ["How Many casualties were there in the battle of Villers-Bretonneux, France, 1918","2400"],
      ["How Many casualties were there in the battle of Montbrehain, France, 1918","430"],
      ["How Many casualties were there in the battle of Gaza, Israel, 1917","32"],
      ["What were used for the first time in the middle east in the battle of Gaza, Israel, 1917","Tanks"],
      ["What time did the Australian troops attack in the battle of Montbrehain, France, 1918","6:05am"],
      ["What town did the Germans capture in the battle of Villers-Bretonneux, France, 1918","Villers-Bretonneux"],
      ["Who captured the town of Peronne France in 1918","The ANZACs"]
  ];

  var answeredQuestions = JSON.parse(localStorage.getItem("questions")) || [];
  questions = questions.filter(x => answeredQuestions.indexOf(x[0]) == -1);

  var getNextQuestion = function() {
    if(questions.length == 0) {
      console.log("no questions left");
      return null;
    }
    else {
      shuffleArray(questions);
      return questions.shift();
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // eslint-disable-line no-param-reassign
    }
  }   
  
  var q = getNextQuestion();
  if(q != null)
    var question = new Question(q[0], q[1], getNextQuestion, correct);
  // and other stuff...
  /*
  $("#search #submit").click(function(event) {
    event.preventDefault();
    var longitude = $("#longitude_text").val();
    var latitude = $("#latitude_text").val();
    updateMap(latitude, longitude);
    console.log("Longitude: " + $("#longitude_text").val() + "\nLatitude: " + $("#latitude_text").val());
  });*/

  
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

function createPopupContent(title, text, statistics, year) {
  var content = document.getElementById("popupTemplate").cloneNode(true);
  content.removeAttribute("id");
  content.classList.remove("template");
  var h = content.getElementsByTagName("h2")[0];
  h.innerHTML = title;
  var mainText = content.getElementsByClassName("popupText")[0];
  var handleText = function(p) {
    var paragraph = document.createElement("p");
    paragraph.innerHTML = p;
    mainText.appendChild(paragraph);
  }
  if(text instanceof Array) {
    text.forEach(handleText);
  } else {
    handleText(text);
  }
/*  text.forEach(function(p) {
    var paragraph = document.createElement("p");
    paragraph.innerHTML = p;
    mainText.appendChild(paragraph);
  });*/
  var stats = content.getElementsByClassName("stats")[0];
  for(var key in statistics) {
    var stat = document.createElement("h4");
    stat.innerHTML = key;
    stats.appendChild(stat);
    var value = document.createElement("p");
    value.innerHTML = statistics[key];
    stats.appendChild(value);
  }
  return content;
}

function correct(question) {
  var answeredQuestions = JSON.parse(localStorage.getItem("questions")) || [];
  answeredQuestions.push(question);
  localStorage.setItem("questions", JSON.stringify(answeredQuestions));

  var unlockedCards = JSON.parse(localStorage.getItem("unlockedCards"));
  if(!unlockedCards) {
   // unlockedCards = [44, 30, 24, 14, 43];
    unlockedCards = []
    localStorage.setItem("unlockedCards", JSON.stringify(unlockedCards));
  }

  
  if(!localStorage.getItem("lockedCards")){
    var data = {
        resource_id: "cf6e12d8-bd8d-4232-9843-7fa3195cee1c"
    }

    $.ajax({
			url: "https://data.gov.au/api/action/datastore_search",
			data: data,
			dataType: "jsonp", // We use "jsonp" to ensure AJAX works correctly locally (otherwise XSS).
			cache: true,
			success: function(data) {
				//localStorage.setItem("slqData", JSON.stringify(data));	
        var lockedCards = [];
        $.each(data.result.records, function(key, value) {
          if(unlockedCards.indexOf(value["_id"]) == -1 && value["Thumbnail image"] != "") {
            lockedCards.push(value["_id"]);
          }
        })
        localStorage.setItem("lockedCards", JSON.stringify(lockedCards));
        var unlockedCard = unlockCard();
        showCard(unlockedCard);
			}
		});
  } else {
    var unlockedCard = unlockCard();
    showCard(unlockedCard);
  }
  /*
  var unlocked;
  do{
    unlocked = Math.floor(Math.random() * 54);
  } while(unlockedCards.indexOf(unlocked) != -1)
  unlockedCards.push(unlocked);
  console.log(unlocked);
  localStorage.setItem("unlockedCards", JSON.stringify(unlockedCards));*/
}

function unlockCard() {
  /*
  lockedCards = JSON.parse(localStorage.getItem("lockedCards"));
  unlockedCards = JSON.parse(localStorage.getItem("unlockedCards"));
  index = Math.floor(Math.random() * lockedCards.length)
  var unlocked = lockedCards[index];
  unlockedCards.push(unlocked);
  lockedCards.splice(index, 1);
  localStorage.setItem("unlockedCards", JSON.stringify(unlockedCards));
  localStorage.setItem("lockedCards", JSON.stringify(lockedCards));
  */

  lockedCards = JSON.parse(localStorage.getItem("lockedCards"));
  unlockedCards = JSON.parse(localStorage.getItem("unlockedCards"));
  var index = Math.floor(Math.random() * lockedCards.length)
  var unlocked = lockedCards[index];
  unlockedCards.push(unlocked);
  lockedCards.splice(index, 1);
  localStorage.setItem("unlockedCards", JSON.stringify(unlockedCards));
  localStorage.setItem("lockedCards", JSON.stringify(lockedCards));
  return unlocked;
}



function getMarkers() {
  $.ajax({
    url: "PHP/markers.php",
    dataType: "json",
    cache: true,
    success: function(data) {
      root = new Root(2.5);
      data.country.forEach(function(country) {
        var tempCountry = new Marker(parseFloat(country.latitude), parseFloat(country.longitude), [], 6,"Images/TopLevel.png");
        root.addChild(tempCountry);

        var handleBattle = function(battle) {
          var stats = {};
          stats["casualties"] = battle.casualties || "unknown";
          var year = parseInt(battle.year);
          var popupContent = createPopupContent(battle.name, battle.text || [], stats, year);
          var popup = new Popup(popupContent);
          var tempBattle = new Marker(parseFloat(battle.latitude), parseFloat(battle.longitude), [year], 7, "Images/BattleMarker.png", popup);
          tempBattle.hide();
          tempCountry.addChild(tempBattle);
          tempCountry.addYear(year);
        };

        if(country.markers.battle instanceof Array) {
          country.markers.battle.forEach(handleBattle);
        } else {
          handleBattle(country.markers.battle);
        }
      });
      root.changeZoom();
      root.showChildren();
      current = root;
    }
  })
    

}