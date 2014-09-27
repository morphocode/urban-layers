(function() {
    'use strict';

    urbanlayers.ui.bootstrap = bootstrap;
    urbanlayers.ui.build = build;

    /**
     * Boostraps Urban Layers: builds the UI, checks for support, etc.
     */
    function bootstrap() {
        if (urbanlayers.util.getParameterByName("show") != "true") {
            $("body").html("Under Construction");
        }

        // built the UI
        build();

        if (!urbanlayers.util.supported()) {
            $('html').addClass('mode-not-supported');
        } else {
            $.when(urbanlayers.map.build())
                .then(function() {

                    urbanlayers.ui.timeline.build();

                    // the tour has to be built after the timeline & the map, in order for selectors to work
                    // or use custom intro.onbeforechange callback
                    buildTour();
                });

            // welcome the User
            showContent("welcome");
        }
    }

    /**
     * Builds the Base UI: buttons, dialogs, etc.
     */
    function build() {

       $(".btn-help").on("click", function(e) {
            e.preventDefault();

            // show the intro, only if the map has been loaded:
            if (!urbanlayers.map.isLoaded()) {
                return;
            }

            if (urbanlayers.util.supported()) {
                if (isFirstTime) {
                    // do nothing, if we haven't seen the map yet
                    //showMap();
                } else {
                    showTour();
                }
            } else {
                showContent("not-supported");
            }
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

        $(".btn-get-started").on("click", function(e) {
            e.preventDefault();
            if (urbanlayers.util.supported()) {
                showMap();
            } else {
                showContent("not-supported");
            }
        });


        $("#layer-oldest-buildings").on("click", function() {
            //urbanlayers.ui.timeline.slideTo(0, 100, 1000);
        });

        $("#layer-most-buildings").on("click", function() {
            //urbanlayers.ui.slideTo(400, 600, 2000);
        });

        $("#layer-newest-buildings").on("click", function() {
            //urbanlayers.ui.slideTo(1400, 1500, 1000);
        });
    }

    /**
     * Shows/Hide different content parts: welcome, map, about, etc.
     */
    function showContent(section) {
        var isContentActive = $("#content-wrapper").css("visibility") == "visible";
        $("body").removeClass();
        $("body").addClass('mode-' + section);

        // scroll to the content section, if we're not coming from the map
        $("#content-wrapper").scrollTo("#"+section, isContentActive ? 1000 : 0);
    }

    var isFirstTime = true;
    /**
     * Show the map to the user
     */
    function showMap() {
        if (isFirstTime) {
            var map = urbanlayers.map.map(),
                mapDemo = true;
            map.flyTo([40.774066683777875, -73.97723823183378], 13, -61);
            map.on('moveend', function(e) {
                if (mapDemo) {
                    urbanlayers.ui.timeline.demo(function() {
                        showTour();
                    });
                }
                mapDemo = false;
            });

            isFirstTime = false;
        }
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
                element: document.querySelector('.range-start .slider-thumb'),
                intro: "<h4>Timeline</h4><p><strong>Drag the sliders</strong> to change the time period. <br/> Only buildings built during the selected time frame will be visible on the map.</p>",
                position: 'left'
              },
              {
                element: document.querySelector('#map-controls'),
                intro: "<h4>Graph</h4><p><strong>The graph shows when were current buildings of Mahnattan built</strong>.</p> The <em>X</em> axis represents the <em>year of construction</em>.<br/> The <em>Y</em> axis shows the <em>number of buildings built</em> in each year.</p>",
                position: 'bottom'
              },/*
              {
                element: document.querySelector('.explore-menu'),
                intro: "Click here to explore some of the urban layers",
                position: 'bottom'
              },*/
              {
                element: document.querySelector('#legend'),
                intro: "<h4>Legend</h4> <p> The <strong>oldest buildings</strong> are coloured in <strong>red</strong>. Buildings <strong>built recently</strong> are shown in <strong>blue</strong>.</p>",
                position: 'top'
              },
              {
                element: document.querySelector('.mapboxgl-ctrl-nav'),
                intro: "<h4>Zoom Controls</h4> <p>Use the map controls to <strong>zoom</strong> or <strong>rotate</strong> the map.</p>",
                position: 'bottom'
              },
              {
                element: document.querySelector('.navbar-nav'),
                intro: "<h4>Learn More</h4> <p> Meet the team and Learn more about the project.</p>",
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
            var isLastStep = this._currentStep == this._options.steps.length-1;
            $("body").toggleClass("intro-last", isLastStep);
        });

        /**
         * Set a cookie to mark that this tour was taken by the user. Don't show it again on refresh.
         */
        function tourTaken() {
            $.cookie('tour-taken', 'yes');
        }
    }

    /**
     * Is this the first time this User is here
     */
    function isTourTaken() {
        return $.cookie('tour-taken') == 'yes';
    }

    /**
     * Starts the intro js presentation
     */
    function showTour() {
        showContent('intro');
        tour.start();
    }


})();