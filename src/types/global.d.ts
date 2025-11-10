import { RequestUser } from '../common/interfaces/request-user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
