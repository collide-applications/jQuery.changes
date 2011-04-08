 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * jQuery Changes Plugin                                                      *
 *                                                                            *
 * Check all changes on a HTML form and show message if the user tries to     *
 * leave the page before saving.                                              *
 *                                                                            *
 * @version             1.0                                                   *
 * @copyright           (c) Collide Applications 2011                         *
 * @author              Radu Graur                                            *
 * @email               radu.graur@gmail.com                                  *
 *                                                                            *
 * Do not delete or modify this header!                                       *
 *                                                                            *
 * Plugin call example:                                                       *
 *                                                                            *
 * $(function(){                                                              *
 *     $('#selector').changes({                                               *
 *          callback:       myCallback,                                       *
 *          message:        'Any changes will be lost!',                      *
 *          excludeTrigger: 'exclude',                                        *
 *          excludeFields:  ['.field1', '#field2', 'checkbox']                *
 *     });                                                                    *
 * });                                                                        *
 *                                                                            *
 * Plugin parameters:                                                         *
 * - callback: function to be called before unload;                           *
 * - message: custom message to show on page unload;                          *
 * - excludeTrigger: class name for elements that will not trigger form check;*
 * - excludeFields: array of elements to be excluded from check;              *
 *                                                                            *
 * Public parameters:                                                         *
 * - $.fn.changes.defaults: default values for plugin parameters;             *
 * - $.fn.changes.params: values for plugin parameters after initialization;  *
 *                                                                            *
 * Public methods:                                                            *
 * - $.fn.changes.initialize: create a snapshoot of a form values;            *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

(function($){  // create closure
    /**
     * Plug-in initialization
     *
     * @access  public
     * @return  object this
     */
    $.fn.changes = function(){
        // save current instance
        $.fn.changes.instance = this;

        // check if first parameter is string (function name) and call it
        if( typeof( arguments[0] ) == 'string' ){
            // check if function given and if it exists
            if( $.isFunction( window[arguments[0]] ) ){
                window[arguments[0]].call( $(this), ( arguments[1] || {} ) );
            }

            return false;
        }

        // merge default settings with dynamic settings
        $.fn.changes.params = $.extend( $.fn.changes.defaults, ( arguments[0] || {} ) );

        // bind onUnload event on window and pass "this" object
        _bindUnload.call( this );

        // take a snapshoot of all selected forms
        return $.fn.changes.initialize();
    };

    ////////////////////////////////// PUBLIC //////////////////////////////////

    /**
     * Plugin default parameters
     *
     * Will be extended to $.fn.changes.params object
     *
     * @access public
     */
    $.fn.changes.defaults = {
        callback:       null,       // function to call before unload
        message:        '',         // message to show if changes were made
        changedClass:   'changed',  // add this class to changed elements
        excludeTrigger: null,       // set a trigger class that will be excluded
        excludeFields:  []          // fields to be excluded from check
    };

    /**
     * Remember initial values of all fields
     *
     * Store initial values in each element data on "old_val" variable.
     * For select lists keep options too.
     * This function could be called from outside the closure for reset.
     * If called from outside and the plugin is not initialized this function
     * returns false.
     *
     * @access  public
     * @return  mixed   jQuery object on success or false on error
     */
    $.fn.changes.initialize = function(){
        // initialize fields only if plugin was already initialized
        if( typeof( $.fn.changes.instance ) === 'object' && $.fn.changes.instance != null ){
            return $.fn.changes.instance.
                each(function(){    // for each element of the original instance
                    // all textboxes, passwords and hidden inputs
                    $(':text, :password, [type=hidden], textarea', this).
                    each(function(){
                        $(this).
                        data('old_val', $(this).val()).
                        removeClass($.fn.changes.params.changedClass);
                    });

                    // all checkboxes and radio buttons
                    $(':checkbox, :radio', this).
                    each(function(){
                        $(this).
                        data('old_val', $(this).attr('checked')).
                        removeClass($.fn.changes.params.changedClass);
                    });

                    // all select lists
                    $('select', this).
                    each(function(){
                        $(this).
                        data('old_val', $(this).val()).
                        data('options', _serializeList.call( this )).
                        removeClass($.fn.changes.params.changedClass);
                    });
                });
        }

        return false;
    }

    ///////////////////////////////// PRIVATE //////////////////////////////////

    /**
     * Bind onUnload event on window
     *
     * !!!OBS: "this" object is plugins "this"
     *
     * @access  private
     * @return  mixed   string if any changes were made or false
     */
    function _bindUnload(){
        // keep global this to pass it later to _isChanged function
        var globalThis = this;

        // bind beforeunload event on window
        $(window).
        bind('beforeunload', function(event){
            // current trigger for this event
            if( typeof( event.target ) == 'object' ){
                // if some changes were made
                if( _isChanged.call( globalThis, event.target.activeElement ) ){
                    // if any callback defined call that function
                    if( $.fn.changes.params.callback != null &&
                       $.isFunction( $.fn.changes.params.callback ) ){
                        $.fn.changes.params.callback.call();
                    }

                    // return message that will stop unloading
                    return $.fn.changes.params.message;
                }
            }
        });
    }

    /**
     * Check if any changes happened
     *
     * !!!OBS: "this" object is plugins "this"
     *
     * @access  private
     * @return  boolean
     */
    function _isChanged( trigger ){
        // remember if any change was made
        var changed = false;

        // for each element in the original selector (usually each form)
        $(this).
        each(function(){
            // check if the trigger for the unload event is not a submit button
            // or is not this form submit button or this trigger was not
            // excluded from check
            if( ( trigger.type != 'submit' ||
               trigger.form.submit != $(this)[0].submit ) &&
               trigger.className != $.fn.changes.params.excludeTrigger ){
               changed = _scanTextFields.call( this, changed );
               changed = _scanCheckFields.call( this, changed );
               changed = _scanSelectFields.call( this, changed );
            }
        });

        return changed;
    }

    /**
     * Scan textboxes, passwords, hidden and textareas
     *
     * @access  private
     * @param   changed boolean value of change status
     * @return  boolean
     */
    function _scanTextFields( changed ){
        // all textboxes, passwords hidden inputs and textareas
        $(':text, :password, [type=hidden], textarea', this).
        not($.fn.changes.params.excludeFields.toString()).   // excepting this list
        each(function(){
            // if any change
            if( $(this).data('old_val') != $(this).val() ){
                // mark this field
                _markField.call( this );

                changed = true;
            }else{
                $(this).removeClass($.fn.changes.params.changedClass);
            }
        });

        return changed;
    }

    /**
     * Scan checkboxes and radio buttons
     *
     * @access  private
     * @param   changed boolean value of change status
     * @return  boolean
     */
    function _scanCheckFields( changed ){
        // all checkboxes and radio buttons
        $(':checkbox, :radio', this).
        not($.fn.changes.params.excludeFields.toString()).   // excepting this list
        each(function(){
            // if any change
            if( $(this).data('old_val') != $(this).attr('checked') ){
                // mark this field
                _markField.call( this );

                changed = true;
            }else{
                $(this).removeClass($.fn.changes.params.changedClass);
            }
        });

        return changed;
    }

    /**
     * Scan select elements
     *
     * @access  private
     * @param   changed boolean value of change status
     * @return  boolean
     */
    function _scanSelectFields( changed ){
        // all select lists
        $('select', this).
        not($.fn.changes.params.excludeFields.toString()).   // excepting this list
        each(function(){
            // if any change
            if( $(this).data('old_val').toString() != $(this).val().toString() ||
               _serializeList.call( this ) != $(this).data('options') ){
                // mark this field
                _markField.call( this );

                changed = true;
            }else{
                $(this).removeClass($.fn.changes.params.changedClass);
            }
        });

        return changed;
    }

    /**
     * Serialize the options in a select
     * Result will be a string:
     * "val1:text1;val2:text2"
     * "val1" and "val2" are the options values
     * "text1" and "text2" are options text
     *
     * !!!OBS: "this" object is a "select" object
     *
     * @access  private
     * @return  string
     */
    function _serializeList(){
        var serialized = '';
        var $options = $(this).find('option');

        // for each option
        $options.
        each(function(i){
            var $end = ';';
            if( i == $options.length - 1 ){
                $end = '';
            }

            // create string
            serialized += $(this).val() + ':' + $(this).text() + $end;
        });

        return serialized;
    }

    /**
     * Add a class on the changed field if any class defined
     *
     * @access  private
     * @return  void
     */
    function _markField(){
        if( $.fn.changes.params.changedClass != null ){
            $(this).addClass($.fn.changes.params.changedClass);
        }
    }
})(jQuery);    // end closure
