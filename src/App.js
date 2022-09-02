import logo from "./logo.svg";
import "./App.css";
import React, { useEffect } from "react";
import { Home, SignOut, SignIn } from "./pages";
import { Link, Routes, Route, BrowserRouter } from "react-router-dom";
import AuthProvider, { AuthContext } from "./context/AuthProvider";
import Protected from "./component/Protected";
import Groups from "./pages/Groups";
import { Divider } from "@mui/material";
function App() {
  const [activeTab, setActiveTab] = React.useState(0);
  useEffect(() => {
    return () => {
      setActiveTab(0);
    };
  }, []);
  return (
    <div>
      <AuthProvider>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: "20px",
          }}
        >
          <div>
            <Link to="/home">
              {" "}
              <button
                className={`NavButtons ${activeTab == 0 ? "ActiveTab" : null}`}
                onClick={() => setActiveTab(0)}
              >
                Home{" "}
              </button>
            </Link>

            <Link to="/groups">
              <button
                className={`NavButtons ${activeTab == 1 ? "ActiveTab" : null}`}
                onClick={() => setActiveTab(1)}
              >
                My Groups
              </button>
            </Link>
          </div>
          <div>
            <Link id="signinlink" to="/signin">
              SignIn
            </Link>
            <Link to="/signout">Signout</Link>
          </div>
        </div>
        <Divider style={{ marginTop: "3px" }} />
        <div style={{ padding: "0 20px 10px 20px" }}>
          <Routes>
            <Route
              exact
              path="/"
              element={
                <Protected>
                  <Home />
                </Protected>
              }
            />
            <Route
              exact
              path="/home"
              element={
                <Protected>
                  <Home />
                </Protected>
              }
            />
            <Route path="/signin" element={<SignIn />} />
            <Route
              path="/signout"
              element={
                <Protected>
                  <SignOut />
                </Protected>
              }
            />
            <Route
              path="/groups"
              element={
                <Protected>
                  <Groups />
                </Protected>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </div>
  );
}

export default App;
