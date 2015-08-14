'use strict';

window.Dancer = (function () {
  var arr = function (a) {
    return Array.prototype.slice.call(a);
  }

  var console = {
    log: window.console.log.bind(window.console),
    warn: window.console.warn.bind(window.console),
    error: window.console.error.bind(window.console),
  };

  // A mapping from DOM class to element constructor
  var registry = {};
  var elements = [];

  function Component(element) {
    elements.push(this);
    element.setAttribute("dancerId", elements.length - 1);
    this._element = element;
    this._init();
  }

  Component.for = function(element) {
    if (element.getAttribute("dancerId")) {
      return elements[element.getAttribute("dancerId")];
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
    _attach: function () {
      this._attached = true;
      this.attach();
    },
    _detach: function () {
      this._attached = false;
      this.detach();
    },
    attach: function() {
      console.log("Attached a", this.className);
    },
    detach: function() {
      console.log("Detached a", this.className);
    },
    init: function () {
      console.log("Inited a", this.className);
    },
    _init: function() {
      this.observer = new MutationObserver(observerFunction);
      this.observer.observe(this._element, {
        attributes: true,
        oldAttributeValue: true,
        attributeFilter: ["class"],
      });
      this.init();
      this._attach();
    },
    _destroy: function() {
      if (this._attached) {
        this._detach();
      }
      delete elements[this._element.getAttribute("dancerId")];
      this._element.removeAttribute("dancerId");
      this.destroy();
      this.observer.disconnect(this._element);
    },
    destroy: function() {
      console.log("Destroyed a", this.className);
    }
  };

  var observerFunction = function (records) {
    arr(records).map(function (record) {
      arr(record.addedNodes).map(function (node) {
        if (node.nodeType != Node.ELEMENT_NODE) return;
        var component = Component.for(node);
        if (component) {
          component._attach();
        } else {
          var constructor = Component.match(node);
          if (constructor) {
            new constructor(node);
          }
        }
      });
      arr(record.removedNodes).map(function (node) {
        if (node.nodeType != Node.ELEMENT_NODE) return;
        var component = Component.for(node);
        if (component) {
          component._detach();
        }
      });
      if (record.attributeName) {
        var tmp = document.createElement("div");
        tmp.setAttribute(record.attributeName, record.oldValue);
        var nextClasses = record.target.classList;
        var prevClasses = tmp.classList;
        // Process declassing
        var component = Component.for(record.target);
        if (component
            && !nextClasses.contains(component.className)) {
              component._destroy();
        }
        // Process enclassing
        nextClasses.forEach(function (c) {
          if (!(prevClasses.contains(c))) {
            if (registry[c]) {
              if (Component.for(record.target)) {
                throw new Error("Attempted to add class to existing Dancer object: " + c);
              }
              new registry[c](record.target);
            }
          }
        });
      }
    });
  };
  var observer = new MutationObserver(observerFunction);

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
