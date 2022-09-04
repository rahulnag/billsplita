import React, { useEffect } from "react";
import { AuthContext } from "../context/AuthProvider";
import { getDatabase, ref, set, child, get, push } from "firebase/database";
import { db } from "../config";
import AddExpense from "../component/AddExpense";
import { textAlign } from "@mui/system";
import Loader from "../component/Loader";
import MySnackbar from "../component/MySnackbar";
const Groups = () => {
  const dbRef = ref(getDatabase());
  const { user } = React.useContext(AuthContext);
  const [myGroups, setMyGroups] = React.useState([]);
  const [selectedGroupData, setSelectedGroupData] = React.useState("");
  const [currentSelectedGroup, setCurrentSelectedGroup] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [createdby, setCreatedby] = React.useState("");
  const [activeTab, setActiveTab] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    get(
      child(
        dbRef,
        "users/" + user.email.split("@")[0].replaceAll(".", "_") + "/groups"
      )
    )
      .then((snapshot) => {
        let grouparr = Object.keys(snapshot.val()).map((o) => {
          return snapshot.val()[o];
        });
        setMyGroups(grouparr);
        setCurrentSelectedGroup(grouparr[0]);
        setActiveTab(grouparr[0]);
        fetchGroupDetails(grouparr[0]);
      })
      .catch((error) => {
        console.log("......" + error);
        setCurrentSelectedGroup("no group found");
      });

    return () => {
      setUserId("");
    };
  }, []);

  const fetchGroupDetails = (selectedgroupname) => {
    setCurrentSelectedGroup(selectedgroupname);
    get(child(dbRef, "groups/" + selectedgroupname))
      .then((snapshot) => {
        // console.log(snapshot.val());
        setSelectedGroupData(snapshot.val());
        setCreatedby(snapshot.val().createdby_email);
      })
      .catch((error) => {
        console.log(error);
        setCurrentSelectedGroup("no group found");
      });
  };

  //add individual to a particular group
  const addIndividual = () => {
    if (userId == "") {
      alert("Please enter user email id");
    } else {
      console.log(selectedGroupData.tripstatus);
      const dbRef = ref(getDatabase());
      //check whether that user has account in user/ node
      get(child(dbRef, `users/${userId.split("@")[0].replaceAll(".", "_")}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            //if user exist, then update his or her group details in user node
            let checkflag = false;
            Object.keys(snapshot.val()).map((existingtripname) => {
              // console.log(snapshot.val()[existingtripname]);
              if (snapshot.val()[existingtripname] == currentSelectedGroup)
                checkflag = true;
            });
            if (checkflag == true) {
              alert("user is already added in this group...");
            } else {
              //now we will update the user/email node and groups/trippartners node
              //before that first we will check whether
              get(child(dbRef, `groups/${currentSelectedGroup}/trippartners`))
                .then((snapshot) => {
                  if (snapshot.exists()) {
                    if (Object.values(snapshot.val()).includes(userId)) {
                      //it means user is already there in group
                      alert("user already present in group");
                    } else {
                      //add user in that group
                      const postListRef_group = ref(
                        db,
                        `groups/${currentSelectedGroup}/trippartners/`
                      );
                      const newPostRef_group = push(postListRef_group);
                      set(newPostRef_group, userId);
                    }
                  }
                })
                .catch((error) => {
                  console.log(error);
                });

              get(
                child(
                  dbRef,
                  "users/" +
                    userId.split("@")[0].replaceAll(".", "_") +
                    "/groups"
                )
              )
                .then((snapshot) => {
                  //check whether users/xxx/groups node exist or not
                  if (snapshot.exists()) {
                    // console.log(Object.values(snapshot.val()));
                    //id node exist then check if that particular group is already present in users/xxx/groups node or not
                    //if user is already added to group then show alert
                    if (
                      Object.values(snapshot.val()).includes(
                        currentSelectedGroup
                      )
                    ) {
                      //it means user is already there in group
                      alert("this group already tagged to this user");
                    } else {
                      //if user has account then update the group list of that user in user/ node
                      const postListRef = ref(
                        db,
                        "users/" +
                          userId.split("@")[0].replaceAll(".", "_") +
                          "/groups"
                      );
                      const newPostRef = push(postListRef);
                      set(newPostRef, currentSelectedGroup);
                    }
                  }
                  //if user/xxx/groups node is not there then create /groups node and add group name to it
                  else {
                    //if user has account then update the group list of that user in user/ node
                    const postListRef = ref(
                      db,
                      "users/" +
                        userId.split("@")[0].replaceAll(".", "_") +
                        "/groups"
                    );
                    const newPostRef = push(postListRef);
                    set(newPostRef, currentSelectedGroup);
                    setOpen(true);
                    console.log("1111111111");
                    fetchGroupDetails(currentSelectedGroup);
                  }
                })
                .catch((error) => {
                  console.log(error);
                });
            }
          } else {
            alert("ask user to login to application");
          }
        })
        .catch((error) => {
          console.error(error);
        });
      setUserId("");
      // console.log("2222222222");
      // fetchGroupDetails(currentSelectedGroup);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <MySnackbar open={open} msg="User added" handleClose={handleClose} />

      <div
        style={{
          fontSize: "0.6rem",
          textAlign: "center",
        }}
      >
        Logged In as : {user.email.split("@")[0]}
      </div>
      {currentSelectedGroup !== "" &&
      currentSelectedGroup !== "no group found" ? (
        <div className="GroupContainer">
          <div className="GroupItems GroupItem-1">
            <p className="MyGroupPageSmallText">Select your group</p>
            {myGroups.map((group) => {
              return (
                <button
                  className={`MyGroupButtons ${
                    activeTab == group ? "SelectedGroup" : null
                  }`}
                  onClick={() => {
                    setActiveTab(group);
                    fetchGroupDetails(group);
                  }}
                >
                  {group}
                </button>
              );
            })}
            <p className="MyGroupPageSmallText">
              Group Admin: {createdby.split("@")[0]}
            </p>
            <br />
            {selectedGroupData.tripstatus !== "completed" ? (
              <div style={{ lineHeight: "0px" }}>
                <h4>Add users to {currentSelectedGroup.toUpperCase()}:</h4>
                <input
                  value={userId}
                  className="AdduserInputBox"
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter email of user to add to group"
                />
                <br />
                <button className="AddUserButton" onClick={addIndividual}>
                  Add
                </button>
              </div>
            ) : (
              <p style={{ color: "red", fontSize: "0.8rem" }}>
                This group / trip has ended by admin, still you can check all
                expense details
              </p>
            )}
          </div>

          <div className="GroupItems GroupItem-2">
            {selectedGroupData !== "" ? (
              <AddExpense
                selectedgroupname={currentSelectedGroup}
                selectedGroupData={selectedGroupData}
                fetchGroupDetails={fetchGroupDetails}
              />
            ) : null}
          </div>
        </div>
      ) : currentSelectedGroup == "no group found" ? (
        <div className="Home-Background">
          <h3
            className="LoadingText"
            style={{ textAlign: "center", marginTop: "10px" }}
          >
            Sorry, No group found. Please create a group or ask someone to add
            you to group
          </h3>
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
          <h3 className="LoadingText">Loading your groups</h3>
        </div>
      )}
    </>
  );
};

export default Groups;
