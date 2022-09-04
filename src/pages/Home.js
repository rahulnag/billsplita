import React, { useEffect } from "react";
import { AuthContext } from "../context/AuthProvider";
import { getDatabase, ref, set, child, get, push } from "firebase/database";
import { db } from "../config";
import MySnackbar from "../component/MySnackbar";

const Home = () => {
  const { googleSignIn, logOut, user } = React.useContext(AuthContext);
  const [groupname, setGroupName] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const CreateGroup = () => {
    if (groupname == null || groupname == "") {
      alert("Please enter group name");
    } else {
      const dbRef = ref(getDatabase());
      get(child(dbRef, `groups/${groupname}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            alert("group already available");
          } else {
            // console.log("No data available");
            //creating group/groupname node
            set(ref(db, "groups/" + groupname), {
              createdby_name: user.displayName,
              createdby_email: user.email,
              data: "",
              consolidatedresultstatus: "{}",
            });

            const postListRef_group = ref(
              db,
              `groups/${groupname}/trippartners`
            );
            const newPostRef_group = push(postListRef_group);
            set(newPostRef_group, user.email);
            //updating the user/email node as well.
            const postListRef = ref(
              db,
              "users/" +
                user.email.split("@")[0].replaceAll(".", "_") +
                "/groups"
            );
            const newPostRef = push(postListRef);
            set(newPostRef, groupname);
            // setGroupName(null); //this will not clear the data
            setGroupName("");
            setOpen(true);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          height: "45vh",
          // width: "60%",
          marginTop: "40px",
          padding: "20px",
        }}
        className="Home-Background"
      >
        <h1>{`Welcome ${user.email.split("@")[0]} To BillSplita`}</h1>
        <input
          className="GroupNameInputBox"
          defaultValue=""
          value={groupname}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group / trip name"
        />
        <br />
        <button className="CreateGroupButton" onClick={CreateGroup}>
          CREATE GROUP
        </button>
        <MySnackbar open={open} msg="Group Created" handleClose={handleClose} />
      </div>
    </div>
  );
};

export default Home;
