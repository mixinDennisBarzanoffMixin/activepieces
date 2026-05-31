import {
  AuthenticationResponse,
  CreateOtpRequestBody,
  ResetPasswordRequestBody,
  SignInRequest,
  SignUpRequest,
  UserIdentity,
  VerifyEmailRequestBody,
} from '@activepieces/shared';
import { createMutation } from "@tanstack/solid-query";

import { authenticationApi } from '@/api/authentication-api';
import { queryClient } from '@/app/query-client';
import { HttpError } from '@/lib/api';

export const authMutations = {
  useSignIn: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return createMutation<AuthenticationResponse, HttpError, SignInRequest>(
      () => ({
        mutationFn: authenticationApi.signIn,
        onSuccess,
        onError,
      }),
      () => queryClient,
    );
  },
  useSignUp: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return createMutation<AuthenticationResponse, HttpError, SignUpRequest>(
      () => ({
        mutationFn: authenticationApi.signUp,
        onSuccess,
        onError,
      }),
      () => queryClient,
    );
  },
  useSendOtpEmail: ({ onSuccess }: { onSuccess?: () => void }) => {
    return createMutation<void, HttpError, CreateOtpRequestBody>(
      () => ({
        mutationFn: authenticationApi.sendOtpEmail,
        onSuccess,
      }),
      () => queryClient,
    );
  },
  useResetPassword: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: (error: HttpError) => void;
  }) => {
    return createMutation<void, HttpError, ResetPasswordRequestBody>(
      () => ({
        mutationFn: authenticationApi.resetPassword,
        onSuccess,
        onError,
      }),
      () => queryClient,
    );
  },
  useVerifyEmail: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: UserIdentity) => void;
    onError: (error: unknown) => void;
  }) => {
    return createMutation(
      () => ({
        mutationFn: (request: VerifyEmailRequestBody) =>
          authenticationApi.verifyEmail(request),
        onSuccess,
        onError,
      }),
      () => queryClient,
    );
  },
};
