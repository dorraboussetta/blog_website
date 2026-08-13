//Mounts the react components

import "vite/modulepreload-polyfill";
import React from 'react'
import { createRoot } from 'react-dom/client'
import UserArea from "./UserArea";
import HomePagePosts from "./HomePagePosts";
import MyPosts from "./MyPosts";
import FullPostCard from "./PostsSrc/FullPostCard";
import CommentsSection from "./CommentsSection";
import Bookmarks from "./Bookmarks";
import SearchedPosts from "./SearchedPosts";

const UserAreaRoot = document.getElementById('UserArea');
const HomePagePostsRoot = document.getElementById('HomePagePosts');
const MyPostsRoot = document.getElementById('MyPosts');
const FullPostCardRoot = document.getElementById('FullPostCard');
const CommentsSectionRoot = document.getElementById('CommentsSection');
const BookmarksRoot = document.getElementById('Bookmarks');
const SearchedPostsRoot = document.getElementById("SearchedPosts");

const params = new URLSearchParams(window.location.search);
const PostId = params.get("id");
const nameOfAuthor = params.get("authorName");

if (UserAreaRoot) {
    createRoot(UserAreaRoot).render( <UserArea />);
};

if (HomePagePostsRoot) {
    createRoot(HomePagePostsRoot).render(<HomePagePosts />);
};

if (MyPostsRoot) {
    createRoot(MyPostsRoot).render(<MyPosts />);
};

if (FullPostCardRoot) {
    createRoot(FullPostCardRoot).render(<FullPostCard id={PostId}/>);
};

if (CommentsSectionRoot) {
    createRoot(CommentsSectionRoot).render(<CommentsSection id={PostId} />);
};

if (BookmarksRoot) {
    createRoot(BookmarksRoot).render(<Bookmarks />);
};

if (SearchedPostsRoot) {
    createRoot(SearchedPostsRoot).render(<SearchedPosts authorName = {nameOfAuthor} />);
};






