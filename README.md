# Pacman.js

A library for reading and writing tightly packed bit streams of data
into and out of canvas PNGs.

![this readme]()

## API

### cls = new pacman([attr_name, attr_type, ...])

Create a pacman class -- returns a function that can be instantiated
with arguments like so:

````javascript
    var Vertex = new pacman([
        'x', pacman.types.integer(4)
      , 'y', pacman.types.integer(7)
    ])

    var my_vert = new Vertex(3, 5)
    my_vert.x === 3
    my_vert.y === 7
````

### pacman.hydrate(stream, pacman_cls, on_ready)

Reads a pacman class instance out of the incoming stream. Calls `on_ready`
with the resulting object as the first argument.

````javascript
    var Vertex = new pacman([
        'x', pacman.types.integer(4)
      , 'y', pacman.types.integer(7)
    ])
    var my_vert = pacman.hydrate(stream, Vertex)
````

### pacman.dehydrate(stream, pacman_cls_instance)

Writes a pacman class instance into the provided stream.

````javascript
    var Vertex = new pacman([
        'x', pacman.types.integer(4)
      , 'y', pacman.types.integer(7)
    ])

    var my_vert = new Vertex(3, 5)
      , stream
    pacman.dehydrate(stream, my_vert)
    stream.flush()
````

### stream = new pacman.canvas(canvas_element, canvas_element_context)

Currently, only the `Canvas` stream is implemented. Takes a canvas element and it's
2D context.

Create a write stream:

````javascript
    var canvas = document.createElement('canvas')
      , out_stream = new pacman.canvas(
          canvas
        , canvas.getContext('2d')
    )

    pacman.dehydrate(out_stream, my_vert)
    out_stream.flush()
````

Create a read stream from the written data:

````javascript
    var in_stream = new pacman.canvas(
        out_stream.canvas
      , out_stream.context
    )

    pacman.hydrate(in_stream, Vertex, function(my_vert) {
        // we have a vertex!
    })
````

### stream#flush()

Flushes the data to be written into the canvas. Data is buffered (not written to the stream directly) until
this function is called.

## types

### pacman.types.boolean()

Stored in a single bit -- `true` or `false`.

### pacman.types.integer(size | 31, signed | true)

Stores an integer of up to 31 bits, along with an optional `signed` flag that will write a bit
representing the sign status of the integer (positive or negative). Size defaults to 31, and signedness
defaults to true.

### pacman.types.string(char_size | 8)

Writes 31 bits representing the length of the string, and `string.length * char_size` bits containing
the string data. Defaults to 256 -- an extended ASCII charset -- but can be increased to full-width
for unicode data.

### pacman.types.list([type, type, type...])

Stores 31 bits representing list length, as well as a tuple of types to be cycled through when reading.
Delegates item storage to the linked types.

Can also be represented by the following shortcut:

````javascript
    var Polygon = new pacman([
        'coords': [pacman.types.integer(4), pacman.types.integer(5)]
    ])
````

### pacman.types.decimal 

Currently stubbed in. Will eventually allow you to store values set to a certain clamp.

### pacman.types.link

Links to another definition to read.

````javascript
    var Vertex = new pacman([
        'x', pacman.types.integer(5)
      , 'y', pacman.types.integer(5)
      , 'z', pacman.types.integer(5)
    ])

    var Face = new pacman([
        'position', Vertex          // or pacman.types.link(Vertex)
      , 'polys', [Vertex]           // read a list of Vertex objects
    ])

````


## LICENSE

MIT

