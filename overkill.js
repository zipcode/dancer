function _(iterable) {
  if (!(this instanceof _)) {
    return new _(iterable);
  }

  this._iterable = iterable;

  var iterator = iterable.iterator;
  if (!(iterator instanceof Function)) {
    iterator = function () {
      var index = -1;
      return { next: function () {
        index++;
        if (index >= iterable.length) {
          return { done: true };
        } else {
          return { done: false, value: iterable[index] };
        }
      }};
    }
  }

  this.iterator = iterator;
}
_.prototype = {
  map: function(f) {
    var self = this;
    return new _({ iterator: function () {
      var iterator = self.iterator();
      return { next: function () {
        var next = iterator.next();
        if (next.done) {
          return { done: true };
        } else {
          return { done: false, value: f(next.value) };
        };
      }};
    }});
  },
  filter: function(f) {
    var self = this;
    return new _({ iterator: function () {
      var iterator = self.iterator();
      return { next: function() {
        var next = iterator.next();
        while (!next.done && !f(next.value)) {
          next = iterator.next();
        }
        if (next.done) {
          return { done:true };
        } else {
          return { done: false, value: next.value };
        }
      }};
    }});
  },
  tap: function(f) {
    var self = this;
    return new _({ iterator: function () {
      var iterator = self.iterator();
      return { next: function() {
        var next = iterator.next();
        if (!next.done) {
          f(next.value);
        }
        return next;
      }};
    }});
  }
};
Object.defineProperty(_.prototype, '_', {
  get: function() {
    var iterator = this.iterator();
    var result = [];
    var next = iterator.next();
    while (!next.done) {
      result.push(next.value);
      next = iterator.next();
    }
    return result;
  }
})
