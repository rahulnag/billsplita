import React, { useEffect } from "react";
import { AuthContext } from "../context/AuthProvider";
import { GoogleButton } from "react-google-button";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, set, child, get } from "firebase/database";
import { db } from "../config";
const SignIn = () => {
  const [apicallinprogress, setApiCallInProgress] = React.useState(false);
  const navigate = useNavigate();
  const { user, googleSignIn } = React.useContext(AuthContext);
  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
      //after sign in navigate user to /
      navigate("/");
    } catch (error) {}
  };

  useEffect(() => {
    //if user is signined in then navigate to /
    console.log(user);
    if (user !== null) {
      setApiCallInProgress(true);

      const dbRef = ref(getDatabase());
      get(
        child(dbRef, `users/${user?.email.split("@")[0].replaceAll(".", "_")}`)
      )
        .then((snapshot) => {
          if (snapshot.exists()) {
            setApiCallInProgress(false);
            navigate("/");
          } else {
            console.log("No data available");
            set(
              ref(db, "users/" + user.email.split("@")[0].replaceAll(".", "_")),
              {
                name: user.displayName,
                email: user.email,
              }
            );
            console.log(user.uid);
            navigate("/");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
    return () => {
      setApiCallInProgress(false);
    };
  }, [user]);
  return apicallinprogress == false ? (
    <div>
      <h1>Welcome to BillSplita</h1>
      <GoogleButton onClick={handleGoogleSignIn} />
    </div>
  ) : (
    <h1>validating user....</h1>
  );
};

export default SignIn;
