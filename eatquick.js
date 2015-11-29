$(document).ready(function($){
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
                          $('#locationInput').val(postcode);
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
    });