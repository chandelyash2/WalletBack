import { User } from '../../models/user.model';
import { SolanaHelper } from '../../helpers/index';

class UserHelper {

  generateWallet = async () => {
    try {
      const result = await SolanaHelper.generateWalletAddress();
      console.log('NEW GENERATED WALLET :', result);
      if(!result){
        return false;
      }
      return result;
    } catch (error) {
      console.log('ERROR GENERATE WALLET :', error);
      return false;
    }
  };

  findOne = async (walletAddress : string ):Promise<any> => {
    let user = '';
    try {
      user = await User.findOne({ wallets: walletAddress }) ?? '';
      console.log('USER FOUND :', user);
      if(!user){
        return false;
      }
      return user;
    } catch (error) {
      console.log('ERROR FIND USER :', error);
      return false;
    }
  };

  createOne = async (walletAddress : string,password: string,username:string) => {
    try {
      const user = await User.create({
        wallets : walletAddress,
        password:password ,
        username:username
      })
      return user;
    } catch (error) {
      console.log('ERROR CREATE USER :', error);
      throw error;
    }
  }
 
}
export default new UserHelper();
