import { Request, Response, NextFunction } from 'express';
import express from 'express';
import Session from '../models/session';
import ISession from '../interfaces/ISession';
import { ErrorHandler } from '../helpers/errors';
import { number } from 'joi';
import IUser from '../interfaces/IUser';

const sessionsController = express.Router();

sessionsController.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      const limit = req.query.limit as string;
      try {
        const sessions: ISession[] = await Session.findSession(parseInt(limit));
        return res.status(200).json(sessions);
      } catch (err) {
        next(err);
      }
    })();
  }
);

sessionsController.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      const { id } = req.params as ISession;
      try {
        const session: ISession = await Session.findOne(id);
        return res.status(200).json(session);
      } catch (err) {
        next(err);
      }
    })();
  }
);

sessionsController.post(
  '/',
  Session.validateSession,
  (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      try {
        const session = req.body as ISession;
        const insertId: number = await Session.create(session);
        return res.status(200).json({ id_session: insertId, ...req.body });
      } catch (err) {
        next(err);
      }
    })();
  }
);

sessionsController.put(
  '/:idSession',
  Session.sessionExists,
  Session.validateSession,
  (req: Request, res: Response, next: NextFunction) => {
    const session = req.body as ISession;
    Session.update(parseInt(req.params.idSession, 10), session)
      .then((sessionUpdated) => {
        if (sessionUpdated) {
          res.status(200).send('User updated');
        } else {
          throw new ErrorHandler(500, `User cannot be updated`);
        }
      })
      .catch((err) => next(err));
  }
);

sessionsController.post(
  '/subscribe',
  (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      try {
        const { id_session } = req.body as ISession;
        const { id_user } = req.body as IUser
        const result : any = await Session.checkIfUserHasSubscribe(id_user, id_session)
        if(!result[0]) {
          const subscription : any = await Session.subscribe(id_user, id_session)
          console.log(subscription, 'subscription')
          return res.status(201).json('SUBSCRIPTION ADDED')
        }
        else return res.status(422).json('USER ALREADY SUBSCRIBE')
        
        
        
      } catch (err) {
        next(err);
      }
    })();
  }
);


sessionsController.delete(
  '/unsubscribe',
  (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      try {
        const { id_session } = req.body as ISession;
        const { id_user } = req.body as IUser
        const result : any = await Session.checkIfUserHasSubscribe(id_user, id_session)
        if(result[0]) {
          const unsubscription : any = await Session.unsubscribe(id_user, id_session)
          console.log(unsubscription, 'subscription')
          return res.status(201).json('SUBSCRIPTION REMOVED')
        }
        else return res.status(404).json('RESSOURCE NOT FOUND')
        
        
        
      } catch (err) {
        next(err);
      }
    })();
  }
);

sessionsController.get(
  '/:id/subscribers',
  (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      const { id } = req.params as ISession;
      
      try {
        const subscribers = await Session.allUserBySession(id);
        return res.status(200).json(subscribers);
      } catch (err) {
        next(err);
      }
    })();
  }
);

export default sessionsController;
