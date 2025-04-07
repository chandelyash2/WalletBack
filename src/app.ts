import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { Controller } from './interfaces';
import * as CM from './constant/response';
const apiBase = CM.API_BASE;
import helmet from 'helmet';
import * as cors from 'cors'; 
import connectMongoDB from './helpers/db.helper';

declare global {
  namespace Express {
  }
}

class App {
  public app: express.Application;
  constructor(controllers: Controller) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
  }

  public listen() {
    this.app.listen(process.env.PORT ? process.env.PORT : 5000, () => {
      console.log(
        `App listening on the port ${
          process.env.PORT ? process.env.PORT : 5000
        }`
      );
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
    this.app.use(cookieParser());
    this.app.use(cors());
    this.app.get(`${apiBase}/status`, (req, res) => {
      console.log('Status Route called');
      return res.json({ status: 'success' });
    });
    this.securityHooks();
  }

  private initializeControllers(controller: Controller) {
    connectMongoDB();
    this.app.use(cors());
    this.app.use(`${apiBase}`, controller.router);
  }

  private securityHooks() {
    this.app.use(helmet());
    this.app.use(
      helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
          'frame-ancestors': "'none'",
        },
      })
    );
    this.app.use(helmet.dnsPrefetchControl());
    this.app.use(
      helmet.frameguard({
        action: 'deny',
      })
    );
    this.app.use(helmet.hidePoweredBy());
    this.app.use(helmet.hsts());
    this.app.use(helmet.ieNoOpen());
    this.app.use(helmet.noSniff());
    this.app.use(helmet.permittedCrossDomainPolicies());
    this.app.use(helmet.referrerPolicy());
    this.app.use(helmet.xssFilter());

    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        if (err) {
          res.status(404).json({ error: err.message });
        } else {
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'none'; script-src 'none'; style-src 'none'; img-src 'none'; frame-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; connect-src 'none'; form-action 'none'; frame-ancestors 'none';"
          );
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader(
            'Strict-Transport-Security',
            ' max-age=31536000; includeSubDomains'
          );
          next();
        }
      }
    );
  }
}

export default App;
