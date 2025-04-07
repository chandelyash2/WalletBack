import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Interface } from '../interfaces/index';
import * as CM from '../constant/response';

function errorMiddleware(
  error: any ,
  req: Request,
  response: Response
) {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  return response.status(status).send({
    message,
    status,
  });
}

const postValidate = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const error = validationResult(request);
  const responseError: Array<object> = [];

  if (!error.isEmpty()) {
    for (const errorRow of error.array() as Array<Interface.FIELD_VALIDATION_ERROR>) {
      responseError.push({
        field: CM.SERVICE + '.validation.' + errorRow.path,
        message: errorRow.msg,
      });
    }
    return response.status(CM.RESPONSES.BADREQUEST).send({
      response: {
        status: 400,
        message: 'Error!',
        error: true,
        data: responseError,
      },
    });
  } else {
    next();
  }
};


export {
  errorMiddleware,
  postValidate
};
