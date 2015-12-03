var currentFoods = [];
var clicks = 0;

$(document).ready(function($){

    var errors = 0;
    var click_queue = [];

    $("#fitts").click(function(e){
        var button = document.elementFromPoint(e.clientX, e.clientY);
        console.log(button.value);
        // if we didnt click on a button increment the mistakes
        if(button.value === undefined || button.value === null)
        {
            errors++;
        }

        else   // otherwise perform the fitts law calculations for this button click
        {
            var d = new Date();

            // get the current click on the button
            var current_click = {x:e.clientX, y:e.clientY , time: d.getTime()};

            // add it to the queue of click events
            click_queue.push(current_click);

            // if the queue has 2 click events then we can measure the time and distance between them
            // to add it to the fitts law array
            if(click_queue.length == 2)
            {
                // dequeue the oldest click event
                // this way we always have two click events that we measure distance  and time between
                previous_click = click_queue.shift();

                var x1 = previous_click.x;
                var y1 = previous_click.y;

                var x2 = current_click.x;
                var y2 = current_click.y;

                var distance = math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
                var time = (current_click.time - previous_click.time) / 1000.0;

                var ID = getBaseLog(2, distance/ button.offsetWidth + 1);

                fitts_entry = {time:time, ID:ID, color: color};
                fitts.push(fitts_entry);

                // delete the old diagrams and update it with the new
                d3.select("svg").remove();
                d3.select("svg").remove();

                click_queue = [];
                drawFittsDiagram(fitts);

                drawErrorsDiagram(errors);

            }
        }
    });


    Array.prototype.pushUnique = function (item){
        if(this.indexOf(item) == -1) {
            this.push(item);
            return true;
        }
        return false;
    }
    var $timeline_block = $('.cd-timeline-block');

    //hide timeline blocks which are outside the viewport
    $timeline_block.each(function(){
        if($(this).offset().top > $(window).scrollTop()+$(window).height()*0.75) {
            $(this).find('.cd-timeline-img, .cd-timeline-content').addClass('is-hidden');
        }
    });

    //on scolling, show/animate timeline blocks when enter the viewport
    $(window).on('scroll', function(){
        $timeline_block.each(function(){
            if( $(this).offset().top <= $(window).scrollTop()+$(window).height()*0.75 && $(this).find('.cd-timeline-img').hasClass('is-hidden') ) {
                $(this).find('.cd-timeline-img, .cd-timeline-content').removeClass('is-hidden').addClass('bounce-in');
            }
        });
    });

    $('.selectpicker').selectpicker({
        style: 'btn-default',
        size: 4
    });

    setupGeo('#locationInput'); 
    $("#searchForFoodButton").click(function(){
	clicks++;
	//document.getElementById("countField").innerHTML=clicks;     // USED FOR TESTING
      getRestaurantsForPostcode($("#locationInput").val());
        $("#filterByCuisineButton").show();
        $("#searchForFoodButton").hide();
        $("#cuisine").show();
    });

    $('#filterByCuisineButton').on('click', function(event) {
	clicks++;

	//document.getElementById("countField").innerHTML=clicks;     // USED FOR TESTING
      event.preventDefault(); 
      var checkedItems = [];
      $("#cuisineList li.active").each(function(idx, li) {
          checkedItems.push($(li).text());
      });

	refreshMap(filterByCuisine(currentFoods,checkedItems));


	$("body, html").animate({ 
            scrollTop: $( $(this).attr('href') ).offset().top
        }, 600);

      
    });

    //hide cuisine fiter
    $("#cuisine").hide();
    $("#filterByCuisineButton").hide();
});

function justEatApiHeaders(){
  return {"Accept-Language":"en-GB","Authorization":"Basic VGVjaFRlc3RBUEk6dXNlcjI=","Accept-Tenant":"uk"}
}

function refreshMap(what){
  // Do it
  console.log("refreshMap called");
  string = "" 

  $("#searchResults").empty(); 

  for(var i = 0; i < what.length; i++){
    string = string + what[i].Name + ", "
      //$("#searchResults").append("<a id='resultbutton" + i + "''>" + what[i].Name + "</a><br/>")
      $("#searchResults").append("<div class='panel panel-success'><div class='panel-heading'><a id='resultbutton" + i + "'' href=\"#restaurantProfile\">" + what[i].Name + "</a></div><div class='panel-body'>"+
      what[i].Address+ "<br>"+
      what[i].Postcode + "<br>" +
      "<div class='star-ratings-sprite'><span style='width:" + getPercentageRating(what[i].RatingStars) + "%' class='rating'></span></div><br>" +
      "<br><img src='"+ what[i].Logo[0].StandardResolutionURL + "'/>" +
      "</div></div>");

    //$("#resultbutton" + i).click({"index": i, "array": what, "url": "https://public.je-apis.com/restaurants/" + what[i]["Id"] + "/details"}, function(event){
    //    jQuery.ajax(event.data["url"], {
    //    type: "GET",
    //    async: true,
    //    index: event.data.index,
    //    array: event.data.array,
    //    headers: justEatApiHeaders()
    //    }) .success(function( data ) {
    //        //alert(JSON.stringify(data));
    //        //alert(JSON.stringify(this.array[this.index]));
    //        $("#restaurantName").empty();
    //        $("#restaurantName").append(this.array[this.index].Name + "<br>");
    //        $("#logo").empty();
    //        $("#logo").append("<img src='"+ this.array[this.index].Logo[0].StandardResolutionURL + "'/>");
    //        $("#restaurantDescription").empty();
    //        $("#restaurantDescription").append(data.Description + "<br>");
    //
    //
    //        console.log(JSON.stringify(data));
    //    }) .error(function() {
    //        console.log("Unable to get a valid response from Google Maps at postcode resolution.");
    //  });
    //});

      $("#resultbutton" + i).click({"index": i, "array": what}, function (event) {
	clicks++;

	//document.getElementById("countField").innerHTML=clicks;     // USED FOR TESTING
          $.when(
              $.ajax("https://public.je-apis.com/restaurants/" + event.data.array[event.data.index]["Id"] + "/details", {
                  type: "GET",
                  async: true,
                  index: event.data.index,
                  array: event.data.array,
                  headers: justEatApiHeaders()
              }).success(function (data) {
                  var openingTimes = "";
                  for(var i = 0; i < data.OpeningTimes.length; i++){
                      openingTimes += data.OpeningTimes[i].Key + data.OpeningTimes[i].Open + "-" + data.OpeningTimes[i].Closed + "<br>" ;
                  }
                  $("#restaurantName").empty();
                  $("#restaurantName").append(this.array[this.index].Name + "<br>");
                  $("#logo").empty();
                  $("#logo").append("<img src='" + this.array[this.index].Logo[0].StandardResolutionURL + "'/>");
                  $("#restaurantDescription").empty();
                  $("#restaurantDescription").append(data.Description + "<br>" + openingTimes);

                  // add the map2 marker
                  var map = new google.maps.Map(document.getElementById('googleMap2'), {
                      zoom: 13});
                  var geocoder = new google.maps.Geocoder();
                  geocodeAddress(JSON.stringify(this.array[this.index].Postcode),geocoder,map);
		  $("body, html").animate({ 
            scrollTop: $( $(this).attr('href') ).offset().top 
        }, 600);
                  console.log(JSON.stringify(data));
              }).error(function () {
                  console.log("Unable to get a valid response from Google Maps at postcode resolution.");
              }),
              $.ajax("https://public.je-apis.com/restaurants/" + event.data.array[event.data.index]["Id"] + "/reviews", {
                  type: "GET",
                  async: true,
                  index: event.data.index,
                  array: event.data.array,
                  headers: justEatApiHeaders()
              }).success(function (data) {
                  //alert(JSON.stringify(data));
                  //alert(JSON.stringify(this.array[this.index]));
                  $("#restaurantName").empty();
                  $("#restaurantName").append(this.array[this.index].Name + "<br>");
                  $("#logo").empty();
                  $("#logo").append("<img src='" + this.array[this.index].Logo[0].StandardResolutionURL + "'/>");
                  $("#restaurantDescription").empty();
                  $("#restaurantDescription").append(data.Description + "<br>");
                  console.log(JSON.stringify(data));
              }).error(function () {
                  console.log("Unable to get a valid response from Google Maps at postcode resolution.");
              })
          ).done(function (a1, a2) {
                  alert("We got what we came for!");
              })
      });


  }
}

function geocodeAddress(postcode,geocoder,map) {
    geocoder.geocode({'address': postcode}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location});

            bounds.extend(marker.getPosition());
        }
        else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
            setTimeout(function () {
                geocodeAddress(postcode, geocoder, map);
            }, 0.1);
        }
        else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    })
}

function refreshCuisineList(cuisines){
  $("#cuisineList").empty(); 
  for(var i=0; i<cuisines.length; i++){
    $("#cuisineList").append('<li class="list-group-item" data-checked="false">' + cuisines[i] + '</li>')
  }


    $(function () {
    $('.list-group.checked-list-box .list-group-item').each(function () {
        
        // Settings
        var $widget = $(this),
            $checkbox = $('<input type="checkbox" class="hidden" />'),
            color = ($widget.data('color') ? $widget.data('color') : "primary"),
            style = ($widget.data('style') == "button" ? "btn-" : "list-group-item-"),
            settings = {
                on: {
                    icon: 'glyphicon glyphicon-check'
                },
                off: {
                    icon: 'glyphicon glyphicon-unchecked'
                }
            };
            
        $widget.css('cursor', 'pointer')
        $widget.append($checkbox);

        // Event Handlers
        $widget.on('click', function () {
	    clicks++;
	//document.getElementById("countField").innerHTML=clicks;     // USED FOR TESTING
            $checkbox.prop('checked', !$checkbox.is(':checked'));
            $checkbox.triggerHandler('change');
            updateDisplay();
        });
        $checkbox.on('change', function () {
            updateDisplay();
        });
          

        // Actions
        function updateDisplay() {
            var isChecked = $checkbox.is(':checked');

            // Set the button's state
            $widget.data('state', (isChecked) ? "on" : "off");

            // Set the button's icon
            $widget.find('.state-icon')
                .removeClass()
                .addClass('state-icon ' + settings[$widget.data('state')].icon);

            // Update the button's color
            if (isChecked) {
                $widget.addClass(style + color + ' active');
            } else {
                $widget.removeClass(style + color + ' active');
            }
        }

        // Initialization
        function init() {
            
            if ($widget.data('checked') == true) {
                $checkbox.prop('checked', !$checkbox.is(':checked'));
            }
            
            updateDisplay();

            // Inject the icon if applicable
            if ($widget.find('.state-icon').length == 0) {
                $widget.prepend('<span class="state-icon ' + settings[$widget.data('state')].icon + '"></span>');
            }
        }
        init();
    });
});

}

function filterByCuisine(restaurants,cuisines){
  var newArray = [];
    var postcodes = [];
  for(var i = 0; i < restaurants.length; i++){
    var stop = false; 
    for(var j = 0; j < restaurants[i].CuisineTypes.length && !stop; j++){
      if(cuisines.indexOf(restaurants[i].CuisineTypes[j]["Name"]) != -1){
        stop = true; 
        newArray.push(restaurants[i]);
        postcodes.pushUnique(restaurants[i].Postcode);
      }
    }
  }

    updateMap(postcodes);
  return newArray; 
}

function updateMap(postcodes) {
    var myLatLng = {lat: 55.858465, lng: -4.269292};

    var map = new google.maps.Map(document.getElementById('googleMap'), {
        center: myLatLng,
        zoom: 13});

    var geocoder = new google.maps.Geocoder();

    console.log(postcodes);
   var latLang;
    var locations=[];
    var items=postcodes.length;
    var googleMapsApiUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    for(var i =0; i< postcodes.length; i++) {
        //var adr="Europe United Kingdom Glasgow ".concat(formal_addresses[i]);
        //geocodeAddress(adr,geocoder,map,coords);
        //console.log(adr);
        var postcode=postcodes[i];
        var apiUrl = googleMapsApiUrl + postcode + "&sensor=false";
        jQuery.getJSON(apiUrl, function (data) {
            if(data.results[0] === undefined) {
                console.log("undefined");
            }
            else {
                latLang = data.results[0].geometry.location;
                locations.push(latLang);
            }

            items=items-1;
            if(items==0){
                onDataReceived(locations,map);
            }

    });
    }
}

function onDataReceived( n, map){
    console.log("aaaaaaaaaa");
    var bounds = new google.maps.LatLngBounds();
    console.log(n);
    for(var i =0; i < n.length; i++) {

       var marker = new google.maps.Marker({
                map: map,
                position: n[i]});
	    	marker.setMap(map);
        bounds.extend(marker.getPosition());
       
    }
    map.fitBounds(bounds);
    
   
    
}

/*
function geocodeAddress(postcode,geocoder,map) {
    geocoder.geocode({'address': postcode}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location});
        }
        else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
            setTimeout(function () {
                geocodeAddress(postcode, geocoder, map);
            }, 0.1);
        }
        else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    })
}
*/
function getRestaurantsForPostcode(postcode){
  jQuery.ajax("https://public.je-apis.com/restaurants?q=" + postcode, {
    type: "GET",
    async: true,
    headers: justEatApiHeaders()
    }) .success(function( data ) {
      var cuisines = [];
      for(var i = 0; i < data.Restaurants.length; i++){
        for(var j = 0; j < data.Restaurants[i].CuisineTypes.length; j++){
          cuisines.pushUnique(data.Restaurants[i].CuisineTypes[j]["Name"]);
        }
      }
      currentFoods = data.Restaurants; 
      //refreshMap(data.Restaurants);
      refreshCuisineList(cuisines);
    }) .error(function() {
        console.log("Unable to get a valid response from Google Maps at postcode resolution.");
  });
}

function setupGeo(target){
  // Debug: 
  // 
  $(target).val("G14 0RR"); 
  return; 

  if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(geo) {
        if (geo.coords)
        {
            var lon = geo.coords.longitude; 
            var lat = geo.coords.latitude; 

            jQuery.ajax("http://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lon+"&sensor=true", {
              type: "GET",
              async: true
              }) .success(function( data ) {
                try{
                  var found = false; 
                  var postcode = null; 
                  for (var i = 0; !found && i < data.results.length; i++) {
                      for(var j = 0; !found && j < data.results[i].address_components.length; j++){
                        if(data.results[i].address_components[j].types[0] == "postal_code"){
                          postcode = data.results[i].address_components[j].short_name; 
                          found = true; 
                        }
                      }
                  }

                  if(found && postcode != null){
                    $(target).val(postcode);
                  }
                } catch(err){
                    console.log("There was a problem with postcode resolution.");
                }
              }) .error(function() {
                  console.log("Unable to get a valid response from Google Maps at postcode resolution.");
            });
        }
    });
   }
  else {
    console.log("Geolocation API is not supported"); 
  }      
}

function getPercentageRating(rating){
    return Math.round(rating * 100 / 6);
}


function drawErrorsDiagram(data)
{
    var margin = {top: 20, right: 15, bottom: 60, left: 60}
    width = 400 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .outerTickSize(0);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .outerTickSize(0)
        .tickFormat(d3.format("d"));

    var svg = d3.select("#errors-graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    x.domain(data.map(function(d) { return d.design; }));
    y.domain([0, d3.max(data, function(d) { return d.errors; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

    //Create Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .style("font-size","15px")
        .attr("y", 0 - 40)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Errors");

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.design); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.errors); })
        .attr("height", function(d) { return height - y(d.errors); })
        .style("fill", function(d){ return d.color; });

}


