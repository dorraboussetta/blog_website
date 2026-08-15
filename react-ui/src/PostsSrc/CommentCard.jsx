import axios from "axios";
import React, { useEffect, useState } from "react";
import FavoriteIcon from '@mui/icons-material/Favorite';
import { red, grey } from '@mui/material/colors';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);



function CommentCard(props) {

    const [nbLikes, setNbLikes] = useState(props.initNbLikes);
    const [likedComment, setLikedComment] = useState(false);
    const [authorInfo, setAuthorInfo] = useState({
        ImgUrl: "",
        name: "",
    });

    async function getCred() {
        try {
            const result = await axios.get("/api/comment-author-info?id=" + props.commentObject.user_id);
            setAuthorInfo({
                ImgUrl: result.data.img_url,
                name: result.data.name
            });
        } catch (err) {
            console.log(err);
        }
    };

    async function updateNbLikes(number) {
        try {
            const result = await axios.patch("/api/update-comment-nb-likes", { id: props.commentObject.id, update: number });
            setNbLikes(result.data);
        } catch (err) {
            console.log(err);
        }

    };

    async function updateLikeBtn(event) {
        event.preventDefault();
        if (props.loggedInUserId === -1) {
            return;
        }

        if (likedComment) {
            unlikeComment();
            updateNbLikes(-1);
        } else {
            likeComment();
            updateNbLikes(1);
        }


    }

    async function likeComment() {
        try {
            const result = await axios.post("/api/add-comment-like", { commentId: props.commentObject.id, userId: props.loggedInUserId } );
            setLikedComment(true);
        } catch (err) {
            console.log(err);
        }
    };

    async function unlikeComment() {
        try {
            const result = await axios.delete("/api/delete-comment-like", { params: { commentId: props.commentObject.id, userId: props.loggedInUserId } });
            setLikedComment(false);
        } catch (err) {
            console.log(err);
        }
    }

    async function getLikedStatus() {
        try {
            const result = await axios.get("/api/get-comment-like", { params: { commentId: props.commentObject.id, userId: props.loggedInUserId } });
            setLikedComment(result.data.isLikedComment);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getCred();
    }, []);

    useEffect(() => {
        getLikedStatus();
    }, [props.loggedInUserId]);



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
                            <a href="#" onClick={updateLikeBtn}>
                                {
                                    likedComment ?
                                        <>  <FavoriteIcon sx={{ color: red[500] }} /> {nbLikes} </>
                                        :
                                        <>  <FavoriteIcon sx={{ color: grey[500] }} /> {nbLikes} </>

                                }


                            </a>
                            {(props.loggedInUserId !== -1 && props.loggedInUserId === props.commentObject.user_id) ?
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