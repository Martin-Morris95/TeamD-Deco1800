var serverSide = false;
var markers = [];
var map;
var root;
var current;
var showBattles = false;
var showTerritories = false;
var showDeployment = false;

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
  $("#timeline p").click(function() {
    $(".current").removeClass("current");
    $(this).addClass("current");
    root.setCurrentYear(parseInt($(this).text()));
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
    var nextQuestion = this.getNextQuestion();
    if(nextQuestion != null) {
      this.changeQuestion(nextQuestion[0], nextQuestion[1]);
      this.content.getElementsByTagName("input")[0].value = "";
    }
    else {
      this.content.classList.add("hidden");
    }
    this.correct();
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
        }else if(this.id == "deployment"){
            showDeployment = true;
        }else if(this.id == "territories"){
            showTerritories = true;
        }
    }else{
        if(this.id == "battles" ){
            showBattles = false;
        }else if(this.id == "deployment"){
            showDeployment = false;
        }else if(this.id == "territories"){
            showTerritories = false;
        }
    }

});

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), { center: {lat: 31, lng: 68},
          zoom: 8, disableDefaultUI: true, mapTypeId: 'terrain',zoomControl: false,
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
map.setCenter(new google.maps.LatLng(54.39044017608623, 9.049155213665586), 6);
shapes.push(polyline);
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
map.setCenter(new google.maps.LatLng(54.39044017608623, 9.049155213665586), 6);
shapes.push(polyline);
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
map.setCenter(new google.maps.LatLng(54.39044017608623, 9.049155213665586), 6);
shapes.push(polyline);





  /*
  var pathCoords = [
    {lat: -30, lng: 115},
    {lat: 15, lng: 55}
  ];

  var path = new google.maps.Polyline({
    path: pathCoords,
    geodesic: true,
    strokeColor: '#000000',
    strokeOpacity: 1,
    strokeWidth: 3
  });
  path.setMap(map);
 */
  if(serverSide) {
    getMarkers();
  } else {
    root = new Root(2.5);
    var turkey = new Marker(39, 35, [1914,1915], 6);
    var france = new Marker(48, 0.8, [], 6);
    root.addChild(turkey);
    root.addChild(france);
    var stats = {"casualties" : "115000", "involved" : "Australia, Britain, New Zealand, Turkey"};
    var popupContent = createPopupContent("Gallipoli", ["Lorem Ipsum"], stats);
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
      ["What date did the battle of 1915 Pine, Israel take place","6th of August "],
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

function createPopupContent(title, text, statistics) {
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

function correct() {
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
    url: "php/markers.php",
    dataType: "json",
    cache: true,
    success: function(data) {
      root = new Root(2.5);
      data.country.forEach(function(country) {
        var tempCountry = new Marker(parseFloat(country.latitude), parseFloat(country.longitude), [], 6);
        root.addChild(tempCountry);

        var handleBattle = function(battle) {
          var stats = {};
          stats["casualties"] = battle.casualties || "unknown";
          var popupContent = createPopupContent(battle.name, battle.text || [], stats);
          var popup = new Popup(popupContent);
          var year = parseInt(battle.year);
          var tempBattle = new Marker(parseFloat(battle.latitude), parseFloat(battle.longitude), [year], 7, null, popup);
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