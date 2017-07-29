# ng-rds

__This is a work in progress__

This package tries to easily store relational data on your website. You can retrieve the stored data as an observable 
(also static) that will automatically push __immutable__ changes when the concerning data has changed.

Install:

`` npm install ng-rds --save``

Documentation:

[wiki](https://github.com/jgdijk/ng-rds/wiki)



## Example:

Lets say we are writing an application where we have multiple projects that can contain multiple tasks.

Simply **add** the items:

```javascript
let projectRds = rdsService.use('Project');
 
projectRds.add([
    {id: 1, name: 'project1', random: 987, tasks: [
        {id: 1, name: 'task1', random: 31},
        {id: 2, name: 'task2', random: 55}
    ]},
    {id: 2, name: 'project2', random: 6854, tasks: [
        {id: 3, name: 'task3', random: 21},
    ]},
    {id: 3, name: 'project3', random: 65},
]);
```

Because of the way the package stores the data we are now able to retrieve the data as an observable:

```javascript
projectRds.get().subscribe((projects: Project[]) => console.log(projects));
```

Every time a change will be made to the stored data the observable will check if its concerning data needs to be
updated and will push all the changed objects (**immutable**).

To request the projects with the related tasks we can join them back:
```javascript
projectRds
    .join('Task')
    .get()
    .subscribe((projects: Project[]) => console.log(projects));
```

We are also able to make more complicated statements:

```javascript
projectRds
    .where('random', '>', 2)
    .where((callback: WhereCallback) => callback
        .whereHas('Task', (cb: WhereHasCallback) => cb
            .where('random', '>', 32)))
        .orWhere('name', '=', 'project2')
    .get().subscribe((projects: Project[]) => {
        console.log(projects);
    });
```

For all the **available functionality** and how to **setup** this package properly check the 
[wiki](https://github.com/jgdijk/ng-rds/wiki)

All feedback is appreciated!

## License

MIT © [Jeroen Grasdijk](mailto:jeroen@gmail.com)
