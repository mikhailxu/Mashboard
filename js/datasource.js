function DataSource(options) {
  this.uid = DataSource.uid++;
  this.dataset_index = 0;
  this.dataset = [];
  this.listeners = [];
  if(options.request) {
    this.request = options.request;
  } else if(options.url) {
    this.url = options.url;
    this.request = DataSource.defaults.request;
  }
  this.description = options.description;
  this.process = options.process;
  this.interval = options.interval || 1000*15;
  this.retain = options.retain || 10;
  this.process_self = Object.create(this);
}
DataSource.uid = 0;

DataSource.defaults = {
  request: function() {
    var self = this;
    $.ajax({
      url: this.url,
      dataType: 'jsonp',
      jsonpCallback: 'DataSource_' + this.uid + '_load',
      success: function(data, status) {
	self.process.call(self.process_self, data);
	self.publish();
      }
    });
  }
};

$.extend(DataSource.prototype, {
  startup: function() {
    var self = this;
    this.shutdown();
    this.interval_id = setInterval(function() {
      self.request();
    }, this.interval); 
    self.request();
  },
  shutdown: function() {
    if(this.interval_id) clearInterval(this.interval_id);
    delete this.interval_id;
  },
  truncate: function(maxlength) {
    if(this.dataset.length > maxlength) {
       var difference = this.dataset.length - maxlength;
       this.dataset = this.dataset.slice(difference);
       this.dataset_index += difference;
    }
  },
  emit: function(element) {
    console.log("emit", element);
    this.dataset.push(element);
  },
  addListener: function(listener, obj) {
    this.listeners.push({
      listener: listener,
      dataset_index: this.dataset_index,
      listener_object: obj || null
    });
  },
  publish: function() {
    for(var index = 0; index < this.dataset.length; index++) {
      var dsid = index + this.dataset_index;
      for(var listener_id = 0; listener_id < this.listeners.length; listener_id++) {
        var listener_record = this.listeners[listener_id];
        if(dsid >= listener_record.dataset_index) {
	  listener_record.listener.call(listener_record.listener_object, this.dataset[index]);
          listener_record.dataset_index++;
        }
      }
    }
    this.truncate(this.retain);
  }
});
