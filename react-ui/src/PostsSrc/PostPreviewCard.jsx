import React from "react";

function PostPreviewCard(props){


    return (
        <div className="col-md-6">
            <div className="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative">
                <div className="col p-4 d-flex flex-column position-static">
                    <strong className="d-inline-block mb-2 text-success-emphasis">{props.post.category}</strong>
                    <h3 className="mb-0">{props.post.title}</h3>
                    <div className="mb-1 text-body-secondary">{props.post.date}, by <strong><i>{props.post.author}</i></strong></div>

                    <p className="card-text mb-auto">
                    {props.post.preview}
                    </p>

                    <a href={"/post-view?id=" + props.post.id} className="icon-link gap-1 icon-link-hover stretched-link post-view-link">
                    Continue reading...
                    <svg className="bi" aria-hidden="true">
                        <use xlink:href="#chevron-right"></use>
                    </svg>
                    </a>
                </div>

                <div className="col-auto d-none d-lg-block">
                    <svg aria-label="Placeholder: Thumbnail" className="bd-placeholder-img" height="250" preserveAspectRatio="xMidYMid slice" role="img" width="200" xmlns="http://www.w3.org/2000/svg">
                    <title>Placeholder</title>
                    <rect width="100%" height="100%" fill="#B3541E"></rect>
                    <text x="50%" y="50%" fill="#eceeef" dy=".3em">{Math.ceil(props.post.content.length/1000)} min read</text>
                    </svg>
                </div>
            </div>
        </div>
    );
}

export default PostPreviewCard;