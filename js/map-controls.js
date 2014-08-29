$().ready(function() {
    "use strict";


    var tooltip = d3.select("#map-controls").append("div")
        .attr("class", "mc-tooltip"),
        tooltipContents = tooltip.append("div").attr("class", "mc-tooltip-contents");

    // Set the dimensions of the canvas / graph
    var margin = {top: 10, right: 25, bottom: 20, left: 25},
        width = $(window).width() - 0 - margin.left - margin.right,
        height = 130 - margin.top - margin.bottom;

    var bisectDate = d3.bisector(function(d) { return d.year; }).left;

    // Set the ranges
    var x = d3.scale.linear().range([0, width]);
    var y = d3.scale.pow().exponent(.3).range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(20).tickSize(-height).tickSubdivide(true);

    var yAxis = d3.svg.axis().scale(y)
        .orient("left").ticks(5);

    // An area generator, for the light fill.
    var area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return x(d.year); })
        .y0(height)
        .y1(function(d) { return y(d.count); });

    // A line generator, for the dark stroke.
    var valueline = d3.svg.line()
        .interpolate("monotone")
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.count); });

    // Get the data
    d3.csv("data/buildings_mn_year.csv", function(error, data) {

        // Add an SVG element with the desired dimensions and margin.
        var svg = d3.select("#map-controls").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        data.forEach(function(d) {
            d.year = +d.year;
            d.count = +d.count;
        });

        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d.year; }));
        y.domain([0, d3.max(data, function(d) { return d.count; })]).nice();

        // Add the clip path.
        svg.append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", width)
          .attr("height", height);

        // Add the area path.
        svg.append("path")
          .attr("class", "area")
          .attr("clip-path", "url(#clip)")
          .attr("d", area(data));

        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + width + ",0)")
            .call(yAxis);

        // Add the valueline path.
        svg.append("path")
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueline(data));

        var marker = svg.append("g")
            .attr("class", "marker");

        marker.append("circle")
            .attr("r", 2.5);

        // add the guideline
        var guideline = svg.append("line")
            .attr("class", "guideline")
            .attr("x1", 0)
            .attr("y1", -30)
            .attr("x2", 0)
            .attr("y2", height);


        //init the marker:
        updateMarker(0);

        var currentYear = -1;
        /**
         * Updates the position of the marker on the graph
         */
        function updateMarker(posX) {
            if (posX < 0 || posX > width) return;

            var x0 = x.invert(posX),
                year = Math.round(x0),
                i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0.year > d1.year - x0 ? d1 : d0,
                posY = y(d.count);
            marker.attr("transform", "translate(" + posX + "," + posY + ")");
            //marker.select("text").text(d.count);

            // update the position of the tooltip
            tooltip
                .style("left", posX + margin.left + "px")
                .style("top",  posY + margin.top + "px");
                //.style("top",  "20px");
            tooltipContents.html(d.count);

            // update the position of the guideline
            guideline.attr("x1", posX).attr("x2", posX);

            // fire update event, if year has changed:
            if (currentYear != year) {
                $(document).trigger("yearUpdated", year);
                currentYear = year;
            }
        }

        // add the scroll thumb. using jQ Draggable in order to have it outside the svg bounds
        $("#scroll-thumb").draggable({
            axis: "x",
            drag: function(event) {
                updateMarker($(this).position().left);
            },
            containment: "svg"
        });

    });

});