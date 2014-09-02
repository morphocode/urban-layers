(function() {
    'use strict';

    urbanmap.ui.buildDialogs = buildDialogs;
    urbanmap.ui.buildToolbar = buildToolbar;
    urbanmap.ui.buildTour = buildTour;
    urbanmap.ui.startTour = startTour;
    urbanmap.ui.welcome = welcome;


    /**
     * Called when the user opens the page
     */
    function welcome() {
        $('#about-dialog').modal('show');
    }

    /**
     * Build the Dialog functionality
     */
    function buildDialogs() {
        $("#show-map").on("click", function() {
            $('#about-dialog').modal('hide');

            //show intro only, if the User hasn't seen it yet
            if (!isTourTaken()) {
                startTour();
            } else {
                urbanmap.ui.timeline.demo();
            }
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
            ]
        });

        // set a cookie to mark that this user has taken the tour
        tour.onexit(function() {
            $.cookie('tour-taken', 'yes');
        });
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
        tour.start();
    }


    // TOOLBAR ----------------------------------------------------------------------------
    /**
     * Wire the buttons
     */
    function buildToolbar() {
       $("#help-button").on("click", function() {
            urbanmap.ui.startTour();
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
    }

})();