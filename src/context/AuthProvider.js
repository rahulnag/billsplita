import React, { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config";

const AuthContext = React.createContext();
const AuthProvider = ({ children }) => {
  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    // signInWithPopup(auth, provider) //signinwithpopup somethimes wont work in smaller screen so its better to use the signinwithredirect
    signInWithRedirect(auth, provider);
  };
  const [user, setUser] = useState(null);
  const [apicallinprogress, setApiCallInProgress] = React.useState(false);
  const logOut = () => {
    signOut(auth);
  };
  useEffect(() => {
    setApiCallInProgress(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // console.log(currentUser)
      setApiCallInProgress(false);
    });

    return () => {
      unsubscribe();
      setApiCallInProgress(false);
    };
  }, []);
  return apicallinprogress == false ? (
    <AuthContext.Provider value={{ googleSignIn, logOut, user }}>
      {children}
    </AuthContext.Provider>
  ) : (
    <h1>Loading....</h1>
  );
};

export default AuthProvider;
export { AuthContext };
