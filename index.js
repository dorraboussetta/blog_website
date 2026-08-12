import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import { Strategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import connectPgSimple from "connect-pg-simple";



const app = express();
const port = 3000;
const pgSession = connectPgSimple(session);
const saltRounds = 10;
var posts = [];
var numPosts = 0;

env.config({ quiet: true });


app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

const sessionPool = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
})

db.connect();

app.use(
  session({
    store: new pgSession({
      pool: sessionPool,
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/auth/google", (req, res, next) => {
  const rememberMe = req.query.rememberMe === "yes";

  if (rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  } else {
    req.session.cookie.maxAge = null;
  };

  req.session.save((err) => {
    if (err) {
      return next(err);
    };
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);

  });

});

app.get("/auth/google/my-posts", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      return next(err);
    };

    if (!user) {
      return res.render("login.ejs", { errorMessage: info.message });
    };



    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      };

      req.session.save((err) => {
        if (err) {
          return next(err);

        };
        res.redirect("/my-posts");

      });

    });
  })(req, res, next);
});




app.get("/login-page", (req, res) => {
  res.render("login.ejs");
});


app.post("/login", (req, res, next) => {

  const rememberMe = req.body.rememberMe === "yes";

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    };

    if (!user) {
      return res.render("login.ejs", { errorMessage: info.message });
    };



    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      };

      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        req.session.cookie.maxAge = null;
      };

      req.session.save((err) => {
        if (err) {
          return next(err);
        };
        res.redirect("/my-posts");

      });

    });

  }
  )(req, res, next);
}
);

app.post("/signup", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const fullName = req.body.full_name;
  const imgUrl = req.body.img_url;
  const rememberMe = req.body.rememberMe === "yes";

  try {
    const checkEmail = await db.query("SELECT email FROM users WHERE email=$1;", [email]);
    if (checkEmail.rows.length === 0) {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          return res.render("signup.ejs", { errorMessage: "Error signing up. Try again." });
        } else {
          try {
            const response = await db.query("INSERT INTO users (full_name, img_url, email, password) VALUES ($1, $2, $3, $4) RETURNING *;", [fullName, imgUrl, email, hash]);
            const user = {name : response.rows[0].full_name, image : response.rows[0].img_url, id : response.rows[0].id};
            req.logIn(user, (err) => {
              if (err) {
                return next(err);
              }
              if (rememberMe) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
              } else {
                req.session.cookie.maxAge = null;
              };

              req.session.save((err) => {
                if (err) {
                  return next(err);
                };
                res.redirect("/my-posts");

              });
            })
          } catch (err) {
            if (err.code === 23505) {
              return res.render("signup.ejs", { errorMessage: "Email already exists. Try logging in." });
            };
            throw err;
          }
        }
      })

    } else {
      return res.render("signup.ejs", { errorMessage: "Email already exists. Try logging in." });
    }
  } catch (err) {
    console.log(err);
  }



});

app.get("/signup-page", (req, res) => {
  res.render("signup.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    };
    res.redirect("/");
  })
});


app.get("/", (req, res) => {
  res.render("index.ejs", { posts: posts });
});

app.get("/my-posts", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("my-posts.ejs");
  } else {
    res.redirect("/login-page");
  }

});

app.get("/bookmarks", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("bookmarks.ejs");
  } else {
    res.redirect("/login-page");
  }

});

app.get("/faqs", (req, res) => {
  res.render("faqs.ejs");
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/profile-page", (req, res) => {
  res.render("profile-page.ejs");
});

app.get("/api/user-info", (req, res) => {

  if (req.isAuthenticated()) {
    res.json({
      isLoggedIn: true,
      id: req.user.id,
      name: req.user.name,
      image: req.user.image,
    });
  } else {
    res.json({
      isLoggedIn: false,
    });
  }
});

app.get("/api/comment-author-info", async (req, res) => {

    try {
      const commentAuthorId = await db.query("SELECT full_name, img_url FROM users WHERE id=$1", [req.query.id]);
      res.json({ img_url: commentAuthorId.rows[0].img_url, name: commentAuthorId.rows[0].full_name });
    } catch (err) {
      console.log(err);
    }


});

app.get("/api/my-posts", async (req, res) => {
  try {
    const response = await db.query("SELECT * FROM posts WHERE user_id=$1 ORDER by full_timestamp DESC;", [req.user.id]);
    res.json({ myPosts: response.rows });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/all-posts", async (req, res) => {

  let posts_array;

  try {
    const result = await db.query("SELECT * FROM posts ORDER by full_timestamp DESC;");
    posts_array = result.rows;
  } catch (err) {
    console.log(err);
  }

  res.json({ posts: posts_array });
});

app.get("/api/full-post", async (req, res) => {

  try {
    const response = await db.query("SELECT * FROM posts WHERE id=$1", [req.query.id]);
    res.send({ post: response.rows[0] });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/submit-comment", async (req, res) => {

  try {
    const result = await db.query("INSERT INTO comments (content, day, time, post_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
      [req.body.content,
      new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      req.body.post_id,
      req.user.id
      ]);
  } catch (err) {
    console.log(err);
  };

  res.redirect(`/post-view?id=${req.body.id}`)
});

app.get("/api/get-comments", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM comments WHERE post_id=$1 ORDER BY full_timestamp DESC", [req.query.id]);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
  }

});

app.get("/api/update-comment-nb-likes", async (req, res) => {
  try {
    const result = await db.query("UPDATE comments SET nb_likes = nb_likes + $1, full_timestamp=CURRENT_TIMESTAMP WHERE id=$2 RETURNING nb_likes; ", [req.query.update ,req.query.id]);
    res.json(result.rows[0].nb_likes);
  } catch (err) {
    console.log(err);
  }

});

app.get("/api/delete-comment", async (req, res) => {
  try {
    const result = await db.query("DELETE FROM comments WHERE id=$1 RETURNING *;", [req.query.id]);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }

});

app.get("/api/get-comment-like", async (req, res) => {
  try{
    const result = await db.query("SELECT * FROM liked_comments WHERE comment_id = $1 AND user_id = $2;", [req.query.commentId, req.query.userId]);
    if (result.rows.length === 0) {
      res.json({isLikedComment : false});
    } else {
      res.json({isLikedComment : true});
    }
  }catch(err){
    console.log(err);
    res.sendStatus(404);
  }
}); 

app.get("/api/add-comment-like", async (req, res) => {
  try{
    const result = await db.query("INSERT INTO liked_comments (comment_id, user_id) VALUES ($1, $2);", [req.query.commentId, req.query.userId]);
    res.sendStatus(200);
  }catch(err){
    console.log(err);
    res.sendStatus(404);
  }
}); 

app.get("/api/delete-comment-like", async (req, res) => {
  try{
    const result = await db.query("DELETE FROM liked_comments WHERE comment_id = $1 AND user_id = $2;", [req.query.commentId, req.query.userId]);
    res.sendStatus(200);
  }catch(err){
    console.log(err);
    res.sendStatus(404);
  }
}); 


app.get("/api/add-bookmark", async (req, res) => {

  try {
    const response = await db.query("INSERT INTO bookmarks (post_id, user_id) VALUES ($1,$2) RETURNING *;", [req.query.postId, req.query.userId]);
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
});

app.get("/api/delete-bookmark", async (req, res) => {

  try {
    const response = await db.query("DELETE FROM bookmarks WHERE post_id = $1 AND user_id = $2 RETURNING *;", [req.query.postId, req.query.userId]);
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
});

app.get("/api/bookmarked-posts", async (req, res) => {
  try {
    const result = await db.query("SELECT post_id FROM bookmarks WHERE user_id=$1;", [req.query.userId]);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
  }
}); 

app.get("/api/get-post", async (req, res) => {
  try{
    const result = await db.query("SELECT * FROM posts WHERE id=$1;", [req.query.postId]);
    // console.log(result.rows[0]);
    res.json(result.rows[0]);
  } catch(err){
    console.log(err);
  }

}); 

app.get("/post-add", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("post-add.ejs");
  } else {
    res.redirect("/login-page");
  }

});

app.post("/submit-post", async (req, res) => {
  const user = req.user;

  let newPost = {
    title: req.body["title"],
    category: req.body["category"],
    content: req.body["content"],
    preview: req.body["content"].slice(0, 135) + "...",
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    author: user.name,
    user_id: user.id,
  };


  try {
    const response = await db.query("INSERT INTO posts (title, category, author, content, time, date, user_id, preview) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;",
      [newPost.title, newPost.category, newPost.author, newPost.content, newPost.time, newPost.date, newPost.user_id, newPost.preview]
    );
    newPost.id = response.rows[0].id;

  } catch (err) {
    console.log(err);
  }

  res.redirect(`/post-view?id=${newPost.id}`);
});

app.get("/post-view", (req, res) => {
  res.render("post-view.ejs");

});

app.get("/return-home", (req, res) => {
  res.render("index.ejs", { posts: posts });
});

app.get("/post-update", async (req, res) => {
  const id = Number(req.query.id);
  let loadedPost;

  try {
    const result = await db.query("SELECT * FROM posts WHERE id=$1", [id]);
    loadedPost = result.rows[0];
  } catch (err) {
    console.log(err);
  }
  res.render("post-update.ejs", { post: loadedPost });
});

app.post("/update-post", async (req, res) => {
  const id = Number(req.body["id"]);

  try {
    const result = await db.query("UPDATE posts SET title = $1, category = $2, content = $3, preview = $4, date = $5, time = $6, full_timestamp = CURRENT_TIMESTAMP WHERE id=$7 RETURNING *;",
      [req.body["title"], req.body["category"], req.body["content"], req.body["content"].slice(0, 135) + "...",
      new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        id]
    );

  } catch (err) {
    console.log(err);
  };

  res.redirect(`/post-view?id=${id}`);
});

app.post("/delete-post", async (req, res) => {
  const id = req.body["id"];

  try {
    const result = await db.query("DELETE FROM posts WHERE id=$1;", [id]);
  } catch (err) {
    console.log(err);
  }

  res.redirect("/my-posts");
});

passport.use(
  "local",
  new Strategy({ usernameField: "email" }, async function (email, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email=$1", [email]);
      if (result.rows.length > 0) {
        if (user.password === "google") {
          return cb(null, false, {
            message: "Sign in with your Google account."
          });
        };
        const userSessionInfo = { id: result.rows[0].id, email: result.rows[0].email, name: result.rows[0].full_name, image: result.rows[0].img_url };
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.log("Error comparing passwords: ", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, userSessionInfo);
            } else {
              return cb(null, false, {
                message: "Wrong password. Try again."
              });
            }
          }
        })
      } else {
        return cb(null, false, { message: "User not found. Try signing up." });
      }
    } catch (err) {
      console.log(err);
    }

  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/my-posts",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE email=$1;", [profile.emails[0].value]);
        if (result.rows.length === 0) {

          const response = await db.query("INSERT INTO users (full_name, email, password, img_url) VALUES ($1,$2,$3,$4) RETURNING *;",
            [profile.displayName, profile.emails[0].value, "google", profile.photos[0].value]);

          const user = { id: response.rows[0].id, email: response.rows[0].email, name: response.rows[0].full_name, image: response.rows[0].img_url };
          return cb(null, user);
        } else {
          if (result.rows[0].password !== "google") {
            return cb(null, false, { message: "Please log in using your email and password." });
          } else {
            return cb(null, { id: result.rows[0].id, email: result.rows[0].email, name: result.rows[0].full_name, image: result.rows[0].img_url });
          }

        }
      } catch (err) {
        return cb(err);
      };
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});