(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

window.awebooking = {};

var accounting = require('accounting');
var Dropdown = require('./core/dropdown');

(function ($, plugin) {
  'use strict';

  // Main objects

  plugin.utils = plugin.instances = {};

  plugin.utils.dropdown = function (el, config) {
    $(el).each(function () {
      $(this).data('abrs-dropdown', new Dropdown(this, config));
    });
  };

  plugin.i18n = window._awebooking_i18n || {};

  plugin.config = Object.assign({}, window._awebooking, {
    route: window.location.origin + '?awebooking_route=/',
    ajax_url: window.location.origin + '/wp-admin/admin-ajax.php'
  });

  /**
   * The admin route.
   *
   * @param  {string} route
   * @return {string}
   */
  plugin.route = function (route) {
    return this.config.route + (route || '').replace(/^\//g, '');
  };

  /**
   * Create new datepicker.
   *
   * @see https://flatpickr.js.org/options/
   *
   * @return {flatpickr}
   */
  plugin.datepicker = function (instance, options) {
    var i18n = plugin.i18n;
    var defaults = plugin.config.datepicker;
    var disable = Array.isArray(defaults.disable) ? defaults.disable : [];

    if (Array.isArray(defaults.disableDays)) {
      disable.push(function (date) {
        return defaults.disableDays.indexOf(date.getDay()) !== -1;
      });
    }

    // const minDate = new Date().fp_incr(defaults.min_date);
    // const maxDate = (defaults.max_date && defaults.max_date !== 0) ? new Date().fp_incr(defaults.max_date) : '';

    var fp = flatpickr(instance, Object.assign({}, options, {
      dateFormat: 'Y-m-d',
      ariaDateFormat: i18n.dateFormat,
      minDate: 'today',
      // maxDate: max_date,
      // disable: disable,
      showMonths: defaults.showMonths || 1,
      enableTime: false,
      enableSeconds: false,
      onReady: function onReady(_, __, fp) {
        fp.calendarContainer.classList.add('awebooking-datepicker');
      }
    }));

    return fp;
  };

  /**
   * Format the price.
   *
   * @param amount
   * @returns {string}
   */
  plugin.formatPrice = function (amount) {
    return accounting.formatMoney(amount, {
      format: plugin.i18n.priceFormat,
      symbol: plugin.i18n.currencySymbol,
      decimal: plugin.i18n.decimalSeparator,
      thousand: plugin.i18n.priceThousandSeparator,
      precision: plugin.i18n.numberDecimals
    });
  };

  /**
   * Document ready.
   *
   * @return {void}
   */
  $(function () {
    window.tippy('[data-awebooking="tooltip"]', {
      theme: 'awebooking-tooltip'
    });

    $('[data-init="awebooking-dialog"]').each(function (e, el) {
      var dialog = new window.A11yDialog(el);

      dialog.on('show', function () {
        el.classList.add('open');
        el.removeAttribute('aria-hidden');
      });

      dialog.on('hide', function () {
        el.classList.remove('open');
        el.setAttribute('aria-hidden', true);
      });
    });
  });
})(jQuery, window.awebooking);

},{"./core/dropdown":2,"accounting":4}],2:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Util = require('./util');

var Dropdown = function ($, Popper) {
  'use strict';

  // Store drops instance.

  var allDrops = [];

  var defaults = {
    offset: 0,
    flip: true,
    openOn: 'click',
    boundary: 'scrollParent',
    reference: 'toggle',
    display: 'dynamic',
    dropClass: '.drop-content'
  };

  var Dropdown = function () {
    function Dropdown(element, options) {
      _classCallCheck(this, Dropdown);

      this.element = element;
      this.options = Object.assign({}, defaults, options);
      this.drop = this._getDropElement();
      this.popper = null;

      if (!this.drop || typeof this.drop === 'undefined') {
        throw new Error('Drop Error: Cannot find the drop element.');
      }

      if (typeof Popper !== 'undefined' && !this.popper) {
        var referenceElement = this.element;
        this.popper = new Popper(referenceElement, this.drop, this._getPopperConfig());
      }

      this.transitionEndHandler = this._transitionEndHandler.bind(this);
      this._addEventListeners();

      allDrops.push(this);
    }

    _createClass(Dropdown, [{
      key: 'isOpened',
      value: function isOpened() {
        return this.drop.classList.contains('open');
      }
    }, {
      key: 'isDisabled',
      value: function isDisabled() {
        return this.element.disabled || this.element.classList.contains('disabled');
      }
    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isOpened()) {
          this.close();
        } else {
          this.open();
        }
      }
    }, {
      key: 'open',
      value: function open() {
        var _this = this;

        if (this.isDisabled() || this.isOpened()) {
          return;
        }

        // If this is a touch-enabled device we add extra
        // empty mouseover listeners to the body's immediate children;
        // only needed because of broken event delegation on iOS
        // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
        if ('ontouchstart' in document.documentElement) {
          $(document.body).children().on('mouseover', null, $.noop);
        }

        if (this.popper) {
          this.popper.update();
        }

        this.element.focus();
        this.element.setAttribute('aria-expanded', true);

        this.drop.classList.add('open');
        this.drop.classList.add('open--transition');
        setTimeout(function () {
          _this.drop.classList.add('open--completed');
        });
      }
    }, {
      key: 'close',
      value: function close() {
        if (this.isDisabled() || !this.isOpened()) {
          return;
        }

        // If this is a touch-enabled device we remove the extra
        // empty mouseover listeners we added for iOS support
        if ('ontouchstart' in document.documentElement) {
          $(document.body).children().off('mouseover', null, $.noop);
        }

        this.element.setAttribute('aria-expanded', false);

        this.drop.classList.remove('open');
        this.drop.classList.remove('open--completed');

        this.drop.addEventListener(Util.TRANSITION_END, this.transitionEndHandler);
      }

      // TODO: ...

    }, {
      key: '_transitionEndHandler',
      value: function _transitionEndHandler(e) {
        if (e.target !== e.currentTarget) {
          return;
        }

        if (!this.drop.classList.contains('open')) {
          this.drop.classList.remove('open--transition');
        }

        this.drop.removeEventListener(Util.TRANSITION_END, this.transitionEndHandler);
      }
    }, {
      key: '_addEventListeners',
      value: function _addEventListeners() {
        var _this2 = this;

        if (!this.options.openOn) {
          return;
        }

        if (this.options.openOn === 'always') {
          setTimeout(this.open.bind(this));
          return;
        }

        var events = this.options.openOn.split(' ');

        if (events.indexOf('click') >= 0) {
          $(this.element).on('click', function (e) {
            e.preventDefault();
            // e.stopPropagation();

            _this2.toggle();
          });

          $(document).on('click', function (e) {
            if (!_this2.isOpened()) {
              return;
            }

            // Clicking inside dropdown
            if (e.target === _this2.drop || _this2.drop.contains(e.target)) {
              return;
            }

            // Clicking target
            if (e.target === _this2.element || _this2.element.contains(e.target)) {
              return;
            }

            // this.close(e);
          });
        }

        if (events.indexOf('hover') >= 0) {
          // TODO: ...
        }

        if (events.indexOf('focus') >= 0) {
          // TODO: ...
        }
      }
    }, {
      key: '_getDropElement',
      value: function _getDropElement() {
        if (!this.drop) {
          var parent = this.element.parentNode;
          var target = Util.getTargetFromElement(this.element);

          if (target) {
            this.drop = document.querySelector(target);
          } else {
            this.drop = parent ? parent.querySelector(this.options.dropClass) : null;
          }
        }

        return this.drop;
      }
    }, {
      key: '_getPopperConfig',
      value: function _getPopperConfig() {
        var _this3 = this;

        var offset = {};

        if (typeof this.options.offset === 'function') {
          offset.fn = function (data) {
            data.offsets = Object.assign({}, data.offsets, _this3.options.offset(data.offsets) || {});
            return data;
          };
        } else {
          offset.offset = this.options.offset;
        }

        var config = {
          placement: this._getPlacement(),
          modifiers: {
            offset: offset,
            flip: { enabled: this.options.flip },
            preventOverflow: { boundariesElement: this.options.boundary }
          }
        };

        // Disable Popper.js if we have a static display.
        if (this.options.display === 'static') {
          config.modifiers.applyStyle = {
            enabled: false
          };
        }

        return config;
      }
    }, {
      key: '_getPlacement',
      value: function _getPlacement() {
        return 'bottom-start';
      }
    }]);

    return Dropdown;
  }();

  return Dropdown;
}(jQuery, window.Popper);

// Export the module.
module.exports = Dropdown;

},{"./util":3}],3:[function(require,module,exports){
'use strict';

var Util = function ($) {
  'use strict';

  function getTransitionEndEvent() {
    var transitionEndEvent = '';

    var transitionEndEvents = {
      'WebkitTransition': 'webkitTransitionEnd',
      'MozTransition': 'transitionend',
      'OTransition': 'otransitionend',
      'transition': 'transitionend'
    };

    for (var name in transitionEndEvents) {
      if ({}.hasOwnProperty.call(transitionEndEvents, name)) {
        var tempEl = document.createElement('p');
        if (typeof tempEl.style[name] !== 'undefined') {
          transitionEndEvent = transitionEndEvents[name];
        }
      }
    }

    return transitionEndEvent;
  }

  return {
    TRANSITION_END: getTransitionEndEvent(),

    getTargetFromElement: function getTargetFromElement(element) {
      var selector = element.getAttribute('data-target');

      if (!selector || selector === '#') {
        selector = element.getAttribute('href') || '';
      }

      try {
        return document.querySelector(selector) ? selector : null;
      } catch (err) {
        return null;
      }
    },
    getTransitionDurationFromElement: function getTransitionDurationFromElement(element) {
      if (!element) {
        return 0;
      }

      // Get transition-duration of the element.
      var transitionDuration = $(element).css('transition-duration');
      var floatTransitionDuration = parseFloat(transitionDuration);

      // Return 0 if element or transition duration is not found.
      if (!floatTransitionDuration) {
        return 0;
      }

      // If multiple durations are defined, take the first.
      transitionDuration = transitionDuration.split(',')[0];

      return parseFloat(transitionDuration) * 1000;
    }
  };
}(jQuery);

module.exports = Util;

},{}],4:[function(require,module,exports){
"use strict";

/*!
 * accounting.js v0.4.1
 * Copyright 2014 Open Exchange Rates
 *
 * Freely distributable under the MIT license.
 * Portions of accounting.js are inspired or borrowed from underscore.js
 *
 * Full details and documentation:
 * http://openexchangerates.github.io/accounting.js/
 */

(function (root, undefined) {

	/* --- Setup --- */

	// Create the local library object, to be exported or referenced globally later
	var lib = {};

	// Current version
	lib.version = '0.4.1';

	/* --- Exposed settings --- */

	// The library's settings configuration object. Contains default parameters for
	// currency and number formatting
	lib.settings = {
		currency: {
			symbol: "$", // default currency symbol is '$'
			format: "%s%v", // controls output: %s = symbol, %v = value (can be object, see docs)
			decimal: ".", // decimal point separator
			thousand: ",", // thousands separator
			precision: 2, // decimal places
			grouping: 3 // digit grouping (not implemented yet)
		},
		number: {
			precision: 0, // default precision on numbers is 0
			grouping: 3, // digit grouping (not implemented yet)
			thousand: ",",
			decimal: "."
		}
	};

	/* --- Internal Helper Methods --- */

	// Store reference to possibly-available ECMAScript 5 methods for later
	var nativeMap = Array.prototype.map,
	    nativeIsArray = Array.isArray,
	    toString = Object.prototype.toString;

	/**
  * Tests whether supplied parameter is a string
  * from underscore.js
  */
	function isString(obj) {
		return !!(obj === '' || obj && obj.charCodeAt && obj.substr);
	}

	/**
  * Tests whether supplied parameter is a string
  * from underscore.js, delegates to ECMA5's native Array.isArray
  */
	function isArray(obj) {
		return nativeIsArray ? nativeIsArray(obj) : toString.call(obj) === '[object Array]';
	}

	/**
  * Tests whether supplied parameter is a true object
  */
	function isObject(obj) {
		return obj && toString.call(obj) === '[object Object]';
	}

	/**
  * Extends an object with a defaults object, similar to underscore's _.defaults
  *
  * Used for abstracting parameter handling from API methods
  */
	function defaults(object, defs) {
		var key;
		object = object || {};
		defs = defs || {};
		// Iterate over object non-prototype properties:
		for (key in defs) {
			if (defs.hasOwnProperty(key)) {
				// Replace values with defaults only if undefined (allow empty/zero values):
				if (object[key] == null) object[key] = defs[key];
			}
		}
		return object;
	}

	/**
  * Implementation of `Array.map()` for iteration loops
  *
  * Returns a new Array as a result of calling `iterator` on each array value.
  * Defers to native Array.map if available
  */
	function map(obj, iterator, context) {
		var results = [],
		    i,
		    j;

		if (!obj) return results;

		// Use native .map method if it exists:
		if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);

		// Fallback for native .map:
		for (i = 0, j = obj.length; i < j; i++) {
			results[i] = iterator.call(context, obj[i], i, obj);
		}
		return results;
	}

	/**
  * Check and normalise the value of precision (must be positive integer)
  */
	function checkPrecision(val, base) {
		val = Math.round(Math.abs(val));
		return isNaN(val) ? base : val;
	}

	/**
  * Parses a format string or object and returns format obj for use in rendering
  *
  * `format` is either a string with the default (positive) format, or object
  * containing `pos` (required), `neg` and `zero` values (or a function returning
  * either a string or object)
  *
  * Either string or format.pos must contain "%v" (value) to be valid
  */
	function checkCurrencyFormat(format) {
		var defaults = lib.settings.currency.format;

		// Allow function as format parameter (should return string or object):
		if (typeof format === "function") format = format();

		// Format can be a string, in which case `value` ("%v") must be present:
		if (isString(format) && format.match("%v")) {

			// Create and return positive, negative and zero formats:
			return {
				pos: format,
				neg: format.replace("-", "").replace("%v", "-%v"),
				zero: format
			};

			// If no format, or object is missing valid positive value, use defaults:
		} else if (!format || !format.pos || !format.pos.match("%v")) {

			// If defaults is a string, casts it to an object for faster checking next time:
			return !isString(defaults) ? defaults : lib.settings.currency.format = {
				pos: defaults,
				neg: defaults.replace("%v", "-%v"),
				zero: defaults
			};
		}
		// Otherwise, assume format was fine:
		return format;
	}

	/* --- API Methods --- */

	/**
  * Takes a string/array of strings, removes all formatting/cruft and returns the raw float value
  * Alias: `accounting.parse(string)`
  *
  * Decimal must be included in the regular expression to match floats (defaults to
  * accounting.settings.number.decimal), so if the number uses a non-standard decimal 
  * separator, provide it as the second argument.
  *
  * Also matches bracketed negatives (eg. "$ (1.99)" => -1.99)
  *
  * Doesn't throw any errors (`NaN`s become 0) but this may change in future
  */
	var unformat = lib.unformat = lib.parse = function (value, decimal) {
		// Recursively unformat arrays:
		if (isArray(value)) {
			return map(value, function (val) {
				return unformat(val, decimal);
			});
		}

		// Fails silently (need decent errors):
		value = value || 0;

		// Return the value as-is if it's already a number:
		if (typeof value === "number") return value;

		// Default decimal point comes from settings, but could be set to eg. "," in opts:
		decimal = decimal || lib.settings.number.decimal;

		// Build regex to strip out everything except digits, decimal point and minus sign:
		var regex = new RegExp("[^0-9-" + decimal + "]", ["g"]),
		    unformatted = parseFloat(("" + value).replace(/\((.*)\)/, "-$1") // replace bracketed values with negatives
		.replace(regex, '') // strip out any cruft
		.replace(decimal, '.') // make sure decimal point is standard
		);

		// This will fail silently which may cause trouble, let's wait and see:
		return !isNaN(unformatted) ? unformatted : 0;
	};

	/**
  * Implementation of toFixed() that treats floats more like decimals
  *
  * Fixes binary rounding issues (eg. (0.615).toFixed(2) === "0.61") that present
  * problems for accounting- and finance-related software.
  */
	var toFixed = lib.toFixed = function (value, precision) {
		precision = checkPrecision(precision, lib.settings.number.precision);
		var power = Math.pow(10, precision);

		// Multiply up by precision, round accurately, then divide and use native toFixed():
		return (Math.round(lib.unformat(value) * power) / power).toFixed(precision);
	};

	/**
  * Format a number, with comma-separated thousands and custom precision/decimal places
  * Alias: `accounting.format()`
  *
  * Localise by overriding the precision and thousand / decimal separators
  * 2nd parameter `precision` can be an object matching `settings.number`
  */
	var formatNumber = lib.formatNumber = lib.format = function (number, precision, thousand, decimal) {
		// Resursively format arrays:
		if (isArray(number)) {
			return map(number, function (val) {
				return formatNumber(val, precision, thousand, decimal);
			});
		}

		// Clean up number:
		number = unformat(number);

		// Build options object from second param (if object) or all params, extending defaults:
		var opts = defaults(isObject(precision) ? precision : {
			precision: precision,
			thousand: thousand,
			decimal: decimal
		}, lib.settings.number),


		// Clean up precision
		usePrecision = checkPrecision(opts.precision),


		// Do some calc:
		negative = number < 0 ? "-" : "",
		    base = parseInt(toFixed(Math.abs(number || 0), usePrecision), 10) + "",
		    mod = base.length > 3 ? base.length % 3 : 0;

		// Format the number:
		return negative + (mod ? base.substr(0, mod) + opts.thousand : "") + base.substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + opts.thousand) + (usePrecision ? opts.decimal + toFixed(Math.abs(number), usePrecision).split('.')[1] : "");
	};

	/**
  * Format a number into currency
  *
  * Usage: accounting.formatMoney(number, symbol, precision, thousandsSep, decimalSep, format)
  * defaults: (0, "$", 2, ",", ".", "%s%v")
  *
  * Localise by overriding the symbol, precision, thousand / decimal separators and format
  * Second param can be an object matching `settings.currency` which is the easiest way.
  *
  * To do: tidy up the parameters
  */
	var formatMoney = lib.formatMoney = function (number, symbol, precision, thousand, decimal, format) {
		// Resursively format arrays:
		if (isArray(number)) {
			return map(number, function (val) {
				return formatMoney(val, symbol, precision, thousand, decimal, format);
			});
		}

		// Clean up number:
		number = unformat(number);

		// Build options object from second param (if object) or all params, extending defaults:
		var opts = defaults(isObject(symbol) ? symbol : {
			symbol: symbol,
			precision: precision,
			thousand: thousand,
			decimal: decimal,
			format: format
		}, lib.settings.currency),


		// Check format (returns object with pos, neg and zero):
		formats = checkCurrencyFormat(opts.format),


		// Choose which format to use for this value:
		useFormat = number > 0 ? formats.pos : number < 0 ? formats.neg : formats.zero;

		// Return with currency symbol added:
		return useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(number), checkPrecision(opts.precision), opts.thousand, opts.decimal));
	};

	/**
  * Format a list of numbers into an accounting column, padding with whitespace
  * to line up currency symbols, thousand separators and decimals places
  *
  * List should be an array of numbers
  * Second parameter can be an object containing keys that match the params
  *
  * Returns array of accouting-formatted number strings of same length
  *
  * NB: `white-space:pre` CSS rule is required on the list container to prevent
  * browsers from collapsing the whitespace in the output strings.
  */
	lib.formatColumn = function (list, symbol, precision, thousand, decimal, format) {
		if (!list) return [];

		// Build options object from second param (if object) or all params, extending defaults:
		var opts = defaults(isObject(symbol) ? symbol : {
			symbol: symbol,
			precision: precision,
			thousand: thousand,
			decimal: decimal,
			format: format
		}, lib.settings.currency),


		// Check format (returns object with pos, neg and zero), only need pos for now:
		formats = checkCurrencyFormat(opts.format),


		// Whether to pad at start of string or after currency symbol:
		padAfterSymbol = formats.pos.indexOf("%s") < formats.pos.indexOf("%v") ? true : false,


		// Store value for the length of the longest string in the column:
		maxLength = 0,


		// Format the list according to options, store the length of the longest string:
		formatted = map(list, function (val, i) {
			if (isArray(val)) {
				// Recursively format columns if list is a multi-dimensional array:
				return lib.formatColumn(val, opts);
			} else {
				// Clean up the value
				val = unformat(val);

				// Choose which format to use for this value (pos, neg or zero):
				var useFormat = val > 0 ? formats.pos : val < 0 ? formats.neg : formats.zero,


				// Format this value, push into formatted list and save the length:
				fVal = useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(val), checkPrecision(opts.precision), opts.thousand, opts.decimal));

				if (fVal.length > maxLength) maxLength = fVal.length;
				return fVal;
			}
		});

		// Pad each number in the list and send back the column of numbers:
		return map(formatted, function (val, i) {
			// Only if this is a string (not a nested array, which would have already been padded):
			if (isString(val) && val.length < maxLength) {
				// Depending on symbol position, pad after symbol or at index 0:
				return padAfterSymbol ? val.replace(opts.symbol, opts.symbol + new Array(maxLength - val.length + 1).join(" ")) : new Array(maxLength - val.length + 1).join(" ") + val;
			}
			return val;
		});
	};

	/* --- Module Definition --- */

	// Export accounting for CommonJS. If being loaded as an AMD module, define it as such.
	// Otherwise, just add `accounting` to the global object
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = lib;
		}
		exports.accounting = lib;
	} else if (typeof define === 'function' && define.amd) {
		// Return the library as an AMD module:
		define([], function () {
			return lib;
		});
	} else {
		// Use accounting.noConflict to restore `accounting` back to its original value.
		// Returns a reference to the library's `accounting` object;
		// e.g. `var numbers = accounting.noConflict();`
		lib.noConflict = function (oldAccounting) {
			return function () {
				// Reset the value of the root's `accounting` variable:
				root.accounting = oldAccounting;
				// Delete the noConflict method:
				lib.noConflict = undefined;
				// Return reference to the library to re-assign it:
				return lib;
			};
		}(root.accounting);

		// Declare `fx` on the root (global/window) object:
		root['accounting'] = lib;
	}

	// Root will be `window` in browser or `global` on the server:
})(undefined);

},{}]},{},[1]);

//# sourceMappingURL=awebooking.js.map
