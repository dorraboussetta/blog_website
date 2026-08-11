import axios from "axios";
import React, { useState } from "react";

function CommentForm(props) {
  const [commentText, setCommentText] = useState("");
  const [commentFormClicked, setCommentFormClicked] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const PostId = params.get("id");

  function handleClick(){
    setCommentFormClicked(true);
  };

  function handleChange(event) {
    setCommentText(event.target.value);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const result = await axios.post("/api/submit-comment", {
        content: commentText,
        post_id: PostId,
      });
    } catch (err) {
      console.log(err);
    }
    props.onSubmit();

    setCommentText("");
    setCommentFormClicked(false);

  }

  return (
    <>
      <form action="/submit-comment" method="post" onSubmit={handleSubmit}>
        <div className="mb-3 mt-3">
          <label for="comment">Comments:</label>
          <textarea
            className="form-control"
            rows={commentFormClicked? "5" : "1"}
            id="comment"
            name="text"
            placeholder="Add a comment here..."
            value={commentText}
            onChange={handleChange}
            onClick={handleClick}
          />
        </div>
        <div>
          <button type="submit" className="comment-btn" fdprocessedid="26rye2">
            Submit
          </button>
        </div>
      </form>
    </>
  );
}

export default CommentForm;
