import { createBrowserRouter } from "react-router";
import { AppRoutes } from "./routes";

export const router = createBrowserRouter([
  {
    path: "*",
    element: <AppRoutes />,
  },
]);
