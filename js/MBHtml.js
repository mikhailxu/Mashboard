function MBHtml(title, desc, htmlString) {
    if ( arguments.length > 0 ) {
        this.init(title, desc, htmlString);
    }
}

MBHtml.description = "A general purpose HTML widget";

MBHtml.prototype.title = "Untitled";
MBHtml.prototype.description = "Unknown";
MBHtml.prototype.htmlString = "<p>Nothing</p>";

MBHtml.prototype.init = function(title, desc, htmlString) {
	this.title = title;
	this.description = desc;
	this.htmlString = htmlString;
}



