var githubDS = new DataSource({
  description: "Mashboard GitHub commits",
  url: "https://github.com/api/v2/json/commits/list/mikhailxu/Mashboard/master", 
  process: function(data) {
    for(var i=data.commits.length-1; i>=0; i--){
      this.emit(data.commits[i]);
    }
  }
});

mashboard.dataSources.push(githubDS);

var twitterDS = new DataSource({
  description: "#iosdevcamp Tweets",
  url: "http://search.twitter.com/search.json?q=%23iosdevcamp&rpp=5",
  process: function(data){
    for(var i=data.results.length-1; i>=0; i--){
      this.emit(data.results[i]);
    }
  }
});

mashboard.dataSources.push(twitterDS);

