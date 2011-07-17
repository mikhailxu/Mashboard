function Ticker(selector) {
  this.selector = selector;
}

$.extend(Ticker.prototype, {
  hear: function(data) {
    console.log('hear: ', data);
    $(this.selector).text(data);
  },
  addDataSource: function(source) {
    source.addListener(this.hear, this);
    source.publish();
  }
});


