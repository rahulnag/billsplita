import React, { useEffect } from "react";
import { AuthContext } from "../context/AuthProvider";
import { getDatabase, ref, set, child, get, push } from "firebase/database";
import { db } from "../config";
const Home = () => {
  const { googleSignIn, logOut, user } = React.useContext(AuthContext);
  // console.log(user)
  const [groupname, setGroupName] = React.useState("");
  const CreateGroup = () => {
    const dbRef = ref(getDatabase());
    get(child(dbRef, `groups/${groupname}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          alert("group already avaiklable");
        } else {
          // console.log("No data available");
          //creating group/groupname node
          set(ref(db, "groups/" + groupname), {
            createdby_name: user.displayName,
            createdby_email: user.email,
            data: "",
          });

          const postListRef_group = ref(db, `groups/${groupname}/trippartners`);
          const newPostRef_group = push(postListRef_group);
          set(newPostRef_group, user.email);
          //updating the user/email node as well.
          const postListRef = ref(
            db,
            "users/" + user.email.split("@")[0].replaceAll(".", "_") + "/groups"
          );
          const newPostRef = push(postListRef);
          set(newPostRef, groupname);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Welcome To BillSplita</h1>
      <input
        className="GroupNameInputBox"
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="Enter name of the group / trip name"
      />
      <br />
      <button className="CreateGroupButton" onClick={CreateGroup}>
        CREATE GROUP
      </button>
    </div>
  );
};

export default Home;
