import CircularProgress from "@mui/material/CircularProgress";

export default function Loader() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <CircularProgress sx={{ color: "#000" }} />
    </div>
  );
}