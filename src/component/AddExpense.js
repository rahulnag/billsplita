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

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
  background: "#f8f8f878",
}));

const AddExpense = ({ selectedgroupname, selectedGroupData }) => {
  const { user } = useContext(AuthContext);
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
        pricespent: null,
        taken: 0,
      };
    })
  );
  const [consolidatedresult, setConsolidatedResult] = React.useState([]);

  //for accordian
  // const [expanded, setExpanded] = React.useState(false);
  const handleChange = (panel) => (event, isExpanded) => {
    // setExpanded(isExpanded ? panel : false);
  };
  //end for accordian
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
  }, [selectedGroupData]);

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
    let priceSpentByUser = 0;
    userList.map((individualUser) => {
      //1. individual price and total price check
      priceSpentByUser += Number(individualUser.pricespent);
    });
    if (priceSpentByUser !== data.price) {
      alert(
        "total price and combined price of each individual is not matching..."
      );
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
    }
    GetExpeseData();
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
                  "Already paid his/her bill",
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
                            " Will take " +
                            Math.abs(obj.extraspentby[temp]) +
                            " from...." +
                            temp,
                        ];
                        obj.whowillgetbywhom[temp] = [
                          ...(obj.whowillgetbywhom[temp] !== undefined
                            ? obj.whowillgetbywhom[temp]
                            : ""),
                          temp +
                            " Will give " +
                            Math.abs(obj.extraspentby[temp]) +
                            " to...." +
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
                            " Will take " +
                            Math.abs(obj.extraspentby[individual]) +
                            " from...." +
                            temp,
                        ];
                        obj.whowillgetbywhom[temp] = [
                          ...(obj.whowillgetbywhom[temp] !== undefined
                            ? obj.whowillgetbywhom[temp]
                            : ""),
                          temp +
                            " Will give " +
                            Math.abs(obj.extraspentby[individual]) +
                            " to...." +
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
                            " Will take " +
                            Math.abs(obj.extraspentby[individual]) +
                            " from...." +
                            temp,
                        ];
                        obj.whowillgetbywhom[temp] = [
                          ...(obj.whowillgetbywhom[temp] !== undefined
                            ? obj.whowillgetbywhom[temp]
                            : ""),
                          temp +
                            " Will give " +
                            Math.abs(obj.extraspentby[temp]) +
                            " to...." +
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
              finalresult[individual] = ["Already paid his/her bill"];
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
                          " Will take " +
                          Math.abs(myfinaldata[temp]) +
                          " from...." +
                          temp,
                      ];
                      finalresult[temp] = [
                        ...(finalresult[temp] !== undefined
                          ? finalresult[temp]
                          : ""),
                        temp +
                          " Will give " +
                          Math.abs(myfinaldata[temp]) +
                          " to...." +
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
                          " Will take " +
                          Math.abs(myfinaldata[individual]) +
                          " from...." +
                          temp,
                      ];
                      finalresult[temp] = [
                        ...(finalresult[temp] !== undefined
                          ? finalresult[temp]
                          : ""),
                        temp +
                          " Will give " +
                          Math.abs(myfinaldata[individual]) +
                          " to...." +
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
                          " Will take " +
                          Math.abs(myfinaldata[individual]) +
                          " from...." +
                          temp,
                      ];
                      finalresult[temp] = [
                        ...(finalresult[temp] !== undefined
                          ? finalresult[temp]
                          : ""),
                        temp +
                          " Will give " +
                          Math.abs(myfinaldata[temp]) +
                          " to...." +
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
  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <h3>Add Expenses</h3>
        {/* <label>Enter Item Name:</label> */}
        <input
          className="AdduserInputBox"
          type="string"
          onChange={(e) => setData({ ...data, item: e.target.value })}
          placeholder="Enter item name"
        />{" "}
        {/* <label>Enter Item Price:</label> */}
        <input
          className="AdduserInputBox"
          type="number"
          onChange={(e) => setData({ ...data, price: Number(e.target.value) })}
          placeholder="Enter item price"
        />
        <table
          style={{
            border: "1px solid lightgrey",
            marginTop: "8px",
            borderRadius: "8px",
            width: "97%",
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid lightgrey" }}>Friends</th>
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
                    <div style={{ color: "#4e4e4e" }}>{i.name}</div>
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
                        className="AmountInputBox"
                        type="number"
                        onChange={(e) => handleAmountGivenInput(e, i, index)}
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
          SAVE
        </button>
      </div>

      <p
        style={{ textAlign: "center", color: "#4e4e4e" }}
      >{`${selectedgroupname.toUpperCase()} Expense Details`}</p>
      <div style={{ padding: "0 20px 0 20px" }}>
        <Accordion
          // expanded={expanded === "panel1"}
          onChange={handleChange("panel1")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >
            <Typography sx={{ width: "33%", flexShrink: 0 }}>
              Consolidated Result
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              You will get details of how much you have to pay or get
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
                  width: 328,
                  height: 128,
                },
              }}
            >
              {Object.keys(consolidatedresult).map((user) => {
                return consolidatedresult[user].map((data) => {
                  return (
                    <Paper style={{ padding: "5px" }} elevation={2}>
                      <p className="ExpenseDetailsText">{data}</p>
                    </Paper>
                  );
                });
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* <button onClick={GetExpeseData}>REFRESH MY DETAILS...</button> */}
        <Accordion
          // expanded={expanded === "panel2"}
          onChange={handleChange("panel2")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2bh-content"
            id="panel2bh-header"
          >
            <Typography sx={{ width: "33%", flexShrink: 0 }}>
              My Expense Details
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              You will get completed details of yours
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
                  width: 328,
                  // height: 128,
                },
              }}
            >
              {finalExpenseCalculation.length > 0 ? (
                finalExpenseCalculation.map((expenselist) => {
                  return (
                    <Paper style={{ padding: "0 5px 5px 5px" }} elevation={2}>
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bolder",
                          color: "#504e4e",
                        }}
                      >{`Item:  ${expenselist.item}`}</div>
                      <Divider />
                      {
                        // console.log(expenselist)
                        //this condition because not all user will be present in expenselist.whowillgetbywhom[user.email]
                        expenselist.whowillgetbywhom[user.email] !== undefined
                          ? expenselist.whowillgetbywhom[user.email].map(
                              (whowhom) => {
                                return (
                                  <div>
                                    <Divider />
                                    <p className="ExpenseDetailsText">
                                      {whowhom}
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
                <h2>Loading...</h2>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion
          // expanded={expanded === "panel3"}
          onChange={handleChange("panel3")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3bh-content"
            id="panel3bh-header"
          >
            <Typography sx={{ width: "33%", flexShrink: 0 }}>
              Group Complete Details
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              You will get details of how much you have to pay or get
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
                  width: 328,
                  // height: 128,
                },
              }}
            >
              {finalExpenseCalculation.length > 0 ? (
                finalExpenseCalculation.map((expenselist) => {
                  return (
                    <Paper style={{ padding: "0 5px 5px 5px" }} elevation={2}>
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
                      {expenselist.takenby.map((whohaseaten) => {
                        return (
                          <p
                            className="ExpenseDetailsText"
                            style={{ paddingLeft: "8px" }}
                          >
                            {whohaseaten}
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
                      {Object.keys(expenselist.spent).map((whohasspent) => {
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
                            >{`${whohasspent} `}</div>
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
                      })}
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
                          (whowhom) => {
                            return (
                              <div>
                                <p className="ExpenseDetailsText">{whowhom}</p>
                              </div>
                            );
                          }
                        );
                      })}
                    </Paper>
                  );
                })
              ) : (
                <h2>Loading...</h2>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </div>
      {/* <button onClick={GetExpeseData}>REFRESH MY DETAILS...</button> */}
    </div>
  );
};

export default AddExpense;
