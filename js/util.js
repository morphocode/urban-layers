(function() {
    'use strict';

    urbanlayers.util.getParameterByName = getParameterByName;
    urbanlayers.util.detailMode = detailMode;
    urbanlayers.util.debugMode = debugMode;
    urbanlayers.util.supported = supported;

    var isMacLike = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i) ? true : false;

    /**
     * gets a request parameter from the url
     */
	function getParameterByName(name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);
	    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

    /**
     * Detail Mode increases the maximum zoom level on both the map and the tiles.
     *
     * In a perfect world, we would have used that, but it turns out that with some
     * video cards/drivers it causes a flickering bug.
     */
	function detailMode() {
        // Mac machines seem to deal fine with that
        if (isMacLike) return true;

        // enable details only if specified
		return getParameterByName("details") == "true";
	}

    function debugMode() {
        return getParameterByName("debug") == "true";
    }

    /**
     * Is Mapbox gl supported.
     * Default support detection seems to allow IE 11, however it doesn't seem to work
     * so make sure to disable IE 11 just as well
     */
    function supported() {
        //return false;

        // IE 11 is still not supported: https://github.com/mapbox/mapbox-gl-js/issues/95
        // review this once the issue is fixed
        var isIE11 = !!window.MSInputMethodContext;
        if (isIE11) {
            return false;
        }

        // rely on mapbox detection by default:
        return mapboxgl.util.supported();
    }

})();