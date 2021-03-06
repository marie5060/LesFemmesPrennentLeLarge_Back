import express from 'express';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import User from '../models/user';
import SurfSkills from '../models/surfskill';
import IUser from '../interfaces/IUser';
import * as Auth from '../helpers/auth';
import ISurfSkill from '../interfaces/ISurfskills';
import ISession from '../interfaces/ISession';
import Session from '../models/session';

const userController = express.Router();

userController.get('/', (async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result: IUser[] = await User.findMany();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

userController.get('/:id_user', (async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id_user } = req.params as IUser;
  try {
    const result: IUser = await User.findOneById(id_user);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

userController.post('/', User.validateUser, (async (
  req: Request,
  res: Response
) => {
  const { email } = req.body as IUser;
  const existingEmail: IUser = await User.findByEmail(email);
  if (existingEmail) {
    return res.status(400).json('BAD REQUEST EMAIL ALREADY EXIST');
  }
  const user = req.body as IUser;
  const response = await User.create(user);
  return res.status(200).json({ id_user: response[0].insertId, ...req.body });
}) as RequestHandler);

userController.put(
  '/:id_user',
  Auth.getCurrentSession,
  User.validateUser,
  (async (req: Request, res: Response) => {
    try {
      const { id_user } = req.params as IUser;
      const foundUser: IUser = await User.findOneById(id_user);

      if (foundUser) {
        await User.update(req.body, id_user);

        return res.status(200).send('USER MODIFIED');
      }
      return res.status(404).send('USER NOT FOUND');
    } catch (err) {
      return res.status(404).json(err);
    }
  }) as RequestHandler
);

userController.get('/:id_user/surfskills', (async (
  req: Request,
  res: Response
) => {
  try {
    const { id_user } = req.params;

    const foundUser: IUser = await User.findOneById(parseInt(id_user, 10));

    if (foundUser) {
      const surfskills: ISurfSkill[] = await SurfSkills.findSurfSkillsByUser(
        parseInt(id_user, 10)
      );
      if (surfskills) return res.status(200).json(surfskills);
      else return res.status(404).send('RESSOURCE NOT FOUND');
    }
  } catch (err) {
    console.log(err);
  }
}) as RequestHandler);

userController.get('/:id_user/sessions', (async (
  req: Request,
  res: Response
) => {
  try {
    const { id_user } = req.params;

    const foundUser: IUser = await User.findOneById(parseInt(id_user, 10));

    if (foundUser) {
      const sessions: ISession[] = await Session.findSessionsByIdUser(
        parseInt(id_user, 10)
      );
      if (sessions) return res.status(200).json(sessions);
      else return res.status(404).send('RESSOURCE NOT FOUND');
    }
  } catch (err) {
    console.log(err);
  }
}) as RequestHandler);

userController.post('/:id_user/surfskills/', (async (
  req: Request,
  res: Response
) => {
  const { id_user } = req.params as IUser;
  const { id_surf_skill } = req.body as ISurfSkill;
  try {
    const created = await SurfSkills.create(id_user, id_surf_skill);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json(err);
  }
}) as RequestHandler);

userController.delete('/:id_user/surfskills/', (async (
  req: Request,
  res: Response
) => {
  console.log(req);
  const { id_user } = req.params;
  try {
    const destroyed = await SurfSkills.destroyAll(parseInt(id_user));
    res.status(204).json('RESSOURCE DELETED');
  } catch (err) {
    res.status(500).json(err);
  }
}) as RequestHandler);

userController.delete('/:idUser', Auth.getCurrentSession, (async (
  req: Request,
  res: Response
) => {
  try {
    const { idUser } = req.params;
    await User.destroy(parseInt(idUser, 10));

    return res.status(201).send('USER DELETED');
  } catch (err) {
    console.log(err);
  }
}) as RequestHandler);

export default userController;
