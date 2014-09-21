(function() {
    'use strict';

    urbanmap.ui.build = build;
    urbanmap.ui.buildTour = buildTour;
    urbanmap.ui.startTour = startTour;
    urbanmap.ui.welcome = welcome;


    /**
     * Called when the user opens the page
     */
    function welcome() {
        //showContent("team");
        showContent("welcome");
    }

    /**
     * Builds the Base UI: buttons, dialogs, etc.
     */
    function build() {

       $("#help-button").on("click", function(e) {
            e.preventDefault();
            startTour();
        });

        $("#layer-oldest-buildings").on("click", function() {
            //urbanmap.ui.timeline.slideTo(0, 100, 1000);
        });

        $("#layer-most-buildings").on("click", function() {
            //urbanmap.ui.slideTo(400, 600, 2000);
        });

        $("#layer-newest-buildings").on("click", function() {
            //urbanmap.ui.slideTo(1400, 1500, 1000);
        });

        $(".btn-about").on("click", function(e) {
            e.preventDefault();
            showContent("about");
        });

        $(".btn-team").on("click", function(e) {
            e.preventDefault();
            showContent("team");
        });

        $(".btn-learn").on("click", function(e) {
            e.preventDefault();
            showContent("learn");
        });

        $("#btn-home").on("click", function(e) {
            e.preventDefault();
            showContent("welcome");
        });

        $("#btn-explore").on("click", function(e) {
            e.preventDefault();
            showMap();
        });
    }

    /**
     * Shows/Hide different content parts: welcome, map, about, etc.
     */
    function showContent(section) {
        var isContentActive = $("#content-wrapper").css("visibility") == "visible";
        $("body").removeClass();
        $("body").addClass(section+'-mode');

        $("#content-wrapper").scrollTo("#"+section, isContentActive ? 1000 : 0);
    }

    function showMap() {
        if (!isTourTaken()) {
            startTour();
        } else {
            showDemo();
        }
        showContent('map');
    }

    /**
     * Build the Dialog functionality
     */
    function buildDialogs() {
        // center the modal dialog
        $('#about-dialog').on('shown.bs.modal', function() {
            var initModalHeight = $('#about-dialog .modal-dialog').outerHeight(); //give an id to .mobile-dialog
            var userScreenHeight = $(document).outerHeight();
            if (initModalHeight > userScreenHeight) {
                $('#about-dialog .modal-dialog').css('overflow', 'auto'); //set to overflow if no fit
            } else {
                $('#about-dialog .modal-dialog').css('margin-top',
                (userScreenHeight / 2) - (initModalHeight/2)); //center it if it does fit
            }
        });

        // close the dialog, when the User clicks show me the Map
        $("#about-dialog #show-map").on("click", function() {
            $('#about-dialog').modal('hide');
        });

    }

    // INTRO --------------------------------------------------------------------
    var tour;
    /**
     * Using intro.js to introduce the User to the map
     */
    function buildTour() {
        tour = introJs();
        tour.setOptions({
            steps: [
              {
                element: document.querySelector('#map-controls'),
                intro: "This graph shows when were current buildings of Manhattan built.",
                position: 'bottom'
              },
              {
                element: document.querySelector('.range-end .slider-thumb'),
                intro: "Drag the sliders to change the time period.",
                position: 'bottom'
              },
              {
                element: document.querySelector('.explore-menu'),
                intro: "Click here to explore some of the urban layers",
                position: 'bottom'
              },
              {
                element: document.querySelector('#help-button'),
                intro: "Click Help if you want to see this Tutorial again.",
                position: 'bottom'
              }
            ]
        });

        // set a cookie to mark that this user has taken the tour
        tour.onexit(function() {
            tourTaken();
        }).oncomplete(function() {
            tourTaken();
        });

        /**
         * Set a cookie to mark that this tour was taken by the user. Don't show it again on refresh.
         */
        function tourTaken() {
            $.cookie('tour-taken', 'yes');
            // start the timeline demo, once the tour is over:
            showDemo();

        }
    }

    /**
     * Is this the first time this User is here
     */
    function isTourTaken() {
        return $.cookie('tour-taken') == 'yes';
    }

    /**
     * Starts a tour around the site functionality.
     */
    function startTour() {
        showContent("intro");
        tour.start();
    }

    var demoShown = false;
    function showDemo() {
        if (!demoShown) {
            urbanmap.ui.timeline.demo();
            demoShown = true;
        }
    }




})();