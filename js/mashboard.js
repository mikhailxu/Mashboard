function Mashboard(parentNode) {
	this.widgets = [];
    if ( arguments.length > 0 ) {
        this.init(parentNode);
    }
}

Mashboard.widgets = [ MBHtml, Ticker ];
Mashboard.dataSources = [];
Mashboard.mashboards = [];

Mashboard.prototype.title = "Untitled";
Mashboard.prototype.description = "Unknown";
Mashboard.prototype.widgets = null;

Mashboard.prototype.init = function(parentNode) {
	if (typeof parentNode === "string")
	{
		parentNode = document.querySelector(parentNode);
	}
	this.parentNode = parentNode;
}

Mashboard.prototype.render = function() {
	console.log(this);
	console.log(this.widgets);
	for (i in this.widgets)
	{
		var widget = this.widgets[i];
		console.log(widget.description);
		var frag = document.createElement("div");
		frag.innerHTML = widget.htmlString;
		this.parentNode.appendChild(frag);
	}
}
