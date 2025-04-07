const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

class TwoFAHelper{
    generate2FA = async (): Promise<any> => {
        try {
          const secret = speakeasy.generateSecret({ name: 'MarvelX' });
          const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url ?? '');
          return { secret: secret.base32, qrCodeUrl } ;
        } catch (error) {
          console.error('Error generating 2FA QR code:', error);
          return false
        }
      };

verify2FA = async (token: string, userSecret: string) => {
  try {

    const isVerified = speakeasy.totp.verify({
      secret: userSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isVerified) {
      return false
    }
    else{
        return isVerified;
    }
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return false;
  }
};

validate2FaCode = async (user:any, token: string) => {

  try {

    const isValid = speakeasy.totp.verify({
      secret: user.google2FaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      return false
    }

    return isValid
  } catch (error) {
    console.error('Error validating 2FA:', error);
    return false;
  }
};
}

export default new TwoFAHelper();