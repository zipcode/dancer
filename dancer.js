'use strict';

window.Dancer = (function () {
  var arr = function (a) {
    return Array.prototype.slice.call(a);
  }

  // A mapping from DOM class to element constructor
  var registry = {};
  var elements = [];

  function Component(element) {
    elements.push(this);
    element.setAttribute("dancerId", elements.length - 1);
    this._element = element;
    this.attach();
  }

  Component.for = function(element) {
    if (element.getAttribute(dancerId)) {
      return elements[dancerId];
    }
  }

  Component.match = function(element) {
    if (!element || element.nodeType != Node.ELEMENT_NODE) return;
    var constructor;
    for (var i in arr(element.classList)) {
      var c = element.classList[i];
      if (registry[c]) {
        if (constructor) throw new Error("Multiple constructors match", constructor.className, c, element);
        constructor = registry[c];
      }
    }
    return constructor;
  }

  Component.register = function(className, constructor) {
    var proto = Object.create(Component.prototype);
    for (var key in Object.keys(constructor)) {
      if (constructor.hasOwnProperty(key)) {
        proto[key] = constructor.key;
      }
    }
    function Constructor(element) {
      Component.call(this, element);
    }
    Constructor.prototype = proto;
    Constructor.prototype.className = className;
    registry[className] = Constructor;
    return Constructor;
  }

  Component.prototype = {
    attach: function() {
      console.log("Attached a", this.className);
    },
    detach: function() {
      console.log("Detached a", thisa.className);
    }
  };

  var observer = new MutationObserver(function (records) {
    arr(records).map(function (record) {
      arr(record.addedNodes).map(function (node) {
        if (node.nodeType != Node.ELEMENT_NODE) return;
        console.log("Added", node);
      });
      arr(record.removedNodes).map(function (node) {
        if (node.nodeType != Node.ELEMENT_NODE) return;
        console.log("Removed", node);
      });
      if (record.attributeName) {
        console.log("Attr", record.attributeName, record.target);
      }
    });
  });

  function observe(element) {
    return observer.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class'],
    });
  }

  function disconnect(element) { return observer.disconnect(element); }

  return {
    observe: observe,
    disconnect: disconnect,
    Component: Component,
    register: Component.register.bind(Component),
    _registry: registry,
  };
})();
