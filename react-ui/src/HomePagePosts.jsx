import axios from "axios";
import PostPreviewCard from "./PostsSrc/PostPreviewCard";
import { useEffect, useState } from "react";

function HomePagePosts(){

    const [posts, setPosts] = useState([]);

    useEffect( () => {
        async function loadPosts() {
            try {
                const response = await axios.get("/api/all-posts");
                setPosts(response.data.posts);
            }catch(err) {
                console.log(err);
            }
        
        };
        loadPosts();
    }, []);


    return (
        <div className="row mb-2">
            {posts.map((postObject) => {
                return <PostPreviewCard key={postObject.id} post={postObject}/>
            })}
            
        </div>

    );
}

export default HomePagePosts;