import * as React from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";
function TransitionLeft(props) {
  return <Slide {...props} direction="left" />;
}
export default function MySnackbar({ msg, open, handleClose }) {
  return (
    <div>
      <Snackbar
        autoHideDuration={2000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        TransitionComponent={TransitionLeft}
        open={open}
        onClose={handleClose}
        message={msg}
        // key={vertical + horizontal}
      />
    </div>
  );
}
