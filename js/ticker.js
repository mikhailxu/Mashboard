function Ticker(node) {
  this.node = node;
}

$.extend(Ticker.prototype, {
  hear: function(data) {
    this.node.appendText(data);
  },
  addDataSource: function(source) {
    source.addListener(this.hear, this);
    source.publish();
  }
});


