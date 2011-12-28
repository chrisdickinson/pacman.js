suite('Canvas', function() {
  setup(function() {

  })

  teardown(function() {

  })

  suite('integer', function() {
    test('pack/retrieve integers in [1..31] bytes, signed or unsigned', function() {
      for(var signed = 0; signed < 2; ++signed)
        for(var size = 1; size < 32; ++size) {
          var cls = new pacman([
              'x', pacman.types.integer(size, !!signed)
            ])
            , simple = new cls
            , expected
            , canvas = document.createElement('canvas')
            , stream = new pacman.canvas(canvas, canvas.getContext('2d'))
            , in_stream

          simple.x = expected = ~~(Math.random() * (Math.pow(2, size)-1)) 
          assert.equal(simple.x, expected)

          pacman.dehydrate(stream, simple)

          stream.flush()

          pacman.hydrate(
              in_stream = new pacman.canvas(canvas, canvas.getContext('2d'))
            , cls
            , function(result) {
                assert.list_equal(stream.write_buffer, in_stream.data.slice(0, stream.write_buffer.length)) 
                assert.equal(simple.x, expected, 'at size '+size, 'at signed '+!!signed, stream.write_buffer.map(pad).join(''))
                assert.equal(result.x, expected, 'at size '+size, 'at signed '+!!signed, stream.write_buffer.map(pad).join(''))
              }
          )
        }
    })

    test('pack/retrieve multiple integers', function() {

      for(var x_width = 1; x_width < 32; ++x_width) 
      for(var y_width = 1; y_width < 32; ++y_width) {
        var cls = new pacman([
            'x', pacman.types.integer(x_width, false)
          , 'y', pacman.types.integer(y_width, false)
        ])

        var expected_x = ~~(Math.random() * Math.pow(2, x_width))
          , expected_y = ~~(Math.random() * Math.pow(2, y_width))
          , input = new cls(expected_x, expected_y)
          , canvas = document.createElement('canvas')
          , stream = new pacman.canvas(canvas, canvas.getContext('2d'))
          , in_stream

        assert.equal(input.x, expected_x)
        assert.equal(input.y, expected_y)

        pacman.dehydrate(stream, input)
        stream.flush()
        pacman.hydrate(
            in_stream = new pacman.canvas(canvas, canvas.getContext('2d'))
          , cls
          , function(result) {
            assert.list_equal(stream.write_buffer, in_stream.data.slice(0, stream.write_buffer.length), 'at '+x_width+', '+y_width)
            assert.equal(result.x, expected_x, '(x) at '+x_width+', '+y_width)
            assert.equal(result.y, expected_y, '(y) at '+x_width+', '+y_width
              , stream.write_buffer.map(pad).join('')
              , pad(expected_y))
          }
        )
      }
    })
  })

  suite('string/', function() {
    test('pack/retrieve long strings', function() {
      var xhr = new XMLHttpRequest
        , write_stream
        , read_stream
        , canvas
        , instance

      xhr.open('GET', '/README.md', false)
      xhr.send(null)

      ;[0x100, 0x10000].forEach(function(size) {
        var cls = new pacman([
          'data', pacman.types.string(size)
        ])

        canvas = document.createElement('canvas')
        write_stream = new pacman.canvas(canvas, canvas.getContext('2d'))

        instance = new cls(xhr.responseText)
        pacman.dehydrate(write_stream, instance)

        write_stream.flush()

        read_stream = new pacman.canvas(canvas, write_stream.context)

        pacman.hydrate(read_stream, cls, function(result) {
          assert.equal(result.data, xhr.responseText, 'char_size of '+size)
        })
      })

    })
  })
})
