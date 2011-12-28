;(function() {

function Stream(data) {
  this.data = data || []
  this.write_buffer = []
  this.cursor = 0
}

var proto = Stream.prototype
  , cons = proto.constructor

proto.read = function(bits, ready) {
  var out = []
    , into = 0
    , into_pos = 0
    , idx = Math.floor(this.cursor/8)
    , value = this.data[idx]
    , offs = this.cursor % 8
    , end = this.cursor + bits

  var s_idx = idx

  while(this.cursor !== end) {

    // finish the byte if we've filled 8 positions in the byte
    if(into_pos % 8 === 0 && into_pos > 0) {
      out.push(into)
      into = into_pos = 0
    }

    // bump the current value if we're on a byte boundary
    // and the boundary isn't the first index.
    if(this.cursor % 8 === 0 && this.cursor > 0) {
      ++idx
      value = this.data[idx]
    }

    var tmp = into

    into |= ((value & (1 << offs)) >>> offs) << into_pos

    ++into_pos
    ++this.cursor
    offs = (this.cursor % 8)

  }

  out.push(into)

  if(this.cursor % 8 === 0) {
    ++this.cursor
  }

  return ready(out)
}

proto.write_byte = function(byt, a) {
  var tmp = this.write_buffer[this.write_buffer.length-1]
  this.write_buffer[this.write_buffer.length-1] = byt
}

proto.write = function(bits_per_value, values) {
  var into = this.write_buffer[this.write_buffer.length-1]

  for(var i = 0, len = values.length, value; value = values[i], i < len; ++i) {
    for(var x = 0; x < bits_per_value; ++x) {
      // every time we hit a write buffer byte offset
      // push the current value into the buffer if we're not at the first position
      // set the into value to a new value in the write_buffer.
      if(this.cursor % 8 === 0) {
        if(this.cursor > 0)
          this.write_byte(into, '-')

        into = this.write_buffer[this.write_buffer.length] = 0
      }

      into |= (((value & (1 << x)) >>> x) & 1) << (this.cursor%8)

      ++this.cursor
    }

    this.write_byte(into, '*')
  }

  if(this.cursor % 8 === 0) {
    ++this.cursor
    this.write_buffer[this.write_buffer.length] = 0
  }
}

proto.flush = function() {
  // noop
}


if(typeof module !== 'undefined')
  module.exports = Stream
else
  (window.pacman = (window.pacman || {})).stream = Stream
})()
