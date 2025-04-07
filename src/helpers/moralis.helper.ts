import Moralis from "moralis";
  
  (async () => {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      console.log("Moralis started successfully");
    }
  })();

  class MoralisHelper {

    getTokens = async (walletAddress:string,network:string): Promise<any>=> {
        const tokensResponse = await Moralis.SolApi.account.getSPL({
            network,
            address: walletAddress.trim(),
          });

          return tokensResponse;
    }

    getBalance = async (walletAddress:string,network:string)=> {
        const balanceResponse = await Moralis.SolApi.account.getBalance({
            network,
            address: walletAddress.trim(),
          });

          return balanceResponse;
    }

    getTokenPrice = async(network:string,token:any)=>{
        const priceResponse = await Moralis.SolApi.token.getTokenPrice({
            network,
            address: token.mint,
          });

          return priceResponse ; 
    }
  }

  export default new MoralisHelper() ; 