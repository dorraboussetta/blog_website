import React from 'react'

function LoginButton(props){

    return (
        <button type="button" className="btn btn-outline-light me-2" onClick={() => {props.onClicked()} }>Login</button>
        
    );

}

export default LoginButton;