$(function() { 
  $('.ticket-entry').defineTemplate('ticket-entry', {
     '.entry-name' : '...name',
     '.entry-type' : '...type',
     '.entry-body' : '...body',
     '.entry-happened' : function() { return "on";},
     '.entry-time' : '...happened'
  });
});

var tick = new Ticker(".ticker", function(commit) {
  var container = $("<span/>");
  var content = $("<span/>").appendTo(container);
  content.template(new Template.ViewModel(commit), {
	$template: '=ticket-entry',
	'...name' : '.author.name',
'...body' : '.message',
'...happened' : '.authored_date',
'...type' : function() { return "committed"; }
  });
  return container.contents();
});
tick.addDataSource(githubDS);
githubDS.startup();

var ticktwitter = new Ticker(".ticker2", function(tweet) { 
  var container = $("<span/>");
  var content = $("<span/>").appendTo(container);
  console.log(tweet);
  debugger;
  content.template(new Template.ViewModel(tweet), {
	$template: '=ticket-entry',
	'...name' : '.from_user',
'...body' : '.text',
'...happened' : '.created_at',
'...type' : function() { return "tweeted"; }
  });
  return container.contents();
});
ticktwitter.addDataSource(twitterDS);
twitterDS.startup();
