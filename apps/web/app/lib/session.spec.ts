import { EMPTY_SESSION } from './session';

describe('EMPTY_SESSION', () => {
  it('provides a fully logged-out session shape', () => {
    expect(EMPTY_SESSION).toEqual({
      user: null,
      tenants: [],
      activeTenant: null,
    });
  });
});
