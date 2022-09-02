import React, { useEffect } from "react";
import { AuthContext } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

const SignOut = () => {
  const navigate = useNavigate();

  const { logOut } = React.useContext(AuthContext);

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleSignOut();
  }, []);
  return (
    <div>
      {/* <button onClick={handleSignOut}>signout</button> */}
      <h3>Signing you out....</h3>
    </div>
  );
};

export default SignOut;
