import React from "react";
import PostPreviewCard from "./PostsSrc/PostPreviewCard";
import axios from "axios";
import { useState, useEffect } from "react";

function SearchedPosts(props) {
    const [posts, setPosts] = useState([]);
    console.log(props.authorName);

    useEffect(() => {
       
        async function loadPosts() {
            try {
                const response = await axios.get("/api/all-posts?authorName=" + props.authorName);
                setPosts(response.data.posts);
            } catch (err) {
                console.log(err);
            }

        };
        loadPosts();
    }, [props.authorName]);

    console.log(posts);
    return (
        <div className="row mb-2">
            {posts.map((postObject) => {
                return <PostPreviewCard post={postObject} key={postObject.id} />
            })}

        </div>

    );
}

export default SearchedPosts;