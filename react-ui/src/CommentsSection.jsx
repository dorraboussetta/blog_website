//Loads and displays the comment section

import CommentForm from "./PostsSrc/CommentForm";
import CommentCard from "./PostsSrc/CommentCard";
import { useEffect, useState } from "react";
import axios from "axios";

function CommentsSection(props) {
  const [comments, setComments] = useState([]);
  const [activeUserId, setActiveUserId] = useState(-1);

  async function getActiveUserInfo() {
    try {
      const response = await axios.get("/api/user-info");
      if (response.data.isLoggedIn) {
        setActiveUserId(response.data.id);
        console.log("request done");
      } else {
        setActiveUserId(-1);
      }
    } catch (err) {
      console.log(err);
    }

  };

  useEffect(() => {
     getActiveUserInfo();
  }, []);
 

  async function loadComments() {
    try {
      const result = await axios.get("/api/get-comments?id=" + props.id);
      setComments(result.data);
    } catch (err) {
      console.log(err);
    }

  };

  async function deleteComment(id) {
    event.preventDefault();
    try {
      const result = await axios.delete("/api/delete-comment?id=" + String(id));
      loadComments();
    } catch (err) {
      console.log(err);
    }

  };


  useEffect(() => {
    loadComments();
  }, []);


  function onCommentSubmit() {
    loadComments();
  };

  return (
    <>
      <CommentForm onSubmit={onCommentSubmit} />
      {comments.length > 0 ? (
        <div className="comment-section">
          <div className="comments-list">
            {comments.map((commentItem, index) => {
              return (
                <CommentCard
                  key={commentItem.id}
                  commentObject={commentItem}
                  PostId={props.id}
                  loggedInUserId={activeUserId}
                  onDelete={deleteComment}
                  initNbLikes = {commentItem.nb_likes}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default CommentsSection;
