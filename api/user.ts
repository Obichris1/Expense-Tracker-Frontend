import http from "@/lib/http";





// Types
export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  contact?: string;
  country?: string;
  currency?: string;
}

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    contact: string;
    provider: string | null;
    country: string;
    refreshToken: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
  }

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

// API Functions
export const userApi = {

    getUser: async (): Promise<ApiResponse<User>> => {
        const response = await http.get('/user');
        console.log(response);
        
        return response.data;

      },
  changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponse> => {
    const response = await http.put('/user/change-password', payload);
    return response.data;
  },

  updateUser: async (payload: UpdateUserPayload): Promise<ApiResponse> => {
    const response = await http.put('/user/update-user', payload);
    return response.data;
  },
};