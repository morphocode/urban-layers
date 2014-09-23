(function() {
    'use strict';

    urbanmap.map.build = build;
    urbanmap.map.map = map;

    var minYear = 1765,
        maxYear = 2014,
        _map,

        // colors
        yellow = d3.rgb(254, 190, 18).toString(),
        gray0 = d3.rgb(55, 55, 55).toString(),
        gray1 = d3.rgb(93, 92, 93).toString(),
        gray2 = d3.rgb(183, 183, 183).toString(),
        red = d3.rgb(219, 58, 27).toString(),
        red1 = d3.rgb(238, 131, 110).toString(),
        palette0 = [gray0, 'rgb(68, 154, 136)', red, 'rgb(44, 154, 183)', gray0],
        palette1 = [red, red1, /*'rgb(199,233,180)',*/ yellow, 'rgb(127,205,187)', 'rgb(65,182,196)', 'rgb(29,145,192)', 'rgb(34,94,168)', 'rgb(12,44,132)'],
        colorScale = d3.scale.quantile()
                        .domain(d3.range(1840, maxYear))
                        //.range(colorbrewer.RdYlBu[9]),
                        //.range(colorbrewer.Spectral[9]),
                        //.range(colorbrewer.BrBG[9]),
                        //.range(d3.scale.category10().range()),
                        //.range(d3.scale.category20b().range()),
                        .range(palette1),

        options = {transition: false};


    function build() {
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
            style.layers = style.layers.concat(generateAllLayers(minYear, maxYear));
            //fix for non-mapped buildings:
            var nonmappedLayer = generateLayer(0);
            style.layers.push(nonmappedLayer);

            // init the _map
            _map = new mapboxgl.Map({
                container: 'map',
                style: style,
                center: [40.774066683777875, -73.97723823183378],
                minZoom: 10,
                zoom: 11,
                maxZoom: 15
            });

            // always show non-_mapped buildings
            _map.style.addClass("active-0");

            // add the compass
            _map.addControl(new mapboxgl.Navigation());

            var basemap = new mapboxgl.Source({
                type: 'raster',
                url: 'http://io.morphocode.com/urban-layers/data/esri-light-gray.tilejson',
                "tileSize": 256
            });
            _map.addSource('basemap', basemap);

            // Update the _map, when the time period has been changed:
            var startYear = minYear,
                endYear = minYear,
                updateTimeout;

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

        });
    }

    /**
     * Generates a layer containing all buildings built during the specified year.
     */
    function generateLayer(yearbuilt) {
        var color = (yearbuilt > 0) ? colorScale(yearbuilt) : gray2;

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
        var layers = [];
        for (var i = minYear; i < maxYear; i++) {
            layers.push(generateLayer(i));
        }
        return layers;
    }

    var updating = false;

    /**
     * Shows all buildings for the specified period
     */
    function showAllBetween(startYear, endYear) {

        //console.log(Date.now());
        //console.log("Show all between: " + startYear + " and " + endYear);
        var classes = [];
        for(var i = startYear; i < endYear; i++) {
            classes.push("active-" + i);
        }

        // show the selected layers
        _map.style.addClasses(classes);

        // remove inactive years
        classes = [];
        for(var j = minYear; j < startYear; j++) {
            classes.push("active-" + j);
        }
        for(var j = endYear; j < maxYear; j++) {
            classes.push("active-" + j);
        }
        _map.style.removeClasses(classes);
        _map.style.update(options);

    }

    /**
     * returns the map instance
     */
    function map() {
        return _map;
    }

})();