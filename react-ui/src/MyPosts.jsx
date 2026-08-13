import axios from "axios";
import PostPreviewCard from "./PostsSrc/PostPreviewCard";
import { useEffect, useState } from "react";

function MyPosts(){

    const [posts, setPosts] = useState([]);

    useEffect( () => {
        async function loadPosts() {
            try {
                const response = await axios.get("/api/my-posts");
                setPosts(response.data.myPosts);
            }catch(err) {
                console.log(err);
            }
        
        };
        loadPosts();
    }, []);

    console.log(posts);
    return (
        <div className="row mb-2">
            {posts.map((postObject) => {
                return <PostPreviewCard post={postObject} key={postObject.id}/>
            })}
            
        </div>

    );
}

export default MyPosts;