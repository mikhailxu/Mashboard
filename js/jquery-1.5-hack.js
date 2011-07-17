jQuery.fn.extend({
	remove: (function(jQuery_fn_remove) {
		return function(selector) {
			jQuery(selector, this).each(function() { if(this.nodeType === 8) jQuery.cleanData([this]); });
			return jQuery_fn_remove.apply(this, arguments);
		};
	})(jQuery.fn.remove),
	/** From: jquery.text.js -- Utilitaires sur l'utilisation de TextNode
	 **  Copyright (c) 2007 France Telecom 
	 **  Julien Wajsberg <julien.wajsberg@orange-ftgroupe.com>
	 **
	 **  Projet Siclome
	 **/
	appendText: function(e) {
		if(typeof e === "string")
			return this.append(document.createTextNode(e));
		return this;
	}
});

