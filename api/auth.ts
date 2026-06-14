import  http  from "@/lib/http";

/**
 * REGISTER USER
 */
export const register = async (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  const res = await http.post("/auth/register", payload);
  return res.data;
};

/**
 * LOGIN USER
 */
export const login = async (payload: {
  email: string;
  password: string;
}) => {
  const res = await http.post("/auth/login", payload);
  return res.data;
};

/**
 * GET CURRENT USER (SESSION RESTORE)
 */
export const getMe = async () => {
  const res = await http.get("/user");
  return res.data; // based on your sendSuccess wrapper
};

/**
 * LOGOUT USER
 */
export const logout = async () => {
  const res = await http.post("/auth/logout");
  return res.data;
};