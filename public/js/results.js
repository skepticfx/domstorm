// Create.js

// Instantiates a new Results object
// Type -> SIMPLE_TABLE, LISTS
// result_object -> an instance of the object 'Type'
function Results(type, result_object){
	this.type = type;
	this.getHTML = function(){ return result_object.getHTML().toString(); };
}

// Instantiates a new Simple Table Object.
// var st = new simpleTable(3, [{type: 'string', value: 'Property Tested'}, {type: 'boolean', value: 'Is Override-able?'}, {type: 'string', value: 'Result / Error'}]);
function simpleTable(title, count, cols_arr){
	var cols = [];
	var i = 0;
	var j = 0;
	for(i=0; i<count; i++){
		cols[i] = cols_arr[i];
	}
	this.columns = cols;
	this.rows = []; // Initially the rows are empty. This will be a 2D array.
	this.addResult = function(result){
		this.rows.push(result);
	};
	
	// Creates and returns a HTML table format.
	// TODO: Encoding of inputs.
	this.getHTML = function(){
		var table_html = '<div class="bs-example table-responsive"><table class="table table-striped table-bordered table-hover"> <thead><tr>';
		// Iterate the columns
		for(i=0; i<this.columns.length; i++){
			table_html += '<th>'+ this.columns[i].value +'</th>'
		}
		table_html += '</tr></thead><tbody>';
		// Iterate the Rows, PS: Its a 2D array
		for(i=0; i<this.rows.length; i++){
			table_html += '<tr class="success">';
			for(j=0; j<this.rows[i].length; j++){
				table_html += '<td>'+ this.rows[i][j] +'</td>';
			}
			table_html += '</tr>';
		}
		table_html += '</tbody></table></div>';
	return table_html;	
	}
}


/* Example Code to create a new simpleTable Result.

var st = new simpleTable("Document.domain testing" ,3, [{type: 'string', value: 'Property Tested'}, {type: 'boolean', value: 'allowed?'}, {type: 'string', value: 'results'}]);
st.addResult(['document.domain', 'true', 'Successfully tested']);
st.addResult(['document.location', 'false', 'Error']);
var r = new Results('SIMPLE_TABLE', st);

*/


