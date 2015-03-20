/**
* The MIT License
* http://creativecommons.org/licenses/MIT/
*
* AngularDataObject ALPHA 1 (github.com/ilausuch/AngularDataObject/)
* Copyright (c) 2015 Ivan Lausuch <ilausuch@gmail.com>
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
	
	this.refresh=function(config){
		this.$factory.refreshObject(this,config);
	}
};

//--------------------------------------------------------------------------------
// Collection
//--------------------------------------------------------------------------------
function ADO_Collection(data,factory){
	this.list=data;
	this.$factory=factory;
	
	this.refresh=function(){
		//TODO
	}
	
	this.update=function(){
		//TODO		
	}
	
	this.add=function(data){
		//TODO		
	}
}

//--------------------------------------------------------------------------------
// OData Factory
//--------------------------------------------------------------------------------
function ADO_oData_factory($http,ServiceRoot){
	this.ignoreFields=["$$hashKey", "Created@odata.type", "CreatedBy", "Modified@odata.type", "ModifiedBy", "RowVersion", "RowVersion@odata.type"];
	this.specialFields=["Created", "Modified", "odata.etag", "odata.id", "odata.type","Id","odata.editLink"];
	
	this._registry={}
	
	this.ServiceRoot=ServiceRoot;
	this.$http=$http;


	/**
	(internal) Register a new object
	*/
	this.registry_add=function(object){
		this._registry[object.$id]=object;
	}
	
	/**
	Get registered object by name and id
	*/
	this.registry_get=function(name,id){
		var link=name+"("+id+")";
		return this._registry[link];
	}
	
	/**
	Get object by link (previus registered)
	*/
	this.registry_getByLink=function(link){
		return this._registry[link];
	}
	
		
	/**
	(internal) Convert query object to query string 	
	*/
	this._prepareQueryFromOptions=function(options){
		var query="";
		if (options!=undefined){
			query="?";
			for (var key in options) 
				query=query+"$"+key+"="+options[key]+"&";
		}
				
		return query;
	}
	
	/**
	(internal) Prepare request with method, url and data
	*/
	this._prepareRequest=function(url,method,data,table){
		data = data || null;
		
		var headers={
				"Content-Type": "application/json", 
				Accept: "application/json;odata=fullmetadata"
		};
		
		if (this.basicAuth!=undefined)
			headers["Authorization"]="Basic "+this.basicAuth.authdata;
		
		return {
			method: method,
			url: url,
			headers: {
				"Content-Type": "application/json", 
				Accept: "application/json;odata=fullmetadata"
			},
			headers:headers,
			data: data,
			__factory:this,
			__table:table
		}
	}
	
	/**
	(internal) execute operation	
	*/
	this._op=function(url,method,successCallback,errorCallback,dataIn,table){
		var req=this._prepareRequest(url,method,dataIn,table);
		
		this.$http(req).success(function(data,status,headers,config){
			
			if (data.value!=undefined)
		    	data=data.value;
		   
			if (data instanceof Array){
				result=[];
				for(i in data)
					result.push(new ADO_ObjectPrototype(data[i],config.__factory,config.__table));
				
				successCallback(new ADO_Collection(result,config.__factory,config.__table));
			}
			else{
				successCallback(new ADO_ObjectPrototype(data,config.__factory,config.__table));	
			}
			
		}).error(function(data, status, headers, config){
			if (errorCallback!==undefined)
				errorCallback(data,status);
		});
	}
	
	/**
	Get one object	
	*/
	this.get=function(ObjectName,id,config){
		config = config || {}
		this._op(this.ServiceRoot+ObjectName+"("+id+")"+this._prepareQueryFromOptions(config.query), "GET", config.success, config.error, null, ObjectName);
	}
	
	/**
	Get multiple elements	
	*/
	this.query=function(ObjectName,config){
		config = config || {}
		this._op(this.ServiceRoot+ObjectName+this._prepareQueryFromOptions(config.query), "GET", config.success, config.error, null, ObjectName);	
	}
	
	/**
	Create a new object
	*/
	this.create=function(ObjectName,config){
		this._op(this.ServiceRoot+ObjectName+this._prepareQueryFromOptions(config.query), "POST", config.success, config.error, config.data, ObjectName);	
	}
	
	/**
	Update all elements in registry
	*/
	this.update=function(){
		for (k in this._registry)
			this._registry[k].update();
	}
	
	/**
	Initizialize object
	*/
	this.prepareObject=function(object,data){
		for(key in data){
			var value=data[key];
			
			if (key.search("@odata.type")!=-1)
				continue;
			
			if (object.$factory.ignoreFields.indexOf(key)==-1){
				if (object.$factory.specialFields.indexOf(key)!=-1){
					object.$special[key]=value;
				}
				else{
					if (key.search("odata.navigationLinkUrl")!=-1){
						object.$navigation[key.split("@")[0]]=value;
					}
					else{
						if (value instanceof Array){
								var list=[];
								object.$data[key]=list;
								object.$references_list.push(key);
								ADO_buildReadOnlyProperty(object,key);	
								
								for(k in value)
									list.push(new ADO_ObjectPrototype(value[k],object.$factory));
								
								
						}else
						if (value instanceof Object){
							object.$references_object.push(key);
							ADO_buildReadOnlyProperty(object,key);	
							
							object.$data[key]=new ADO_ObjectPrototype(value,object.$factory);
						}
						else{
							ADO_buildProperty(object,key);
							
							object.$data[key]=value;
							object.$changes[key]=false;
						}
					}
				}
			}
		}
		
		object.$special.link=object.$special["odata.editLink"];;
		
		Object.defineProperty(object, "id", {
	       get: function() { return object.$special.Id; }
	    });

		Object.defineProperty(object, "Id", {
	       get: function() { return object.$special.Id; }
	    });
	    
		Object.defineProperty(object, "$id", {
	       get: function() { return object.$special["odata.editLink"]; }
	    });
		
		object.$factory.registry_add(object);
	}
	
	/**
	Update object	
	*/
	this.saveObject=function(object,config){
		config = config || {};
		config.success = config.success || function(data){};
		config.error = config.error || function(err){console.debug("Error",err)};
		
		if (object.$hasChanges){
			
			var data={};
			for(i in object.$changes){
				if (object.$changes[i])
					data[i]=object.$data[i];
			}
			
			var req = {
				method: 'MERGE',
				url: object.$special["odata.id"],
				headers: {
					"Content-Type": "application/json", 
					Accept: "application/json;odata=fullmetadata",
					"If-Match" : object.$special["odata.etag"]
				},
				data: data,
			}
					
			object.$factory.$http(req).success(config.success).error(config.error);
		}
		
		for (k in object.$references_list)
			for (k2 in object.$data[object.$references_list[k]])
				object.$data[object.$references_list[k]][k2].update();
				
		for (k in object.$references_object)
			object.$data[object.$references_object[k]].update();
	}
	
	/**
	Delete object	
	*/
	this.deleteObject=function(object,config){
		config = config || {};
		config.success = config.success || function(data){};
		config.error = config.error || function(err){console.debug("Error",err)};
		
		var req = {
				method: 'DELETE',
			url: object.$special["odata.id"],
			headers: {
				"Content-Type": "application/json", 
				Accept: "application/json;odata=fullmetadata",
				"If-Match" : object.$special["odata.etag"]
			},
			data: data,
		}
				
		object.$factory.$http(req).success(config.success).error(config.error);
	}
	
	this.refreshObject=function(object,config){
		//TODO
	}
}


//--------------------------------------------------------------------------------
// RestFul Factory
//--------------------------------------------------------------------------------
function ADO_rest_factory($http,ServiceRoot){
	this.ignoreFields=[];
	this.specialFields=["__table","__link","id"];
	
	this._registry={}
	
	this.ServiceRoot=ServiceRoot;
	this.$http=$http;

	this.basicAuth=undefined;
	
	this.setBasicAuth=function(login,password){
		this.basicAuth={
			login:login,
			password:password,
			authdata:base64_encode(login + ':' + password)
		}	
	}
	
	/**
	(internal) Register a new object
	*/
	this.registry_add=function(object){
		this._registry[object.$id]=object;
	}
	
	/**
	Get registered object by name and id
	*/
	this.registry_get=function(name,id){
		var link=name+"/"+id;
		return this._registry[link];
	}
	
	/**
	Get object by link (previus registered)
	*/
	this.registry_getByLink=function(link){
		return this._registry[link];
	}
	
		
	/**
	(internal) Convert query object to query string 	
	*/
	this._prepareQueryFromOptions=function(options){
		var query="";
		if (options!=undefined){
			query="?";
			for (var key in options) 
				query=query+"$"+key+"="+options[key]+"&";
		}
				
		return query;
	}
	
	/**
	(internal) Prepare request with method, url and data
	*/
	this._prepareRequest=function(url,method,data,table,query){
		data = data || null;
		
		var headers={
				"Content-Type": "application/json", 
				Accept: "application/json"
		};
		
		if (this.basicAuth!=undefined)
			headers["Authorization"]="Basic "+this.basicAuth.authdata;
			
		return {
			method: method,
			url: url,
			headers: headers,
			data: data,
			__factory:this,
			__table:table,
			__query:query,
		}
	}
	
	/**
	(internal) execute operation	
	*/
	this._op=function(url,opConfig,method,table){
		var url=url+this._prepareQueryFromOptions(opConfig.query);
		var req=this._prepareRequest(url,method,opConfig.data,table,opConfig.query);
		
		var successCallback=opConfig.success || function(data){console.info("success without handle")}
		var errorCallback=opConfig.error;
		
		this.$http(req).success(function(data,status,headers,config){
			
			if (data.value!=undefined)
		    	data=data.value;
		   
			if (data instanceof Array){
				result=[];
				for(i in data)
					result.push(new ADO_ObjectPrototype(data[i],config.__factory,config.__table,config.__query));
				
				successCallback(new ADO_Collection(result,config.__factory,config.__table,config.__query));
			}
			else{
				if (opConfig.object!=undefined){
					opConfig.object.$factory.prepareObject(opConfig.object,data);
					successCallback(opConfig.object);	
				}
				else
					successCallback(new ADO_ObjectPrototype(data,config.__factory,config.__table,config.__query));	
			}
			
		}).error(function(data, status, headers, config){
			if (errorCallback!==undefined)
				errorCallback(data,status);
		});
	}
	
	/**
	Get one object	
	*/
	this.get=function(ObjectName,id,config){
		config = config || {}
		this._op(this.ServiceRoot+ObjectName+"/"+id, config, "GET", ObjectName);
	}
	
	/**
	Get multiple elements	
	*/
	this.query=function(ObjectName,config){
		config = config || {}
		this._op(this.ServiceRoot+ObjectName, config, "GET", ObjectName);	
	}
	
	/**
	Create a new object
	*/
	this.create=function(ObjectName,config){
		this._op(this.ServiceRoot+ObjectName, config, "POST", ObjectName);	
	}
	
	/**
	Update all elements in registry
	*/
	this.update=function(){
		for (k in this._registry)
			this._registry[k].update();
	}
	
	/**
	Initizialize object
	*/
	this.prepareObject=function(object,data){
		for(key in data){
			var value=data[key];
			
			if (object.$factory.ignoreFields.indexOf(key)==-1){
				if (object.$factory.specialFields.indexOf(key)!=-1){
					object.$special[key]=value;
				}
				else{
					if (value instanceof Array){
							var list=[];
							object.$data[key]=list;
							object.$references_list.push(key);
							ADO_buildReadOnlyProperty(object,key);	
							
							for(k in value)
								list.push(new ADO_ObjectPrototype(value[k],object.$factory));
							
							
					}else
					if (value instanceof Object){
						object.$references_object.push(key);
						ADO_buildReadOnlyProperty(object,key);	
						
						object.$data[key]=new ADO_ObjectPrototype(value,object.$factory);
					}
					else{
						ADO_buildProperty(object,key);
						
						object.$data[key]=value;
						object.$changes[key]=false;
					}
				}
			}
		}
		
		if (object.$special.table!=undefined)
			object.$special.link=object.$special.table+"/"+ object.$special.id;
		else
			if (object.$special.__table!=undefined)
				object.$special.link=object.$special.__table+"/"+ object.$special.id;
		
		if (!ADO_hasProperty(object,"id"))
			Object.defineProperty(object, "id", {
		       get: function() { return object.$special.id; }
		    });
	    
	    if (!ADO_hasProperty(object,"Id"))
			Object.defineProperty(object, "Id", {
		       get: function() { return object.$special.id; }
		    });
	    
	    if (!ADO_hasProperty(object,"$id"))
			Object.defineProperty(object, "$id", {
		       get: function() { return object.$special.link; }
		    });
		
		object.$factory.registry_add(object);
	}
	
	/**
	Update object	
	*/
	this.saveObject=function(object,config){
		config = config || {};
		config.success = config.success || function(data){};
		config.error = config.error || function(err){console.debug("Error",err)};
		
		if (object.$hasChanges){
			
			var data={};
			for(i in object.$changes){
				if (object.$changes[i])
					data[i]=object.$data[i];
			}
			
			var headers={
				"Content-Type": "application/json", 
				Accept: "application/json"
			};
			
			if (this.basicAuth!=undefined)
				headers["Authorization"]="Basic "+this.basicAuth.authdata;
			
			var req = {
				method: 'PUT',
				url: this.ServiceRoot+object.$special["link"],
				headers: headers,
				data: data,
			}
					
			object.$factory.$http(req).success(config.success).error(config.error);
		}
		
		for (k in object.$references_list)
			for (k2 in object.$data[object.$references_list[k]])
				object.$data[object.$references_list[k]][k2].update();
				
		for (k in object.$references_object)
			object.$data[object.$references_object[k]].update();
	}
	
	/**
	Delete object	
	*/
	this.deleteObject=function(object,config){
		config = config || {};
		config.success = config.success || function(data){};
		config.error = config.error || function(err){console.debug("Error",err)};
		
		var headers={
			"Content-Type": "application/json", 
			Accept: "application/json"
		};
		
		if (this.basicAuth!=undefined)
			headers["Authorization"]="Basic "+this.basicAuth.authdata;
			
		var req = {
				method: 'DELETE',
			url: this.ServiceRoot+object.$special["link"],
			headers: headers
		}
				
		object.$factory.$http(req).success(config.success).error(config.error);
	}
	
	this.refreshObject=function(object,config){

		//TODO
		config = config || {}
		config.object=object;
		config.query=object.$special.query;
		
		this._op(this.ServiceRoot+object.$special.link, config, "GET", object.$special.table);
	}
}

