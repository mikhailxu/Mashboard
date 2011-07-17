function Ticker(selector, format) {
  this.selector = selector;
  this.format = format;
  this.description = "A scrolling Ticker widget";
}

$.extend(Ticker.prototype, {
  hear: function(data) {
    $(this.selector).prepend(this.format(data));
  },
  addDataSource: function(source) {
    source.addListener(this.hear, this);
    source.publish();
  }
});
