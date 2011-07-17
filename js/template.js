/*
 | Module: Template
 | Author: Adam Freidin
 | Requires: Layer
-- Introduction
 |
 | Template is a live DOM/Data rendering system.  
 | Loosely based on <{http://beebole.com/pure/|PURE}, but with the
 | dynamic rendering capabilities of <{http://knockoutjs.com|knockoutjs},
 | and some of the compositing functions of rails layouts.
 |
 | The idea behind template is to specify a 
 | functional JSON/Object which controls rendering
 | and a data JSON which it processes.  Which data is actually accessed is 
 | logged and when data changes the part of the template 
 | which accessed it is rerendered.
 |
 | Rendering happens in a tree, but this tree is 
 | entirely determined by the call chain which happens when
 | processing the control JSON and the data.  
 | So, whenever a node is rerendered, 
 | it and it's children and recursively cleaned and then it rebuilds.
 |
 | Template extends <{http://jquery.com/|jQuery}.fn with a few new functions:
 |   template => render the selector with the template engine and data,
 |   clearTemplate => unregisters the selector with the template, and
 |   defineTemplate => registers a named template for reuse.
 |
 >! window["ShowIt"] = function ShowIt(setup) {
 >!   var context = Litijs.context;
 >!   setup.call(context, context.haml);
 >!   ShowIt.last = context.haml.insertAfter(context.example);
 >! };
 >! jQuery.fn.updatey = function(freq) {
 >!   return this.each(function() {
 >!     var interval;
 >!     $(this).focus(function() {
 >!       if(interval) clearInterval(interval); 
 >!       interval = setInterval(function() { 
 >!         $(this).change(); 
 >!       }.bind(this), freq || 50);
 >!     }).blur(function() { clearInterval(interval); interval = 0; });
 >!   });
 >! };
 >! Story.Plot.Define('WithStyle_', function(selector, style) {
 >!   this.selector = selector;
 >!   this.style = style;
 >! }, {
 >!   setup: function() {
 >!     this.selector = typeof this.selector === 'function' 
 >!       ? this.selector() 
 >!       : jQuery(this.selector);
 >!     this.restore = _.map(this.selector, function(elem) { 
 >!       return elem.getAttribute('style');
 >!     });
 >!     _.each.call(this, this.selector, function(elem) {
 >!       jQuery(elem).css(this.style);
 >!     });
 >!   },
 >!   teardown: function() {
 >!     _.each.call(this, this.selector, function(elem, index) {
 >!       elem.setAttribute('style', this.restore[index]);
 >!     });
 >!   }
 >! });
 >! Litijs.annotate = function(nodeid, type, thing) {
 >!   switch(type) {
 >!   case 'e': 
 >!      var animation = new Story([Story.Delay(0), [Story.Delay(10), Story.WithStyle_(nodeid, {
 >!       'border-radius': '10px',
 >!       'background-color': '#A88',
 >!       'padding' : '4px',
 >!       'margin' : '-4px',
 >!       'opacity' : '1',
 >!       'webkit-transition-duration' : '0'
 >!     })],[Story.Delay(1000), Story.WithStyle_(nodeid, {
 >!       'webkit-transition-duration' : '1s',
 >!       'border-radius': '10px',
 >!       'padding' : '10px',
 >!       'margin' : '-10px',
 >!       'background-color': 'none',
 >!       'webkit-transition-property' : 'all'
 >!     })]]);
 >!     var running;
 >!     return function() {
 >!       if(running) running.stop();
 >!       running = animation.tell();
 >!       return thing.call(this);
 >!     };
 >!   default:
 >!     return function() { return Story.Compound(thing.call(this), Story.WithStyle_(nodeid, {
 >!       'border-left': '3px solid #373',
 >!       'border-right': '3px solid #373',
 >!       'border-radius': '10px',
 >!       'background-color': '#8A8',
 >!       'padding' : '4px',
 >!       'margin' : '-7px',
 >!       'opacity' : '1'
 >!     })); };
 >!   }
 >! };
-- Examples
 |
-| Replacement
 |
 | Like any decent templating engine, we should be able to do
 | replacements.
 + %span
 +   %input{"placeholder":"change me"}
 +   result:
 +   %span.templated
 | can be controlled using this template
 >!ShowIt(function(sample) {
 >var model = new Template.ViewModel({result: 'change me'});
 >
 >// template the root element with '.result'
 >$('.templated', sample).template(model, {
 >  '.' : '.result'
 >});
 >
 >// write the model data on change of the input.
 >$('input', sample).change(function() {
 >  model.data('result', $(this).val()); 
 >});
 >! $('input', sample).updatey(1000);
 >!});
 >!ShowIt.last.appendTo(this.node);
 |
 | We can do iterations using $each and $for
 + %button.template template
 + %button.clear clear
 + .options{"style":"float:right"}
 +   %input{"placeholder":"change me"}
 +   %select
 +     %option{"value":"#000000"} black
 +     %option{"value":"#FF4D41"} red
 +     %option{"value":"#91B221"} lime green 
 +     %option{"value":"#1E8C65"} pine green
 + .example
 +   %ol.each $each : { item : '.items' }
 +     %li '@text' : 'item.text'
 +   %ol.for $for : '.items'
 +     %li '@text' : '.text'
 | ... can be rendered by binding template and clearTemplate to
 | the buttons.
 |
-| Simple Iteration
 |
 >! ShowIt(function(sample) {
 >    $('.template', sample).click(function() {
 >      var model = new Template.ViewModel({items: [
 >        {text: 'a', color: '#FF4D41'}, 
 >        {text: 'b', color: '#91B221'}, 
 >        {text: 'c', color: '#1E8C65'}, 
 >        {text: 'change me', color: 'change me'}
 >      ]});
 >      $('.example', sample).template(model, {
 >        '.each>li' : { $each : { item: '.items' },
 >          '@style' : { color: 'item.color' },
 >          '@text' : 'item.text'
 >        },
 >        '.for>li' : { $for : '.items',
 >          '@text' : '.text',
 >          '@style' : { color: '.color' }
 >        }
 >      });
 >      $('select', sample).change(function() {
 >        model.data('items.3.color', $(this).val()); 
 >      });
 >!     $('select', sample).updatey().change();
 >      $('input', sample).change(function() { 
 >        model.data('items.3.text', $(this).val()); 
 >      });
 >!     $('input', sample).updatey().change();
 >    });
 >    $('.clear', sample).click(function() {
 >      $('.example', sample).clearTemplate();
 >    });
 >! });
 | The difference being that $each introduces a scope
 | variable, while $for adjusts the root data context,
 | but the results are exactly the same.
 >! ShowIt.last.appendTo(this.node);
 |
-| Data, Template.access, and $let
 |
 | The template system tracks data access as it
 | renders.  For this, data must be accessed through
 | >{Template.access}.  In most cases, the rendering rules
 | will just specify the string which will be run through
 | Template.access.  Template.access can be used to get both 
 | source data, and data computed in a $let or $each binding.
 |
 + %center.example
 +   show a month with _
 +   %select.days
 +     %option
 +   _ days, which starts on _
 +   %select.first-day
 +     %option
 +   %table
 +     %tr
 +       %th Sun
 +       %th Mon
 +       %th Tue
 +       %th Wed
 +       %th Thu
 +       %th Fri
 +       %th Sat
 +     %tr.row
 +       %td.day
 | and now we want to render a grid for the month.
 | we can do this in a $let binding, computing the data
 | from the source, and it still automatically updates.
 | Template doesn't care who accesses data, it just mattered that
 | it was accessed while rendering that node.
 >! ShowIt(function(sample) {
 >var model = new Template.ViewModel({
 >  number_of_days_options: [ 30, 31, 28, 29 ],
 >  first_day_options: [ 
 >    { name: 'Sunday',    value: 0 },
 >    { name: 'Monday',    value: 1 },
 >    { name: 'Tuesday',   value: 2 },
 >    { name: 'Wednesday', value: 3 },
 >    { name: 'Thursday',  value: 4 },
 >    { name: 'Friday',    value: 5 },
 >    { name: 'Saturday',  value: 6 },
 >  ],
 >  first_day: 0,
 >  number_of_days: 30
 >});
 >
 >sample.template(model, {
 >  '.first-day option': { $each: { day: '.first_day_options' },
 >    '@value': 'day.value',
 >    '@text': 'day.name'
 >  },
 >  '.days option': { $each: { day: '.number_of_days_options' },
 >    '@text': 'day'
 >  },
 >  'table' : {
 >    $let : { rows : function() {
 >      var row = [], rows = [], cell = 0, 
 >          day = 1, 
 >          first_day = Template.access('.first_day')
 >          days = Template.access('.number_of_days');
 >      rows.push(row);
 >      while(row.length < first_day) row.push(''); 
 >      while(day <= days) {
 >        if(row.length == 7) { row = []; rows.push(row); }
 >        row.push(day++);
 >      }
 >      return @e(rows@);
 >    } },
 >    '.row' : { $each : { row: 'rows' },
 >      '.day' : { $each : { day: 'row' }, '.' : 'day' }
 >    }
 >  },
 >  '.first-day@onchange': function() { 
 >    @e(Template.update('.first_day', $(this).val())@); 
 >  },
 >  '.days@onchange': function() {
 >    @e(Template.update('.number_of_days', $(this).val())@);
 >  }
 >});
 >! })
 */

/*
 |
 | The next feature we have in template is the ability to compose
 | and reuse layout using >{defineTemplate}.
 |
 | A simple example of a template
 + %style
 +   |.simple-frame {
 +   |  border-radius: 10px;
 +   |  border-bottom: 3px solid #99AAFF;
 +   |  margin-bottom: 6px;
 +   |  padding: -3px 100px;
 +   |  display: inline;
 +   |}
 + .simple-template
 +   .simple-frame
 +     I like _
 +     %span.word
 +     _ a lot!
 | We can store this template for reuse with
 >! ShowIt(function(sample) {
 >$('.simple-template', sample).defineTemplate('i-like-template', {
 >  '.word' : '...word'
 >});
 >! })
 | And we can use it like this
 |
 + .example
 +   Some things I like:
 +   %ul
 +     %li.like
 +       .thing
 +
 >! ShowIt(function(sample) {
 >$('.example', sample).template({ 
 >  things: ['turtles', 'birds', 'computers']
 >}, {
 >  '.like' : { $each: { thing: '.things' },
 >    '.thing' : {
 >      $template: '=i-like-template',
 >      '...word' : 'thing'
 >    }
 >  }
 >});
 >! })
 | 
 | The previous example shows how whole dom structures can
 | be reused.  Sometimes a single node isn't enough for CSS to work with,
 | right?  However this reuse only extends as far as what the
 | template itself can render from data.  Is this a problem? You betcha.
 |
 | There are not one, but two ways to address this.
 |   1. => have a template itself render a template. (exercise for you)
 |   2. => use $as, think content_for in rails, just keep reading... 
 |
 | Normally, the node which is rendered with the $template rule
 | is replaced by the template, if you specify rendering rules
 | alongside the template, but label with with $as, 
 | you can save them for use by the template. An example will describe this
 | much better:
 | 
 + %style
 +   |.frame-r { padding: 5px; background: red; color: white; }
 +   |.frame-g { padding: 5px; background: green; color: white; }
 +   |.frame-b { padding: 5px; background: blue; color: white; }
 + .rainbow-frame-template
 +   .frame-r
 +     .content
 +     .frame-g
 +       .content
 +       .frame-b
 +         .content
 + %p
 +   %button.do-template Template
 +   %button.clear-template Clear
 + .example
 +   .rainbow
 +     .outer
 +       Some content for the_
 +       %b{"style":"color:pink"} red
 +       _frame
 +     .middle
 +       Some content for the_
 +       %b{"style":"color:lightgreen"} green
 +       _frame
 +     .inner
 +       Some content for the_
 +       %b{"style":"color:lightblue"} blue
 +       _frame
 +     .
 >! ShowIt(function(sample) {
 >$('.rainbow-frame-template', sample).defineTemplate('rainbow-frame', {
 >  '.frame-r>.content' : '%outer-content',
 >  '.frame-g>.content' : '%middle-content',
 >  '.frame-b>.content' : '%inner-content'
 >});
 >$('.do-template', sample).click(function() { 
 >  $('.example', sample).template({}, {
 >    '.rainbow' : { $template : '=rainbow-frame',
 >      '.inner' : { $as: 'inner-content' },
 >      '.middle' : { $as: 'middle-content' },
 >      '.outer' : { $as: 'outer-content' }
 >    }
 >  });
 >});
 >$('.clear-template', sample).click(function() { 
 >  $('.example', sample).clearTemplate();
 >});
 >! });
 |
-! Template
 | Actually showing the code now.
 */

/// Template creates a node in the tree of renders.
var Template = _.Class(function(self, action) {
  var args = __args();

  this.destructors = [];
  this.placeholders = [];
  this.children = [];
  this.inserted = [];
  this.model = Template.render_context.model;
  var template_context = _.overlay({}, Template.context());
  template_context.render_context = this;

  /// prototype the context and it's map so changes stay local.
  if(action) this.action = function() {
    this.context = Object.create(template_context);
    this.context.map = Object.create(template_context.map);
    return action.apply(self, args);
  };

  return this.render();
}, {
  proto: {
    /// @{Template.render} renders.
    render: function() {
      /// Register with the parent so 
      /// a parent's clear triggers this clear too.
      this.parent = Template.render_context;
      if(this.parent) this.parent.children.push(this);

      return _.local.call(Template, {render_context: this}, function() {
        try {
          /// Give this action an access scope so that 
          /// it knows what it read.
          Template.render_context.model.save_access_scope();
          return this.action();
        } catch(ex) {
          debugger;
          console.warn('error rendering: %o', ex.stack || ex);
        } finally {
          /// Get back the list of things that this render accessed...
          var scope = 
            Template.render_context.model.restore_access_scope();
          /// ...and register it as a listener on those things.
          try {
            this.vm_listener_id = 
              Template.render_context.model.register(this, scope);
          } catch(ex) {
            alert(ex.message);
          }
        }
      }).call(this);
    },
    /// @{Template.update} renders.
    update: function() {
      this.clear();
      return this.render();
    },
    /// @{Template.clear} cleans up what it did to the DOM and
    /// unregisters itself with the ViewModel.
    clear: function() {
      _.each(this.children, function(child) {
        child.clear();
      });
      /// run all destructors registered with >{Template.teardown}.
      _.each.call(this, this.destructors, function(destructor) {
        destructor.call(this, this.self);
      });
      /// grab the orginal nodes out of the placeholders
      /// and replace the placehoders with them.
      /// (this is why we need to hack jquery, because these placeholders
      /// are comment nodes).
      _.each(this.placeholders, function(placeholder) {
        var placeholder_node = placeholder.data('node');
        placeholder.data('node', 0);
        if(placeholder_node) {
          placeholder_node.insertBefore(placeholder);
          placeholder.remove();
        } else { debugger; }
      });
      /// remove all nodes we remember inserting with
      /// >{Template.insert}.
      _.each(this.inserted, function(node) {
        node.remove();
      });
      this.inserted = [];
      this.destructors = [];
      this.placeholders = [];
      this.children = [];
      /// remove this template node from the model listeners.
      this.model.clear(this.vm_listener_id);
    }
  },
  classic: {
    /// map of templates defined with >{jQuery.defineTemplate}
    definedTemplates: {},
    RootRenderContext: function(model, map) {
      var self = Object.create(Template.prototype);
      self.children = [];
      self.model = model;
      self.destructors = [];
      self.placeholders = [];
      self.inserted = [];
      self.context = {
        data: model.data,
        map: map,
        scope: { '#context': model.data } 
      };
      return self;
    },
    /// @{Template.opt} acts like Template, except
    /// it's not necessary to build a full context, just
    /// run the function.
    ///
    /// The author has never seen a case where it helps to
    /// take the shortcut, but it's nice to know where the contexts
    /// can be built v.s. must be built.
    opt: function(self, action) {
      //  space v.s. size tradeoffs....
      if(false) {
        action.apply(self, __args());
      } else {
        Template.apply(null, arguments);
      }
    },
    /// @{Template.inserted} remembers we inserted a node
    /// so we can clean remove it when we >{Template.clear|clear}.
    inserted: function(node) {
      var rc = Template.render_context;
      rc.inserted.push(node);
      return node;
    },
    /// @{Template.teardown} registers a generic function 
    /// for when we >{Template.clear|clear}.
    teardown: function(teardown) {
      var args = __args();
      Template.render_context.destructors.push(function() {
        return teardown.apply(this, args.concat(__args()));
      });
    },
    /// a good example of adjusting the style of an element in a template,
    /// with restoration happening through teardown.
    css: function(elem, style) {
      $(elem).each(function() {
        Template.teardown(function(self, css) {
          $(self).css(css);
        }, this, _.map.call($(this), style, function(v, key) {
          return this.css(key);
        }));

        $(this).css(style);
      });
    },
    /// @{Template.remove} removes a node from the
    /// dom and replaces it with a comment node placeholder.
    remove: function(node, name) {
      var placeholder = Template.inserted($(document.createComment((name||'template') + ' placeholder')).insertAfter(node));
      Template.render_context.placeholders.push(placeholder);
      placeholder.data('node', node);
      $(node).detach();
      return placeholder;
    },
    /// @{Template.render_or_action_context} returns 
    /// the template context for data access.
    /// Since an action can cause a render, the render
    /// context takes precedence.
    render_or_action_context: function() {
      return Template.render_context || Template.action_context;
    },
    context: function() { 
      return Template.render_or_action_context().context; 
    },
    callback: function(fn) {
      var context = Template.render_or_action_context();
      var args = __args();
      return _.local.call(Template, { action_context: {
        self: context.self,
        model: context.model,
        context: {
          scope: context.context.scope,
          map: context.context.map,
          data: context.context.data
        }
      } }, function() { return fn.apply(this, args.concat(__args())); });
    },
    /// @{Template.scope|}
    scope: function(scope) {
      var context = Template.context();
      if(arguments.length == 0) return context.scope;
      else {
        if(Object.hasOwnProperty.call(context, 'scope')) {
          _.overlay(context.scope, scope);
        } else {
          context.scope = _.override(context.scope, scope);
        }
      }
    },
    /// @{Template.access} reads data from
    /// the current context. Read more >{Template.access:doc|here}.
    access: function(path) {
      var navigation = Template.navigate(path);
      if(typeof navigation != 'function') {
        if(navigation === undefined) {
          console.warn('could not follow path:', path);
          debugger;
        }
        return navigation;
      }
      return navigation();
    },
    /// @{Template.navigate} locates data like >{Template.access}
    /// but delays on the final read.
    navigate: function(path) {
      var navi = Template.navigate_(path, Template.context());
      if(!navi || typeof navi[0] !== 'function') {
        debugger;
      }
      return navi[0](navi[1]);
    },
    /// @{Template.update} causes an update to
    /// data indictated by path (same format as >{Template.access}).
    /// If a value is specified, then the path is assigned that value
    /// otherwise the value already there is re-written.
    update: function(path, value) {
      var navi = Template.navigate_(path, Template.context());
      if(arguments.length > 1) {
        return navi[0](navi[1], value);
      } else {
        return navi[0](navi[1], navi[0](navi[1])());
      }
    },
    navigate_: function(path, context) {
      while(typeof path === 'string' && path.slice(0,3) == '...') {
        context = context.parent;
        path = context.map[path];
      }

      if(!path) return undefined;

      if(typeof path === 'function') {
        return [ function() { 
          return Template.ViewModel.constant(
            path.call(context.render_context.self)
          ); 
        }, null ];
      }

      if(path === '.') {
        path = '#context';
      }

      // "a.x[b[c]][d[e].f.g].h]" -->
      // ['a', [ 'b', ['c'], [ 'd', [ 'e' ], '.f.g' ], '.h' ] ]
      // 
      // split '[' -->
      // 'a.x', 'b', 'c]', 'd', 'e].f.g].h]'
      // each... split ']' with stack up/down navigation -->
      // ['a', 'x', [ 'b', ['c'], [ 'd', [ 'e' ], 'f', 'g' ], 'h' ] ]
      var tree = [];
      _.each.call([], path.split('['), function(left_part) {
        var chain = left_part.split(']'),
            part0 = chain[0].slice(0,1) == '.' 
              ? '#context' + chain[0] 
              : chain[0],
            subtree = part0.slice(0,1) == '=' ? [part0] : part0.split('.');
        tree.push(subtree); this.push(tree); tree = subtree;
        _.each.call(this, chain.slice(1), function(right_part) {
          tree = this.pop();
          if(right_part.length) { 
            if(right_part.slice(0,1) != '.') debugger;
            tree.push.apply(tree, right_part.slice(1).split('.'));
          }
        });
      });

      return [
        _eval(tree.slice(0,-1)),
        _eval_part(tree.slice(-1)[0])
      ];

      function primitive(path) {
        if(path.slice(0,1) == '.') {
          return context.data(path.slice(1));
        } else if(path.slice(0,1) == '=') {
          return Template.ViewModel.constant(Template.expand(path.slice(1)));
        } else {
          //return context.scope[path];
          var first_part = path.split('.', 1)[0];
          var rest = path.slice(first_part.length + 1);
          var navigation = context.scope[first_part];
          if(navigation && rest.length) navigation = navigation(rest);
          return navigation;
        }
      };

      function _eval_part(part) {
        if(part instanceof Array) {
          return _eval(part)();
        } else {
          return part;
        }
      }

      function _eval(tree) {
        if(tree.length == 0) return primitive;
        var base = primitive(tree[0]);
        _.each(tree.slice(1), function(part) {
          var evaluated = _eval_part(part);
          base = base(evaluated);
        });
        return base;
      }
    },
    coalesce: function() {
      return (function(args) { 
        return function() { 
          for(var k in args) {
            var result = Template.access(args[k]);
            if(result != undefined) return result;
          }
        } 
      })(__args());
    },
    render: function() {
      Template.render_context.self = this;

      if(Template.context().map.$each) {
        var $each = Template.context().map.$each;
        var key = _.keys($each)[0];
        var value = $each[key];

        Template.context().map.$each = undefined;
        
        Template(this, function() {
          var list = Template.navigate(value);
          if(typeof list != 'function' || typeof list('length') != 'function') {
            console.warn('Invalid list found in model for', value);
            debugger; // and do it again so we can step through it!
            list = Template.navigate(value);
            debugger;
          }
          if(list) _.range.call(this, 0, list('length')(), function(index) {
            var $this = $(this);
            var clone = $(Template.inserted($this.clone().insertBefore($this)));
            Template(this, function() {
              Template.scope(_.build(key, [list(index)], key + '-index', [Template.ViewModel.constant(index)]));
              Template.render.call(clone);
            });
          });
          Template.remove(this, 'list');
        });

        return;
      }

      if(Template.context().map.$for) {
        var $for = Template.context().map.$for;
        Template.context().map.$for = undefined;
        
        Template.opt(this, function() {
          var list = Template.navigate($for);
          if(list) _.range.call(this, 0, list('length')(), function(index) {
            Template(this, function() {
              var $this = $(this);
              Template.context().data = list(index);
              Template.scope({'#context': Template.context().data});
              Template.render.call(
                Template.inserted($this.clone().insertBefore($this))
              );
            });
          });
          Template.remove(this, 'list');
        });
        return;
      }

      if(Template.context().map.$let) {
        var $let = Template.context().map.$let;
        Template.context().map.$let = undefined;
        (function evaluate_let_bindings($let) {
          if($let instanceof Array) {
            _.each.call(this, $let, evaluate_let_bindings);
          } else {
            _.each.call(this, $let, function(value, key) {
              if(typeof value === 'function') {
                return Template.scope(_.build(key, [
                  Template.ViewModel.constant(Template.access(value))
                ]));
              } else {
                return Template.scope(_.build(key, [
                  Template.navigate(value)
                ]));
              }
            });
          }
        }).call(this, $let);
      }

      if(Template.context().map.$template) {
        var $template_src = Template.context().map.$template;
        var $template = Template.access(Template.context().map.$template);
        Template.context().map.$template = undefined;
        var content_map = {};
        _.each(Template.context().map, function(value, key) {
          if(value && value.$as) {
            var $as = value.$as;
            content_map[$as] = _.overlay(content_map[$as] || {}, _.build(
              key,
              [_.map(_.override(value, { $as: undefined }), function(x) {
                if(x === undefined) throw 'reject'; return x;
              })]
            ));
          }
        });
        Template.context().map.$contents = _.deepfreeze(content_map);
        Template.context().map.$partial = this;
        Template.context().map.$as_context = Template.context();
        var template_fn = Template.definedTemplates[$template];
        if(!template_fn) { 
          console.error('undefined template %o (%o in %o)', 
            $template,
            $template_src, { 
              data: Template.context().data(), 
              scope: _.map.call(this, Template.context().scope, _.result(function(v) { 
                return v.call(this); 
              }))
            }
          )
          debugger;
        }
        Template.opt(this, function() {
          template_fn.call(this);
        });
        return;
      }

      if(Template.context().map.$in) {
        if(typeof Template.context().map.$in === 'function') {
          Template.context().data = Template.context().map.$in.call(this);
          Template.scope({'#context': Template.context().data});
          if(typeof Template.context().data != 'function') debugger;
        } else {
          Template.context().data = Template.navigate(Template.context().map.$in);
          Template.scope({'#context': Template.context().data});
        }
        Template.context().map.$in = undefined;
      }


      if(Template.context().map.$setup) {
        var $setup = Template.context().map.$setup;
        Template.context().map.$setup = undefined;

        Template(this, function() {
          if(typeof $setup === 'string') {
            $setup = Template.access($setup);
          }
          Template.render.call(this);
          if(typeof $setup === 'function') {
            $setup.call(this);
          }
        });
        return;
      }

      _.each.call(this, Template.context().map, function(value, key) { Template(this, function() {
        if(key.slice(0,1) == '$') return;
        var map_index = 0;
        if(Number(value) == value) value = Number(value);
        var context = Template.context();
        while(typeof value == 'string') {
          if(value.slice(0,1) == '%') {
            var content_selector = $();
            for( ; context; context = context.parent) {
              var map = context.map;
              if(!map.$partial || !map.$contents) continue;
              var contents_for = map.$contents[value.slice(1)],
                  $partial = map.$partial;

              _.each.call($partial, contents_for || {}, function(value, key) {
                var content = key == '.' ? $(this) : $(this).find(key);
                content_selector = content_selector.add(
                  content.clone().data('template', {
                    map: value, 
                    data: map.$as_context.data
                  })
                );
                Template.remove(content, 'content_for ' + key);
              });
            }
            var target = $(this).find(key);
            if(content_selector.length > 0 && target.length > 0) {
              Template.inserted(content_selector.appendTo(target).each(function() {
                Template(this, function() {
                  var template = $(this).data('template');
                  Template.context().map = Object.create(template.map);
                  Template.context().data = template.data;
                  Template.scope({'#context': Template.context().data});
                  Template.render.call($(this));
                });
              }));
            }
            return;
          } else break;
        }
        if(!value && typeof value !== 'number') return;

        Template.opt(this, function() {
          var at_index = key.indexOf('@');
          if(at_index != -1) {
            var split = [key.slice(0,at_index), key.slice(at_index+1)];
            var selector = split[0] == '' ? this : $(split[0], this);
            var attr = split[1];
            if(attr.slice(0,2) == 'on') {
              var event_type = attr.slice(2),
                  action;
              if(typeof value === 'function') {
                var param = {
                  data: Template.context().data,
                  map: Template.context().map,
                  scope: Template.scope()
                };
                action = Template.callback(value);
              } else if(typeof value === 'string') {
                action = Template.callback(Template.access(value));
              }
              selector.bind(event_type, action);
              Template.teardown(function() { 
                selector.unbind(event_type, action);
              });
            } else switch(attr.toLowerCase()) {
            case 'text':
              selector.text(Template.access(value));
              break;
            case 'html':
              selector.html(Template.access(value));
              break;
            case 'style':
              var style = value;
              if(typeof value === 'string') {
                style = Template.access(value);
              }

              if(!_.is_primitive(style)) {
                var result = [];
                function enumerate(style) {
                  if(style instanceof Array) {
                    _.each(style, enumerate);
                  } else {
                    _.each(style, function(value, key) {
                      value = Template.access(value);
                      if(value === undefined || value === null) return;
                      var values = String(value).replace(/^\s+/, '').replace(/\s*$/, '').split(/\s+/);
                      value = _.map(values, function(part) {
                        if(String(Number(part)) === part) {
                          return String(Number(part)) + (_.until([
                            [/^left$|^right$|^top$|^bottom$/, 'px'],
                            [/^margin|^padding|^border/, 'px'],
                            [/^width$|^height$/, 'px'],
                            [/^min-|^max-/, 'px'],
                            [/^line-height$|^font-size$|^text-indent$/, 'pt'],
                          ], function(ending) {
                            if(ending[0].test(key)) {
                              return ending[1];
                            }
                          }) || '');
                        }
                        return part;
                      }).join(' ');
                      // there's plenty of special handling we could do here to get maximum cross-compatibility 
                      // between browsers, for now, just stick -moz- (firefox), -webkit- (chrome/safari), and -o- (opera) prefixes on
                      // the styles so non-up-to-date browsers will see the new (now standardized) style attributes.
                      if(/^box-shadow|^border-.*radius|^transform|^transition/.test(key)) {
                        result.push('-moz-' + key + ': ' + value);
                        result.push('-webkit-' + key + ': ' + value);
                        result.push('-o-' + key + ': ' + value);
                      }
                      result.push(key + ': ' + value);
                    });
                  }
                };
                enumerate(style);
                style = result.join(';\n');
              }
              var base = (selector.attr('style') || '');
              selector.attr(attr, base ? base + ';' + style : style);
              Template.teardown(function() { selector.attr(attr, base); });
              break;
            default:
              selector.attr(key.slice(1), Template.access(value));
            }
            return;
          }
          if(typeof value === 'function') {
            Template.opt(this, function() {
              var selector = (key == '.' ? $(this) : $(this).find(key));
              var result = value.call(selector);
              if(result) selector.text(result);
            });
          } else if(typeof value === 'string') {
            Template.opt(this, function() {
              (key == '.' ? $(this) : $(this).find(key)).text(Template.access(value));
            });
          } else {
            (key == '.' ? $(this) : $(this).find(key)).each(function() {
              Template(this, function() {
                Template.context().map = Object.create(value);
                Template.render.call($(this));
              });
            });
          }
        });
      });});
    },
    expand: function(x) {
      /* balancing brace for silly vim: { */ 
      var result = x.replace(/%{([^}]*)}/g, function(match, key) {
        return Template.access(key);
      });
      return result;
    },
    ViewModel: _.Class(function(data) {
      this.root = data;
      this.accessed_stack = [];
      this.written = {};
      this.data = new Template.ViewModel.wrapper(this, this.root, 'data');

      this.listener_id_counter = 1;
      this.free_listener_id = 0;
      this.listeners = {};
      this.reasons = {};
      this.lock_count = 0;
    }, { 
      proto: {
        accessed: function() {
          return this.accessed_stack.slice(-1)[0] || {};
        },
        read: function(path) {
          //console.log('read: ', path);
          this.accessed()[path] = true;
        },
        write: function(path) {
          //console.log('write: ', path);
          var parts = path.split('.');
          var root, branch = this.written;
          _.each(parts, function(part) {
            if(branch === true) {
              return;
            } 
            root = branch;
            branch = branch[part];
            if(!branch) {
              branch = root[part] = {};
            } 
          });
          if(branch !== true) root[parts.slice(-1)[0]] = true;
          this.update();
        },
        trace_access: function(self, fn) {
          var result;
          try {
            this.save_access_scope();
            fn.apply(self, __args());
          } finally {
            result = this.restore_access_scope();
          }
          return result;
        },
        save_access_scope: function() {
          this.accessed_stack.push({});
        },
        restore_access_scope: function() {
          var stack = this.accessed_stack.pop();
          var scope = _.keys(stack);
          return scope;
        },
        locked: function(action) {
          try {
            this.lock(); 
            return action.apply(this, __args()); 
          } finally { 
            this.unlock();
          }
        },
        lock: function() {
          this.lock_count++;
        },
        update: function() {
          if(this.lock_count === 0) {
            this.flush();
          }
        },
        unlock: function() {
          if(this.lock_count == 0) {
            console.warn('Template.ViewModel: too many unlocks!');
          } else this.lock_count--;

          this.update();
        },
        generate_listener_id: function() {
          if(this.free_listener_id) {
            var id = this.free_listener_id;
            var free_listener = this.listeners[this.free_listener_id];
            console.assert(free_listener[1] == 0, "free listener not at end of list");
            this.free_listener_id = free_listener[0];
            if(free_listener[0]) this.listeners[free_listener[0]][1] = 0;
            return id;
          } else {
            return this.listener_id_counter++;
          }
        },
        register: function(listener, reasons) {
          var id = this.generate_listener_id();
          this.listeners[id] = { listener: listener, reasons: reasons };
          _.each.call(this, reasons, function(reason) {
            var thereason = this.reasons[reason];
            if(!thereason) {
              thereason = this.reasons[reason] = { count: 0 };
            };
            thereason[id] = true;
            thereason.count += 1;
          });

          return id;
        },
        clear: function(listener_id) {
          if(listener_id) {
            var listener = this.listeners[listener_id];
            _.each.call(this, listener.reasons, function(reason) {
              delete this.reasons[reason][listener_id];
              if(0 == --this.reasons[reason].count) {
                delete this.reasons[reason];
              }
            });
            this.listeners[listener_id] = [this.free_listener_id,0];
            if(this.free_listener_id) {
              this.listeners[this.free_listener_id][1] = listener_id;
            }
            this.free_listener_id = listener_id;
          }

          for(;;) {
            if(this.listener_id_counter <= 1) break;
            var index = this.listener_id_counter - 1;
            var listener = this.listeners[index];
            if(!(listener instanceof Array)) break;

            var prev = this.listeners[listener[0]];
            var next = this.listeners[listener[1]];
            if(prev) prev[1] = listener[1];
            if(next) next[0] = listener[0];

            if(this.free_listener_id == index) {
              this.free_listener_id = (next && next[0]) || 0;
            }
            delete this.listeners[--this.listener_id_counter];
          }
        },
        updated_paths: function() {
          var paths = [];
          function traverse(root, path) {

            for(var key in root) {
              var value = root[key], property = path + '.' + key;
              if(value === true) { 
                paths.push(property);
              }
              else traverse(value, property);
            }
          }
          if(this.written.data) traverse(this.written.data, 'data');

          return paths;
        },
        flush: function() {
          var updated_listeners = {};
          _.each.call(this, this.updated_paths(), function(reason) {
            for(var listener_id in (this.reasons[reason] || {})) {
              if(listener_id == 'count') continue;
              if(!Object.hasOwnProperty.call(updated_listeners, listener_id)) {
                updated_listeners[listener_id] = [];
              }
              updated_listeners[listener_id].push(reason);
            }
          });
          _.each.call(this, updated_listeners, function(reasons, id) {
            if(!this.listeners[id]) return;
            var listener = this.listeners[id].listener;
            try {
              //console.log('updating listener ' + id + ' with reasons: ' + reasons);
              if(typeof listener === 'function') {
                listener(reasons);
              } else {
                if(!listener) { 
                  // not sure if this is a problem... 
                  // one listener's update killed another...? 
                  // OK. Maybe more rude than evil.
                  //debugger; 
                } else listener.update(reasons);
              }
            } catch(ex) {
              alert(ex);
              alert(ex.message);
              console.warn(
                'Template.ViewModel: Failed to update listener with reasons: ', reasons, ex.stack
              );
              debugger;
            }
          });
          this.written = {};
        }
      },
      classic: {
        constant: function(value) {
          return new Template.ViewModel.wrapper({
            read: _.noop,
            write: _.noop
          }, value, '!');
        },
        wrapper: _.Class(function(model, value, path) {
          this.model = model;
          this.value = value;
          this.path = path;
          var wrapper = Template.ViewModel.wrapper.fn.bind(this);
          wrapper._ = _.override(Template.ViewModel.wrapper.fn._, { self: wrapper });
          return wrapper;
        }, {
          proto: {
            get: function(access) {
              var path = this.path;
              var keys = String(access).split('.');
              var root = this.value;
              while(root && keys.length) {
                var key = keys.shift();
                root = root[key];
                this.model.read(path += '.' + key);
              }
              return Template.ViewModel.wrapper(this.model, root, path);
            },
            set: function(access, value) {
              var keys = String(access).split('.');
              var root = this.value;
              var path = this.path;
              while(keys.length > 1) {
                var key = keys.shift();
                var next = root[key];
                this.model.read(path += '.' + key);
                if(next) root = next;
                else throw new Error('cannot set');
              }
              root[keys[0]] = value;
              this.model.write(path += '.' + keys[0]);
              return Template.ViewModel.wrapper(this.model, value, path);
            }
          },
          classic: new function() { var result = {
            fn: function(key, value) {
              switch(arguments.length) {
              case 0: 
                return this.value;
              case 1: 
                return this.get(key);
              case 2: 
                return this.set(key, value);
              }
            }
          };
          result.fn._ = {
            get: function(key) {
              return this.self(key)();
            },
            set: function(key, value) {
              return this.self(key, value)();
            }
          }; return result; }()
        })
      }
    })
  }
});

var require;

Template.bind_to_jQuery = function() {
  if(require) try { require('./jquery-1.5-hack'); } catch(ex) {}

  jQuery.fn.defineTemplate = function(name, map) {
    var src = this.detach();
    if(this.length != 1) {
      console.warn('Bad defineTemplate("' + name + '"), selector.length != 1');
      debugger;
    }
    //src.attr('id', null); // clear id attribute, probably the selector.
    Template.definedTemplates[name] = function() {
      var parent = Object.create(Template.context());
      Template(this, function() {
        Template.context().parent = parent;
        Template.context().map = Object.create(map);
        var clone = Template.inserted(src.clone().insertAfter(this));

        Template.render.call(clone);

        if(parent.map.$setup) {
          parent.map.$setup.call(clone);
        }

        Template.remove(this, 'template(' + name + ')');
      });
    }
  };

  jQuery.fn.clearTemplate = function() {
    return this.each(function() {
      jQuery.clearTemplate(this);
    });
  };

  jQuery.fn.template = function(model, map) {
    if(arguments.length == 1 && arguments[0] === false) {
      return this.clearTemplate();
    }

    if(this.length != 1) {
      console.warn('template rendering on a non-singular node! %o', this.selector);
      debugger;
    }
    if(!(model instanceof Template.ViewModel)) {
      model = new Template.ViewModel(model);
    }
    return this.each(function() {
      jQuery.template(this, model, map);
    });
  };

  jQuery.clearTemplate = function(elem) {
    var data = $(elem).data();
    var template_context = data.template_context;
    if(template_context) {
      template_context.clear();
      delete data.template_context;
    }
  };

  jQuery.template = function(node, model, map) {
    var $node = $(node);
    var old_context = $node.data('template_context');
    if(old_context) { old_context.clear(); }
    var root_context = 
      new Template.RootRenderContext(model, _.deepfreeze(map || {}))
    $node.data('template_context', root_context);
    _.local.call(Template, { render_context: root_context }, function() {
      Template(node, function() {
        Template.render.call(this);
      });
    }).call(this);
  };
};

if(jQuery) Template.bind_to_jQuery();

var exports; if(exports) exports.Template = Template;

// vim: set sw=2 ts=2 expandtab :
