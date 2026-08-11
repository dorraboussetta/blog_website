import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import Icon from '@mui/material/Icon';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

function FullPostCard(props){
    const [post, setPost] = useState({});
    const [isPostAuthor, setIsPostAuthor] = useState(false);

    async function loadPost(id){
        try{
            const response = await axios.get("/api/full-post?id=" + id);
            setPost(response.data.post);

        }catch(err){
            console.log(err);
        }
    };

    async function getCred(){

        try{
            const response = await axios.get("/api/user-info"); 
            setIsPostAuthor(post.user_id === response.data.id);       
              
        }catch(err){
            console.log(err);
        }
    };

    useEffect(() => {
        loadPost(Number(props.id));
    }, [props.id]);

    useEffect(() => {
        if (post.user_id === undefined) {
            return;
        }
        getCred();
    }, [post.user_id]);


    return (
         <>
            <h3 className="pb-4 mb-4 fst-italic border-bottom">{post.category}</h3>
            <article className="blog-post">
                <h2 className="display-5 link-body-emphasis mb-1"> {post.title} </h2>
                <p className="blog-post-meta text-body-secondary"> {post.date} at {post.time}, by <i><strong>{post.author}</strong></i> </p>
                <hr />
                <p>
                    {post.content}
                </p>

                {isPostAuthor? 
                <div className="post-view-buttons">
                    <form action="/post-update" method="get">
                        <input type="hidden" name="id" value={String(post.id)}/>
                        <button className="edit-btn" type="submit"><EditRoundedIcon /></button>
                    </form>
                    <form action="/delete-post" method="post">
                        <input type="hidden" name="id" value={String(post.id)}/>
                        <button className="delete-btn" type="submit"> <DeleteRoundedIcon/> </button>
                    </form>
                </div>
                : null}
            </article>
                
        </> 
    )

};

export default FullPostCard;

