var bMap;
$().ready(function() {
    "use strict";

    var minYear = 1765,
        maxYear = 2014;

    mapboxgl.util.getJSON('data/nyc-style.json', function (err, style) {
        if (err) throw err;

        // style for the basemap
        style.layers.push({
            "id": "basemap",
            "source": "basemap",
            "style": {
                //"raster-opacity": "0.1"
                //"raster-brightness": [0, 2]
                //"raster-contrast": "5"
            },
            "type": "raster"
        });

        // generate layers for all buildings
        generateAllLayers(minYear, maxYear);
        //fix for non-mapped buildings:
        var nonMappedLayer = generateLayer(0);
        style.layers.push(nonMappedLayer);

        var map = new mapboxgl.Map({
            container: 'map',
            style: style,
            center: [40.77499462,-73.98909694],
            minZoom: 10,
            zoom: 12,
            maxZoom: 15
        });

        // add the compass
        map.addControl(new mapboxgl.Navigation());

        var basemap = new mapboxgl.Source({
            type: 'raster',
            url: 'http://io.morphocode.com/urban-layers/data/esri-light-gray.tilejson',
            "tileSize": 256
        });
        map.addSource('basemap', basemap);


        /**
         * Generates a layer containing all buildings built during the specified year.
         *
         */
        function generateLayer(yearbuilt) {
            // use d3js interpolators for the color
            var colorInterpolator = d3.interpolateRgb('#52bad5', '#e85c41');

            var layer = {
                "id": "buildings_" + yearbuilt.toString(),
                "source": "nycBuildings",
                "source-layer": "buildings_mn",
                "filter": {"year_built": yearbuilt},
                "type": "fill"
            };

            // default style of the buildings in the layer:
            layer["style"] = {
                "fill-color": "yellow",
                "fill-opacity": "0.0"
            };
            var normalizedYear = scale(yearbuilt, minYear, maxYear, 0.0, 1.0),
                color = yearbuilt == 0 ? 'rgb(183, 183, 183)' : colorInterpolator(normalizedYear);

            // add the active class
            layer["style.active-"+yearbuilt.toString()] = {
                "fill-color": color,
                "fill-opacity": "1.0"
            };

            return layer;
        }

        /**
         * Generates all layers containing buildings for the specified period.
         */
        function generateAllLayers(minYear, maxYear) {
            for (var i = minYear; i < maxYear; i++) {
                style.layers.push(generateLayer(i));
            }
        }

        /**
         * Scales a number from one range to another
         */
        function scale(oldValue, oldMin, oldMax, newMin, newMax) {
            return (((oldValue - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;
        }

        // listen for yearUpdate event:
        var startYear = minYear,
            endYear = minYear;
        var updateTimeout;
        $(document).bind("slider-range-end", function(event, year) {
            endYear = year;
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(function() {
                showAllBetween(startYear, endYear);
            }, 10);
        });

        $(document).bind("slider-range-start", function(event, year) {
            startYear = year;
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(function() {
                showAllBetween(startYear, endYear);
            }, 10);
        });

        /**
         * Shows all buildings up until the specified year
         */
        function showAllBetween(startYear, endYear) {
            var classes = [];
            for(var i = startYear; i < endYear; i++) {
                classes.push("active-" + i);
            }
            //FIX for non-mapped buildings
            classes.push("active-0");
            // show the selected layers
            map.style.addClasses(classes);

            // remove inactive years
            classes = [];
            for(var j = minYear; j < startYear; j++) {
                classes.push("active-" + j);
            }
            for(var j = endYear; j < maxYear; j++) {
                classes.push("active-" + j);
            }
            map.style.removeClasses(classes);
        }

        bMap = map;

    });

});