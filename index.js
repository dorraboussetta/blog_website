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



//Login page get route
app.get("/login-page", (req, res) => {
  res.render("login.ejs");
});

//Login form POST route
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

//Signup form POST route
app.post("/signup", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const fullName = req.body.full_name;
  const imgUrl = req.body.img_url;
  const rememberMe = req.body.rememberMe === "yes";

  console.log("email typed: " + email);


  try {
    const checkEmail = await db.query("SELECT email FROM users WHERE email=$1;", [email]);
    if (checkEmail.rows.length === 0) {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          return res.render("signup.ejs", { errorMessage: "Error signing up. Try again." });
        } else {
          try {
            const response = await db.query("INSERT INTO users (full_name, img_url, email, password) VALUES ($1, $2, $3, $4) RETURNING *;", [fullName, imgUrl, email, hash]);
            const user = { name: response.rows[0].full_name, image: response.rows[0].img_url, id: response.rows[0].id, email: response.rows[0].email, authenType: "local" };
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
  res.render("index.ejs");
});

app.get("/search-page", (req, res) => {
  res.render("search-page.ejs");
})

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
  res.render("faqs.ejs", {faqs : faqs});
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/profile-page", async (req, res) => {
  let nbOfPosts;
  console.log(req.user);
  try {
    const result = await db.query("SELECT nb_posts FROM users WHERE id=$1;", [req.user.id]);
    nbOfPosts = result.rows[0].nb_posts;
  } catch (err) {
    console.log(err);
  }

  res.render("profile-page.ejs", {
    img: req.user.image,
    name: req.user.name,
    email: req.user.email,
    nbPosts: nbOfPosts
  });
});

app.get("/edit-profile", (req, res) => {

  console.log("authenType " + req.user.authenType);
  console.log(req.user);

  res.render("edit-profile.ejs", {
    email: req.user.email,
    name: req.user.name,
    image: req.user.image,
    isGoogleAccount: req.user.authenType === "google"
  });

});

app.post("/update-profile", async (req, res, next) => {
  const formData = req.body;
  let message;
  let newPassword = "";
  let userChangedPassword = true;
  let updatedUser = {};



  if (req.user.authenType === "local") {
    if (formData.oldPassword.length === 0 && (formData.newPassword.length !== 0 || formData.confirmPassword.length !== 0)) {

    } else if (formData.oldPassword.length !== 0 && (formData.newPassword.length === 0 || formData.confirmPassword.length === 0)) {
      message = "Please enter both the new password and the confirmation.";

    } else if (formData.oldPassword.length === 0 && formData.newPassword.length === 0 && formData.confirmPassword.length === 0) {
      userChangedPassword = false;
    } else if (formData.oldPassword.length !== 0 && formData.newPassword.length !== 0 && formData.confirmPassword.length !== 0) {
      const result = await db.query("SELECT password FROM users WHERE id=$1", [req.user.id]);
      if (formData.newPassword !== formData.confirmPassword) {
        message = "Passwords don't match."
      } else {
        try {
          const valid = await bcrypt.compare(formData.newPassword, result.rows[0].password);
          if (valid) {
            message = "New password and old password match.";
          } else {
            newPassword = formData.newPassword;
            userChangedPassword = true;
          }
        } catch (err) {
          console.log("Error comparing passwords: ", err);
          message = "Error. Please try again.";
        }
      }
    }

  }

  console.log(formData.newPassword);

  if (req.user.authenType === "local" && userChangedPassword && formData.newPassword.length === 0) {
    return res.render("edit-profile.ejs", {
      email: req.user.email,
      name: req.user.name,
      image: req.user.image,
      isGoogleAccount: false,
      errorMessage: message
    });
  };

  if (req.user.authenType === "local" && userChangedPassword && formData.newPassword.length > 0) {
    try {
      const result = await bcrypt.hash(newPassword, saltRounds);
      console.log(result);

      try {
        const response = await db.query("UPDATE users SET full_name=$1, img_url=$2, email=$3, password=$4 WHERE id=$5 RETURNING *;", [formData.full_name, formData.img_url, formData.email, result, req.user.id]);
        updatedUser = {
          name: response.rows[0].full_name,
          email: response.rows[0].email,
          image: response.rows[0].img_url,
          id: response.rows[0].id,
          authenType: "local"

        };

        console.log("AFTER UPDATE:", updatedUser);

      } catch (err) {
        console.log(err);
      }
    } catch (err) {
      return res.render("edit-profile.ejs", {
        email: req.user.email,
        name: req.user.name,
        image: req.user.image,
        isGoogleAccount: false,
        errorMessage: "Error updating profile. Please try again."
      });
    }

  };

  if (req.user.authenType === "local" && !userChangedPassword) {
    try {
      const response = await db.query("UPDATE users SET full_name=$1, img_url=$2, email=$3 WHERE id=$4 RETURNING *;", [formData.full_name, formData.img_url, formData.email, req.user.id]);
      updatedUser = {
        name: response.rows[0].full_name,
        email: response.rows[0].email,
        image: response.rows[0].img_url,
        id: response.rows[0].id,
        authenType: "local"

      }
    } catch (err) {
      console.log(err);
    }
  };

  if (req.user.authenType === "google") {
    try {
      const response = await db.query("UPDATE users SET img_url=$1 RETURNING *;", [formData.img_url, req.user.id]);
      updatedUser = {
        name: response.rows[0].full_name,
        email: response.rows[0].email,
        image: response.rows[0].img_url,
        id: response.rows[0].id,
        authenType: "google"

      }
    } catch (err) {
      console.log(err);
    }
  };

  req.logIn(updatedUser, (err) => {
    if (err) {
      return next(err);
    };

    req.session.save((err) => {
      if (err) {
        return next(err);
      };
      res.redirect("/profile-page");
    })
  })



});

app.get("/delete-profile", async (req, res, next) => {

  try {
    const result = await db.query("DELETE FROM users WHERE id=$1", [req.user.id]);
  } catch (err) {
    console.log(err);
  }

  req.logout(function (err) {
    if (err) {
      return next(err);
    };
    res.redirect("/");
  })
})

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
    const response = await db.query("SELECT posts.*, users.full_name FROM posts  JOIN users ON posts.user_id = users.id WHERE user_id=$1 ORDER by full_timestamp DESC;", [req.user.id]);
    res.json({ myPosts: response.rows });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/all-posts", async (req, res) => {

  let posts_array;

  if (req.query.authorName) {
    try {
      const result = await db.query("SELECT posts.*, users.full_name FROM posts JOIN users ON posts.user_id = users.id WHERE LOWER(full_name) LIKE '%' || $1 || '%' ORDER by full_timestamp DESC;", [req.query.authorName.toLowerCase()]);
      console.log(result.rows);
      return res.json({ posts: result.rows });
    } catch (err) {
      console.log(err);
    }
  }

  try {
    const result = await db.query("SELECT posts.*, users.full_name FROM posts JOIN users ON posts.user_id = users.id ORDER by full_timestamp DESC;");
    posts_array = result.rows;
    res.json({ posts: posts_array });
  } catch (err) {
    console.log(err);
  }


});

app.get("/api/full-post", async (req, res) => {

  try {
    const response = await db.query("SELECT posts.*, users.full_name FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id=$1", [req.query.id]);
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
    const result = await db.query("UPDATE comments SET nb_likes = nb_likes + $1, full_timestamp=CURRENT_TIMESTAMP WHERE id=$2 RETURNING nb_likes; ", [req.query.update, req.query.id]);
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
  try {
    const result = await db.query("SELECT * FROM liked_comments WHERE comment_id = $1 AND user_id = $2;", [req.query.commentId, req.query.userId]);
    if (result.rows.length === 0) {
      res.json({ isLikedComment: false });
    } else {
      res.json({ isLikedComment: true });
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
});

app.get("/api/add-comment-like", async (req, res) => {
  try {
    const result = await db.query("INSERT INTO liked_comments (comment_id, user_id) VALUES ($1, $2);", [req.query.commentId, req.query.userId]);
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
});

app.get("/api/delete-comment-like", async (req, res) => {
  try {
    const result = await db.query("DELETE FROM liked_comments WHERE comment_id = $1 AND user_id = $2;", [req.query.commentId, req.query.userId]);
    res.sendStatus(200);
  } catch (err) {
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
  try {
    const result = await db.query("SELECT posts.*, users.full_name FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id=$1;", [req.query.postId]);
    res.json(result.rows[0]);
  } catch (err) {
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

  console.log(req.body);

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

    try {
      const result = await db.query("UPDATE users SET nb_posts=nb_posts + 1 WHERE id=$1;", [req.user.id]);
    } catch (err) {
      console.log(err);
    }

  } catch (err) {
    console.log(err);
  }


  res.redirect(`/post-view?id=${newPost.id}`);
});

app.get("/post-view", (req, res) => {
  res.render("post-view.ejs");

});

app.get("/return-home", (req, res) => {
  res.render("index.ejs");
});

app.get("/post-update", async (req, res) => {
  const id = Number(req.query.id);
  let loadedPost;

  try {
    const result = await db.query("SELECT posts.*, users.full_name FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id=$1", [id]);
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
        if (result.rows[0].password === "google") {
          return cb(null, false, {
            message: "Sign in with your Google account."
          });
        };
        const userSessionInfo = { id: result.rows[0].id, email: result.rows[0].email, name: result.rows[0].full_name, image: result.rows[0].img_url, authenType: "local" };
        const storedHashedPassword = result.rows[0].password;
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

          const user = { id: response.rows[0].id, email: response.rows[0].email, name: response.rows[0].full_name, image: response.rows[0].img_url, authenType: "google" };
          return cb(null, user);
        } else {
          if (result.rows[0].password !== "google") {
            return cb(null, false, { message: "Please log in using your email and password." });
          } else {
            return cb(null, { id: result.rows[0].id, email: result.rows[0].email, name: result.rows[0].full_name, image: result.rows[0].img_url, authenType: "google" });
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

const faqs = [
  {
    question: "What is BlogIt?",
    answer:
      "BlogIt is a blogging platform where users can discover posts, share their own ideas, interact with other readers, and explore content across different categories.",
  },
  {
    question: "Do I need an account to read posts?",
    answer:
      "No. You can browse and read published posts without creating an account. Some interactive features may require you to log in.",
  },
  {
    question: "How do I create an account?",
    answer:
      "You can register using your email and password or sign in with your Google account.",
  },
  {
    question: "How do I publish a post?",
    answer:
      "Once you are logged in, you can create a new post by adding a title, choosing a category, writing your content, and submitting it for publication.",
  },
  {
    question: "What categories can I write about?",
    answer:
      "BlogIt supports a variety of topics, including Lifestyle, Travel, Money, Health, Pets, Personal Growth, Food & Curiosities, Programming, Education, Psychology, and more.",
  },
  {
    question: "Can I find posts from a specific author?",
    answer:
      "Yes. You can use the search bar to search for an author and view posts written by them.",
  },
  {
    question: "Can I comment on posts?",
    answer:
      "Yes. Logged-in users can leave comments on posts and join discussions with other readers.",
  },
  {
    question: "Can I like comments?",
    answer:
      "Yes. You can like comments you find helpful, interesting, or entertaining.",
  },
  {
    question: "What are bookmarks?",
    answer:
      "Bookmarks let you save posts that you want to return to later. Your bookmarked posts are collected in one place for easy access.",
  },
  {
    question: "Where can I find the posts I have written?",
    answer:
      "Your own published posts are available in the My Posts section when you are logged in.",
  },
  {
    question: "Can I update my profile information?",
    answer:
      "Yes. You can update supported profile information from your profile page. Some information may work differently if your account was created through Google.",
  },
  {
    question: "Can I use Google to sign in?",
    answer:
      "Yes. BlogIt supports Google authentication, allowing you to sign in using your Google account instead of creating a separate password.",
  },
  {
    question: "Is BlogIt only for professional writers?",
    answer:
      "Not at all. BlogIt is for anyone who wants to share ideas, experiences, knowledge, stories, or things they find interesting.",
  },
];