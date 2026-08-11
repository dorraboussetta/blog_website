import axios from "axios";
import React, { useEffect, useState } from "react";
import FavoriteIcon from '@mui/icons-material/Favorite';
import { red } from '@mui/material/colors';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);



function CommentCard(props) {

    const [nbLikes, setNbLikes] = useState(props.initNbLikes);
    const [authorInfo, setAuthorInfo] = useState({
        ImgUrl: "",
        name: "",
    });

    async function getCred() {
        try {
            const result = await axios.get("/api/comment-author-info?id=" + props.commentObject.user_id);
            console.log(result.data);
            setAuthorInfo({
                ImgUrl: result.data.img_url,
                name: result.data.name
            });
        } catch (err) {
            console.log(err);
        }
    };

    async function updateNbLikes(event){
        event.preventDefault();
        if (props.LoggedInUserId === -1) {
            return;
        }
        try {
            const result = await axios.get("/api/like-comment?id=" + String(props.commentObject.id));
            setNbLikes(result.data);
        } catch (err) {
            console.log(err);
        }

    }

 
    // console.log(authorInfo);

    useEffect(() => {
        getCred();
    }, []);



    return (
        <>

            {/* Comment stars here */}
            <div className="comment-box">
                <div className="d-flex gap-3">
                    <img src={authorInfo.ImgUrl} alt="User Avatar" className="user-avatar" />
                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">{authorInfo.name}</h6>
                            <span className="comment-time">{dayjs().to(dayjs(String(props.commentObject.full_timestamp)))}</span>
                        </div>
                        <p className="mb-2 comment-content">{props.commentObject.content}</p>
                        <div className="comment-actions">
                            <a href="#" onClick={updateNbLikes}> <FavoriteIcon sx={{ color: red[500] }}/> {nbLikes}</a> 
                            {(props.LoggedInUserId !== -1 && props.LoggedInUserId === props.commentObject.user_id) ?
                                <a href="#" onClick={() => props.onDelete(props.commentObject.id)}><i className="bi bi-reply"></i> Delete</a>
                                : null
                            }

                        </div>
                    </div>
                </div>
            </div>


        </>
    )
};

export default CommentCard;