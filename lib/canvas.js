;(function() {

var dbg = /debug/g.test(window.location) ? console.log.bind(console) : function(){}

function CanvasStream(canvas, context, alpha_enabled) {
  this.canvas = canvas
  this.alpha_enabled = alpha_enabled
  this.context = context

  this.width = canvas.width
  this.height = canvas.height

  this.data = this.context.getImageData(0, 0, this.width, this.height).data

  // omit alpha bytes.
  if(!this.alpha_enabled) {
    var data = []
    for(var i = 0; i < this.data.length; i += 4) {
      data[data.length] = this.data[i]
      data[data.length] = this.data[i+1]
      data[data.length] = this.data[i+2] 
    }
    this.data = data
  }

  this.write_buffer = []
  this.cursor = 0
}

var proto = CanvasStream.prototype
  , cons = proto.constructor

var masks = [
  255 
, 127
, 63
, 31
, 15
, 7
, 3
, 1
]

var pad = function(x) {
  x = x.toString(2)
  while(x.length < 8)
    x = '0' + x
  return x
}

window.pad = pad

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
      dbg('<-- output', pad(into), pad(value), into_pos, s_idx, idx)
      into = into_pos = 0
    }

    // bump the current value if we're on a byte boundary
    // and the boundary isn't the first index.
    if(this.cursor % 8 === 0 && this.cursor > 0) {
      ++idx
      value = this.data[idx]
      dbg('<-- value', pad(value), idx, this.cursor % 8, this.cursor)
    }

    var tmp = into

    into |= ((value & (1 << offs)) >>> offs) << into_pos

    ++into_pos
    ++this.cursor
    offs = (this.cursor % 8)

  }

  dbg('<-- output', pad(into), pad(value), into_pos, s_idx, idx, this.data.map(pad).join(''))
  out.push(into)

  if(this.cursor % 8 === 0) {
    ++this.cursor
  }

  return ready(out)
}

proto.write_byte = function(byt, a) {
  var tmp = this.write_buffer[this.write_buffer.length-1]
  dbg(a+' write ', pad(byt))
  this.write_buffer[this.write_buffer.length-1] = byt
}

proto.write = function(bits_per_value, values) {
  var into = this.write_buffer[this.write_buffer.length-1]

  dbg('recv write ', values.map(pad).join(''))
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
  var size = this.write_buffer.length
    , pixels = Math.ceil(size/3)
    , no_alpha = Math.ceil(pixels/4)
    , sqrt = Math.sqrt(pixels + no_alpha)
    , data

  this.canvas.width = Math.floor(sqrt)
  this.canvas.height = Math.ceil(sqrt)
  this.context = this.canvas.getContext('2d')

  data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
  var o_idx = 0

  for(var i = 0; i < size; ++i, ++o_idx) {
    i > 0 && i % 3 === 0 && (data.data[o_idx] = 255, ++o_idx) 

    data.data[o_idx] = this.write_buffer[i]
  }
  while(o_idx < data.data.length)
    data.data[o_idx++] = 255

  this.context.globalCompositeOperation = 'copy'
  this.context.putImageData(data, 0, 0)
  this.data = data.data
}


if(typeof module !== 'undefined')
  module.exports = CanvasStream
else
  (window.pacman = (window.pacman || {})).canvas = CanvasStream
})()
