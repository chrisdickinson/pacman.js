;(function() { 

var str = {}.toString.call.bind({}.toString)

function Pack(definition) {
  this.definition = definition = definition.map(function mapped(item, i, all) {
    if(all !== definition || i & 1) {
      if(str(item) === '[object Array]') {
        return cons.types.list(item.map(mapped)) 
      } else if(item.__pacman__) {
        return cons.types.link(item.__pacman__)
      }
    }
    return item
  })


  var self = this

  this.cls = function() {
    var args = [].slice.call(arguments)
    for(var i = 0, len = definition.length; i < len; i += 2) {
      this[definition[i]] = args[i/2] || definition[i+1].empty()
    }

    this.__pacman__ = self
  }

  this.cls.__pacman__ = this
  return this.cls
}

var proto = Pack.prototype
  , cons = proto.constructor

cons.hydrate = function(stream, cls, ready) {
  cls.__pacman__.hydrate(stream, ready)
}

cons.dehydrate = function(stream, instance, ready) {
  instance.__pacman__.dehydrate(stream, instance, ready)
}

proto.hydrate = function(stream, ready) {
  var obj = new this.cls
    , def = this.definition
    , current
    , key
    , i   = 0
    , len = def.length

  function iter() {
    if(i >= len)
      return ready(obj)

    key = def[i]
    current = def[i+1]

    current.read(stream, function(value) {
      obj[key] = value
      i += 2
      iter()
    })
  }

  return iter()
}

proto.dehydrate = function(stream, instance) {
  var def = this.definition
    , current
    , key
    , i   = 0
    , len = def.length

  for(var i = 0; i < len; i += 2) {
    def[i+1].write(stream, instance[def[i]])
  }
}

cons.types = {}

var base = {
    read:function(stream, bits, ready) {
      stream.read(bits, ready)
    }
  , write:function(stream, bits, value, ready) {
      stream.write(bits, value, ready)
    }
}

cons.types.decimal = function decimal(size) {
  size = size || 4

  function read(stream, ready) {

  }

  function write(stream, value, ready) {

  }


  return {
    read:   read
  , write:  write
  }
}

cons.types.integer = function integer(size, sign) {
  if(size > 31)
    throw new Error('cannot pack or unpack integers greater than 31 bits!')

  size = size || 31
  sign = sign === undefined ? true : sign

  function process_values(values) {
    var out = 0
    for(var i = 0, len = values.length; i < len; ++i) {
      out |= ((values[i] & 0xFF) << (8 * i))
    }
    return out
  }

  function read(stream, ready) {
    function read_main(signed) {
      stream.read(size, function(value) {
        var out = process_values(value)
        return ready(out * signed)
      })
    }

    if(sign) {
      stream.read(1, function(signed) { read_main(~~signed[0] ? -1 : 1) })
    } else {
      read_main(1)
    }
  }

  function write(stream, value) {
    if(sign) {
      stream.write(1, [value > 0 ? 0 : 1])
    }

    stream.write(size, [value])
  }

  return {
    read:     read
  , write:    write
  , empty:    function() { return 0 }
  , process:  process_values
  }
}

cons.types.boolean = function boolean() {
  function read (stream, ready) {
    stream.read(1, function(value) {
      ready(~~value[0] > 0)
    }) 
  }

  function write (stream, value, ready) {
    stream.write(1, [!!value ? 1 : 0])
  }
  return {
    read:   read
  , write:  write
  , empty:  function() { return false }
  }
}

cons.types.string = function string(char_range) {
  char_range = (char_range || 256) - 1

  var char_size = char_range.toString(2).length
    , integer = cons.types.integer(31, false)
    , chr_int = cons.types.integer(char_size, false)
    , chk_size = Math.max(char_size>>>3, 1)

  function read (stream, ready) {
    integer.read(stream, function(size) {
      

      stream.read(char_size * ~~size, function(data) {
        var out = []
        for(var i = 0, len = data.length; i < len; i += chk_size) {
          out.push(
            String.fromCharCode(chr_int.process(data.slice(i, i+chk_size)))  
          )
        }
        ready(out.join(''))
      })
    })
  }

  function write (stream, value) {
    integer.write(stream, value.length)
    ;[].slice.call(value).forEach(function(item) {
        return chr_int.write(stream, item.charCodeAt(0) % char_range)
    })
  } 

  return {
    read:   read
  , write:  write
  , empty:  function() { return '' }
  }
}


cons.types.link = function link(to_definition) {
  function read (stream, ready) {
    to_definition.hydrate(stream, ready)
  }

  function write (stream, instance) {
    to_definition.dehydrate(stream, instance)
  }

  return {
    read:   read
  , write:  write
  , empty:  function() { return null }
  }
}

cons.types.list = function list(sequence) {

  var integer = cons.types.integer(31, false)

  function read (stream, ready) {
    integer.read(stream, function(len) {
      var i = 0
        , sequence_length = sequence.length
        , buffer = []

      function iter() {
        if(buffer.length >= len) {
          return ready(buffer)
        }

        sequence[buffer.length % sequence_length].read(stream, function(value) {
          buffer[buffer.length] = value
          iter()
        })
      }

      iter()
    })
  }

  function write (stream, value) {
    var length = sequence.length
    integer.write(stream, value.length)
    for(var i = 0, len = value.length; i < len; ++i) {
      sequence[i % length].write(stream, value[i]) 
    }
  }

  return {
    read:   read
  , write:  write
  , empty:  function() { return [] }
  }
}

if(typeof module !== 'undefined')
  module.exports = Pack
else
  window.pacman = Pack

})()
