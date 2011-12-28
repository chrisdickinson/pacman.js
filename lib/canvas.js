;(function() {
var Stream = typeof window === 'undefined' ? require('./stream') : window.pacman.stream

function CanvasStream(canvas) {
  this.canvas = canvas
  this.context = this.canvas.getContext('2d')
  this.data = this.context.getImageData(0, 0, canvas.width, canvas.height).data
  var data = []
  for(var i = 0; i < this.data.length; i += 4) {
    data[data.length] = this.data[i]
    data[data.length] = this.data[i+1]
    data[data.length] = this.data[i+2] 
  }
  Stream.call(this, data)
}

CanvasStream.prototype = new Stream

var proto = CanvasStream.prototype
  , cons = proto.constructor

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
