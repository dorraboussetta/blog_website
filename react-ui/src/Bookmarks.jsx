import axios from "axios";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import PostPreviewCard from "./PostsSrc/PostPreviewCard";

function Bookmarks() {
  const [activeUserId, setActiveUserId] = useState(-1);
  const [posts, setPosts] = useState([]);

  async function getActiveUserInfo() {
    try {
      const response = await axios.get("/api/user-info");
      if (response.data.isLoggedIn) {
        setActiveUserId(response.data.id);
      } else {
        setActiveUserId(-1);
      }
    } catch (err) {
      console.log(err);
    } 
  }

  async function loadBookmarks() {
    if (activeUserId === -1) {
      return;
    }; 
    if(posts.length > 0) {
      return;     
    }
    try {
      const response = await axios.get("/api/bookmarked-posts", {
        params: { userId: activeUserId },
      });
  
      const postIds = response.data; 
 
      for (let i = 0; i < response.data.length; i++) {
        try {
          const result = await axios.get("/api/get-post", {
            params: { postId: response.data[i].post_id},
          });
          setPosts((prevPosts) => {
            return [...prevPosts, result.data];
          });
          console.log(posts);
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getActiveUserInfo();
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [activeUserId]); 
  

  return (
    <>
      <div className="row mb-2">
        {posts.map((postObject) => {
          return <PostPreviewCard post={postObject} key={postObject.id} />;
        })}
      </div>
    </>
  );
}

export default Bookmarks;
