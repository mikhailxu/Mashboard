function Ticker(selector, format) {
  this.selector = selector;
  this.format = format;
}

$.extend(Ticker.prototype, {
  hear: function(data) {
    $(this.selector).append(this.format(data));
  },
  addDataSource: function(source) {
    source.addListener(this.hear, this);
    source.publish();
  }
});
