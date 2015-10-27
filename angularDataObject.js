/**
* The MIT License
* http://creativecommons.org/licenses/MIT/
*
* Angular Data Object 0.9 (github.com/ilausuch/AngularDataObject/)
* Copyright (c) 2015 Ivan Lausuch <ilausuch@gmail.com>
*
* Requires moment.js
* //cdnjs.cloudflare.com/ajax/libs/moment.js/2.10.2/moment.min.js
**/

function ADO_hasProperty(obj,name){
	return Object.prototype.hasOwnProperty.call(obj,name);
}

function ADO_buildProperty(obj, name) {
	if (!ADO_hasProperty(obj,name))
		Object.defineProperty(obj, name, {
	       get: function() { return this.get(name); },
	       set: function(value) {return this.set(name, value);}
	    });
}

function ADO_buildReadOnlyProperty(obj, name) {
	if (!ADO_hasProperty(obj,name))
		Object.defineProperty(obj, name, {
	       get: function() { return this.get(name); }
	    });
}


//--------------------------------------------------------------------------------
// objectPrototipe
//--------------------------------------------------------------------------------
function ADO_ObjectPrototype(data,factory,table,query){
	this.$data={};
	this.$special={table:table,query:query};
	this.$navigation={};
	this.$changes={};
	this.$hasChanges=false;
	this.$factory=factory;
	this.$changesVal={};
	
	this.$references_list=[];
	this.$references_object=[];
	
	factory.prepareObject(this,data);
	
	/**
	Attribute getter	
	*/
	this.get=function(key){
		return this.$data[key];
	}
	
	/**
	Attribute setter
	*/
	this.set=function(key,value){
		this.$changesVal[key]=this.$data[key];
		this.$data[key]=value;
		this.$changes[key]=true;
		this.$hasChanges=true;
	}
	
	/**
	Print this object in console	
	*/
	this.print=function(){
		console.info(this.$data);
	}
	
	/**
	Reload	
	*/
	this.refreshObject=function(config){
		this.$factory.refreshObject(this,config);
	}
		
	/**
	Save this object
	*/
	this.save=function(config){
		this.$factory.saveObject(this,config);
	}
	
	/**
	Delete this object
	*/
	this.delete=function(config){
		this.$factory.deleteObject(this,config);
	}
	
	/**
	Reload from DB	
	*/
	this.refresh=function(config){
		this.$factory.refreshObject(this,config);
	}
	
	/**
	Remove all changes list
	*/
	this.resetChanges=function(){
		this.$changes={};
		this.$changesVal={};
		this.$hasChanges=false;
	}
	
	/**
	Restore previous values	
	*/
	this.abortChanges=function(){
		for (k in this.$changes)
			if (this.$changes[k])
				this.$data[k]=this.$changesVal[k];
		
		this.resetChanges();
	}
	
	/**
	Convert a field to int without generate changes	
	*/
	this.convertToInt=function(field){
		this.$data[field]=parseInt(this.$data[field]);
	}
	
	/**
	Convert a field to decimal without generate changes	
	*/
	this.convertToDecimal=function(field){
		this.$data[field]=parseFloat(this.$data[field]);
	}
	
	/**
	Convert a field to date without generate changes	
	*/
	this.convertToDate=function(field,format){
		this.$data[field]=moment(this.$data[field],format);
	}
	
	/**
	Convert a field to date from mysql without generate changes	
	*/
	this.convertToDateMysql=function(field){
		this.$data[field]=moment.utc(this.$data[field],"YYYY-MM-DD");
	}
	
	/**
	Complete object using references to other objects
	*/
	this.complete=function(field,field_id,table){
		this[field]=this.$factory.registry_get(table,this[field_id]);
	}
};



