var scrollers = [];	// Don't know if we really need to save these for later use
					// but for now, we'll keep them

function iuiScrollerLoaded()
{
//	setHeight();
	document.addEventListener('touchmove', function(e){ e.preventDefault(); });
	document.body.addEventListener('afterinsert', afterInsert, false);
	
	var scrollDivs = document.querySelectorAll('.scroller');
	for (var i=0; i<scrollDivs.length; i++)
	{
		var scroller = new iScroll(scrollDivs[i])
		scrollDivs[i].scroller = scroller;
		scrollers.push(scroller);
	}

	nodes = document.querySelectorAll("body > *:not(.toolbar)");
	for (var i = 0; i  < nodes.length  ; i++)
	{
		nodes[i].addEventListener("aftertransition", refreshScroller, false);
	}

}

function afterInsert(e)
{
	// create the scroller and add the event handler to refresh the scroller after an ajax insert
	//
    var scrollerEl = e.insertedNode.querySelector('.scroller');
    if (scrollerEl) {
        var scroller = new iScroll(scrollerEl);
        scrollerEl.scroller = scroller;
        scrollers.push(scroller);
        e.insertedNode.addEventListener('aftertransition', refreshScroller, false);
    }
}

window.addEventListener('DOMContentLoaded', iuiScrollerLoaded, true);

function refreshScroller(e)
{
	var node = e.target;
	var scrollerEl = node.querySelector('.scroller');  // should only be one scroller inside this block
	var scroller = scrollerEl.scroller;
	scroller.refresh();
	if (node.scrollToAnchor)
	{
		var positionNode = document.getElementById(node.scrollToAnchor);
		node.scrollToAnchor = null;
		if (positionNode)
		{
			var newX = 0;
			var newY = -1 * positionNode.offsetTop;
			console.log("newY is  " + newY);
			scroller.scrollTo(newX, newY, '10ms');
		}
	}
}

function setHeight()
{
	var wrapperDivs = document.querySelectorAll('.wrapper');
	for (var i=0; i<wrapperDivs.length; i++)
	{
		// wrapperDivs[i].style.height = window.orientation == 90 || window.orientation == -90 ? '80px' : '200px';
	}
}
