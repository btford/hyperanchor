describe('hyperanchor#parse', function () {
  it('should parse a simple path', function () {
    var re = hyperanchor.parse('a...b');
    expect(re).toEqual({
      left: 'a',
      right: 'b',
      index: 0
    });
  });

  it('should parse a path with an index', function () {
    var re = hyperanchor.parse('a...b[2]');
    expect(re).toEqual({
      left: 'a',
      right: 'b',
      index: 2
    });
  });

  it('should parse a conjoined path', function () {
    var re = hyperanchor.parse('aabb');
    expect(re).toEqual({
      left: 'aabb',
      index: 0
    });
  });

  it('should parse a conjoined path with an index', function () {
    var re = hyperanchor.parse('aabb[3]');
    expect(re).toEqual({
      left: 'aabb',
      index: 3
    });
  });

  it('should parse a conjoined path with square braces', function () {
    var re = hyperanchor.parse('aabb[[4]');
    expect(re).toEqual({
      left: 'aabb[',
      index: 4
    });
  });

  it('should parse a path with periods', function () {
    var re = hyperanchor.parse('.....');
    expect(re).toEqual({
      left: '.',
      right: '.',
      index: 0
    });
  });

  it('should throw for a path that\'s too long', function () {
    expect(function () {
      hyperanchor.parse('abcd1234567890');
    }).toThrow('up');
  });

  it('should throw for a path that\'s too short', function () {
    expect(function () {
      hyperanchor.parse('a');
    }).toThrow('up');
  });
});
