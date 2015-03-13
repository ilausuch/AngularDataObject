#AngularDataObject

An easy way to interacts with oData and RestFul APIs.

For instance:

```php
app.controller("MainController", function($rootScope,$scope,$timeout,$http,$q){
	
	//Prepare factory
	this.api=new ADO_rest_factory($http,"/api/");
	
	//Get Product 1
	this.api.get("Product",1,{
		success:function(data){
			
			//Decrease quantity
	        data.quantity--;
	        
	        //Update in DB
	        data.save();
		}
	});	
}
```

In this example, Product is get, decreased its quantity and update.

#Factory

There are two factories:
- ADO_oData_factory : Use in case of oData factory
- ADO_rest_factory : Use in case of restful api. It's full compatible with [ArrestDB API with ilausuch extensions] (https://github.com/ilausuch/ArrestDB/)

##Constructor operation

Parameters:
- $http : angular $http object
- URL : Url of api

```php
this.api=new ADO_rest_factory($http,"/api/");
```

##Get operation

Get an object (ADO_ObjectPrototype) by id.

```php
factoryObj.get(ObjectName,ObjectId,config);
```

For instance, to get Product with id 1

```php
this.api.get("Product",1,{
	success:function(data){
		//TODO
	},
	error:function(error,status){
		//TODO
	},
});	
```

Note: All configuration is optional

In case you are using modified ArrestDB you can use configurations such as extends

```php
this.api.get("Product",1,{
	extends:"ProductCategory,Purchases/Customer",
	success:function(data){
		//TODO
	},
	error:function(error,status){
		//TODO
	},
});	
```

##Query operation

Get a collection (ADO_Collection) of objects (ADO_ObjectPrototype)

```php
factoryObj.query(ObjectName,config);
```

For instance, to get all products
```php
this.api.get("Product",{
	success:function(data){
		//TODO
	},
	error:function(error,status){
		//TODO
	},
});	
```

In case you are using modified ArrestDB you can use extended configurations.

#Objects
##Save
##Delete
##Collections
##Special info

#Changelog

- ** ALPHA 1 ** ~~Suport to oDATA and restFul~~


#License (MIT)

Copyright (c) 2014 Ivan Lausuch (ilausuch@gmail.com).
