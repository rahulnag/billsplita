import React, { useContext, useEffect } from "react";
import "./component.css";
import Accordion from "@mui/material/Accordion";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { styled } from "@mui/material/styles";
// import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { getDatabase, ref, set, child, get, push } from "firebase/database";
import { db } from "../config";
import { AuthContext } from "../context/AuthProvider";
import ConfirmationBox from "./ConfirmationBox";
import RefreshIcon from "@mui/icons-material/Refresh";
import Loader, { SunspotLoaderComponent } from "./Loader";
import MySnackbar from "./MySnackbar";

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
  background: "#f8f8f878",
}));

const AddExpense = ({
  selectedgroupname,
  selectedGroupData,
  fetchGroupDetails,
}) => {
  const { user } = useContext(AuthContext);
  var username = user;
  const [open, setOpen] = React.useState(false); //for confirmation box
  const [snackopen, setSnackOpen] = React.useState(false); //for snackbar open
  const [snackmsg, setSnackMsg] = React.useState(""); //for snackbar open
  const [data, setData] = React.useState({
    item: "",
    price: 0,
    takenby: [], //make this also dynamic based upon who all taken that item
    spent: {},
    extraspentbyeach: {},
    extraspentby: {},
    whowillgetbywhom: {},
  });

  const [finalExpenseCalculation, setFinalExpenseCalculation] = React.useState(
    []
  );
  const [groupData, setGroupData] = React.useState(selectedGroupData);

  const [userList, setUserList] = React.useState(
    Object.values(groupData?.trippartners).map((i) => {
      return {
        name: i,
        pricespent: null, //always keep this default value as null
        taken: 0,
      };
    })
  );
  const [consolidatedresult, setConsolidatedResult] = React.useState([]);

  const [apicallingtosaveexpense, setApiCallingToSaveExpense] =
    React.useState(false);

  //for confirmation box
  const handleClose = () => {
    setOpen(false);
  };

  //for snackbar message
  const handleSnackClose = () => {
    setSnackOpen(false);
    setSnackMsg("");
  };
  useEffect(() => {
    setGroupData(selectedGroupData);
    setUserList(
      Object.values(selectedGroupData?.trippartners).map((i) => {
        return {
          name: i,
          pricespent: null,
          taken: 0,
        };
      })
    );
    GetExpeseData();

    return () => {
      resetData();
    };
  }, [selectedGroupData]);

  const resetData = () => {
    setData({
      item: "",
      price: 0,
      takenby: [], //make this also dynamic based upon who all taken that item
      spent: {},
      extraspentbyeach: {},
      extraspentby: {},
      whowillgetbywhom: {},
    });

    setUserList(
      Object.values(groupData?.trippartners).map((i) => {
        return {
          name: i,
          pricespent: null, //always keep this default value as null
          taken: 0,
        };
      })
    );
  };
  const handleTakenInput = (e, i, index) => {
    userList[index] = { ...userList[index], taken: e.target.checked };
    setUserList(userList);
  };

  const handleAmountGivenInput = (e, i, index) => {
    userList[index] = {
      ...userList[index],
      pricespent: e.target.value == "" ? null : e.target.value,
    };
    setUserList(userList);
  };

  const handleSubmit = () => {
    setApiCallingToSaveExpense(true);
    let priceSpentByUser = 0;
    let anyonehastakenornot = false;
    userList.map((individualUser) => {
      //1. individual price and total price check
      priceSpentByUser += Number(individualUser.pricespent);
      anyonehastakenornot += Boolean(individualUser.taken);
    });
    console.log(data);
    if (data.price == "" || data.item == "") {
      alert("Please enter the item/service name and its cost");
      setApiCallingToSaveExpense(false); //making false because after clicking on ok of alert box, spinner is showing
    } else if (priceSpentByUser !== data.price) {
      alert(
        "Total price and combined price of each individual is not matching..."
      );
      setApiCallingToSaveExpense(false);
    } else if (anyonehastakenornot == 0) {
      alert("None of the user has taken the item/service, please check");
      setApiCallingToSaveExpense(false);
    } else {
      //if price is matching , then now manipulate the data.
      let tempdata = data;
      userList.map((individualUser) => {
        // console.log(individualUser);
        if (individualUser.taken == true) {
          tempdata = {
            ...tempdata,
            takenby: [...tempdata.takenby, individualUser.name],
          };
        }

        tempdata = {
          ...tempdata,
          spent: {
            ...tempdata.spent,
            [individualUser.name]: individualUser.pricespent,
          },
        };
      });
      // console.log(tempdata);
      setData(tempdata);

      const postListRef_group = ref(
        db,
        "groups/" + selectedgroupname + "/data"
      );
      const newPostRef_group = push(postListRef_group);
      set(newPostRef_group, JSON.stringify(tempdata));

      //if we want to update a key value in firebase
      // set(ref(db, "groups/" + selectedgroupname + "/data"), JSON.stringify(data));

      //setting up default value for price and item
      setData({
        item: "",
        price: "",
        takenby: [], //make this also dynamic based upon who all taken that item
        spent: {},
        extraspentbyeach: {},
        extraspentby: {},
        whowillgetbywhom: {},
      });

      //setting default value after db insertion
      // setUserList(
      //   Object.values(groupData?.trippartners).map((i) => {
      //     return {
      //       name: i,
      //       pricespent: null,
      //       taken: 0,
      //     };
      //   })
      // );

      //calling this function to recalculate based on new data set after db update
      GetExpeseData();
      setSnackMsg("Expense added successfully");
      setSnackOpen(true);
      let timeoutid = setTimeout(() => {
        resetData();
        setApiCallingToSaveExpense(false);
        clearTimeout(timeoutid);
      }, 3000);
    }
  };

  const GetExpeseData = () => {
    setFinalExpenseCalculation([]);
    const dbRef = ref(getDatabase());
    get(child(dbRef, `groups/${selectedgroupname}/data`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          let finalData = Object.values(snapshot.val());
          let obj = finalData.map((d) => JSON.parse(d));

          obj.map((obj) => {
            let individualcost = obj.price / obj.takenby.length;

            //check whether the individual who has given the money has taken that item or not.
            if (Object.keys(obj.spent) === obj.takenby) {
              //it means the individual wo has taken that item has given the money
              for (const individual of obj.takenby) {
                obj.extraspentby[individual] =
                  obj.spent[individual] - individualcost;
                obj.extraspentbyeach[individual] =
                  obj.spent[individual] - individualcost;
              }
            } else {
              //it means that the person who has given the bill has not taken the item
              for (const individual in obj.spent) {
                //we should not count the individual who has not taken that item while subtracting money
                if (obj.takenby.includes(individual)) {
                  obj.extraspentby[individual] =
                    obj.spent[individual] - individualcost;
                  obj.extraspentbyeach[individual] =
                    obj.spent[individual] - individualcost;
                } else {
                  obj.extraspentby[individual] = obj.spent[individual];
                  obj.extraspentbyeach[individual] = obj.spent[individual];
                }
              }
            }

            for (const individual in obj.extraspentby) {
              //if individual extra pay is 0 , it means individual has paid amount for him/her self
              if (
                obj.extraspentby[individual] === 0 &&
                obj.takenby.includes(individual)
              ) {
                obj.whowillgetbywhom[individual] = [
                  individual + " Already paid his/her bill",
                ];
              }
            }
            for (const individual in obj.extraspentby) {
              if (obj.extraspentby[individual] > 0) {
                for (const temp in obj.extraspentby) {
                  if (temp !== individual) {
                    if (
                      obj.extraspentby[temp] < 0 &&
                      obj.extraspentby[temp] !== 0 &&
                      obj.extraspentby[temp] !== null
                    ) {
                      if (
                        Math.abs(obj.extraspentby[individual]) >
                        Math.abs(obj.extraspentby[temp])
                      ) {
                        // console.log("111111");
                        obj.whowillgetbywhom[individual] = [
                          ...(obj.whowillgetbywhom[individual] !== undefined
                            ? obj.whowillgetbywhom[individual]
                            : ""),
                          individual +
                            " will take " +
                            Math.abs(obj.extraspentby[temp]).toFixed(1) +
                            " from " +
                            temp,
                        ];
                        obj.whowillgetbywhom[temp] = [
                          ...(obj.whowillgetbywhom[temp] !== undefined
                            ? obj.whowillgetbywhom[temp]
                            : ""),
                          temp +
                            " will give " +
                            Math.abs(obj.extraspentby[temp]).toFixed(1) +
                            " to " +
                            individual,
                        ];

                        obj.extraspentby[individual] =
                          obj.extraspentby[individual] -
                          Math.abs(obj.extraspentby[temp]);
                        obj.extraspentby[temp] = 0;
                      }

                      if (
                        Math.abs(obj.extraspentby[individual]) <
                        Math.abs(obj.extraspentby[temp])
                      ) {
                        //here order matters
                        // console.log("22222222");

                        obj.whowillgetbywhom[individual] = [
                          ...(obj.whowillgetbywhom[individual] !== undefined
                            ? obj.whowillgetbywhom[individual]
                            : ""),
                          individual +
                            " will take " +
                            Math.abs(obj.extraspentby[individual]).toFixed(1) +
                            " from " +
                            temp,
                        ];
                        obj.whowillgetbywhom[temp] = [
                          ...(obj.whowillgetbywhom[temp] !== undefined
                            ? obj.whowillgetbywhom[temp]
                            : ""),
                          temp +
                            " will give " +
                            Math.abs(obj.extraspentby[individual]).toFixed(1) +
                            " to " +
                            individual,
                        ];

                        obj.extraspentby[temp] =
                          obj.extraspentby[temp] + obj.extraspentby[individual];
                        obj.extraspentby[individual] = 0;
                      }

                      if (
                        Math.abs(obj.extraspentby[individual]) ===
                        Math.abs(obj.extraspentby[temp])
                      ) {
                        // console.log("33333333");

                        obj.whowillgetbywhom[individual] = [
                          ...(obj.whowillgetbywhom[individual] !== undefined
                            ? obj.whowillgetbywhom[individual]
                            : ""),
                          individual +
                            " will take " +
                            Math.abs(obj.extraspentby[individual]).toFixed(1) +
                            " from " +
                            temp,
                        ];
                        obj.whowillgetbywhom[temp] = [
                          ...(obj.whowillgetbywhom[temp] !== undefined
                            ? obj.whowillgetbywhom[temp]
                            : ""),
                          temp +
                            " will give " +
                            Math.abs(obj.extraspentby[temp]).toFixed(1) +
                            " to " +
                            individual,
                        ];

                        obj.extraspentby[individual] = 0;
                        obj.extraspentby[temp] = 0;
                      }
                    }
                  }
                }
              }
            }
          });
          // console.log(obj);
          setFinalExpenseCalculation(obj);

          //new calculation for getting the consolidated data for each indiviudal in the group
          let tempobj = obj;
          let myfinaldata = {};
          let finalresult = {};
          // console.log(tempobj);
          Object.values(selectedGroupData?.trippartners).map((ind) => {
            tempobj.map((te) => {
              // console.log(myfinaldata[ind]);
              if (
                myfinaldata[ind] == null &&
                te.extraspentbyeach[ind] == null
              ) {
                myfinaldata[ind] = null;
              } else {
                myfinaldata[ind] =
                  Number(
                    myfinaldata[ind] == undefined
                      ? !!myfinaldata[ind]
                      : myfinaldata[ind]
                  ) + Number(te.extraspentbyeach[ind]);
              }
            });
          });
          // console.log(myfinaldata);
          for (const individual in myfinaldata) {
            //if individual extra pay is 0 , it means individual has paid amount for him/her self
            if (myfinaldata[individual] === 0) {
              finalresult[individual] = [
                individual + " Already paid his/her bill",
              ];
            }
          }
          for (const individual in myfinaldata) {
            if (myfinaldata[individual] > 0) {
              for (const temp in myfinaldata) {
                if (temp !== individual) {
                  if (
                    myfinaldata[temp] < 0 &&
                    myfinaldata[temp] !== 0 &&
                    myfinaldata[temp] !== null
                  ) {
                    if (
                      Math.abs(myfinaldata[individual]) >
                      Math.abs(myfinaldata[temp])
                    ) {
                      // console.log("111111");
                      finalresult[individual] = [
                        ...(finalresult[individual] !== undefined
                          ? finalresult[individual]
                          : ""),
                        individual +
                          " will take " +
                          Math.abs(myfinaldata[temp]).toFixed(1) +
                          " from " +
                          temp,
                      ];
                      finalresult[temp] = [
                        ...(finalresult[temp] !== undefined
                          ? finalresult[temp]
                          : ""),
                        temp +
                          " will give " +
                          Math.abs(myfinaldata[temp]).toFixed(1) +
                          " to " +
                          individual,
                      ];

                      myfinaldata[individual] =
                        myfinaldata[individual] - Math.abs(myfinaldata[temp]);
                      myfinaldata[temp] = 0;
                    }

                    if (
                      Math.abs(myfinaldata[individual]) <
                      Math.abs(myfinaldata[temp])
                    ) {
                      //here order matters
                      // console.log("22222222");

                      finalresult[individual] = [
                        ...(finalresult[individual] !== undefined
                          ? finalresult[individual]
                          : ""),
                        individual +
                          " will take " +
                          Math.abs(myfinaldata[individual]).toFixed(1) +
                          " from " +
                          temp,
                      ];
                      finalresult[temp] = [
                        ...(finalresult[temp] !== undefined
                          ? finalresult[temp]
                          : ""),
                        temp +
                          " will give " +
                          Math.abs(myfinaldata[individual]).toFixed(1) +
                          " to " +
                          individual,
                      ];

                      myfinaldata[temp] =
                        myfinaldata[temp] + myfinaldata[individual];
                      myfinaldata[individual] = 0;
                    }

                    if (
                      Math.abs(myfinaldata[individual]) ===
                      Math.abs(myfinaldata[temp])
                    ) {
                      // console.log("33333333");

                      finalresult[individual] = [
                        ...(finalresult[individual] !== undefined
                          ? finalresult[individual]
                          : ""),
                        individual +
                          " will take " +
                          Math.abs(myfinaldata[individual]).toFixed(1) +
                          " from " +
                          temp,
                      ];
                      finalresult[temp] = [
                        ...(finalresult[temp] !== undefined
                          ? finalresult[temp]
                          : ""),
                        temp +
                          " will give " +
                          Math.abs(myfinaldata[temp]).toFixed(1) +
                          " to " +
                          individual,
                      ];

                      myfinaldata[individual] = 0;
                      myfinaldata[temp] = 0;
                    }
                  }
                }
              }
            }
          }
          setConsolidatedResult(finalresult);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const EndTrip = () => {
    set(ref(db, "groups/" + selectedgroupname + "/tripstatus"), "completed");
    setOpen(false);
    console.log(consolidatedresult);

    //get new set of updated data after ending trip so we are calling apis again to get complete group details
    fetchGroupDetails(selectedgroupname);
    setSnackMsg("Trip successfully ended");
    setSnackOpen(true);
  };

  const MarkMeDone = () => {
    console.log(".....");
    //now we will save consolidatedresult to firebase for current user on click on mark done button
    set(
      ref(
        db,
        "groups/" +
          selectedgroupname +
          "/consolidatedresultstatus/" +
          username.email.replaceAll("@gmail.com", "").replaceAll(".", "_")
      ),
      "completed"
    );
    //get new set of updated data after ending trip so we are calling apis again to get complete group details
    fetchGroupDetails(selectedgroupname);
  };
  return (
    <div>
      <ConfirmationBox
        open={open}
        setOpen={setOpen}
        handleClose={handleClose}
        EndTrip={EndTrip}
      />
      <MySnackbar
        open={snackopen}
        msg={snackmsg}
        handleClose={handleSnackClose}
      />

      {selectedGroupData.tripstatus !== "completed" ? (
        apicallingtosaveexpense !== true ? (
          <div style={{ textAlign: "center" }}>
            <h3>Add Expenses For {selectedgroupname.toUpperCase()}</h3>
            {/* <label>Enter Item Name:</label> */}
            <input
              value={data.item}
              className="AdduserInputBox"
              type="string"
              onChange={(e) => setData({ ...data, item: e.target.value })}
              placeholder="Enter item/service name"
            />{" "}
            {/* <label>Enter Item Price:</label> */}
            <input
              // value={data.price}
              className="AdduserInputBox"
              type="number"
              min="0"
              onChange={(e) =>
                setData({ ...data, price: Number(e.target.value) })
              }
              placeholder="Enter item/service total price"
            />
            <table
              style={{
                border: "1px solid lightgrey",
                marginTop: "8px",
                borderRadius: "8px",
                width: "97%",
                background: "#ffffff",
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid lightgrey" }}>
                    Friends
                  </th>
                  <th style={{ borderBottom: "1px solid lightgrey" }}>
                    Taken above item ?
                  </th>
                  <th style={{ borderBottom: "1px solid lightgrey" }}>
                    Amount contributed
                  </th>
                </tr>
              </thead>
              {userList.map((i, index) => {
                return (
                  <tbody>
                    <tr>
                      <td>
                        <div style={{ color: "#4e4e4e" }}>
                          {i.name.split("@")[0]}
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <div>
                          <input
                            type="checkbox"
                            onClick={(e) => handleTakenInput(e, i, index)}
                          />
                        </div>
                      </td>
                      <td>
                        <div>
                          <input
                            min="0"
                            className="AmountInputBox"
                            type="number"
                            onChange={(e) =>
                              handleAmountGivenInput(e, i, index)
                            }
                            placeholder="Amount"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                );
              })}
            </table>
            <br />
            <button className="AddUserButton" onClick={handleSubmit}>
              Save
            </button>
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
          </div>
        )
      ) : null}
      {/* {console.log(selectedGroupData)} */}
      <p
        style={{ textAlign: "center", color: "#4e4e4e", fontWeight: "bold" }}
      >{`${selectedgroupname.toUpperCase()} Expense Details`}</p>
      <RefreshIcon
        color="primary"
        onClick={() => fetchGroupDetails(selectedgroupname)}
      ></RefreshIcon>
      <span style={{ fontSize: "0.6rem", color: "rgba(11, 52, 201);" }}>
        Refresh
      </span>

      <div style={{ padding: "0 20px 0 20px" }}>
        <Accordion
        // expanded={expanded === "panel1"}
        // onChange={handleChange("panel1")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >
            <Typography sx={{ width: "33%", flexShrink: 0 }}>
              {selectedgroupname.toUpperCase()} Consolidated Result
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              Details of how much you/others have to pay or get in total
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div style={{ textAlign: "center" }}>
              {selectedGroupData.tripstatus !== "completed" && (
                <>
                  {/* <button
                    className="AddUserButton"
                    onClick={() => setOpen(true)}
                    disabled={
                      selectedGroupData.createdby_email !== username.email
                    }
                  >
                    End Trip
                  </button> */}
                  <p style={{ fontSize: "0.6rem", color: "darkgrey" }}>
                    End trip to enable additional features like mark pending
                    expenses as completed (only admin can end)
                  </p>{" "}
                </>
              )}
            </div>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                flexWrap: "wrap",
                wordWrap: "break-word",
                "& > :not(style)": {
                  m: 1,
                  width: 300,
                  height: 128,
                },
              }}
            >
              {Object.keys(consolidatedresult).map((user) => {
                return (
                  <Paper
                    style={{
                      padding: "5px",
                      position: "relative",
                      minHeight: "150px",
                      background: "rgb(234 140 255 / 30%)",
                    }}
                    elevation={7}
                    className={
                      selectedGroupData?.consolidatedresultstatus[
                        user.replaceAll("@gmail.com", "").replaceAll(".", "_")
                      ] == "completed"
                        ? user == username.email
                          ? "MyNameAvailable MarkAsCompleted"
                          : "MarkAsCompleted"
                        : user == username.email
                        ? "MyNameAvailable"
                        : null
                    }
                  >
                    <div
                      style={{
                        textAlign: "center",
                        fontWeight: "bolder",
                        color: "#504e4e",
                        height: "33px",
                        paddingTop: "2px",
                      }}
                    >
                      {user
                        .replaceAll(username.email, "Your")
                        .replaceAll("@gmail.com", "")}{" "}
                      Details
                    </div>
                    <Divider />
                    {consolidatedresult[user].map((data, index) => {
                      return (
                        <p className="ExpenseDetailsText">
                          {index + 1}.{" "}
                          {data
                            .replaceAll(username.email, "You")
                            .replaceAll("his/her", "")
                            .replaceAll("@gmail.com", "")}
                        </p>
                      );
                    })}
                    {selectedGroupData?.consolidatedresultstatus[
                      user.replaceAll("@gmail.com", "").replaceAll(".", "_")
                    ] == "completed" ? (
                      <button disabled className="MarkFinalStatus">
                        COMPLETED
                      </button>
                    ) : (
                      user == username.email && (
                        <button
                          className="MarkFinalStatus"
                          disabled={
                            selectedGroupData.tripstatus !== "completed"
                          }
                          onClick={() => {
                            if (
                              selectedGroupData?.consolidatedresultstatus[
                                username.email
                                  .replaceAll("@gmail.com", "")
                                  .replaceAll(".", "_")
                              ] !== "completed"
                            )
                              MarkMeDone();
                          }}
                        >
                          {selectedGroupData?.consolidatedresultstatus[
                            username.email
                              .replaceAll("@gmail.com", "")
                              .replaceAll(".", "_")
                          ] == "completed"
                            ? "PAID"
                            : "MARK PAID"}
                        </button>
                      )
                    )}
                  </Paper>
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* <button onClick={GetExpeseData}>REFRESH MY DETAILS...</button> */}
        <Accordion
        // expanded={expanded === "panel2"}
        // onChange={handleChange("panel2")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2bh-content"
            id="panel2bh-header"
          >
            <Typography sx={{ width: "33%", flexShrink: 0 }}>
              My Item/Service Wise Expense Details
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              Get complete details of your item/service wise expense
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                flexWrap: "wrap",
                wordWrap: "break-word",
                "& > :not(style)": {
                  m: 1,
                  width: 300,
                  // height: 128,
                },
              }}
            >
              {finalExpenseCalculation.length > 0 ? (
                finalExpenseCalculation.map((expenselist) => {
                  return (
                    <Paper
                      style={{
                        padding: "0 5px 5px 5px",
                        minHeight: "150px",
                        background: "rgb(140 255 234 / 30%)",
                      }}
                      elevation={7}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bolder",
                          color: "#504e4e",
                          height: "33px",
                          paddingTop: "2px",
                        }}
                      >{`Item:  ${expenselist.item}`}</div>
                      <Divider />
                      {
                        // console.log(expenselist)
                        //this condition because not all user will be present in expenselist.whowillgetbywhom[user.email]
                        expenselist.whowillgetbywhom[user.email] !== undefined
                          ? expenselist.whowillgetbywhom[user.email].map(
                              (whowhom, index) => {
                                return (
                                  <div>
                                    <p className="ExpenseDetailsText">
                                      {index + 1}.{" "}
                                      {whowhom
                                        .replaceAll(username.email, "You")
                                        .replaceAll("his/her", "")
                                        .replaceAll("@gmail.com", "")}
                                    </p>
                                  </div>
                                );
                              }
                            )
                          : null
                      }
                    </Paper>
                  );
                })
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <Loader />
                </div>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion
        // expanded={expanded === "panel3"}
        // onChange={handleChange("panel3")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3bh-content"
            id="panel3bh-header"
          >
            <Typography sx={{ width: "33%", flexShrink: 0 }}>
              {selectedgroupname.toUpperCase()} Complete Details
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              Complete / Detailed view of expense(splitted) per item/service
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                flexWrap: "wrap",
                wordWrap: "break-word",
                "& > :not(style)": {
                  m: 1,
                  width: 300,
                  // height: 128,
                },
              }}
            >
              {finalExpenseCalculation.length > 0 ? (
                finalExpenseCalculation.map((expenselist) => {
                  return (
                    <Paper
                      style={{
                        padding: "0 5px 5px 5px",
                        minHeight: "150px",
                        background: "rgb(243 243 169 / 30%)",
                      }}
                      elevation={7}
                    >
                      <div
                        style={{
                          height: "35px",
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "1.2rem",
                          padding: "2px 3px 0px 3px",
                          fontWeight: "bolder",
                          color: "#504e4e",
                        }}
                      >
                        <div>{`Item: ${expenselist.item}`}</div>
                        <div>{`Price ${expenselist.price}`}</div>
                      </div>
                      <Divider />

                      <p
                        style={{
                          fontWeight: "bold",
                          textAlign: "center",
                          color: "grey",
                        }}
                      >
                        who has eaten
                      </p>
                      {expenselist.takenby.map((whohaseaten, index) => {
                        return (
                          <p
                            className="ExpenseDetailsText"
                            style={{ paddingLeft: "8px" }}
                          >
                            {index + 1}.{" "}
                            {whohaseaten
                              .replaceAll(username.email, "You")
                              .replaceAll("@gmail.com", "")}
                          </p>
                        );
                      })}
                      <Divider />
                      <p
                        style={{
                          fontWeight: "bold",
                          textAlign: "center",
                          color: "grey",
                        }}
                      >
                        who has spent how much
                      </p>
                      {Object.keys(expenselist.spent).map(
                        (whohasspent, index) => {
                          return (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                flexWrap: "nowrap",
                              }}
                            >
                              <div
                                className="ExpenseDetailsText"
                                style={{ paddingLeft: "8px" }}
                              >
                                {index + 1}.{" "}
                                {`${whohasspent.replaceAll("@gmail.com", "")} `}
                              </div>
                              <div
                                className="ExpenseDetailsText"
                                style={{ fontWeight: "bold" }}
                              >{`${
                                expenselist.spent[whohasspent] !== null
                                  ? expenselist.spent[whohasspent]
                                  : "NA"
                              }`}</div>
                            </div>
                          );
                        }
                      )}
                      <Divider />
                      <p
                        style={{
                          fontWeight: "bold",
                          textAlign: "center",
                          color: "grey",
                        }}
                      >
                        who to whom
                      </p>
                      {Object.keys(expenselist.whowillgetbywhom).map((o) => {
                        return expenselist.whowillgetbywhom[o].map(
                          (whowhom, index) => {
                            return (
                              <div>
                                <p
                                  className="ExpenseDetailsText"
                                  style={{ paddingLeft: "8px" }}
                                >
                                  {index + 1}.{" "}
                                  {whowhom
                                    .replaceAll(username.email, "You")
                                    .replaceAll("@gmail.com", "")
                                    .replaceAll("his/her", "")}
                                </p>
                              </div>
                            );
                          }
                        );
                      })}
                    </Paper>
                  );
                })
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <Loader />
                </div>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <div style={{ textAlign: "center", height: "90px" }}>
          {selectedGroupData.tripstatus !== "completed" && (
            <>
              <button
                className="EndTripButton"
                onClick={() => setOpen(true)}
                disabled={selectedGroupData.createdby_email !== username.email}
              >
                End Trip
              </button>
              <p style={{ fontSize: "0.6rem", color: "black" }}>
                End trip to enable additional features like mark pending
                expenses as completed (only admin can end)
              </p>{" "}
            </>
          )}
        </div>
      </div>
      {/* <button onClick={GetExpeseData}>REFRESH MY DETAILS...</button> */}
    </div>
  );
};

export default AddExpense;
