import { Responses } from '../interfaces';
import { Response, Request } from 'express';
import {
  GenericSuccess,
  GenericError,
} from '../interfaces/responses.interface';

class ResponseHelper {
  public async success(
    request: Request,
    response: Response,
    data: GenericSuccess
  ) {
    const finalSuccess: Responses.Responses = {
      response: {
        status: 200,
        message: data.message,
        error: false,
        data: typeof data.data != 'undefined' ? data.data : {},
      },
    };

    console.log('RESPONSE PAYLOAD ::', finalSuccess);
    
    return response.status(200).send(finalSuccess);
  }
  public async error400(
    request: Request,
    response: Response,
    data: GenericError
  ) {
    const errorResponse: Array<object|any> = [];
    if (typeof data.error === 'object') {
      errorResponse.push(data.error);
    }
    const finalError: Responses.Responses = {
      response: {
        status: 400,
        message: errorResponse[0]?.message ?? 'Error',
        error: true,
        data: errorResponse,
      },
    };
    console.log('RESPONSE PAYLOAD ::', finalError);
   
    return response.status(400).send(finalError);
  }

  public async error401(
    request: Request,
    response: Response,
    data: GenericError
  ) {
    const errorResponse: Array<object> = [];
    if (typeof data.error === 'object') {
      errorResponse.push(data.error);
    }
    const finalError: Responses.Responses = {
      response: {
        status: 401,
        message: data.errorMessage ? data.errorMessage : 'Error',
        error: true,
        data: errorResponse,
      },
    };
    console.log('RESPONSE PAYLOAD ::', finalError);
   
    return response.status(401).send(finalError);
  }

  public async error500(
    request: Request,
    response: Response,
    data: GenericError
  ) {
    const errorResponse: Array<object> = [];
    if (typeof data.error === 'object') {
      errorResponse.push(data.error);
    }
    const finalError: Responses.Responses = {
      response: {
        status: 500,
        message: 'Error',
        error: true,
        data: errorResponse,
      },
    };
    console.log('RESPONSE PAYLOAD ::', finalError);
    return response.status(500).send(finalError);
  }

  public grpcSuccess(data: GenericSuccess) {
    const finalSuccess: Responses.Responses = {
      response: {
        status: '200',
        message: data.message,
        error: false,
        data: typeof data.data != 'undefined' ? data.data : {},
      },
    };
    return finalSuccess.response;
  }

  public grpcError400(data: GenericError) {
    const errorResponse: Array<object> = [];
    if (typeof data.error === 'object') {
      errorResponse.push(data.error);
    }
    const finalError: Responses.GrpcResponses = {
      response: {
        status: '400',
        message: 'Error',
        error: true,
        data: errorResponse,
        errorData: errorResponse,
      },
    };
    return finalError.response;
  }
}
export default new ResponseHelper();
