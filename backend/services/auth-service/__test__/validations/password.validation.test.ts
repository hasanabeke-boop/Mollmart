import { resetPasswordSchema, resetPasswordTokenSchema } from '../../src/validations/password.validation';

describe('password validation', () => {
  it('accepts UUID reset tokens for the reset password route', () => {
    const { error } = resetPasswordSchema.params.validate({
      token: '550e8400-e29b-41d4-a716-446655440000'
    });

    expect(error).toBeUndefined();
  });

  it('accepts UUID reset tokens for the reset password form route', () => {
    const { error } = resetPasswordTokenSchema.params.validate({
      token: '550e8400-e29b-41d4-a716-446655440000'
    });

    expect(error).toBeUndefined();
  });
});
