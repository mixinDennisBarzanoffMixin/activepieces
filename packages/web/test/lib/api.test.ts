import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  axios: vi.fn(),
}));

vi.mock('axios', async (load) => ({
  ...(await load<typeof import('axios')>()),
  default: mocks.axios,
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getToken: () => 'token',
    logOut: vi.fn(),
  },
}));

describe('api credentials', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.axios.mockReset();
    mocks.axios.mockResolvedValue({ data: {} });
    vi.stubGlobal('window', {
      location: {
        origin: 'https://activepieces.test',
        href: '',
      },
    });
  });

  it('omits credentials from external requests', async () => {
    const { api, setVeritlyProjectId } = await import('@/lib/api');
    setVeritlyProjectId('project');

    await api.get('https://secrets.activepieces.com/apps', { edition: 'ce' });

    expect(mocks.axios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://secrets.activepieces.com/apps',
        withCredentials: false,
        headers: expect.not.objectContaining({
          'x-veritly-project-id': expect.anything(),
        }),
      }),
    );
  });

  it('includes credentials on Activepieces requests', async () => {
    const { api, setVeritlyProjectId } = await import('@/lib/api');
    setVeritlyProjectId('project');

    await api.get('/v1/flags');

    expect(mocks.axios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://activepieces.test/api/v1/flags',
        withCredentials: true,
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'x-veritly-project-id': 'project',
        }),
      }),
    );
  });
});
