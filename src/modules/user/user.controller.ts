import { Controller } from '../../interfaces';
import * as express from 'express';
import { ResponseHelper } from '../../helpers';
import userMiddleware from './user.middleware';
import * as VALIDATION from "./user.validation";
import * as Middleware from "../../middlewares/index";

const setResponse = ResponseHelper;

class UserController implements Controller {
  path: string;
  router: express.Router;
  constructor(path: string, router: express.Router) {
    this.path = path;
    this.router = router;
    this.initializeRoutes();
  }

  initializeRoutes = () => {
    this.router
      .all('/*')
      .get(
        this.path + '/generate-wallet',
        userMiddleware.generateNewWallet,
        this.responseHandler
      )
      .post(
        this.path + '/create-user',
        VALIDATION.createUser,
        Middleware.postValidate,
        userMiddleware.isUserExist,
        userMiddleware.createUser,
        this.responseHandler
      )
      .post(
        this.path + '/recover-by-phrase',
        VALIDATION.recoverByPhrase,
        Middleware.postValidate,
        userMiddleware.recoverWalletByPhrase,
        this.responseHandler
      )
      .post(
        this.path + '/recover-by-private-key',
        VALIDATION.recoverByPrivateKey,
        Middleware.postValidate,
        userMiddleware.recoverByPrivateKey,
        this.responseHandler
      )
      .post(
        this.path + '/update-username',
        VALIDATION.updateUser,
        Middleware.postValidate,
        userMiddleware.updateUsername,
        this.responseHandler
      )
      .post(
        this.path + '/user',
        VALIDATION.getUser,
        Middleware.postValidate,
        userMiddleware.getUser,
        this.responseHandler
      )
      .post(
        this.path + '/tokens',
        VALIDATION.getTokens,
        Middleware.postValidate,
        userMiddleware.getTokens,
        this.responseHandler
      )
      .post(
        this.path + '/transaction-pin',
        VALIDATION.setPin,
        Middleware.postValidate,
        userMiddleware.setPin,
        this.responseHandler
      )
      .get(
        this.path + '/generate-2fa',
        userMiddleware.generate2FA,
        this.responseHandler
      )
      .post(
        this.path + '/verify-2fa',
        VALIDATION.verify2Fa,
        Middleware.postValidate,
        userMiddleware.verify2FA,
        this.responseHandler
      )
      .post(
        this.path + '/validate-2fa',
        VALIDATION.validate2Fa,
        Middleware.postValidate,
        userMiddleware.validate2FA,
        this.responseHandler
      )
  };

  responseHandler = async (
    request: express.Request,
    response: express.Response
  ) => {
    if (typeof request.body.result != 'undefined') {
      return setResponse.success(request, response, request.body.result);
    } else {
      return setResponse.error400(request, response, { message: 'error' });
    }
  };
}

export default UserController;
