import { AxiosError, isAxiosError } from 'axios';

export const validationUtils = {
  isValidationError: (
    error: unknown,
  ): error is AxiosError<{ code?: string; params?: { message?: string } }> => {
    console.error('isValidationError', error);
    return (
      isAxiosError<{ code?: string; params?: { message?: string } }>(error) &&
      error.response?.status === 409 &&
      error.response.data.code === 'VALIDATION'
    );
  },
};
