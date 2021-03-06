# Dancer.js

This is pretty rough around the edges. Anyway, here's the deal.

## Overview
Dancer is a parasitic web framework.  It does not attempt to be a web framework
in its own right, but rather to piggyback on what some other web framework is
doing.  It achieves this by using the `MutationObserver` class to watch when nodes
are added or removed from the DOM and when classes are added and removed from an
element.

The idea is to use this when you simply do not have access to the execution
context of another framework, but you can see the DOM.  For example, this is the case
when implementing a Chrome plugin.

## Lifecycle
`init` -> `attach` -> `detach` -> `destroy`

* `init` fires when a class is attached to an element
* `attach` fires when a component is attached to the DOM
* `detach` fires when a component is removed from the DOM
* `destroy` fires when a class is removed from an element

These lifecycle events do not receive arguments. `this` is set to the
Dancer object.  If you use es6 you should take care to use
`function(){}` syntax and not `()=>{}` syntax as this will bind `this`
to the wrong value.

`init` and `attach` fire in order if a new element is attached with a class.
`detach` and `destroy` fire in order if a class is removed from an attached component.

Dancer matches on classes for the moment. You must register a component for
each class and no DOM node should have two of these classes at the same time.
You can use the lifecycle methods to react when the underlying web app creates
something.

## Other callbacks
* `attribute` fires with the name of an attribute and its new value, if an attribute is changed.

The class attribute is currently filtered out, as is `dancerid`.

## Watching a subtree
```
Dancer.observe(document.body);
```

## Adding a component
```
Dancer.register("honk", {
  attach: function() { this.element.style.backgroundColor = "green"; },
  detach: function() { this.element.style.backgroundColor = "initial"; },
  honk: function() { console.log("honk!"); },
});
```

## Manipulating your object
```
var element = document.querySelector(".honk");
var honk = Dancer.for(element);
honk.honk();
```
