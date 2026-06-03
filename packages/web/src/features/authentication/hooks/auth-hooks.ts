import {
  AuthenticationResponse,
  CreateOtpRequestBody,
  ResetPasswordRequestBody,
  SignInRequest,
  SignUpRequest,
  UserIdentity,
  VerifyEmailRequestBody,
} from '@activepieces/shared';
import { createMutation, useQueryClient } from '@tanstack/solid-query';

import { authenticationApi } from '@/api/authentication-api';
import { HttpError } from '@/lib/api';

export const authMutations = {
  useSignIn: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    const queryClient = useQueryClient();
    return createMutation<AuthenticationResponse, HttpError, SignInRequest>(
      () => ({
        mutationFn: (request) => authenticationApi.signIn(request),
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
    const queryClient = useQueryClient();
    return createMutation<AuthenticationResponse, HttpError, SignUpRequest>(
      () => ({
        mutationFn: (request) => authenticationApi.signUp(request),
        onSuccess,
        onError,
      }),
      () => queryClient,
    );
  },
  useSendOtpEmail: ({ onSuccess }: { onSuccess?: () => void }) => {
    const queryClient = useQueryClient();
    return createMutation<void, HttpError, CreateOtpRequestBody>(
      () => ({
        mutationFn: (request) => authenticationApi.sendOtpEmail(request),
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
    const queryClient = useQueryClient();
    return createMutation<void, HttpError, ResetPasswordRequestBody>(
      () => ({
        mutationFn: (request) => authenticationApi.resetPassword(request),
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
    const queryClient = useQueryClient();
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
