import React, { useEffect } from "react";
import { AuthContext } from "../context/AuthProvider";
import { GoogleButton } from "react-google-button";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, set, child, get } from "firebase/database";
import { db } from "../config";
import Loader from "../component/Loader";
import logoTransparent from "../backgrounds/assets/logo-transparent.png";

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
    document.getElementById("signoutlink").style.display = "none";
    document.getElementById("signinlink").style.display = "";

    if (user !== null) {
      document.getElementById("signinlink").style.display = "none";

      document.getElementById("signoutlink").style.display = "";

      setApiCallInProgress(true);

      const dbRef = ref(getDatabase());
      get(
        child(dbRef, `users/${user?.email.split("@")[0].replaceAll(".", "_")}`)
      )
        .then((snapshot) => {
          if (snapshot.exists()) {
            setApiCallInProgress(false);
            navigate("/");
            document.getElementById("signinlink").style.display = "none";
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
            document.getElementById("signinlink").style.display = "hidden";
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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // height: "89vh",
        backgroundImage: `url(${logoTransparent})`,
        backgroundRepeat: "no-repeat",
        flexDirection: "column",
      }}
    >
      <div
        className="Home-Background"
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
          height: "50vh",
          width: "70vw",
          marginTop: "20px",

          // backgroundPosition: "",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            textAlign: "center",
            marginBottom: "20px",
            fontWeight: "bolder",
            color: "#6600ff",
          }}
        >
          Welcome to BillSplita
        </div>

        <div>
          <GoogleButton
            onClick={handleGoogleSignIn}
            style={{ borderRadius: "8px", padding: "5px" }}
          />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <h4>About BillSplita</h4>
        <p style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
          BillSplita is a Bill Splitter tool which helps user to split their
          bill when they are going to a trip or to spend holiday with friends.
          BillSplita helps users to add the expenses that they have done for
          each items/services they have purchased (tickets, restaurant bill,
          hotel bills, others) throughout the trip and who has paid how much
          amount for that purchase or whether any user has taken part in that
          purchase or not and split the bill accordingly for the splitted bill
          paid by different user or a single individual. And if you haven't
          participated in a particular purchase, then you don't have to
          contribute for that purchase. If you have If you have already paid
          your bill for any purchase and others paid in a distributed way then
          bill will only split with the actual amount who will pay to whom
          between them and you don't have to worry about yours.
        </p>
      </div>
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Loader />
      <h1 className="LoadingText">Validating User...</h1>
    </div>
  );
};

export default SignIn;
