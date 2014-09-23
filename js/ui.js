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

        $(".btn-subscribe").on("click", function(e) {
            e.preventDefault();
            showContent("subscribe");
        });

        $("#btn-home").on("click", function(e) {
            e.preventDefault();
            showContent("welcome");
        });

        $("#btn-explore").on("click", function(e) {
            e.preventDefault();
            showMap();
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

    /**
     * Shows/Hide different content parts: welcome, map, about, etc.
     */
    function showContent(section) {
        var isContentActive = $("#content-wrapper").css("visibility") == "visible";
        $("body").removeClass();
        $("body").addClass(section+'-mode');

        // scroll to the content section, if we're not coming from the map
        $("#content-wrapper").scrollTo("#"+section, isContentActive ? 1000 : 0);
    }

    var isFirstTime = true;
    /**
     * Show the map to the user
     */
    function showMap() {
        if (isFirstTime) {
            startTour();

            isFirstTime = false;
        } /*else {
            showDemo();
        }*/
        showContent('map');
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
                intro: "<strong>This graph shows when were current buildings of Mahnattan built.</strong> <br /><br /> The x axis represents the year of construction, where the y axis gives the number of buildings built during the selected time period.",
                position: 'bottom'
              },
              {
                element: document.querySelector('.range-start .slider-thumb'),
                intro: "<strong>Drag the sliders to control which buildings are visible.</strong> <br /> <br /> The left slider controls the start of the period. The right slider - it's end.",
                position: 'left'
              },/*
              {
                element: document.querySelector('.explore-menu'),
                intro: "Click here to explore some of the urban layers",
                position: 'bottom'
              },*/
              {
                element: document.querySelector('.mapboxgl-ctrl-nav'),
                intro: "<strong>Use the map controls to zoom in/out or rotate the map.</strong>",
                position: 'bottom'
              },
              {
                element: document.querySelector('.nav .btn-about'),
                intro: "<strong>Learn more about the project.</strong>",
                position: 'bottom'
              },
              {
                element: document.querySelector('#help-button'),
                intro: "<strong>Click here if you want to see this tutorial again.</strong>",
                position: 'bottom'
              }
            ]
        });

        // set a cookie to mark that this user has taken the tour
        tour.onexit(function() {
            tourTaken();
        }).oncomplete(function() {
            tourTaken();
        }).onbeforechange(function(targetElem) {
            var isLastStep = targetElem.id == 'help-button';
            $("body").toggleClass("intro-last", isLastStep);
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
            urbanmap.map.map().flyTo([40.774066683777875, -73.97723823183378], 13, -61);
            demoShown = true;
        }
    }




})();