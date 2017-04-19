/*jshint loopfunc: true */

/**
* @fileOverview
* <h3>Canvas+ internal Webview </h3>
* <p>Canvas+ allows accessing a full DOM environment via Webview. Thus, there are two environments that live together: Canvas+ and WebView. Although both are two different JavaScript environments, Cocoon allows to render a transparent Webview on top of the Canvas+ OpenGL ES rendering context and it also provides a bidirectional communication channel between them. In this way, the final visual result seems to integrate both environments seamlessly.</p>
* <p>However, as Cordova only injects automatically the required clobbers in the main webview engine, it is neccesary to add manually the following files to the content that will be sent and displayed in Canvas+ internal Webview: </p>
<ul>
   <li><a href="https://github.com/ludei/cocoon-common/blob/master/src/js/cocoon.js" target="_blank">cocoon.js</a></li>
   <li><a href="https://github.com/CocoonIO/cocoon-canvasplus/blob/master/dist/js/cocoon_canvasplus.js" target="_blank">cocoon_canvasplus.js</a></li>
</ul>
<br/>
<h3>Documentation</h3>
<p> Select the specific namespace below to open the relevant documentation section:</p>
<ul>
   <li><a href="http://ludei.github.io/cocoon-common/dist/doc/js/Cocoon.html">Cocoon</a></li>
   <li><a href="Cocoon.App.html">App</a></li>
   <li><a href="Cocoon.Device.html">Device</a></li>
   <li><a href="Cocoon.Dialog.html">Dialog</a></li>
   <li><a href="Cocoon.Motion.html">Motion</a></li>
   <li><a href="Cocoon.Proxify.html">Proxify</a></li>
   <li><a href="Cocoon.Touch.html">Touch</a></li>
   <li><a href="Cocoon.Utils.html">Utils</a></li>
   <li><a href="Cocoon.WebView.html">WebView</a></li>
   <li><a href="Cocoon.Widget.html">Widget</a></li>
</ul>
* We hope you find everything you need to get going here, but if you stumble on any problems with the docs or the plugins, 
* just drop us a line at our forums and we'll do our best to help you out.
<h3>Tools</h3>
<a href="https://forums.cocoon.io/"><img src="img/cocoon-tools-1.png" /></a>
<a href="https://cocoon.io/doc"><img src="img/cocoon-tools-2.png" /></a>
<a href="http://cocoon.io/"><img src="img/cocoon-tools-3.png" /></a>
* @version 1.0
*/

/**
* @fileOverview
* <h1>Canvas+ API documentation</h1>
* <p>Cocoon Canvas+ are multiplatform Javascript utilities that work in Canvas+. These plugins are included in Canvas+ core, so it is not required to install anything else at the cloud. The required files, if so, will be injected automatically in your project.</p> 
* <h3>Important note</h3>
* <p>Unlike old CocoonJS plugins, Cocoon Canvas+ plugins need to wait for Cordova <a href="https://cordova.apache.org/docs/en/4.0.0/cordova_events_events.md.html#deviceready">"deviceready" event</a> to start working.</p>
* @example
*   document.addEventListener("deviceready", onDeviceReady, false);
*   function onDeviceReady() {
*       // Cocoon Canvas+ code here
*   }  
*/

(function () {

    /**
    * The "Cocoon" object holds all the Cocoon Canvas+ Extensions and other stuff needed.
    <p> For more information about this specific namespace, please, visit the following link: </p>
    <li><a href="http://ludei.github.io/cocoon-common/dist/doc/js/Cocoon.html">Cocoon common documentation</a></li>
    * @namespace Cocoon
    */
    var Cocoon = window.Cocoon;
    if (!Cocoon && window.cordova && typeof require !== 'undefined') {
        require('cocoon-plugin-common.Cocoon');
    }

    /**
     * Is the native environment available? true if so.
     * @property {bool} version
     * @memberof Cocoon
     * @private
     * @example
     * if(Cocoon.nativeAvailable) { ... do native stuff here ... }
     */

    Cocoon.nativeAvailable = function () {
        return (!!window.ext);
    };

    /**
    * This utility function copies the properties from one object to a new object array, the result object array can be used as arguments when calling Cocoon.callNative()
    * @memberof Cocoon
    * @static
    * @private
    * @param {function} obj The base object that contains all properties defined.
    * @param {function} copy The object that user has defined.
    */
    Cocoon.clone = function (obj, copy) {
        if (null === obj || "object" !== typeof obj) return obj;
        var arr = [];
        for (var attr in obj) {
            if (copy.hasOwnProperty(attr)) {
                arr.push(copy[attr]);
            } else {
                arr.push(obj[attr]);
            }
        }
        return arr;
    };

    /**
    * IMPORTANT: This function should only be used by Ludei.
    * This function allows a call to the native extension object function reusing the same arguments object.
    * Why is interesting to use this function instead of calling the native object's function directly?
    * As the Cocoon object functions expicitly receive parameters, if they are not present and the native call is direcly mapped,
    * undefined arguments are passed to the native side. Some native functions do not check the parameters validation
    * correctly (just check the number of parameters passed).
    * Another solution instead of using this function call is to correctly check if the parameters are valid (not undefined) to make the
    * call, but it takes more work than using this approach.
    * @static
    * @private
    * @param {string} nativeExtensionObjectName The name of the native extension object name. The object that is a member of the 'ext' object.
    * @param {string} nativeFunctionName The name of the function to be called inside the native extension object.
    * @param {object} arguments The arguments object of the Cocoon extension object function. It contains all the arguments passed to the Cocoon extension object function and these are the ones that will be passed to the native call too.
    * @param {boolean} [async] A flag to indicate if the makeCall (false or undefined) or the makeCallAsync function should be used to perform the native call.
    * @returns Whatever the native function call returns.
    */
    Cocoon.callNative = function (nativeExtensionObjectName, nativeFunctionName, args, async) {
        if (Cocoon.nativeAvailable()) {
            var argumentsArray = Array.prototype.slice.call(args);
            argumentsArray.unshift(nativeFunctionName);
            var nativeExtensionObject = ext[nativeExtensionObjectName];
            var makeCallFunction = async ? nativeExtensionObject.makeCallAsync : nativeExtensionObject.makeCall;
            var ret = makeCallFunction.apply(nativeExtensionObject, argumentsArray);
            var finalRet = ret;
            if (typeof ret === "string") {
                try {
                    finalRet = JSON.parse(ret);
                }
                catch (error) {
                    console.log(error);
                }
            }
            return finalRet;
        }
    };

    /**
    * Returns an object retrieved from a path specified by a dot specified text path starting from a given base object.
    * It could be useful to find the reference of an object from a defined base object. For example the base object could be window and the
    * path could be "Cocoon.App" or "document.body".
    * @static
    * @param {Object} baseObject The object to start from to find the object using the given text path.
    * @param {string} objectPath The path in the form of a text using the dot notation. i.e. "document.body"
    * @private
    * @memberof Cocoon
    * For example:
    * var body = Cocoon.getObjectFromPath(window, "document.body");
    */
    Cocoon.getObjectFromPath = function (baseObject, objectPath) {
        var parts = objectPath.split('.');
        var obj = baseObject;
        for (var i = 0, len = parts.length; i < len; ++i) {
            obj[parts[i]] = obj[parts[i]] || undefined;
            obj = obj[parts[i]];
        }
        return obj;
    };

    /**
    * A class that represents objects to handle events. Event handlers have always the same structure:
    * Mainly they provide the addEventListener and removeEventListener functions.
    * Both functions receive a callback function that will be added or removed. All the added callback
    * functions will be called when the event takes place.
    * Additionally they also allow the addEventListenerOnce and notifyEventListeners functions.
    * @constructor
    * @param {string} nativeExtensionObjectName The name of the native extension object (inside the ext object) to be used.
    * @param {string} CocoonExtensionObjectName The name of the sugarized extension object.
    * @param {string} nativeEventName The name of the native event inside the ext object.
    * @param {number} [chainFunction] An optional function used to preprocess the listener callbacks. This function, if provided,
    * will be called before any of the other listeners.
    * @memberof Cocoon
    * @private
    * @static
    */
    Cocoon.EventHandler = function (nativeExtensionObjectName, CocoonExtensionObjectName, nativeEventName, chainFunction) {
        this.listeners = [];
        this.listenersOnce = [];
        this.chainFunction = chainFunction;

        /**
        * Adds a callback function so it can be called when the event takes place.
        * @param {function} listener The callback function to be added to the event handler object. See the referenced Listener function documentation for more detail in each event handler object's documentation.
        * @memberof Cocoon.EventHandler
        * @private
        * @static
        */
        this.addEventListener = function (listener) {
            if (chainFunction) {
                var f = function () {
                    chainFunction.call(this, arguments.callee.sourceListener, Array.prototype.slice.call(arguments));
                };
                listener.CocoonEventHandlerChainFunction = f;
                f.sourceListener = listener;
                listener = f;
            }

            var CocoonExtensionObject = Cocoon.getObjectFromPath(Cocoon, CocoonExtensionObjectName);
            if (CocoonExtensionObject && CocoonExtensionObject.nativeAvailable) {
                ext[nativeExtensionObjectName].addEventListener(nativeEventName, listener);
            }
            else {
                var indexOfListener = this.listeners.indexOf(listener);
                if (indexOfListener < 0) {
                    this.listeners.push(listener);
                }
            }
        };
        /**
        * Adds a callback function that will be called only one time.
        * @param {function} listener The callback function to be added to the event handler object. See the referenced Listener function documentation for more detail in each event handler object's documentation.
        * @memberof Cocoon.EventHandler
        * @private
        * @static
        */

        this.addEventListenerOnce = function (listener) {
            if (chainFunction) {
                var f = function () { chainFunction(arguments.callee.sourceListener, Array.prototype.slice.call(arguments)); };
                f.sourceListener = listener;
                listener = f;
            }

            var CocoonExtensionObject = Cocoon.getObjectFromPath(Cocoon, CocoonExtensionObjectName);
            if (CocoonExtensionObject.nativeAvailable) {
                ext[nativeExtensionObjectName].addEventListenerOnce(nativeEventName, listener);
            }
            else {
                var indexOfListener = this.listeners.indexOf(listener);
                if (indexOfListener < 0) {
                    this.listenersOnce.push(listener);
                }
            }
        };

        /**
        * Removes a callback function that was added to the event handler so it won't be called when the event takes place.
        * @param {function} listener The callback function to be removed from the event handler object. See the referenced Listener function documentation for more detail in each event handler object's documentation.
        * @memberof Cocoon.EventHandler
        * @private
        * @static
        */
        this.removeEventListener = function (listener) {

            if (chainFunction) {
                listener = listener.CocoonEventHandlerChainFunction;
                delete listener.CocoonEventHandlerChainFunction;
            }

            var CocoonExtensionObject = Cocoon.getObjectFromPath(Cocoon, CocoonExtensionObjectName);
            if (CocoonExtensionObject.nativeAvailable) {
                ext[nativeExtensionObjectName].removeEventListener(nativeEventName, listener);
            }
            else {
                var indexOfListener = this.listeners.indexOf(listener);
                if (indexOfListener >= 0) {
                    this.listeners.splice(indexOfListener, 1);
                }
            }
        };

        this.removeEventListenerOnce = function (listener) {

            if (chainFunction) {
                listener = listener.CocoonEventHandlerChainFunction;
                delete listener.CocoonEventHandlerChainFunction;
            }

            var CocoonExtensionObject = Cocoon.getObjectFromPath(Cocoon, CocoonExtensionObjectName);
            if (CocoonExtensionObject.nativeAvailable) {
                ext[nativeExtensionObjectName].removeEventListenerOnce(nativeEventName, listener);
            }
            else {
                var indexOfListener = this.listenersOnce.indexOf(listener);
                if (indexOfListener >= 0) {
                    this.listenersOnce.splice(indexOfListener, 1);
                }
            }
        };

        /**
        * @memberof Cocoon.EventHandler
        * @private
        * @static
        */

        this.notifyEventListeners = function () {
            var CocoonExtensionObject = Cocoon.getObjectFromPath(Cocoon, CocoonExtensionObjectName);
            if (CocoonExtensionObject && CocoonExtensionObject.nativeAvailable) {
                ext[nativeExtensionObjectName].notifyEventListeners(nativeEventName);
            } else {

                var argumentsArray = Array.prototype.slice.call(arguments);
                var listeners = Array.prototype.slice.call(this.listeners);
                var listenersOnce = Array.prototype.slice.call(this.listenersOnce);
                var _this = this;
                // Notify listeners after a while ;) === do not block this thread.
                setTimeout(function () {
                    for (var i = 0; i < listeners.length; i++) {
                        listeners[i].apply(_this, argumentsArray);
                    }
                    for (i = 0; i < listenersOnce.length; i++) {
                        listenersOnce[i].apply(_this, argumentsArray);
                    }
                }, 0);

                _this.listenersOnce = [];
            }
        };
        return this;
    };

    /**
    * This namespace is used to create an Event Emitter/Dispatcher that works together.
    * with the Cocoon.EventHandler.
    * @namespace Cocoon.Signal
    * @private
    */

    /**
    * This constructor creates a new Signal that holds and emits different events that are specified inside each extension.
    * @memberof Cocoon.Signal
    * @private
    * @constructs createSignal
    */
    Cocoon.createSignal = function () {
        /** @lends Cocoon.Signal.prototype */
        this.handle = null;
        this.signals = {};

        /**
        * Registers a new Signal.
        * @param {string} namespace The name of the signal which will be emitted.
        * @param {object} handle The Cocoon.EventHandler that will handle the signals.
        * @function register
        * @private
        * @example
        * signal.register("banner.ready", new Cocoon.EventHandler);
        */
        this.register = function (namespace, handle) {

            if ((!namespace) && (!handle)) throw new Error("Can't create signal " + (namespace || ""));

            if (handle.addEventListener) {
                this.signals[namespace] = handle;
                return true;
            }

            if (!handle.addEventListener) {
                this.signals[namespace] = {};
                for (var prop in handle) {
                    if (handle.hasOwnProperty(prop)) {
                        this.signals[namespace][prop] = handle[prop];
                    }
                }
                return true;
            }

            throw new Error("Can't create handler for " + namespace + " signal.");
        };

        /**
        * Exposes the already defined signals, and can be use to atach a callback to a Cocoon.EventHandler event.
        * @param {string} signal The name of the signal which will be emitted.
        * @param {object} callback The Cocoon.EventHandler that will handle the signals.
        * @param {object} params Optional parameters, example { once : true }
        * @function expose
        * @private
        * @example
        * Cocoon.namespace.on("event",function(){});
        */
        this.expose = function () {
            return function (signal, callback, params) {
                var once = false;

                if (arguments.length === 1) {
                    var that = this;
                    var fnc = function (signal) {
                        this.signal = signal;
                    };

                    fnc.prototype.remove = function (functionListener) {
                        var handle = that.signals[this.signal];
                        if (handle && handle.removeEventListener) {
                            handle.removeEventListener.apply(that, [functionListener]);
                            that.signals[this.signal] = undefined;
                        }
                    };
                    return new fnc(signal);
                }

                if ((params) && (params.once)) {
                    once = true;
                }

                if (!this.signals[signal]) throw new Error("The signal " + signal + " does not exists.");
                var handle = this.signals[signal];
                if (handle.addEventListener) {
                    if (once) {
                        handle.addEventListenerOnce(function () {
                            callback.apply(this || window, arguments);
                        });
                    } else {
                        handle.addEventListener(function () {
                            callback.apply(this || window, arguments);
                        });
                    }
                }

                if (!this.signals[signal].addEventListener) {
                    for (var prop in this.signals[signal]) {

                        if (!this.signals[signal].hasOwnProperty(prop)) continue;

                        handle = this.signals[signal][prop];

                        if (once) {
                            handle.addEventListenerOnce(function () {
                                this.clbk[this.name].apply(this || window, arguments);
                            }.bind({ name: prop, clbk: callback }));
                        } else {
                            handle.addEventListener(function () {
                                this.clbk[this.name].apply(this || window, arguments);
                            }.bind({ name: prop, clbk: callback }));
                        }

                    }
                }

            }.bind(this);
        };
    };

    //properties for old legacy code compatibility
    window.CocoonJS = window.Cocoon;
    window.c2cocoonjs = true;

})();