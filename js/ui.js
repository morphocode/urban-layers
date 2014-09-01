(function() {
    'use strict';

    urbanmap.ui.showIntro = showIntro;
    urbanmap.ui.buildIntro = buildIntro;
    urbanmap.ui.buildToolbar = buildToolbar;

    var intro;

    /**
     * Using intro.js to introduce the User to the map
     */
    function buildIntro() {
        intro = introJs();
        intro.setOptions({
            steps: [
              {
                element: document.querySelector('#map-controls'),
                intro: "This graph shows when were the current buildings of Manhattan built.",
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
        intro.onexit(function() {
            $.cookie('intro-taken', 'yes');
        });
    }

    /**
     * Shows an intro to the user, only if that's his first time on this site
     */
    function showIntro(firstTime) {
        if (firstTime && $.cookie('intro-taken')) {
            return;
        }
        intro.start();
    }

    /**
     * Wire the buttons
     */
    function buildToolbar() {
       $("#help-button").on("click", function() {
            urbanmap.ui.showIntro();
        });

        $("#layer-oldest-buildings").on("click", function() {
            urbanmap.ui.slideTo(0, 100, 1000);
        });

        $("#layer-most-buildings").on("click", function() {
            urbanmap.ui.slideTo(400, 600, 2000);
        });

        $("#layer-newest-buildings").on("click", function() {
            urbanmap.ui.slideTo(1400, 1500, 1000);
        });
    }

})();