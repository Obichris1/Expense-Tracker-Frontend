import http from "@/lib/http";



export const getBudget = async () => {
    const response = await http.get('/budget');
    return response.data;
  };
   
  // Create or update budget
  export const upsertBudget = async (name: string, amount: number) => {
    const response = await http.post('/budget', {
      name,
      amount,
    });
    return response.data;
  };
   
  // Delete budget
  export const deleteBudget = async () => {
    const response = await http.delete('/budget');
    return response.data;
  };
   