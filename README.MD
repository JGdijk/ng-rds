# ng-rds

__This is a work in progress__

This package tries to easily store relational data on your website. You can retrieve the stored data as an observable 
(also static) that will automatically push changes when the concerning data has changed.


## Installation

To install this library, run:

```bash
$ npm install ng-rds --save
```

To import it to your project:

```javascript
NgModule({
   imports: [RdsModule] 
})
```

Provide the service:

```javascript
providers: [RdsService]
```

## Setup

You define your models by creating a class and extend it from Model. Give it the properties this model will have
e.g. __id__ and __name__:

```javascript
import {Model} from "ng-rds";
 
export class Task extends Model {
    
    public id: number;
    
    public name: string;
}
```

Secondly you create a Model Config of the class made to configure the different orm options. You have to at least provide
the made model:

```javascript
import {ModelConfig} from "ng-rds";
 
export const TaskConfig: ModelConfig = {
    model: Task         // The class we just made
    primaryKey: 'id'    // optional
    relations: {}       // optional
}
```

* __model__: the class that is extending on Model.
* __primaryKey__: the property of your model that is the primary key.
* __relations__: the relations with other models (see below).

To finish the setup add the ModelConfigs to the service:

```javascript
import {RdsService} from "ng-rds"; 
 
export class AppComponent {
    
     constructor(private rdsService: RdsService) {
        rdsService.config([TaskConfig, ...]);
     }
    
}
```

You are now ready to use your defined Models

## Usage

To get started we first select wich model we want to work with. This is done by using the 
__use() function on the RdsService__:

```javascript
let taskRds = rdsService.use('Task');
```

### Add / Update / Delete

To __add items__ use the __add()__ function

```javascript
taskRds.add([
    {id: 1 , name: 'task1'},
    {id: 2 , name: 'task2'}
]);
```
**you can also add a singel item*

To __update items__ use the __update()__ function

```javascript
taskRds.update({name: 'all the same'}); //gives all the tasks the same name
```
**see below how to select which items to update*

To __remove items__ use the __remove()__ function

```javascript
taskRds.remove(); // removes all the tasks
```
**see below how to select which items to delete*

### Retrieving the models

To retrieve the models you can use one of three functions:
* __find(id)__          // requires a single id  
* __get([id1, id2])__   // optional the desired id's
* __first([id1, id2])__ // optional the desired id's

__find()__ and __first()__ will return a __single object__, __get()__ will __always__ return an __array__.

All of these functions will __return an observable__ that will __push a new result__ if the 
__concerning data is altered__. 

If you want a static result you can give __false__ as your (second) argument:

```javascript
taskRds.find(1, false); // will return a static result instead of an observable
```

### Query statements

The following functions are added to select your models *(more comming)*:

* __where(key, action, value)__
    * action: '=', '<' , '>'
* __orWhere(key, action, value)__

* __whereIn(key, values) / whereNotIn(key, values)__
    * values: [1, 2, ...]

* __whereBetween(key, min, max) / whereNotBetween(key, min, max)__

* __whereNull(key) / whereNotNull(key)__

* __whereHas(relation) / whereNotHas(relation)__

* __orderBy(key, order)__
    * order 'asc' / 'desc'
    
They are placed before one of the retrieving functions:

```javascript
taskRds
    .where('id', '<', 3)
    .orderBy('id', 'desc')
    .get(); 
```

The __where()__ and __orWhere()__ function also except a __callback function__ on which all the where functions can be 
applied:

```javascript
taskRds
    .where((callback: WhereCallBack) => {
       callback.where('id', '<', 3).whereNotNull('name')... 
    })
    .get(); 
```

All the __where functions__ can be used __in combination with__ the __update()__ or __remove()__ functions

```javascript
taskRds.where('id', '=', 1).remove(); // will only remove the task with id 1
```

### The model

The retrieved models contain the following functions:  

__save()__ 
will add or save the model

__update(data)__ will update the model
    * data // {name: 'new_task_name', ...}
    
__remove()__ will remove the model

__attach()__ see below

__detach()__ see below

e.g.
```javascript
taskRds.find(1).subscribe(task => {
    this.task = task;
})
 
let data = {name: 'new_task_name'};
this.task.update(data);
```

###  Relations (Setup)

If you would like to couple models together we can __configure the relation__ in the setup.

lets say we would like to have a setup where a __project__ can have __multiple tasks__:

```javascript
import {ModelConfig} from "ng2-orm";
 
export const ProjectConfig: ModelConfig = {
    model: Project,
    primaryKey: 'id',
    relations: {
        tasks: {type: 'hasMany', model: Task, relationId: 'task_ids'}
    }
}
 
export const TaskConfig: ModelConfig = {
    model: Task,
    primaryKey: 'id',
    relations: {
        project: {type: 'belongsTo', model: Project}
    }
}
```
the following options are available (more comming):
* __type__: At the moment either a *hasMany* or *belongsTo* relation
* __model__: The relations model
* __relationId__: *See below*

The __key__ of the configuration *(tasks / project)* will describe how the __relation__ is __found in the object__ when 
adding or retrieving the model e.g.

```javascript
// has an array of tasks because of the hasMany relation
let project = {
    id: 1,
    name: project1,
    tasks: [
        {id: 1, name: task1}
    ]
};
 
// has a single project because of the belongsTo relation
let task = {
    id: 1,
    name: task1,
    project: {id: 1, name: project1}
};
```

The __relationId__ will contain only __the id(s) of a relation__ when adding a model. 

By __default__ the relationId will be set to *model*_id for a single relation (e.g. belongsTo) or *model*_ids for a 
relation with multiple connections (e.g. hasMany).

```javascript
// has an array of ids because of the hasMany relation
let project = {
    id: 1,
    name: project1,
    task_ids: [1,2,3]
};
 
// has a single id because of the belongsTo relation
let task = {
    id: 1,
    name: task1,
    project_id: 1
};
```

The final thing you want to do is adding the relation as a public property to your model:

Task:
```javascript
public project: Project;
```

Project:
```javascript
public tasks: Task[];
```

###  Relations (retrieving)

To __retrieve a relation__ simply use the __join()__ function and give the __model name__ of the relation as 
__argument__.

```javascript
taskRds.join('Project').find(1)
```

###  Relations (attaching / detaching)

To __attach__ a relation you use the function __attach()__
   
*// at the moment only id's are accepted*

```javascript
taskRds.attach('Project', 1).to(1);
taskRds.attach('Project', 1).to([1,2,3]);

taskRds.attach('Project', 1, 1);
taskRds.attach('Project', 1, [1,2,3]);
   ```
It is also possible to attach directly on a retrieved model
```javascript
taskRds.find(1).subscribe(task => {
    this.task = task;
})
 

this.task.attach('Project', 1);
```
   
To __detach__ a relation you use the function __detach()__
   
*// at the moment only id's are accepted*

```javascript
taskRds.detach('Project', 1).from(1);
taskRds.detach('Project', 1).from([1,2,3]);
 
taskRds.detach('Project', 1, 1);
taskRds.detach('Project', 1, [1,2,3]);
```
With detaching you can also use a wild card '*' to remove all relations from a model e.g.

*// at the moment only available on the relation id's*
```javascript
projectRds.detach('Task', '*').from(1);
```

It is also possible to detach directly on a retrieved model
```javascript
taskRds.find(1).subscribe(task => {
    this.task = task;
})
 

this.task.detach('Project', 1);
```



## License

MIT © [Jeroen Grasdijk](mailto:jeroen@gmail.com)
