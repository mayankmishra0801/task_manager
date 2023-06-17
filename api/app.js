const express = require('express')

const app = express();
const  dotenv = require("dotenv");

const mongoose = require("mongoose");

dotenv.config();
const connectDB = require('./config/task')

const MONGO_URI = process.env.MONGO_URI
connectDB(MONGO_URI)


const bodyParser = require('body-parser')
app.use(bodyParser.json());

// cors header 
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-control-Allow-Methods","GET,POST,HEAD,OPTIONS,PUT,PATCH,DELETE");
    next();
  });

const {List,Task} = require('./models')
// const {Task} = require('./models/taskModel')






//List routes
app.get('/lists',(req,res)=>{
    // res.send("Hello World")
    // we want to return array of all the lists in the database
    List.find({}).then((lists)=>{
        res.send(lists);
    
    }).catch((e)=>{
        res.send(e);
    })
})


app.post('/list',(req,res)=>{
    // we want to create a new list and return the new list document back to the user(which includes the id)  
//  The list info will be passed in via the JSON request body

  let title = req.body.title
   let newList = new List({
    title
   });
   newList.save().then((listDoc)=>{
    res.send(listDoc)
   })

});

app.patch('/lists/:id',(req,res)=>{
    // we want to upadte specified  list with the new value specified in the JSON body
     
    List.findOneAndUpdate({_id:req.params.id},{
        $set:req.body
    }).then(()=>{
        res.send({message:'Updated successfully'});
    })
})

app.delete('/lists/:id',(req,res)=>{
    // we want to delete the specified list

    List.findOneAndRemove({
        _id:req.params.id
    }).then((removeListDoc) =>{
        res.send(removeListDoc);
    })
})

app.get('/lists/:listId/tasks',(req,res)=>{
    //  We want to return all task belong to specific list 
    
    Task.find({
        _listId:req.params.listId
    }).then((tasks)=>{
        res.send(tasks);
    })
});

app.get('/lists/:listId/tasks/:taskId',(req,res) =>{
    Task.findOne({
        _id:req.params.taskId,
        _listId:req.params.listId
    }).then((task)=>{
        res.send(task);
    })
})




// post/lists/:listId/tasks
app.post('/lists/:listId/tasks',(req,res)=>{
    // create new task in a list specified by id
   
    let newTask = new Task({
        title:req.body.title,
        _listId: req.params.listId
    });
    newTask.save().then((newTaskDoc) => {
        res.send(newTaskDoc)
    })



})

app.patch('/lists/:listId/tasks/:taskId',(req,res)=>{
    Task.findOneAndDelete({
        _id:req.params.taskId,
        _listId:req.params.listId
    },{
        $set:req.body
    }).then(()=>{
        res.sendStatus(200)
    })
})


app.delete('/lists/:listId/tasks/:taskId',(req,res)=>{
    List.findOneAndRemove({
        _id:req.params.taskId,
        _listId:req.params.listId
    })
})

app.listen(5000,()=>{
    console.log("Server is listening on port 5000");
})



