//Loads and displays searched posts

import React from "react";
import PostPreviewCard from "./PostsSrc/PostPreviewCard";
import axios from "axios";
import { useState, useEffect } from "react";

function SearchedPosts(props) {
    const [posts, setPosts] = useState([]);

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

    return (
        <>
            <h5 className="my-3 text-body-secondary"  >{posts.length === 1 ?
                `${posts.length} result` :
                `${posts.length} results`
            }</h5>
            <div className="row mb-2">
                {posts.map((postObject) => {
                    return <PostPreviewCard post={postObject} key={postObject.id} />
                })}

            </div>
        </>


    );
}

export default SearchedPosts;