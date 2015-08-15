'use strict';

(function () {
  // Helper function because JS is full of array-like objects.
  var arr = function (a) {
    return Array.prototype.slice.call(a);
  }

  // Local subcopy of the console.  Later we might hook this to appear on
  // the page, or not spam things up in debug mode, or whatever.
  var console = {
    log: window.console.log.bind(window.console),
    warn: window.console.warn.bind(window.console),
    error: window.console.error.bind(window.console),
  };

  // A mapping from DOM class to element constructor
  var registry = {};
  // A mapping from an element ID to its Component
  var elements = [];
  // The root we're observing
  var rootNode = null;

  // Component constructor.
  // Here we do administration related to tracking: setting ID, putting it in
  // the element registry.
  // Everything else runs in _init().
  function Component(element) {
    elements.push(this);
    element.setAttribute("dancerId", elements.length - 1);
    this.element = element;
    this._init();
  }

  // Look up a component from an element
  Component.for = function(element) {
    if (element.getAttribute("dancerId")) {
      return elements[element.getAttribute("dancerId")];
    }
  }

  // Look up a prospective Constructor for an element
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

  // Add a component to the registry.
  // Arguments are a class name to match and an object.
  // The object is copied over to our namespace and given an
  // appropriate prototype.
  // User should implement `attach`, `detach`, `init`, `destroy`.
  Component.register = function(className, constructor) {
    var proto = Object.create(Component.prototype);
    for (var key in constructor) {
      proto[key] = constructor[key];
    }
    function Constructor(element) {
      Component.call(this, element);
    }
    Constructor.prototype = proto;
    Constructor.prototype.className = className;
    registry[className] = Constructor;

    // Get everything already in the document
    arr(rootNode.querySelectorAll("." + className)).map(attachNode);

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
      // This is purely for spotting when a class is removed from an object
      // while it is detached from the DOM
      this.observer = new MutationObserver(observerFunction);
      this.observer.observe(this.element, {
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
      delete elements[this.element.getAttribute("dancerId")];
      this.element.removeAttribute("dancerId");
      this.destroy();
      this.observer.disconnect(this.element);
    },
    destroy: function() {
      console.log("Destroyed a", this.className);
    }
  };

  // Fired when an element is attached.  Either look it up and send it the
  // event or create it from whole cloth.
  function attachNode(node) {
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
  }

  var observerFunction = function (records) {
    arr(records).map(function (record) {
      arr(record.addedNodes).map(function (node) {
        if (node.nodeType != Node.ELEMENT_NODE) return;
        // Hunt for other components in the subtree and attach
        for (var className in registry) {
          var selector = "." + className;
          arr(node.querySelectorAll(selector)).map(attachNode);
        }
        // Attach root
        attachNode(node);
      });
      arr(record.removedNodes).map(function (node) {
        if (node.nodeType != Node.ELEMENT_NODE) return;
        // Hunt for Components in the subtree and detach
        var subtree = arr(node.querySelectorAll("[dancerId]"));
        for (var i in subtree) {
          var component = Component.for(subtree[i]);
          if (component) component._detach();
        }
        // Detach
        var component = Component.for(node);
        if (component) component._detach();
      });
      if (record.attributeName) {
        // Create a fake element just so we can get a classList
        var tmp = document.createElement("div");
        tmp.setAttribute(record.attributeName, record.oldValue);
        var nextClasses = record.target.classList;
        var prevClasses = tmp.classList;
        // Process a class being removed
        var component = Component.for(record.target);
        if (component
            && !nextClasses.contains(component.className)) {
              component._destroy();
        }
        // Process a class being added
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

  // Master observer
  var observer = new MutationObserver(observerFunction);

  function observe(element) {
    var res = observer.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class'],
    });
    rootNode = element;
    attachNode(element);
    return res;
  }

  function disconnect(element) { return observer.disconnect(element); }

  var Dancer = {
    for: Component.for.bind(Component),
    observe: observe,
    disconnect: disconnect,
    Component: Component,
    register: Component.register.bind(Component),
    _registry: registry,
  };

  if (typeof define == 'function' && define.amd) {
    define(Dancer);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dancer;
  } else {
    this.Dancer = Dancer;
  }
}).call(this);
