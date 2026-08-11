import axios from "axios";
import React from "react";
import { useState } from "react";

function Bookmarks() {
  const [activeUserId, setActiveUserId] = useState(-1);

  async function getActiveUserInfo() {
    try {
      const response = await axios.get("/api/user-info");
      if (response.data.isLoggedIn) {
        setActiveUserId(response.data.id);
      } else {
        setActiveUserId(-1);
      }
    } catch (err) {
      console.log(err);
    }
  }
  getActiveUserInfo();

  async function loadBookmarks() {
    if (activeUserId === -1) {
        return;
    }
    try {
      const response = await axios.get("/api/display-bookmarks", {
        params: { userId: activeUserId},
      });
      console.log(response.data);
    } catch (err) {
      console.log(err);
    }
  }

  loadBookmarks(); 

  return (<>
    <h1>Here's an H1 for funzies</h1>
  </>);
}

export default Bookmarks;

