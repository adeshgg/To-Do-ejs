const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();
app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended : true }));

mongoose.connect("mongodb+srv://<user>:<password>@cluster0.mmozt.mongodb.net/<todoDB>?retryWrites=true&w=majority", {useNewUrlParser: true,  useUnifiedTopology: true, useFindAndModify: false});

const todoSchema = new mongoose.Schema({
   name : String
})

const Item = mongoose.model("Item", todoSchema);

const item1 = new Item({
   name : "Welcome to your To-Do List"
})

const item2 = new Item({
   name : "Hit + button to add new items"
})

const item3 = new Item({
   name : "<-- Hit the checkbox once the task is done"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
   name : String,
   items : [todoSchema] 
};

const List = mongoose.model("List", listSchema);

app.get('/', function(req,res){
    
   Item.find({}, function(err, foundItems){
      if(err){
         console.log(err);
      }
      else{
         if(foundItems.length === 0 )
         {

            Item.insertMany(defaultItems, function(err){
               if(err){
                  console.log(err);
               }
               else{
                  res.render('list', {listTitle : "Today", newItems : foundItems});
                  console.log("Done!");
               }
            })
         }
         else{
         res.render('list', {listTitle : "Today", newItems : foundItems});
         }
      }
   })
 
});

app.get('/:customListName',function(req,res){
   const customListName = _.capitalize(req.params.customListName);

   List.findOne({name : customListName}, function(err, foundList){
      if(!err){
         if(!foundList){
            const list = new List({
               name : customListName,
               items : defaultItems
            });

            list.save();
            res.redirect('/' + customListName);
            res.redirect('/' + customListName);
         }
         else{
            res.render("list", {listTitle : foundList.name, newItems : foundList.items});
         }
      }
   })
})


app.post('/', function(req,res){
   var itemName = req.body.newItem;
   var listName = req.body.list;
   const item = new Item({
      name : itemName
   });

   if(listName === "Today")
   {
      item.save();
      res.redirect('/');
   }
   else
   {
      List.findOne({name : listName}, function(err, foundList){
         foundList.items.push(item);
         foundList.save();
         res.redirect("/" + listName);
      })
   }
   
});

app.post('/delete', function(req,res){
   const checkedItemId = req.body.checkbox;
   const listName = req.body.listName;

   if(listName === "Today")
   {
      Item.findByIdAndRemove(checkedItemId, function(err){
         if(err){
            console.log(err);
         }
         res.redirect("/");
      })
   }
   
   else 
   {
      List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId }}}, function(err, foundList){
         if(!err)
         {
            res.redirect("/" + listName);
         }
      })
   }
});


let port = process.env.PORT;

if(port == null || port == "") {
   port = 3000;
}

app.listen(port, function(){
   console.log("Server is up and running");
});
