/*
 * hyperanchor.js
 * MIT Licence
 * Copyright 2014 brian ford
 *
 * HTML has hyperlinks but it's totally missing hyperanchors
 *
 * Hyperachor makes all the text on your page anchorable.
 * When a user selects text, hyperanchor constructs a minimalish
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
    if (text.length) {
      window.location.hash = text;
      var r = window.getSelection().getRangeAt(0);
      var nodes = getNodesInRange(r);
      unwrapText(hyperanchor.wrapped);
      unwrapEnds();
      wrapEnds(r);
      hyperanchor.wrapped = getParentsOfTextNodes(nodes);
      hyperanchor.wrapped.forEach(wrapText);
    }
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
hyperanchor.wrapped = [];
hyperanchor.ends = {};

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
var t = document.body.innerText.split('\n').join('');
function minimalMatcher (s) {
  s = s.trim();
  var bound = 1,
      re,
      left,
      right,
      matches,
      wholeStringRegex = new RegExp(s, 'g'),
      u=(t.match(wholeStringRegex) || []).length || 1; // check how many of this substr there are

  do {
    bound += 1;
    if ((2*bound + 3) >= s.length) {
      return {text: s, re: wholeStringRegex};
    } else {
      left = s.substr(0,bound).trim();
      right = s.substr(s.length-bound).trim();
      re = new RegExp(left + '[\\s\\S]+?' + right, 'g');
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
  while (node && !node.nextSibling) {
    node = node.parentNode;
  }
  return node && node.nextSibling;
}

function getNodesInRange (range) {
  var start = range.startContainer,
      end = range.endContainer,
      commonAncestor = range.commonAncestorContainer,
      nodes = [],
      node;

  // walk parent nodes from start to common ancestor
  for (node = start.parentNode; (node && node !== commonAncestor); node = node.parentNode) {
    if (nodes.indexOf(node) === -1) {
      nodes.unshift(node);
    }
  }

  // walk children and siblings from start until end is found
  for (node = start; (node && node !== end); node = getNextNode(node)) {
    if (nodes.indexOf(node) === -1) {
      nodes.push(node);
    }
  }

  nodes.splice(start, 1);
  nodes.splice(end, 1);

  return nodes;
}

function getParentsOfTextNodes (nodes) {
  nodes = nodes.filter(function (node) {
    return node.nodeName === '#text' && node.textContent.trim().length > 0;
  });

  nodes = nodes.map(function (node) {
    return node.parentNode;
  });

  return nodes;
}

function wrapText (node) {
  node.classList.add('hyperanchorized');
}

function wrapEnds (range) {
  var start = range.startContainer.parentNode,
      end = range.endContainer.parentNode;

  if (start === end) {

    return;
  }
  if (range.startOffset > 0) {
    if (range.startOffset >= start.textContent.trim().length) {
      wrapText(start);
    } else {
      splitStartNode(start, range.startOffset);
    }
  }
  if (range.endOffset > 0) {
    if (range.endOffset >= end.textContent.trim().length) {
      wrapText(end);
    } else {
      splitEndNode(end, range.endOffset);
    }
  }
  hyperanchor.ends.start = start;
  hyperanchor.ends.end = end;
}

function unwrapEnds () {
  [
    hyperanchor.ends.start,
    hyperanchor.ends.end
  ].forEach(unwrapEnd);
}

function unwrapEnd (end) {
  if (!end) {
    return;
  }
  if (end.childNodes.length > 1) {
    end.innerHTML = end.textContent;
  } else {
    unwrapText([end]);
  }
}

// takes a parent with only a single text node as a child
// and splits it into a text node plus a text node wrapped
// in a `<span>`
function splitStartNode (elt, offset) {
  var text = elt.textContent;
  var unwrapped = text.substr(0, offset);
  var wrapped = wrapInSpan(text.substr(offset));
  elt.innerHTML = unwrapped + wrapped;
}
// takes a parent with only a single text node as a child
// and splits it into a text node plus a text node wrapped
// in a `<span>`
function splitEndNode (elt, offset) {
  var text = elt.textContent;
  var wrapped = wrapInSpan(text.substr(0, offset));
  var unwrapped = text.substr(offset);
  elt.innerHTML = wrapped + unwrapped;
}

function wrapInSpan (text) {
  return '<span class="hyperanchorized">' + text + '</span>';
}

function unwrapText (nodes) {
  nodes.forEach(function (element) {
    element.classList.remove('hyperanchorized');
  });
}
