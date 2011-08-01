$(function() { 
	var myMash = new Mashboard('#demo-mash');
	
	myMash.title = "Demo"
	myMash.description = "A demo of several HTML widgets";
	
	
	var widget1 = new MBHtml("English", "Hello in English", "<p>Hello World!</p>");
	var widget2 = new MBHtml("French", "Hello in French", "<p>Bonjour tout le monde!</p>");
	
	myMash.widgets.push(widget1);
	myMash.widgets.push(widget2);
	
	Mashboard.mashboards.push(myMash);

	myMash.render();
});

