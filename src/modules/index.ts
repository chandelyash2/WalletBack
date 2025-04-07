import * as express from 'express';
import UserController from './user/user.controller';

class InitControllers {
  public path = '';
  public router = express.Router();
  constructor() {
    new UserController('/user', this.router);
  }
}

export default InitControllers;
