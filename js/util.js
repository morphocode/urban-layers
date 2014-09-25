(function() {
    'use strict';

    urbanmap.util.getParameterByName = getParameterByName;
    urbanmap.util.detailMode = detailMode;
    urbanmap.util.supported = supported;

    /**
     * gets a request parameter from the url
     */
	function getParameterByName(name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);
	    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}


	function detailMode() {
		return urbanmap.util.getParameterByName("details") == "true";
	}

    /**
     * Is Mapbox gl supported.
     * Disable also IE11.
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