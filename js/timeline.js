(function() {
    "use strict";

    urbanmap.ui.timeline.build = build;
    urbanmap.ui.timeline.demo = demo;

    var margin,
        width,
        height,
        bisectDate = d3.bisector(function(d) { return d.year; }).left,
        x, xAxis,
        y, yAxis,
        rangeSlider;

    /**
     * Builds the base DOM structure for the Graph.
     * Loads the data and populates the UI when ready.
     */
    function build() {
        // Set the dimensions of the canvas / graph
        margin = {top: 20, right: 25, bottom: 15, left: 25},
            width = $(window).width() - 0 - margin.left - margin.right,
            height = 130 - margin.top - margin.bottom;

        // Add an SVG element with the desired dimensions and margin.
        var canvas = d3.select("#map-controls")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "graph")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var graphLayer = canvas.append('g').attr("class", "graph-layer"),
            axesLayer = canvas.append('g').attr("class", "axes-layer"),
            sliderLayer = canvas.append('g').attr("class", "slider-layer");

        // Set the ranges
        x = d3.scale.linear().range([0, width]);
        y = d3.scale.pow().exponent(.3).range([height, 0]);

        // Define the axes
        xAxis = d3.svg.axis().scale(x)
            .orient("bottom")
            .tickSize(-height)
            .tickFormat(function(d) {
                return d;
            })
            .tickSubdivide(true);

        // build the Y axis
        yAxis = d3.svg.axis()
            .scale(y)
            .tickValues([0, 1])
            .tickSize(width)
            .orient("right")
            .tickFormat(function(d) {
                return d === 8000 ? d + " buildings" : d;
            });

        // Add the clip path.
        canvas.append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", width)
          .attr("height", height);

        // Add the X Axis
        var gx = axesLayer.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the Y Axis
        var gy = axesLayer.append("g")
            .attr("class", "y axis")
            //.attr("transform", "translate(" + width + ",0)")
            .call(yAxis);
            //.call(customYTicks);

        rangeSlider = buildRangeSlider(sliderLayer);

        // Load the data & populate UIs
        d3.csv("data/buildings_mn_year.csv", function(error, data) {
            buildGraph(graphLayer, data);
            rangeSlider.data(data);
        });
    }

    /**
     * Show a quick demo by animating the sliders a bit
     */
    function demo() {
        var cStart = rangeSlider.start().pos(),
            cEnd = rangeSlider.end().pos();
        rangeSlider.slideTo(cStart, cEnd + 200, 2000);
    }


    /**
     * Builds the graph on the canvas using the supplied data
     */
    function buildGraph(graphics, data) {

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

        yAxis.tickValues([200, 2000, 8000]);

        // NOTE: clip the ticks with the graph
        var axesLayer = d3.select(".axes-layer");
        axesLayer.append("path")
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueline(data));

        // Add the area path.
        graphics.append("path")
          .attr("class", "area")
          .attr("clip-path", "url(#clip)")
          .attr("d", area(data));

        // Add the valueline path.
        graphics.append("path")
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueline(data));

        // update the axis with the new values
        d3.select(".x.axis").call(xAxis);
        d3.select(".y.axis").call(yAxis)
            .call(customYTicks);

        /**
         * Adjusts the position of the ticks on the Y axis
         */
        function customYTicks(g) {
          g.selectAll("text")
              .attr("x", 4)
              .attr("dy", -4);
        }
    }

    /**
     * builds the Range slider composed of two separate sliders and a selection marquee
     */
    function buildRangeSlider(canvas) {

        var startSlider = buildSlider(width/2 - 100, "range-start", canvas),
            endSlider = buildSlider(width/2 , "range-end", canvas);

        var dragBehavior = d3.behavior.drag()
            .on("drag", onSelectionDrag);

        // build the selection window
        var selection = canvas.append("rect")
            .attr("class", "selection")
            .attr("x", startSlider.pos())
            .attr("y", 0 - margin.top)
            .attr("height", height + margin.top)
            .attr("width", endSlider.pos() - startSlider.pos())
            .call(dragBehavior);

        /**
         * Called when the data is set for this range slider
         */
        function data(myData) {
            startSlider.data(myData);
            endSlider.data(myData);
        }

        /**
         * Slides the two sliders to the new positions using a transition
         */
        function slideTo(newStart, newEnd, duration) {
            var duration = duration || 2000;
            d3.transition()
                .duration(duration)
                //.ease("linear")
                .tween("moveTween", function () {
                    var sI = d3.interpolateRound(startSlider.pos(), newStart),
                        eI = d3.interpolateRound(endSlider.pos(), newEnd),
                        _width = d3.select(this).attr("width");

                    return function(t) {
                        var iStart = sI(t),
                            iEnd = eI(t);
                        startSlider.update(iStart, true);
                        endSlider.update(iEnd, true);
                        updateSelection();
                    }
                });
        }

        /**
         * Updates the bounds of the selection marquee according to the positions of the sliders
         */
        function updateSelection() {
            if (!selection) return;

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

            selection.attr("x", newX);

            // update the slider, they will update the selection
            startSlider.update(newX, true);
            endSlider.update(newX + sWidth, true);
        }

        /**
         * Builds a slider attached to the specified canvas
         */
        function buildSlider(myPos, sliderName, canvas, myData) {

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

                _data = myData || {},

                // the position of the slider
                _pos = myPos,

                // the value of the data for the current position
                _value = 0;

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
            updateSlider(_pos, true);


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

                // update the div thumb, if the flag is set.
                // this happens when update() is not called from the thumb itself
                if (updateThumb) {
                    $(".slider." + sliderName + " .slider-thumb").css({left: posX});
                }

                marker.attr("transform", "translate(" + posX + "," + 0 + ")");

                // don't update the data values, if no data is present
                if (!_data[0]) return;

                var x0 = x.invert(posX),
                    newValue = Math.round(x0),
                    i = bisectDate(_data, x0, 1),
                    d0 = _data[i - 1],
                    d1 = _data[i],
                    d = x0 - d0.year > d1.year - x0 ? d1 : d0,
                    posY = y(d.count);

                // update the dot
                dot.attr("transform", "translate(" + 0 + "," + posY + ")");

                // update the position of the tooltip
                tooltip
                    .style("left", posX + margin.left + "px")
                    .style("top",  posY + margin.top + "px");
                tooltipContents.html(d.count + " buildings");

                sliderThumb.html(newValue);

                // fire update event, if year has changed:
                if (_value != newValue) {
                    $(document).trigger("slider-" + sliderName, newValue);
                    _value = newValue;
                }

                //updateSelection();
            }

            /**
             * returns the current value of the slider
             */
            function value() {
                return _value;
            }

            function pos() {
                return _pos;
            }

            /**
             * Sets the data related to the slider
             */
            function data(data) {
                _data = data;
                updateSlider(_pos, _data);
            }

            return {
                data: data,
                update: updateSlider,
                value: value,
                pos: pos
            };

        }//buildSlider

        // RangeSlider interface
        return {
            slideTo: slideTo,
            data: data,
            start: function() { return startSlider; },
            end: function() { return endSlider; }
        }

    }// buildRange



})();