describe('hyperanchor', function () {
  it('should do things', function () {
    expect(hyperanchor).toBeDefined();
  });

  var div;

  describe('#construct', function () {
    beforeEach(function () {
      div = document.createElement('div');
      document.body.appendChild(div);
    });

    afterEach(function () {
      document.body.removeChild(div);
    });

    itShouldMatch('check this out').as('ch...ut');

    itShouldMatch('abcd').as('abcd');

    itShouldMatch('abcdabcdabcd', 'a string with internal repetition').as('ab...cd');

    itShouldMatch('<span>ab</span><span>cd</span>').as('abcd');

    itShouldMatch('<span>a|b</span><span>c|d</span>').as('bc');
  });

  describe('#start', function () {
    it('should not change the url if there isn\'t anything a fragment', function () {
      hyperanchor.start();
    });
  });

  function itShouldMatch (html, description) {
    //html = html.replace('|', '');

    return {
      as: function (expected) {
        it('should work with ' + (description || html), function () {
          div.innerHTML = html;
          selectElementContents(div);
          expect(hyperanchor.construct()).toBe(expected);
        });
      }
    };

  }
});


function selectElementContents(el) {
  console.log(el.childNodes[0].nodeType === 3 && el.childNodes[0]);

  if (window.getSelection && document.createRange) {
    var sel = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (document.selection && document.body.createTextRange) {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.select();
  }

  function traverse (node) {
    var pairs;

    for (var i = 0,
             ii = node.childNodes.length; i < ii; i += 1) {

      currentNode = node.childNodes[i];
      if (typeof currentNode === 3 && currentNode.innerText.indexOf('|') > 0) {

      } else {

      }
      traverse(currentNode);
    }
  }
}
