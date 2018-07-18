var ResizeColumns = function(table){
	this.table = table; //hold Tabulator object
	this.startColumn = false;
	this.startX = false;
	this.startWidth = false;
	this.handle = null;
	this.prevHandle = null;
};

ResizeColumns.prototype.initializeColumn = function(type, column, element){
	var self = this,
	variableHeight =false,
	mode = this.table.options.resizableColumns;

	//set column resize mode
	if(type === "header"){
		variableHeight = column.definition.formatter == "textarea" || column.definition.variableHeight;
		column.extensions.resize = {variableHeight:variableHeight};
	}

	if(mode === true || mode == type){

		var handle = document.createElement('div');
		handle.className = "tabulator-col-resize-handle";


		var prevHandle = document.createElement('div');
		prevHandle.className = "tabulator-col-resize-handle prev";

		handle.addEventListener("click", function(e){
			e.stopPropagation();
		});

		handle.addEventListener("mousedown", function(e){
			var nearestColumn = column.getLastColumn();

			if(nearestColumn && self._checkResizability(nearestColumn)){
				self.startColumn = column;
				self._mouseDown(e, nearestColumn);
			}
		});

	    handle.addEventListener("dblclick", function (e) {    	
	      	var nearestColumn = column.getLastColumn(); // base tabulator uses column instead of nearestColumn

	      	if (nearestColumn && self._checkResizability(nearestColumn)) {
		        delete nearestColumn.definition.width;
		        nearestColumn.reinitializeWidth(); // base branch uses reinitializeWidth(true);

		        if (self.table.options.persistentLayout && self.table.extExists("persistentLayout", true)) {
		          	self.table.extensions.persistentLayout.save();
		        }
	      	}
	    });

		prevHandle.addEventListener("click", function(e){
			e.stopPropagation();
		});

		prevHandle.addEventListener("mousedown", function(e){
			var nearestColumn, colIndex, prevColumn;

			nearestColumn = column.getFirstColumn();

			if(nearestColumn){
				colIndex = self.table.columnManager.findColumnIndex(nearestColumn);
				prevColumn = colIndex > 0 ? self.table.columnManager.getColumnByIndex(colIndex - 1) : false;

				if(prevColumn && self._checkResizability(prevColumn)){
					self.startColumn = column;
					self._mouseDown(e, prevColumn);
				}
			}
		});

	    prevHandle.addEventListener("dblclick", function (e) {
	      	var nearestColumn = column.getLastColumn(); // base tabulator uses column.getFirstColumn

	      	if (nearestColumn) {
		        var colIndex = self.table.columnManager.findColumnIndex(nearestColumn);
		        var prevColumn = colIndex > 0 ? self.table.columnManager.getColumnByIndex(colIndex - 1) : false;

		        if (prevColumn && self._checkResizability(prevColumn)) {
		          	delete prevColumn.definition.width;
		          	prevColumn.reinitializeWidth(); // base tabulator uses reinitializeWidth(true)

		          	if (self.table.options.persistentLayout && self.table.extExists("persistentLayout", true)) {
		            	self.table.extensions.persistentLayout.save();
		          	}
		        }
	      	}
	    });

		element.append(handle)
		.append(prevHandle);
	}
};


ResizeColumns.prototype._checkResizability = function(column){
	return typeof column.definition.resizable != "undefined" ? column.definition.resizable : this.table.options.resizableColumns
};

ResizeColumns.prototype._mouseDown = function(e, column){
	var self = this;

	self.table.element.addClass("tabulator-block-select");

	function mouseMove(e){
		column.setWidth(self.startWidth + (e.screenX - self.startX));

		if(!self.table.browserSlow && column.extensions.resize && column.extensions.resize.variableHeight){
			column.checkCellHeights();
		}
	}

	function mouseUp(e){

		//block editor from taking action while resizing is taking place
		if(self.startColumn.extensions.edit){
			self.startColumn.extensions.edit.blocked = false;
		}

		if(self.table.browserSlow && column.extensions.resize && column.extensions.resize.variableHeight){
			column.checkCellHeights();
		}

		$("body").off("mouseup", mouseMove);
		$("body").off("mousemove", mouseMove);

		self.table.element.removeClass("tabulator-block-select");

		if(self.table.options.persistentLayout && self.table.extExists("persistence", true)){
			self.table.extensions.persistence.save("columns");
		}

		self.table.options.columnResized(self.startColumn.getComponent())
	}

	e.stopPropagation(); //prevent resize from interfereing with movable columns

	//block editor from taking action while resizing is taking place
	if(self.startColumn.extensions.edit){
		self.startColumn.extensions.edit.blocked = true;
	}

	self.startX = e.screenX;
	self.startWidth = column.getWidth();

	$("body").on("mousemove", mouseMove);

	$("body").on("mouseup", mouseUp);
};

Tabulator.registerExtension("resizeColumns", ResizeColumns);
