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
            center: [40.774066683777875, -73.97723823183378],
            minZoom: 10,
            zoom: 11,
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
            var yellow = d3.rgb(254, 190, 18).toString(),
                gray0 = d3.rgb(55, 55, 55).toString(),
                gray1 = d3.rgb(93, 92, 93).toString(),
                gray2 = d3.rgb(183, 183, 183).toString(),
                red = d3.rgb(219, 58, 27).toString(),
                red1 = d3.rgb(238, 131, 110).toString(),
                palette0 = [gray0, 'rgb(68, 154, 136)', red, 'rgb(44, 154, 183)', gray0],
                palette1 = [red, red1, /*'rgb(199,233,180)',*/ 'rgb(127,205,187)', 'rgb(65,182,196)', 'rgb(29,145,192)', 'rgb(34,94,168)', 'rgb(12,44,132)'],

                colorScale = d3.scale.quantile()
                                .domain(d3.range(1850, maxYear))
                                //.range(colorbrewer.RdYlBu[9]),
                                //.range(colorbrewer.Spectral[9]),
                                //.range(colorbrewer.BrBG[9]),
                                //.range(d3.scale.category10().range()),
                                //.range(d3.scale.category20b().range()),
                                .range(palette1),

                color = (yearbuilt > 0) ? colorScale(yearbuilt) : gray2;

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