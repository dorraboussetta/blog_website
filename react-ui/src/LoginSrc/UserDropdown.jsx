import React, { useState } from 'react';
import axios from 'axios';

function UserDropdown() {

    const [name, setName] = useState("");
    const [image, setImage] = useState("");

    async function getCred(){

        try{
            const response = await axios.get("/api/user-info"); 
            setName(response.data.name);
            setImage(response.data.image);
            console.log(response);
              
        }catch(err){
            console.log(err);
        }
    };

    getCred();

    return (
        <div className="flex-shrink-0 dropdown">
                        <a href="#" className="d-block text-white text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            <img src={image} alt="mdo" width="32" height="32" className="rounded-circle"/> 
                        </a>
                        <ul className="dropdown-menu text-small shadow">
                            <li className="dropdown-item text-body-secondary mb-2">Hello {name}</li>
                            <li><a className="dropdown-item" href="/post-add">New post...</a></li>
                            <li><a className="dropdown-item" href="/profile-page">Profile</a></li>
                            <li><hr className="dropdown-divider"/></li>
                            <li><a className="dropdown-item" href="/logout">Sign out</a></li>
                        </ul>
        </div>    
    );
  
}

export default UserDropdown;