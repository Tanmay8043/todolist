//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("process.env.MONGOHQ_URL"); // 

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todo list!"
});

const item2 = new Item({
  name: "Hit + button to add a new task"
});

const item3 = new Item({
  name: "<-- Hit this checkbox to delete this task"
});

const defaultItems = [item1, item2, item3];

const listSchema ={
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({},function(err, foundItems){

    if(foundItems.length ===0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Succesfully inserted entries.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today" , newListItems: foundItems});
    }


  });



});

app.get("/:customListName", function(req,res){
  const lname = _.capitalize(req.params.customListName);


  List.findOne({name: lname}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name:lname,
          items: defaultItems
        });

        list.save();
        res.redirect("/"+lname);
      }else{
        res.render("list", {listTitle: foundList.name , newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }




});

app.post("/delete", function(req, res){
  const checkedItem = req.body.delItem;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove({_id: checkedItem}, function(err){
      if(!err){
        console.log("Successsfully deleted task.");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+ listName);
      }
    })
  }




});



app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
