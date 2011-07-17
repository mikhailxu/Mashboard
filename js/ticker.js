function Ticker(selector, format) {
  this.selector = selector;
  this.format = format;
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

Ticker.description = "A scrolling Ticker widget";

