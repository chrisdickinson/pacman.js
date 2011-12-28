;(function(exports) {

  exports.ok = function(val) {
    if(!val) {
      throw new Error('not ok: ' + val)
    }
  }

  exports.list_equal = function(lhs, rhs) {
    exports.equal(lhs.length, rhs.length, 'length mismatch')
    for(var i = 0, len = lhs.length; i < len; ++i)
      exports.equal(lhs[i], rhs[i])
  }

  exports.equal = function(lhs, rhs) {
    if(lhs != rhs) {
      throw new Error('lhs ("'+lhs+'") should == rhs ("'+rhs+'") ' + [].slice.call(arguments, 2).join(', '))
    }
  } 

  exports.notEqual = function(lhs, rhs) {
    if(lhs == rhs) {
      throw new Error('lhs ("'+lhs+'") should != rhs ("'+rhs+'") ' + [].slice.call(arguments, 2).join(', '))
    }
  } 

})(window.assert = {})
