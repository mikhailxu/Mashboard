/*
   copyright:
   Copyright (c) 2007-10, iUI Project Members.
   See LICENSE.txt for licensing terms.
   Version @VERSION@
 */

/* note:
   This version of iUI has a partial implementation of the `busy` flag for Issue #191,
   it will not work with webapps that call `iui.showPage()` or `iui.showPageByHref()` directly.
   This issue will be resolved in a later version. */

(function() {

var slideSpeed = 20;
var slideInterval = 0;
var ajaxTimeoutVal = 30000;

var currentPage = null;
var currentDialog = null;
var currentWidth = 0;
var currentHeight = 0;
var currentHash = location.hash;
var hashPrefix = "#_";
var pageHistory = [];
var newPageCount = 0;
var checkTimer;
var hasOrientationEvent = false;
var portraitVal = "portrait";
var landscapeVal = "landscape";
var splitScreenMinWidth = 700; // hack for iosdevcamp app
var slideParent;
var ssConfig = {	disabled: 0,	// Never splitscreen 
					auto: 1,		// Splitscreen when wider than splitScreenMinWidth, popover when ss and portrait
					noPopover: 2,	// // Splitscreen, but never do popover
					alwaysPopover: 3}; // Nav always in poppover

// *************************************************************************************************

/*
events:
iUI fires a number of custom events on your panel and dialog elements. Handling
these events is the recommended way to do any just-in-time transformations or
loading (besides the ajax pre-loading built into iUI).
*/

window.iui =
{
	/*
	property: iui.busy
	This is set to `true` if a slide animation is in progress.
	*/
	busy: false,
	
	/*
	property: iui.animOn
	Determines whether to do horizontal slide animations with CSS transitions
	(http://www.w3.org/TR/css3-2d-transforms/) where supported (defaults	to
	`true`). Otherwise, manual `setInterval()` style animations are performed
	(vertical slide animations are always done manually).
	*/
	animOn: true,
	
	/*
	property: iui.ajaxErrHandler
	If defined, this user-set function will be called when an AJAX call returns
	with an HTTP status other than `200` (currently all HTTP statuses other than
	`200`, even including 200-level statuses like `201 Created`, are seen as
	errors).
	*/
	ajaxErrHandler : null,
	splitScreenConfig: ssConfig.disabled,
	debug: false,
	
	/*
	property: iui.httpHeaders
	An object defining headers to be sent with Ajax requests. This defaults to:
	
	example:
	  { 'X-Requested-With': 'XMLHttpRequest' }
	*/

	httpHeaders: {
	    "X-Requested-With" : "XMLHttpRequest"
	},

	/*
	method: iui.showPageInternal(page[, backwards=false])
	`showPage()` should probably be an internal function, outside callers should
	call `showPageById()` instead. `showPage()` doesn't set the busy flag because
	it is already set by the public-facing functions.
	
	`page` is the html element to show. If `backwards` is set to `true`, it will
	display a right-to-left animation instead of the default left-to-right.
	
	If the currently-displayed page is passed, iui will do nothing. `showPage()`
	is used for both panel-type pages and dialog-type pages (dialogs float on top
	of the panels, have a cancel button and do not participate in sliding
	animations). Panel-type pages receive blur/focus events and load/unload events,
	but dialog-type pages only receive blur/focus events.
	*/	
	showPageInternal: function(page, backwards)
	{
		if (!iui.busy)
		{
			console.log("showPageInternal() called with busy = false!");
		}
		if (page)
		{
//			if (window.iui_ext)	window.iui_ext.injectEventMethods(page);	// TG -- why was this comment left here??
			if (page == currentPage)
			{
				console.log("page = currentPage = " + page.id);
				iui.busy = false;	//  Don't do anything, just clear the busy flag and exit
				return;
			}
			
			if (currentDialog)
			{
				currentDialog.removeAttribute("selected");
				sendEvent("blur", currentDialog);					// EVENT: BLUR
				currentDialog = null;
			}

			/*
			events:
			Dialogs receive a `focus` event when they are shown and a `blur` event
			when hidden. Currently they don't receive any `load` or `unload` events.
			*/
			if (hasClass(page, "dialog"))
			{
				// There's no LOAD/UNLOAD events for dialogs -- is that the way it should be??
				// Should the view the dialog is going over get a BLUR??
				sendEvent("focus", page);							// EVENT: FOCUS
				showDialog(page);
				iui.busy = false;
			}
			/*
			events:
			Panels receive `focus` and `blur` events and also receive a `load` event
			and (only when going backwards away from a panel) an `unload` event.
			*/
			else
			{
				sendEvent("load", page);    						// EVENT: LOAD
													// 127(stylesheet), 128(script), 129(onload)
													// 130(onFocus), 133(loadActionButton)
				var fromPage = currentPage;
				sendEvent("blur", fromPage);						// EVENT: BLUR
				sendEvent("focus", page);							// EVENT: FOCUS


				if (isContentPane(page))
				{
					iui.busy = false;
					showContentPane(page);
				}
				else
				{
					currentPage = page;
					if (fromPage)
					{
						if (backwards) sendEvent("unload", fromPage);	// EVENT: UNLOAD
						setTimeout(slidePages, 0, fromPage, page, backwards);
					}
					else
					{
						updatePage(page, fromPage);
					}
				}
					
			}
		}
	},


	/*
	method: iui.showPageById(pageId)
	Looks up the page element by the id and checks the internal history to
	determine if the page is on the stack -- if so, it will call `showPage()` with
	`backwards` set to `true`, reversing the direction of the animation. 
	*/
	// Deprecated, use showPage, it now works with id or element
	showPageById: function(pageId)
	{
		showPage(pageId);
	},
	
	showPage: function(pageRef)
	{
		var page = typeof pageRef == 'object' ? pageRef : $(pageRef);
		if (page)
		{
			if (!iui.busy)
			{
				iui.busy = true;
				var index = pageHistory.indexOf(page.id);
				var backwards = index != -1;
				if (backwards)
				{
					// we're going back, remove history from index on
					// remember - pageId will be added again in updatePage
					pageHistory.splice(index);
				}
	
				iui.showPageInternal(page, backwards);
			}
		}
	},

	/*
	method: iui.goBack()
	Navigates to the previous page in the history stack.
	*/
	goBack: function()
	{
		if (!iui.busy)
		{
			iui.busy = true;
			pageHistory.pop();	// pop current page
			var pageID = pageHistory.pop();  // pop/get parent
			var page = $(pageID);
			iui.showPageInternal(page, true);
		}
	},


	/*
	method: iui.replacePage(pageId, backwards)
	Loads a new page at the same level in the history stack. 
	Currently it will do a slide-in animation, but replaces
	the current page in the navStack.
	It should probably use a different animation (slide-up/slide-down).
	*/
	replacePage: function(pageRef, backwards)
	{
		var page = typeof pageRef == 'object' ? pageRef : $(pageRef);
		if (page)
		{
			if (!iui.busy)
			{
				iui.busy = true;
				var index = pageHistory.indexOf(page.id);
				var ancestor = index != -1;
				if (ancestor)	// link is to ancestor, shouldn't happen on replacePage()
					console.log("error: can't replace page with ancestor");
					
				pageHistory.pop();
	
				iui.showPageInternal(page, backwards);
			}
		}
	},

	/*
	method: iui.showPageByHref(href, args, method, replace, cb)
	Outside callers should use this version to do an ajax load programmatically
	from your webapp. In a future version, this will be renamed to
	`showPageByHref()` (once the old method and  all its calls are renamed).
	
	`href` is a URL string, `method` is the HTTP method (defaults to `GET`),
	`args` is an Object of key-value pairs that are used to generate the querystring,
	`replace` is an existing element that either is the panel or is a child of the
	panel that the incoming HTML will replace (if not supplied, iUI will append
	the incoming HTML to the `body`), and `cb` is a user-supplied callback function.
	*/
	showPageByHref: function(href, args, method, replace, cb)
	{
		if (!iui.busy)
		{
			iui.busy = true;
			iui.showPageByHrefInternal(href, args, method, replace, cb);	
		}
	},

	/*
	method: iui.showPageByHrefInternal(href, args, method, replace, cb)
	This one should only be used by iUI internally.  It should be renamed and
	possibly moved into the closure.
	*/
	// This one should only be used by iUIinternally.  It will be made private shortly.
	showPageByHrefInternal: function(href, args, method, replace, cb)
	{
		if (!iui.busy)
		{
			console.log("showPageByHrefInternal() called with busy = false!");
		}
	  	// I don't think we need onerror, because readstate will still go to 4 in that case
		function spbhCB(xhr) 
		{
			console.log("xhr.readyState = " + xhr.readyState);
			if (xhr.readyState == 4)
			{
				// status = 200 is valid HTTP response status = 0 is returned by loads from file urls
				if (((xhr.status == 200) || (xhr.status == 0)) && !xhr.aborted)
				{
				  // Add 'if (xhr.responseText)' to make sure we have something???
				  // Can't use createDocumentFragment() here because firstChild is null and childNodes is empty
				  var frag = document.createElement("div");
				  frag.innerHTML = xhr.responseText;
				  // EVENT beforeInsert->body
					/*
					events:
					When new pages are inserted into the DOM after an AJAX load, the `body`
					element receives a `beforeinsert` event with `{ fragment: frag }` parameters
					and afterwards receives an `afterinsert` event with `{insertedNode: docNode}` parameters.
					*/
				  sendEvent("beforeinsert", document.body, {fragment:frag})
				  if (replace)
				  {
					  replaceElementWithFrag(replace, frag);
					  iui.busy = false;
				  }
				  else
				  {
					  iui.insertPages(frag);
				  }
				}
				else
				{
					iui.busy = false;
					if (iui.ajaxErrHandler)
					{
						iui.ajaxErrHandler("Error contacting server, please try again later");
					}
				}
				if (cb)
				{
					setTimeout(cb, 1000, true);
				}
			}
		  
		};
	  iui.ajax(href, args, method, spbhCB);
	},
	
	/*
	method: iui.ajax(url, args, method, cb)
	Handles ajax requests and also fires a `setTimeout()` call
	to abort the request if it takes longer than 30 seconds. See `showPageByHrefExt()`
	above for a description of the various arguments (`url` is the same as `href`).
	*/
	ajax: function(url, args, method, cb)
	{
        var xhr = new XMLHttpRequest();
        method = method ? method.toUpperCase() : "GET";
        if (args && method == "GET")
        {
          url =  url + "?" + iui.param(args);
        }
        xhr.open(method, url, true);
        if (cb)
        {
			xhr.onreadystatechange = function() { cb(xhr); };
        }
        var data = null;
        if (args && method != "GET")
        {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            data = iui.param(args);
        }
        for (var header in iui.httpHeaders)
        {
            xhr.setRequestHeader(header, iui.httpHeaders[header]);
        }
        xhr.send(data);
        xhr.requestTimer = setTimeout( ajaxTimeout, ajaxTimeoutVal );
		return xhr;
        function ajaxTimeout()
        {
			try{
		 		xhr.abort();
		   		xhr.aborted = true;
			}
		   	catch(err){
				console.log(err);
		 	}
		}
	},
	
	/*
	method: iui.param(o)
	Stripped-down, simplified object-only version of a jQuery function that
	converts an object of keys/values into a URL-encoded querystring.
	*/
	param: function( o )
	{
	  var s = [ ];
	
	  // Serialize the key/values
	  for ( var key in o )
		s[ s.length ] = encodeURIComponent(key) + '=' + encodeURIComponent(o[key]);
  
	  // Return the resulting serialization
	  return s.join("&").replace(/%20/g, "+");
	},

	/*
	method: iui.insertPages(frag)
	If an AJAX call (`showPageByHref()`) is made without supplying a `replace`
	element, `insertPages()` is called to insert the newly-created element
	fragment into the page DOM. Each child-node of the HTML fragment is a panel
	and if any of them are already in the DOM, they will be replaced by the
	incoming elements.
	*/
	insertPages: function(frag)
	{
		var nodes = frag.childNodes;
		var targetPage;
		for (var i = 0; i < nodes.length; ++i)
		{
			var child = nodes[i];
			if (child.nodeType == 1)
			{
				if (!child.id)
					child.id = "__" + (++newPageCount) + "__";

				var clone = $(child.id);
				var docNode;
				if (clone) {
					clone.parentNode.replaceChild(child, clone);
				    docNode = $(child.id);
			    }
				else
					docNode = document.body.appendChild(child);
					
				sendEvent("afterinsert", document.body, {insertedNode:docNode});   

				// First child becomes selected page/view by default unless
				// selected="true" is set
				// BUG: selected="true" results in a visually incorrect transition
				if (child.getAttribute("selected") == "true" || !targetPage)
					targetPage = child;
				
				--i;
			}
		}
		sendEvent("afterinsertend", document.body, {fragment:frag})

		if (targetPage)
			iui.showPageInternal(targetPage);

	},
	
	popover_toc: function ()
	{
	  var navcontainer = document.getElementById("iui-container");
//	  iui.addClass(navcontainer, 'popover');
      if (iui.hasClass(navcontainer, 'hiding'))
      {
        iui.removeClass(navcontainer, 'hiding');
      }
      else
      {
        iui.addClass(navcontainer, 'hiding');
      }
    },


	/*
	method: iui.getSelectedPage()
	Returns the panel element that is currently being viewed. Each panel must be a
	direct child of the `body` element. A panel is set as the selected panel by
	setting the `selected` attribute to `true`.
	*/
	getSelectedPage: function()
	{
		for (var child = slideParent.firstChild; child; child = child.nextSibling)
		{
			if (child.nodeType == 1 && child.getAttribute("selected") == "true")
				return child;
		}	 
	},
	/*
	method: iui.isNativeUrl(href)
	Determines whether the supplied URL string launches a native iPhone app (maps,
	YouTube, phone, email, etc). If so, iUI does nothing (doesn't attempt to load
	a page or slide to it) and allows the phone to handle it the click natively.
	*/
	isNativeUrl: function(href)
	{
		for(var i = 0; i < iui.nativeUrlPatterns.length; i++)
		{
			if(href.match(iui.nativeUrlPatterns[i])) return true;
		}
		return false;
	},
	nativeUrlPatterns: [
		new RegExp("^http:\/\/maps.google.com\/maps\?"),
		new RegExp("^mailto:"),
		new RegExp("^tel:"),
		new RegExp("^http:\/\/www.youtube.com\/watch\\?v="),
		new RegExp("^http:\/\/www.youtube.com\/v\/"),
		new RegExp("^javascript:"),

	],
	/*
	method: iui.hasClass(self, name)
	Convenience function to determine if the given element (`self`) has the
	class `name`.
	*/
	hasClass: function(self, name)
	{
		var re = new RegExp("(^|\\s)"+name+"($|\\s)");
		return re.exec(self.getAttribute("class")) != null;
	},
	
	/*
	method: iui.addClass(self, name)
	Convenience function to add the given class `name` to element `self`.
	*/	
	addClass: function(self, name)
	{
	  if (!iui.hasClass(self,name)) self.className += " "+name;
	},
		
	/*
	method: iui.removeClass(self, name)
	Convenience function to remove the given class `name` to element `self`.
	*/
	removeClass: function(self, name)
	{
	  if (iui.hasClass(self,name)) {
		  var reg = new RegExp('(\\s|^)'+name+'(\\s|$)');
		self.className=self.className.replace(reg,' ');
	  }
	}
};

// *************************************************************************************************

/*
load: On Load
On load, iUI will determine which page to display primarily based on
the anchor part of the URL (everything after `#_`) and secondarily based on the
top-level (child of the `body`) element with the `selected` attribute set to
`true`. If these both exist, iui.showPage() will be called twice, but the
anchor-based load will win because it is done second.
*/
addEventListener("load", function(event)
{
	sendEvent("beforeinitiui",  document);
	
	
	slideParent = document.getElementById('iui-container');

	if (!slideParent) {
		slideParent = document.body;
		slideParent.id = 'iui-container';
	}
  
	var page = iui.getSelectedPage();
	var locPage = getPageFromLoc();
		
	if (page)
			iui.showPageInternal(page);
	
	if (locPage && (locPage != page))
		iui.showPageInternal(locPage);

	if (hasTouch())
	{
		iui.splitScreenConfig = ssConfig.auto;
	}
	else
	{
	  if (iui.debug == true) {
	    iui.splitScreenConfig = ssConfig.auto;
	  } else {
	    iui.splitScreenConfig = ssConfig.noPopover;
	  }
	}
	if (iui.hasClass(slideParent, 'iuialwayspopover'))
	{
	    iui.splitScreenConfig = ssConfig.alwaysPopover;
	    console.log("Always popover");
	}
	if (iui.hasClass(slideParent, 'iuinopopover'))
	{
	    iui.splitScreenConfig = ssConfig.noPopover;
	    console.log("No popover");
	}
	
	var contentView = document.querySelector(".content-pane");
	if (contentView)
	{
		if (window.innerWidth > splitScreenMinWidth)
		{
			showContentPane(contentView);
		}
	}
	setTimeout(preloadImages, 0);
	if (typeof window.onorientationchange == "object")
	{
		window.onorientationchange=orientChangeHandler;
		hasOrientationEvent = true;
		setTimeout(orientChangeHandler, 0);
	}
	setTimeout(checkOrientAndLocation, 0);
	checkTimer = setInterval(checkOrientAndLocation, 300);
	
	sendEvent("afterinitiui", document);

}, false);

addEventListener("unload", function(event)
{
	return;
}, false);
	
/*
click: Link Click Handling
iUI captures all clicks on `a` elements and goes through a series of checks to
determine what to do:

1. If the link has a `href="#..."`, iUI will navigate to the panel ID specified
   after the # (no underscore).
2. If the link's ID is `backButton`, iUI will navigate to the previous screen
   (see `iui.goBack()`).
3. If the link has a `type="submit"`, iUI will find the parent `form` element,
   gather up all the input values and submit the form via AJAX (see
   `iui.showPageByHref()`).
4. If the link has a `type="cancel"`, iUI will cancel the parent `form` element
   dialog.
5. If the link has a `target="_replace"`, iUI will do an AJAX call based on the
   href of the link and replace the panel that the link is in with the contents
   of the AJAX response.
6. If the link is a native URL (see `iui.isNativeURL()`), iUI will do nothing.
7. If the link has a `target="_webapp"`, iUI will perform a normal link,
   navigating completely away from the iUI app and pointing the browser to the
   linked-to webapp instead.
8. If there is no `target` attribute, iUI will perform a normal (non-replace)
   AJAX slide (see `iui.showPageByHref()`).
*/
addEventListener("click", function(event)
{
	var link = findParent(event.target, "a");
	if (link)
	{
		function unselect() { link.removeAttribute("selected"); }
		if (link.href && link.hash && link.hash != "#" && (!link.target || link.target == "_skipnav"))
		{
			followAnchor(link);
		}
		else if (link == $("backButton"))
		{
			iui.goBack();
		}
		else if (link.getAttribute("type") == "submit")
		{
			var form = findParent(link, "form");
			if (form.target == "_self")
			{
				// Note: this will not call any onsubmit handlers!
			    form.submit();
			    return;  // allow default
			}
			submitForm(form);
		}
		else if (link.getAttribute("type") == "cancel")
		{
			cancelDialog(findParent(link, "form"));
		}
		else if (link.target == "_replace")
		{
			followAjax(link, link);
		}
		else if (iui.isNativeUrl(link.href))
		{
			return;
		}
		else if (link.target == "_webapp")
		{
			location.href = link.href;
		}
		else if (!link.target)
		{
			followAjax(link, null);
		}
		else
			return;
		
		event.preventDefault();		   
	}
}, true);

/*
click: Div.toggle Click Handling
iUI also captures `div.toggle` clicks and displays/hides the element via setting
a `toggled` attribute to true/false.
*/
addEventListener("click", function(event)
{
	var div = findParent(event.target, "div");
	if (div && hasClass(div, "toggle"))
	{
		div.setAttribute("toggled", div.getAttribute("toggled") != "true");
		event.preventDefault();		   
	}
}, true);

function followAnchor(link)
{
	function unselect() { 
		link.removeAttribute("selected");
	}
	
	var destEl = $(link.hash.substr(1));
	var destView = findView(destEl);
	if (destView != destEl)
	{
		console.log("we got a 2-step link");
		// Store info to allow a plugin to scroll the destView to show destEl
		destView.scrollToAnchor = destEl.id;
	}
	
	if (!iui.busy)
	{
		link.setAttribute("selected", "true");
		if (link.target == "_skipnav")
		{
			iui.replacePage(destView);
		}
		else
		{
		// We need to check for backlinks here like in showPageID()
		// That backlink functionality needs to be in here somewhere
			iui.showPage(destView);
		}
		setTimeout(unselect, 500);
	}
}

function followAjax(link, replaceLink)
{
	function unselect() { link.removeAttribute("selected"); }

	if (!iui.busy)
	{
		link.setAttribute("selected", "progress");
		iui.showPageByHref(link.href, null, "GET", replaceLink, unselect);	
	}
}

function sendEvent(type, node, props)
{
    if (node)
    {
        var event = document.createEvent("UIEvent");
        event.initEvent(type, false, false);  // no bubble, no cancel
        if (props)
        {
            for (i in props)
            {
                event[i] = props[i];
            }
        }
        node.dispatchEvent(event);
    }
}

function getPageFromLoc()
{
	var page;
	var result = location.hash.match(/#_([^\?_]+)/);
	if (result)
		page = result[1];
	if (page)
		page = $(page);
	return page;
}

function orientChangeHandler()
{
	var orientation=window.orientation;
	switch(orientation)
	{
	case 0:
	case 180:
		setOrientation(portraitVal);
		break;	
		
	case 90:
	case -90: 
		setOrientation(landscapeVal);
		break;
	}
}


function checkOrientAndLocation()
{
	if (!hasOrientationEvent)
	{
	  if ((window.innerWidth != currentWidth) || (window.innerHeight != currentHeight))
	  {	  
		  currentWidth = window.innerWidth;
		  currentHeight = window.innerHeight;
		  var orient = (currentWidth < currentHeight) ? portraitVal : landscapeVal;
//		  var previousOrientation = document.body.getAttribute("orient");
		  setOrientation(orient);
		  
		  
	  }
	}

	if (location.hash != currentHash)
	{
		var pageId = location.hash.substr(hashPrefix.length);
		iui.showPage(pageId);
	}
}

function setOrientation(orient)
{
	document.body.setAttribute("orient", orient);
//  Set class in addition to orient attribute:
	if (orient == portraitVal)
	{
		iui.removeClass(document.body, landscapeVal);
		iui.addClass(document.body, portraitVal);
		refreshScroller(currentPage);
	}
	else if (orient == landscapeVal)
	{
		iui.removeClass(document.body, portraitVal);
		iui.addClass(document.body, landscapeVal);
		refreshScroller(currentPage);
	}
	else
	{
		iui.removeClass(document.body, portraitVal);
		iui.removeClass(document.body, landscapeVal);
	}
	
	setSplitScreen();
	
	if (navigator.standalone != undefined)
	{
		if (navigator.standalone)
		{
			iui.addClass(document.body, "standalone");
		}
		else
		{
			iui.removeClass(document.body, "standalone");
		}
	}			
	setTimeout(scrollTo, 100, 0, 1);
}

function setSplitScreen()
{
	var contentEl = document.getElementById("iuipad-content");	// See if div for right pane exists
	var doSplitScreen = ((currentWidth > splitScreenMinWidth) || (iui.splitScreenConfig == ssConfig.noPopover)) && (contentEl != null) && (iui.splitScreenConfig != ssConfig.disabled);
	
	if (doSplitScreen)
	{
		iui.addClass(slideParent, "iui-ss");
		iui.addClass(document.body, "iui-ss");
	}
	else
	{
		iui.removeClass(slideParent, "iui-ss");
		iui.addClass(document.body, "iui-ss");
	}
	var doPopOver = (doSplitScreen && (iui.splitScreenConfig != ssConfig.noPopover)) || (iui.splitScreenConfig == ssConfig.alwaysPopover);
	if (doPopOver)
	{
		iui.addClass(slideParent, 'popover');
		iui.addClass(contentEl, 'showtoc');
	}
	else
	{
		iui.removeClass(slideParent, 'popover');
		if (contentEl != null) iui.removeClass(contentEl, 'showtoc');
	}
	
	var hidePopOver = true;
	if (hidePopOver)
	{
	//	iui.addClass(slideParent, 'hiding');
	}
}

function refreshScroller(contentEl)
{
	var scrollerEl = contentEl.querySelector('.scroller');
	if (scrollerEl)
	{
		var scroller = scrollerEl.scroller;
		if (scroller)
		{
			scroller.refresh();
		}
	}
}

function showDialog(page)
{
	currentDialog = page;
	page.setAttribute("selected", "true");
	
	if (hasClass(page, "dialog"))
		showForm(page);
}

function showForm(form)
{
	form.onsubmit = function(event)
	{
//  submitForm and preventDefault are called in the click handler
//  when the user clicks the submit a.button
// 
		event.preventDefault();
		submitForm(form);
	};
	
	form.onclick = function(event)
	{
// Why is this code needed?  cancelDialog is called from
// the click hander.  When will this be called?
		if (event.target == form && hasClass(form, "dialog"))
			cancelDialog(form);
	};
}

function cancelDialog(form)
{
	form.removeAttribute("selected");
}


function isContentPane(page)
{
	// For now all <ul> elements are nav and all others are content
	// We can change it later in this function...
	if (hasClass(page, "content"))
	{
		return true;
	}
	else
	{
		return false;
	}
}

function showContentPane(page)
{
 	var contentEl = document.getElementById("iuipad-content");
	contentEl.innerHTML = page.innerHTML;
 	var scrollerEl = contentEl.parentElement;
	var scroller = scrollerEl.scroller;
	scroller.refresh();
 	var contentTitle = document.getElementById("contentTitle");
 	if (page.title)
 	{
 		contentTitle.innerHTML = page.title;
 	}
}

function updatePage(page, fromPage)
{
	if (!page.id)
		page.id = "__" + (++newPageCount) + "__";

	location.hash = currentHash = hashPrefix + page.id;
	pageHistory.push(page.id);

	var pageTitle = $("pageTitle");
	if (page.title)
		pageTitle.innerHTML = page.title;
	var ttlClass = page.getAttribute("ttlclass");
	pageTitle.className = ttlClass ? ttlClass : "";

	if (page.localName.toLowerCase() == "form" && !page.target)
		showForm(page);
		
	var backButton = $("backButton");
	if (backButton)
	{
		var prevPage = $(pageHistory[pageHistory.length-2]);
		if (prevPage && !page.getAttribute("hideBackButton"))
		{
			backButton.style.display = "inline";
			backButton.innerHTML = prevPage.title ? prevPage.title : "Back";
			var bbClass = prevPage.getAttribute("bbclass");
			backButton.className = (bbClass) ? 'button ' + bbClass : 'button';
		}
		else
			backButton.style.display = "none";
	}
	iui.busy = false;
}
/*
events:
Both panels involved in a slide animation receive `beforetransition` and
`aftertransition` events. The panel being navigated from receives event
parameters `{ out :true }`, the panel being navigated to receives `{ out: false }`.
*/
function slidePages(fromPage, toPage, backwards)
{		 
	var axis = (backwards ? fromPage : toPage).getAttribute("axis");

	clearInterval(checkTimer);
	
	sendEvent("beforetransition", fromPage, {out:true});
	sendEvent("beforetransition", toPage, {out:false});
	if (canDoSlideAnim() && axis != 'y')
	{
	  slide2(fromPage, toPage, backwards, slideDone);
	}
	else
	{
	  slide1(fromPage, toPage, backwards, axis, slideDone);
	}

	function slideDone()
	{
	  if (!hasClass(toPage, "dialog"))
		  fromPage.removeAttribute("selected");
	  checkTimer = setInterval(checkOrientAndLocation, 300);
	  setTimeout(updatePage, 0, toPage, fromPage);
	  fromPage.removeEventListener('webkitTransitionEnd', slideDone, false);
	  sendEvent("aftertransition", fromPage, {out:true});
      sendEvent("aftertransition", toPage, {out:false});
	  if (backwards) sendEvent("unload", fromPage);	// EVENT: UNLOAD
	}
}

function canDoSlideAnim()
{
  return (iui.animOn) && (typeof WebKitCSSMatrix == "object");
}

function hasTouch()
{
	return (typeof Touch == "object");
}

function slide1(fromPage, toPage, backwards, axis, cb)
{
	if (axis == "y")
		(backwards ? fromPage : toPage).style.top = "100%";
	else
		toPage.style.left = "100%";

	scrollTo(0, 1);
	toPage.setAttribute("selected", "true");
	var percent = 100;
	slide();
	var timer = setInterval(slide, slideInterval);

	function slide()
	{
		percent -= slideSpeed;
		if (percent <= 0)
		{
			percent = 0;
			clearInterval(timer);
			cb();
		}
	
		if (axis == "y")
		{
			backwards
				? fromPage.style.top = (100-percent) + "%"
				: toPage.style.top = percent + "%";
		}
		else
		{
			fromPage.style.left = (backwards ? (100-percent) : (percent-100)) + "%"; 
			toPage.style.left = (backwards ? -percent : percent) + "%"; 
		}
	}
}


function slide2(fromPage, toPage, backwards, cb)
{
	toPage.style.webkitTransitionDuration = '0ms'; // Turn off transitions to set toPage start offset
	// fromStart is always 0% and toEnd is always 0%
	// iPhone won't take % width on toPage
	var toStart = 'translateX(' + (backwards ? '-' : '') + window.innerWidth +	'px)';
	var fromEnd = 'translateX(' + (backwards ? '100%' : '-100%') + ')';
	toPage.style.webkitTransform = toStart;
	toPage.setAttribute("selected", "true");
	toPage.style.webkitTransitionDuration = '';	  // Turn transitions back on
	function startTrans()
	{
		fromPage.style.webkitTransform = fromEnd;
		toPage.style.webkitTransform = 'translateX(0%)'; //toEnd
	}
	fromPage.addEventListener('webkitTransitionEnd', cb, false);
	setTimeout(startTrans, 0);
}

function preloadImages()
{
	var preloader = document.createElement("div");
	preloader.id = "preloader";
	document.body.appendChild(preloader);
}

function submitForm(form)
{
 	if (!iui.busy)
	{
		iui.busy = true;
		iui.addClass(form, "progress");
		iui.showPageByHrefInternal(form.action, encodeForm(form), form.method || "GET", null, clear);
	}
    function clear() {   iui.removeClass(form, "progress"); }
}

function encodeForm(form)
{
	function encode(inputs)
	{
		for (var i = 0; i < inputs.length; ++i)
		{
	        if (inputs[i].name)
		        args[inputs[i].name] = inputs[i].value;
		}
	}

    var args = {};
    encode(form.getElementsByTagName("input"));
    encode(form.getElementsByTagName("textarea"));
    encode(form.getElementsByTagName("select"));
    encode(form.getElementsByTagName("button"));
    return args;	  
}

function findParent(node, localName)
{
	while (node && (node.nodeType != 1 || node.localName.toLowerCase() != localName))
	{
		node = node.parentNode;
	}
	return node;
}

function findView(node)
{
	while (node && (node.nodeType != 1 || node.parentNode != slideParent))
	{
		node = node.parentNode;
	}
	if (node.parentNode != slideParent)
	{
		node = null;
	}
	console.log("findView = " + node);	
	return node;
}

function hasClass(self, name)
{
	return iui.hasClass(self,name);
}

function replaceElementWithFrag(replace, frag)
{
	var page = replace.parentNode;
	var parent = replace;
	while (page.parentNode != document.body)
	{
		page = page.parentNode;
		parent = parent.parentNode;
	}
	page.removeChild(parent);

    var docNode;
	while (frag.firstChild) {
		docNode = page.appendChild(frag.firstChild);
		sendEvent("afterinsert", document.body, {insertedNode:docNode});
    }
	sendEvent("afterinsertend", document.body, {fragment:frag})
}

function $(id) { return document.getElementById(id); }
function ddd() { console.log.apply(console, arguments); }

})();
