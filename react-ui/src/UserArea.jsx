import React from 'react';
import UserDropdown from './LoginSrc/UserDropdown.jsx'
import LoginButton from './LoginSrc/LoginButton.jsx'
import SignUpButton from './LoginSrc/SignUpButton.jsx'
import axios from 'axios';
import { useState } from 'react';
import { useEffect } from 'react';

async function authCheck(){

}

function UserArea() {

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        async function checkAuth(){
            try{
                const response = await axios.get("/api/user-info");
                setIsLoggedIn(response.data.isLoggedIn);
            }catch(err) {
                console.log(err);
            }; 
        }
        checkAuth();
    }, []);
    

    

    function loginBtnClicked(){
       window.location.href = "/login-page";
    };

    function signupBtnClicked(){
        window.location.href = "/signup-page";

    };


    if (isLoggedIn){
        return (<UserDropdown/> );
    } else {
        return (<>
        <LoginButton onClicked={loginBtnClicked}/>
        <SignUpButton onClicked={signupBtnClicked}/>
        </>);
    }
};

export default UserArea;