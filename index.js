import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
var posts = []; 
var numPosts = 0;

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req,res) =>{
   res.render("index.ejs", {posts : posts});
})

app.get("/post-add", (req, res) => {
  res.render("post-add.ejs");
});

app.get("/post-view", (req, res) => {
  var id = Number(req.query.id);

  var selectedPost = posts.find(function(post){
    return post.id === id;
  })

  if (!selectedPost) {
    return res.redirect("/");
  }

  res.render("post-view.ejs", {post: selectedPost});
});

app.get("/post-update", (req, res) => {
  var id = Number(req.query.id);

  var selectedPost = posts.find(function(post){
    return post.id === id;
  })

  if (!selectedPost) {
    return res.redirect("/");
  }

  res.render("post-update.ejs", {post: selectedPost});
});

app.get("/return-home", (req, res) => {
  res.render("index.ejs", {posts : posts});
});

app.post("/submit-post", (req, res) => {
  numPosts++;
  posts.push({
    title : req.body["title"],
    category : req.body["category"],
    content : req.body["content"],
    preview: req.body["content"].slice(0,120),
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    author: req.body["author"],
    id: numPosts -1
  });
  res.redirect("/");
});  


app.post("/update-post", (req, res) => {
  var id = Number(req.body["id"]);

  var postToUpdate = posts.find(function(post){
    return post.id === id;
  })

  if (!postToUpdate) {
    return res.redirect("/");
  }
  postToUpdate.title = req.body["title"]; 
  postToUpdate.category = req.body["category"]; 
  postToUpdate.author = req.body["author"]; 
  postToUpdate.content = req.body["content"]; 
  postToUpdate.preview = req.body["content"].slice(0,120); 



  res.render("post-view.ejs", {post: postToUpdate});
});

app.post("/delete-post", (req, res) => {
  var idToDelete = req.body["id"]; 
  var index = posts.findIndex(function(post){
    return post.id == idToDelete;
  })

  if (index!== -1){
    posts.splice(index, 1);
    numPosts--;
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});