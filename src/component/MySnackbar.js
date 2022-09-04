import * as React from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";
function TransitionUp(props) {
  return <Slide {...props} direction="up" />;
}
export default function MySnackbar({ msg, open, handleClose }) {
  return (
    <div>
      <Snackbar
        autoHideDuration={2000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        TransitionComponent={TransitionUp}
        open={open}
        onClose={handleClose}
        message={msg}
        // key={vertical + horizontal}
      />
    </div>
  );
}
