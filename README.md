jQuery Changes Plugin
=====================

Check all changes on a HTML form and show message if the user tries to leave the page before saving.

### Plugin call example:

	$(function(){
		$('#selector').changes({
			callback:       myCallback,
			message:        'Any changes will be lost!',
			excludeTrigger: 'exclude',
			excludeFields:  ['.field1', '#field2', 'checkbox']
		});
	});

### Reset forms:

This function could be used when the form is saved with AJAX.
On the success callback of the AJAX call the form should be reinitialized
with the values already saved.

    $.fn.changes( 'initialize' );

### Plugin parameters:
- callback: function to be called before unload;
- message: custom message to show on page unload;
- excludeTrigger: class name for elements that will not trigger form check;
- excludeFields: array of elements to be excluded from check;

### Public parameters:
- $.fn.changes.defaults: default values for plugin parameters;
- $.fn.changes.params: values for plugin parameters after initialization;

