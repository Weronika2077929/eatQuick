var currentFoods = [];

$(document).ready(function($){
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
      getRestaurantsForPostcode($("#locationInput").val());
        $("#filterByCuisineButton").show();
        $("#searchForFoodButton").hide();
        $("#cuisine").show();
    });

    $('#filterByCuisineButton').on('click', function(event) {
      event.preventDefault(); 
      var checkedItems = [];
      $("#cuisineList li.active").each(function(idx, li) {
          checkedItems.push($(li).text());
      });

      refreshMap(filterByCuisine(currentFoods,checkedItems)); 
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
      $("#searchResults").append("<div class='panel panel-success'><div class='panel-heading'><a id='resultbutton" + i + "''>" + what[i].Name + "</a></div><div class='panel-body'>"+
      what[i].Address+ "<br>"+
      what[i].Postcode + "<br> Rating: "+
      what[i].RatingStars +
      "<br><img src='"+ what[i].Logo[0].StandardResolutionURL + "'/>" +
      "</div></div>");

    $("#resultbutton" + i).click({"index": i, "array": what, "url": "https://public.je-apis.com/restaurants/" + what[i]["Id"] + "/details"}, function(event){
        jQuery.ajax(event.data["url"], {
        type: "GET",
        async: true,
        index: event.data.index,
        array: event.data.array,
        headers: justEatApiHeaders()
        }) .success(function( data ) {
            alert(JSON.stringify(data));
            alert(JSON.stringify(this.array[this.index]));
            $("#restaurantDescription").empty();
            $("#restaurantDescription").append(data.Description + "<br>");

            console.log(JSON.stringify(data));
        }) .error(function() {
            console.log("Unable to get a valid response from Google Maps at postcode resolution.");
      });
    });
  } 
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
    for(var i =0; i< postcodes.length; i++) {
        geocodeAddress(postcodes[i],geocoder,map);
    }
}


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
