$().ready(function() {
    "use strict";

    // Set the dimensions of the canvas / graph
    var margin = {top: 20, right: 25, bottom: 15, left: 25},
        width = $(window).width() - 0 - margin.left - margin.right,
        height = 130 - margin.top - margin.bottom;

    var bisectDate = d3.bisector(function(d) { return d.year; }).left;

    // Add an SVG element with the desired dimensions and margin.
    var svg = d3.select("#map-controls")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "graph")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set the ranges
    var x = d3.scale.linear().range([0, width]);
    var y = d3.scale.pow().exponent(.3).range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom")
        .tickSize(-height)
        .tickFormat(function(d) {
            return d;
        })
        .tickSubdivide(true);

    // build the Y axis
    var yAxis = d3.svg.axis()
        .scale(y)
        .tickValues([200, 2000, 8000])
        .tickSize(width)
        .orient("right")
        .tickFormat(function(d) {
            return d === 8000 ? d + " buildings" : d;
        });

    // Add the clip path.
    svg.append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    /**
     * Adjusts the position of the ticks on the Y axis
     */
    function customYTicks(g) {
      g.selectAll("text")
          .attr("x", 4)
          .attr("dy", -4);
    }

    // Get the data
    d3.csv("data/buildings_mn_year.csv", function(error, data) {
        buildGraph(svg, data);
        buildRange(svg, data);
    });


    /**
     * Builds the graph on the canvas using the supplied data
     */
    function buildGraph(canvas, data) {

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

            data.forEach(function(d) {
                d.year = +d.year;
                d.count = +d.count;
            });

        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d.year; }));
        y.domain([0, d3.max(data, function(d) { return d.count; })]).nice();

        // Add the area path.
        canvas.append("path")
          .attr("class", "area")
          .attr("clip-path", "url(#clip)")
          .attr("d", area(data));


        // Add the X Axis
        var gx = canvas.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the Y Axis
        var gy = canvas.append("g")
            .attr("class", "y axis")
            //.attr("transform", "translate(" + width + ",0)")
            .call(yAxis)
            .call(customYTicks);

        // Add the valueline path.
        canvas.append("path")
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueline(data));

        // update the axis with the new values
        d3.select(".x.axis").call(xAxis);
        d3.select(".y.axis").call(yAxis)
            .call(customYTicks);

    }

    /**
     * builds the Range slider composed of two seprate slider and a selection marquee
     */
    function buildRange(canvas, data) {

        var endSlider = buildSlider("range-end", canvas, data);
        var startSlider = buildSlider("range-start", canvas, data);

        var dragBehavior = d3.behavior.drag()
            .on("drag", onSelectionDrag);

        // build the selection window
        var selection = canvas.append("rect")
            .attr("class", "selection")
            .attr("y", 0 - margin.top)
            .attr("height", height + margin.top)
            .attr("width", 0)
            .call(dragBehavior);

        /**
         * Updates the bounds of the selection marquee according to the positions of the sliders
         */
        function updateSelection() {
            selection.attr("x", startSlider.pos());
            selection.attr("width", endSlider.pos() - startSlider.pos());
        }

        /**
         * Handles dragging of the selection window
         */
        function onSelectionDrag() {

            var $this = d3.select(this),
                currentX = +$this.attr("x"),
                sWidth = +$this.attr("width"),
                newX = currentX + d3.event.dx;

            // check bounds:
            if (newX < 0 || newX+sWidth > width) return;

            $this.attr("x", newX);

            startSlider.update(newX, true);
            endSlider.update(newX + sWidth, true);
        }

        /**
         * Builds a slider attached to the specified canvas
         */
        function buildSlider(sliderName, canvas, data) {

            // build the guideline and the dot showing the current value of the slider
            var controller = d3.select("#map-controls"),

                marker = canvas.append("g")
                    .attr("class", "marker " + sliderName),

                // a small circle at the intersection of the graph and the guideline
                dot = marker.append("circle")
                    .attr("class", "dot")
                    .attr("r", 2.5),

                // add the guideline
                guideline = marker.append("line")
                    .attr("class", "guideline")
                    .attr("x1", 0)
                    .attr("y1", -height*2)
                    .attr("x2", 0)
                    .attr("y2", height*2),

                // builds the slider as div elements. this allows to have them outside of the svg bounds
                slider = controller
                    .append("div")
                    .attr("class", "slider " + sliderName),

                sliderThumb = slider
                    .append("div")
                    .attr("class", "slider-thumb"),

                // build the tooltip. tooltips are also divs
                tooltip = slider
                    .append("div")
                    .attr("class", "v-tooltip"),

                tooltipContents = tooltip.append("div")
                    .attr("class", "v-tooltip-contents"),

                // the position of the slider
                _pos = 0,

                // the value of the data for the current position
                value = 0;

            // add the scroll thumb. using jQ Draggable in order to have it outside the svg bounds
            $(".slider." + sliderName + " .slider-thumb").draggable({
                axis: "x",
                start : function() {
                    $(this).closest(".slider").addClass("drag");
                    marker.classed("drag", true);
                    updateSelection();
                },
                drag: function(event) {
                    updateSlider($(this).position().left);
                    updateSelection();
                },
                stop : function() {
                    $(this).closest(".slider").removeClass("drag");
                    marker.classed("drag", false);
                    updateSlider($(this).position().left);
                    updateSelection();
                },
                containment: "svg"
            });

            //init the marker:
            updateSlider(0);


            /**
             * Updates the slider to match the specified position.
             * This will update the position of the guideline, the dot, the tooltip.
             * This is usually called by the draggable thumb.
             *
             */
            function updateSlider(posX, updateThumb) {
                if (posX < 0 || posX > width) return;

                // update the slider x:
                _pos = posX;

                var x0 = x.invert(posX),
                    newValue = Math.round(x0),
                    i = bisectDate(data, x0, 1),
                    d0 = data[i - 1],
                    d1 = data[i],
                    d = x0 - d0.year > d1.year - x0 ? d1 : d0,
                    posY = y(d.count);
                marker.attr("transform", "translate(" + posX + "," + posY + ")");

                // update the position of the tooltip
                tooltip
                    .style("left", posX + margin.left + "px")
                    .style("top",  posY + margin.top + "px");
                    //.style("top",  "20px");
                tooltipContents.html(d.count + " buildings");

                // update the position of the guideline
                //guideline.attr("x1", posX)
                //    .attr("x2", posX);
                sliderThumb.html(newValue);

                // fire update event, if year has changed:
                if (value != newValue) {
                    $(document).trigger("slider-" + sliderName, newValue);
                    value = newValue;
                }

                // update the div thumb, if the flag is set.
                // this happens when update() is not called from the thumb itself
                if (updateThumb) {
                    $(".slider." + sliderName + " .slider-thumb").css({left: posX});
                }
            }

            /**
             * returns the current value of the slider
             */
            function value() {
                return value;
            }

            function pos() {
                return _pos;
            }

            return {
                update: updateSlider,
                value: value,
                pos: pos
            };

        }//buildSlider

    }// buildRange



});