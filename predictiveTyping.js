/*
 * Predictive Typing 1.0.1
 *
 * Copyright (c) 2011 Laurent Guedon (tild.com)
 * Licensed under the MIT (MIT-LICENSE.txt)
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *  
 * @autors    laurent Guedon <info@tild.com>
 * @date    2011-01-26 18:11:21
 * @version    1.0.1
 */
;(function($){
    "use strict";
    
    $.predictiveTyping = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;
        
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        base.zIndex = 0;
        
        base.lblText = '';
        
        // Add a reverse reference to the DOM object
        base.$el.data("predictiveTyping", base);
        
        base.init = function()
        {
            var $el = base.$el;
            base.opts = $.extend({},$.predictiveTyping.defaultOptions, options);
            
            base.lblText = base.opts.label || $('label[for="' + base.$el.attr('id') + '"]').text() || base.$el.attr('title');
            // hide old label element
            $('label[for="' + base.$el.attr('id') + '"]').hide();

            
            // Get the textbox styles used to mimic the displayed text of the textbox
            // To have a nice effect, you need to style your ($el) input like this :
            // # input {border:1px solid #000; margin:3px; padding:5px;}
            var cStyles;
            if ( typeof base.el.currentStyle != 'undefined' ) {
                cStyles = base.el.currentStyle;
            } else {
                cStyles = document.defaultView.getComputedStyle(base.el, null);
            }
            
            replaceInput(cStyles);
        };
        
        var replaceInput = function(clonedStyles) {
            // The jQuery team removing $.browser :-/
            var isMoz = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase());
            var $el = base.$el;
            
            base.position = $el.position(); // Get old Input position
            
            var contener = document.createElement("div");
            var fullWidth = $el.outerWidth( true );
            var fullHeight = $el.outerHeight( true );
            $(contener).css({'display':'block', 'position':'relative', 'width':fullWidth, 'height':fullHeight});
            $(contener).addClass(base.opts.labelClass + '-contener');
            
            // Create and set the label input
            base.label = document.createElement("input");
            
            base.$label = $(base.label);
            
            var labelClass = base.opts.labelClass || 'predictive-text';
            base.$label.attr({'type': 'text', 'class':labelClass + '-label', 'disabled':'disabled', 'autocomplete':'off'});
            base.$label.val(base.lblText);
            for ( var cStyle in clonedStyles ) {
                // Clone default and user defined css styles
                if ( typeof cStyle == "string" && (!isMoz || (isMoz && cStyle != "cssText"))) {
                    try {
                        base.label.style[cStyle] = clonedStyles[cStyle];
                        if ( cStyle == "zIndex" && clonedStyles[cStyle] != "auto") { // getcurrent zIndex
                            base.zIndex = clonedStyles[cStyle];
                        }
                        if(isMoz){
                            if ( cStyle == "font" ) {
                				base.label.style.fontSize = clonedStyles.fontSize;
                			}
                			if ( cStyle == "border" ) {
                				base.label.style.borderSize = clonedStyles.borderSize;
                			}
                        }
                    } catch (e) {}
                }
            }
            
            $(contener).css('z-index', base.zIndex+1);
            base.$label.css(
                    {
                    'z-index':base.zIndex,
                    'position':'relative',
                    'top':-fullHeight,
                    'left':0
                    });

            // Up input style
            $el.css({'background':'transparent', 'position':'relative',
                    'top':0,
                    'left':0, 'z-index':base.zIndex+2});
            $el.attr({'autocomplete':'off'});
            $el.addClass(base.opts.labelClass);
            
            $el.replaceWith(contener);
            $(contener).append($el, base.label);
            
            base.$el.focus(function(e) { onFocus(e); })
               .blur(function(e) { onBlur(e); })
               .keyup(function(e) { onKeyup(e); })
               .keydown(function(e) { onKeypress(e); });
        };
        
        var onFocus = function()
        {
            base.$label.css({ 'opacity' : 0.5 });
        };
        
        var onBlur = function()
        {
            if(base.$el.val() === '')
            {
                base.$label.val(base.lblText);
            }
            else
            {
                base.$label.val('');
            }
            base.$label.css({ 'opacity' : 1 });
        };
        
        var onKeypress = function(e)
        {
            var kc = e.keyCode || e.which;
            if((kc === 9 && base.opts.allowTabKey) || kc === 39 )  // tab pressed
            {
                if(base.$el.val() !== base.$label.val() && '' !== base.$el.val() && '' !== base.$label.val())
                {
                    e.preventDefault();
                    base.$el.val(base.$label.val());
                    base.$el.focus();
                    return false;
                }
            }
            if(kc === 13) // enter pressed
            {
                if(base.$el.is(':not(:password)') && '' !== base.$el.val())
                {
                    base.$label.val(base.$el.val());
                }
            }
            return true;
        };
        
        var onKeyup = function(e)
        {
            if (!/\w/i.test(String.fromCharCode(e.which)))
            {
                return true;
            }
                    
            var srch = base.$el.val();
            if('' === srch) {base.$label.val(base.lblText); return true;}
            var exp = new RegExp('^(' + srch + ')', "i");
            base.$label.val('');
            
            
            
            if(typeof base.opts.source === 'function') {
                var re = base.opts.source( srch );
                base.$label.val( re.replace(exp, srch) );
            }
            else {
                $(base.opts.source).each(function(k,v) { 
                    if( exp.test(v) ){
                        base.$label.val(v.replace(exp, srch));
                        return false; // each:go out!
                    }
                });
            }
        };
        
        // Run initializer
        base.init();
    };
    
    $.predictiveTyping.defaultOptions = {
        label: null,
        onStart: null,
        containerClass: 'predictive-text-box',
        labelClass: 'predictive-text',
        speed:100,
        labelColor:'#333',
        source:{},
        zIndex:1000,
        allowTabKey:true
    };
    
    $.fn.predictiveTyping = function(options){
        return this.each(function(){
            (new $.predictiveTyping(this, options));
        });
    };
    
})(jQuery);
