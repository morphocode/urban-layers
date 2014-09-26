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


    patch();
    /**
     * Patch the original mapbox gl js lib in order to improve performance
     */
    function patch() {
        mapboxgl.Style.prototype.update = function(options) {
            this.cascade(options);
        };

        mapboxgl.Style.prototype.addClasses = function(n, options) {
            var needsUpdate = false;
            for (var i = 0, c; c = n[i]; i++) {
                if (!this.classes[c]) needsUpdate = true; // prevent unnecessary recalculation

                //console.log("Adding class: "+ c);
                this.classes[c] = true;
            }
            /*
            if (needsUpdate) {
                this.cascade(options);
            }*/
        };

        mapboxgl.Style.prototype.removeClasses = function(n, options) {
            var needsUpdate = false;
            for (var i = 0, c; c = n[i]; i++) {
                if (this.classes[c]) needsUpdate = true; // // prevent unnecessary recalculation

                //console.log("Removing class: "+ c);
                delete this.classes[c];
            }/*
            if (needsUpdate) {
                this.cascade(options);
            }*/
        };

    }


    /**
     * returns promise
     */
    function build() {

        var dfd = new jQuery.Deferred();

        mapboxgl.util.getJSON('data/nyc-style.json', function (err, style) {
            if (err) throw err;

            // enable more details ... this prooved to break rendering with some browsers
            // so we only enable it conditionally
            if (urbanmap.util.detailMode()) {
                style.sources["nycBuildings"].url = "http://io.morphocode.com/urban-layers/data/nyc-mn-tiles-details.tilejson";
            }

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
                maxZoom: (urbanmap.util.detailMode()) ? 15 : 15
            });

            // always show non-_mapped buildings
            _map.style.addClass("active-0");

            // add the compass
            _map.addControl(new mapboxgl.Navigation());

            var buildingsSource = _map.sources['nycBuildings'];

            var tilesQueue = [
                '11/603/769',
                '11/602/769',
                '11/601/769'
            ], reqTilesCount = tilesQueue.length;
            ;
            buildingsSource.on('tile.load', function(event) {
                var tile = event.tile;

                // remove the tile from the required list, once loaded
                for (var i = 0; i < tilesQueue.length; i++) {
                    if (tile.url.indexOf(tilesQueue[i]) > -1) {
                        tilesQueue.splice(i, 1);
                        break;
                    }
                }

                // loading is finished, once there are no more tiles left in the queue
                if (tilesQueue.length == 0) {
                    $('html').toggleClass("tiles-loaded", true);
                }
                console.log("Completion percent: " + (reqTilesCount - tilesQueue.length) / reqTilesCount * 100);
            });

            var basemap = new mapboxgl.Source({
                type: 'raster',
                //url: 'http://io.morphocode.com/urban-layers/data/stamen-toner-lite.tilejson',
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
                // prevent updates if the slider moves too fast
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(function() {
                    showAllBetween(startYear, endYear);
                }, 1);
            });

            $(document).bind("slider-range-start", function(event, year) {
                startYear = year;
                // prevent updates if the slider moves too fast
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(function() {
                    showAllBetween(startYear, endYear);
                }, 1);
            });

            buildLegend();

            dfd.resolve(_map);

        });

        return dfd.promise();
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

    var updateTimeout,
        needsUpdate = true,
        lastEndYear,
        lastStartYear;

    /**
     * Shows all buildings for the specified period
     */
    function showAllBetween(startYear, endYear) {

        // ensure updates at a max of 100ms frequency
        lastStartYear = startYear;
        lastEndYear = endYear;
        if (!needsUpdate) return;
        needsUpdate = false;

        //console.log(Date.now());
        //console.log("Show all between: " + startYear + " and " + endYear);

        updateTimeout = setTimeout(function() {
            needsUpdate = true;

            if (lastStartYear != startYear || lastEndYear != endYear) {
                showAllBetween(lastStartYear, lastEndYear);
            }
        }, 100);


        var classes = [];
        for(var i = startYear; i <= endYear; i++) {
            classes.push("active-" + i);
        }

        // show the selected layers
        _map.style.addClasses(classes);

        // remove inactive years
        classes = [];
        for(var j = minYear; j < startYear; j++) {
            classes.push("active-" + j);
        }
        for(var j = endYear+1; j < maxYear; j++) {
            classes.push("active-" + j);
        }

        _map.style.removeClasses(classes);
        _map.style.update(options);

    }

    /**
     * Build the legend
     */
    function buildLegend() {
        var legend = d3.select('#legend')
          .append('ul')
            .attr('class', 'list-inline');

        var keys = legend.selectAll('li.key')
            .data(colorScale.range());

        keys.enter().append('li')
            .attr('class', 'key')
            .style('border-top-color', String)
            .text(function(d) {
                var r = colorScale.invertExtent(d);
                return Math.round(r[0]);
            });
    }


    /**
     * returns the map instance
     */
    function map() {
        return _map;
    }

})();