import React from 'react'

function SignUpButton(props){

    return (
        <button type="button" className="btn sign-up-btn" onClick={() => {props.onClicked()} } >Sign-up</button>
        
    );
  
}

export default SignUpButton;