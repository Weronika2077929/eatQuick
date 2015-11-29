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
    });

    $('#filterByCuisineButton').on('click', function(event) {
      event.preventDefault(); 
      var checkedItems = [];
      $("#cuisineList li.active").each(function(idx, li) {
          checkedItems.push($(li).text());
      });
      console.log(JSON.stringify(checkedItems, null, '\t'));

      refreshMap(filterByCuisine(currentFoods,checkedItems)); 
    });
});

function justEatApiHeaders(){
  return {"Accept-Language":"en-GB","Authorization":"Basic VGVjaFRlc3RBUEk6dXNlcjI=","Accept-Tenant":"uk"}
}

function refreshMap(what){
  // Do it
  console.log("refreshMap called");
  string = "" 

  for(var i = 0; i < what.length; i++){
    string = string + what[i].Name + ", "
  } 
  alert(string);
}

function refreshCuisineList(cuisines){
  $("#cuisineList").empty(); 
  for(var i=0; i<cuisines.length; i++){
    $("#cuisineList").append('<li class="list-group-item" data-checked="true">' + cuisines[i] + '</li>')
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
  var newArray = []
  for(var i = 0; i < restaurants.length; i++){
    var stop = false; 
    for(var j = 0; j < restaurants[i].CuisineTypes.length && !stop; j++){
      if(cuisines.indexOf(restaurants[i].CuisineTypes[j]["Name"]) != -1){
        stop = true; 
        newArray.push(restaurants[i]); 
      }
    }
  }
  return newArray; 
}

function getRestaurantsForPostcode(postcode){
  jQuery.ajax("https://public.je-apis.com/restaurants?q=" + postcode, {
    type: "GET",
    async: true,
    headers: justEatApiHeaders()
    }) .success(function( data ) {
      console.log(data);
      var cuisines = [];
      for(var i = 0; i < data.Restaurants.length; i++){
        console.log(data.Restaurants[i]);
        for(var j = 0; j < data.Restaurants[i].CuisineTypes.length; j++){
          cuisines.pushUnique(data.Restaurants[i].CuisineTypes[j]["Name"]);
        }
      }
      currentFoods = data.Restaurants; 
      refreshMap(data.Restaurants); 
      refreshCuisineList(cuisines);
      console.log(cuisines);
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
                      //console.log(data.results[i].address_components);
                      for(var j = 0; !found && j < data.results[i].address_components.length; j++){
                        if(data.results[i].address_components[j].types[0] == "postal_code"){
                          console.log(data.results[i].address_components[j].short_name);
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