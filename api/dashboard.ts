import  http  from "@/lib/http";

/**
 * GET DASHBOARD INFORMATION
 */
export const dashboardInformation = async (
 ) => {
  const res = await http.get("/transactions/dashboard");
  return res.data;
};
