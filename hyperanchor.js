/*
 * hyperanchor.js
 * MIT Licence
 * Copyright 2014 brian ford
 *
 * HTML has hyperlinks but it totally needs hyperanchors
 *
 * Hyperachor makes all the text on your page anchorable.
 * when a user selects text, hyperanchor constructs a minimal
 * regex representing the selection, and updates the URL accordingly
 */

window.hyperanchor = window.hyperanchor || {};

/*
 * Public API
 * ==========
 */


/*
 * listen for mouseup and update the url when the selection changes
 * optionally takes a callback as the action to be performed when the
 * selection changes instead of updating the url
 */
hyperanchor.start = function (cb) {
  cb = cb || function (text) {
    window.location.hash = text;
  };
  document.body.addEventListener('mouseup', function () {
    cb(hyperanchor.construct());
  });
};


/*
 * returns a path to a hyperanchor
 */
hyperanchor.construct = function (sel) {
  var sel = window.getSelection() || sel;
  var text = getTextFromSelection(sel);

  // NOTE: this culls single character selections; they produce
  // meaningless URLs and I don't anticipate them being useful to end users
  if (text && text.length > 1) {
    var min = minimalMatcher(text);
    var before = getTextBeforeRange(sel.getRangeAt(0));
    var num = (before.match(min.re) || []).length;
    return min.text + formatMatches(num);
  }
  return '';
};

hyperanchor.container = document.body;

/*
 * takes a string in the form:
 * lol...lol[4] and returns a regex
 */
hyperanchor.parse = function (str) {
  var parts = /(.+?)\.\.\.([^\[]+)(\[[0-9]+\])?/.exec(str);
  return {
    left: parts[1],
    right: parts[2],
    index: parts[3] || 0
  };
}

/*
 *
 */
hyperanchor.rewrite = function () {

}

hyperanchor.scrollTo


/*
 * Helpers
 * =======
 */


/*
 * this is probably a poly-fill-ish thing
 * i have yet to encounter a situation where rangeCount > 1
 */
function getTextFromSelection (sel) {
  sel = sel || window.getSelection();
  var container;
  if (sel.rangeCount) {
    container = document.createElement('div');
    for (var i = 0, len = sel.rangeCount; i < len; ++i) {
      container.appendChild(sel.getRangeAt(i).cloneContents());
    }
    return container.innerText;
  }
  return '';
}


/*
 * return a "minimal" hyperanchor path to the given text
 * this isn't truly minimal; the algorithm aims for readability
 * over a short URL
 */
var t = document.body.innerText;
function minimalMatcher (s) {
  s = s.trim();
  var bound = 1,
      re,
      left,
      right,
      matches,
      wholeStringRegex = new RegExp(s, 'g'),
      u=t.match(wholeStringRegex).length; // check how many of this substr there are

  do {
    bound += 1;
    if ((2*bound + 3) >= s.length) {
      return {text: s, re: wholeStringRegex};
    } else {
      left = s.substr(0,bound).trim();
      right = s.substr(s.length-bound).trim();
      re = new RegExp(left + '.*?' + right, 'g');
    }
    matches = t.match(re).length;
  } while (matches > u && bound < 5);
  return {text: left + '...' + right, re: re};
}
function formatMatches (matches) {
  return (matches > 0 ? ('[' + matches + ']') : '');
}



/*
 * traverse the document's nodes until we hit the start of range.
 * we'll use this to calculate which instance we're highlighting
 */
function getTextBeforeRange (r) {
  var buffer = r.startContainer.textContent.substr(0, r.startOffset),
      parent = r.startContainer.parentNode,
      childElement = r.startContainer;

  while (parent !== document.body) {
    var childIndex = Array.prototype.indexOf.apply(parent.childNodes, [childElement]);
    for (var i = childIndex-1; i >= 0; i -= 1) {
      buffer = (parent.childNodes[i].innerText || '') + buffer;
    }
    childElement = childElement.parentNode;
    parent = childElement.parentNode;
  }

  return buffer;
}


function getNextNode (node) {
  if (node.firstChild) {
    return node.firstChild;
  }
  do {
    node = node.parentNode;
  } while (!node.nextSibling);
  return node.nextSibling;
}

function getNodesInRange (range) {
  var start = range.startContainer,
      end = range.endContainer,
      commonAncestor = range.commonAncestorContainer,
      nodes = [],
      node;

  // walk parent nodes from start to common ancestor
  for (node = start.parentNode; (node && node !== commonAncestor); node = node.parentNode) {
    nodes.unshift(node);
  }

  // walk children and siblings from start until end is found
  for (node = start; (node && node !== end); node = getNextNode(node)) {
    nodes.push(node);
  }

  return nodes;
}
