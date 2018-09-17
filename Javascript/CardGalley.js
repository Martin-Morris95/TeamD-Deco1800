$(document).ready(function() {
    /*
        function Node(zoom) {
      this.zoom = zoom;
      this.children = [];
    }
    
        function showBack() {
      $("#back").removeClass("hidden");
    }

    function hideBack() {
      $("back").addClass("hidden");
    }
  var stat = document.createElement("h4");
    stat.innerHTML = key;
    stats.appendChild(stat);
    var value = document.createElement("p");
    value.innerHTML = statistics[key];
    stats.appendChild(value);
*/
    for(i=0;i<35;i++){
        $("#cardContainer").append('<div class = "card">'+(i+1)+'</div>');
    }
});