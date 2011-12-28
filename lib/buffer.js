;(function() {

var Stream = typeof window === 'undefined' ? require('./stream') : window.pacman.stream
  , Buffer = typeof window === 'undefined' ? require('buffer').Buffer : window.Uint8Array

function BufferStream(buffer) {
  this.buffer = buffer
  Stream.call(this, [].slice.call(buffer))
}

BufferStream.prototype = new Stream

var proto = BufferStream.prototype
  , cons = BufferStream

proto.flush = function() {
  this.data = new Buffer(this.write_buffer)
}

if(typeof module !== 'undefined')
  module.exports = BufferStream
else
  (window.pacman = (window.pacman || {})).buffer = BufferStream

})()
