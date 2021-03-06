import connection from '../helpers/db-config';
import Joi from 'joi';
import ISession from '../interfaces/ISession';
import { ResultSetHeader } from 'mysql2';
import { ErrorHandler } from '../helpers/errors';
import { Request, Response, NextFunction } from 'express';

const findSession = (
  region: number,
  limit: number,
  date: string,
  pages: number,
  wahine: number
) => {
  let sql =
    'SELECT id_session, sessions.name, DATE_FORMAT(date, "%Y/%m/%d %H:%i:%s") AS date, spot_name, address, nb_hiki_max, sessions.id_department, id_surf_style, carpool, id_user, DATE_FORMAT(date, "%d/%m/%Y") AS nice_date, DATE_FORMAT(date, "%kh%i") AS nice_time FROM sessions';
  const sqlValue: Array<string | number> = [];

  if (wahine) {
    sql += ` WHERE id_user = ?`;
    sqlValue.push(wahine);
  }
  if (region) {
    sql +=
      ' INNER JOIN departments ON sessions.id_department=departments.id_department INNER JOIN regions ON departments.id_region=regions.id_region WHERE departments.id_region = ?';
    sqlValue.push(region);
    if (date) {
      sql += ' AND DATE_FORMAT(date, "%Y-%m-%d") = ?';
      sqlValue.push(date);
    }
  }
  if (date && !region) {
    sql += ' WHERE DATE_FORMAT(date, "%Y-%m-%d") = ?';
    sqlValue.push(date);
  }

  if (limit === 3) {
    sql += ' ORDER BY date DESC LIMIT ?';
    sqlValue.push(3);
  } else {
    if (pages === 0) {
      sql += ' ORDER BY date DESC LIMIT ?';
      sqlValue.push(9);
    } else if (pages > 0) {
      sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
      sqlValue.push(9, pages);
    }
  }

  // console.log(sql);
  // console.log(sqlValue);

  return connection
    .promise()
    .query<ISession[]>(sql, sqlValue)
    .then(([results]) => results);
};

const create = (session: ISession): Promise<number> => {
  const {
    name,
    date,
    spot_name,
    address,
    nb_hiki_max,
    id_department,
    id_surf_style,
    carpool,
    id_user,
  } = session;
  return connection
    .promise()
    .query<ResultSetHeader>(
      'INSERT INTO sessions (name, date, spot_name, address, nb_hiki_max, id_department, id_surf_style, carpool, id_user) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        name,
        date,
        spot_name,
        address,
        nb_hiki_max,
        id_department,
        id_surf_style,
        carpool,
        id_user,
      ]
    )
    .then(([results]) => results.insertId);
};

const findOne = (id_session: number) => {
  return connection
    .promise()
    .query<ISession[]>(
      'SELECT *, DATE_FORMAT(date, "%d/%m/%Y") AS nice_date, DATE_FORMAT(date, "%kh%i") AS nice_time FROM sessions WHERE id_session = ?',
      [id_session]
    )
    .then(([results]) => results[0]);
};

const update = (
  id_session: number,
  newAttributes: ISession
): Promise<boolean> => {
  return connection
    .promise()
    .query<ResultSetHeader>('UPDATE sessions SET ? WHERE id_session = ?', [
      newAttributes,
      id_session,
    ])
    .then(([results]) => results.affectedRows === 1);
};

const sessionExists = (req: Request, res: Response, next: NextFunction) => {
  // R??cup??rer l'id user de req.params
  const { idSession } = req.params;

  // V??rifier si le user existe
  findOne(Number(idSession))
    .then((sessionExists) => {
      // Si non, => erreur
      if (!sessionExists) {
        next(new ErrorHandler(404, `This session doesn't exist`));
      }
      // Si oui => next
      else {
        next();
      }
    })
    .catch((err: Error) => next(err));
};

const validateSession = (req: Request, res: Response, next: NextFunction) => {
  let required: Joi.PresenceMode = 'optional';
  if (req.method === 'POST') {
    required = 'required';
  }
  const errors = Joi.object({
    name: Joi.string().min(3).max(100).presence(required),
    date: Joi.string().presence(required),
    spot_name: Joi.string().min(2).max(100).presence(required),
    address: Joi.string().min(2).max(255).presence(required),
    nb_hiki_max: Joi.number().integer().presence(required),
    id_department: Joi.number().integer().presence(required),
    id_surf_style: Joi.number().integer().presence(required),
    carpool: Joi.number().integer().presence(required),
    id_user: Joi.number().integer().presence(required),
  }).validate(req.body, { abortEarly: false }).error;
  if (errors) {
    next(new ErrorHandler(422, errors.message));
  } else {
    next();
  }
};

const checkIfUserHasSubscribe = (id_user: number, id_session: number) => {
  return connection
    .promise()
    .query<ResultSetHeader>(
      'SELECT * FROM users_has_sessions WHERE id_user = ? AND id_session = ?',
      [id_user, id_session]
    )
    .then(([result]) => result);
};

const destroy = (id: number) => {
  return connection
    .promise()
    .query<ISession[]>('DELETE FROM sessions WHERE id_session = ?', [id]);
};

// const findSessionByUser = (id: number) => {
//   return connection
//     .promise()
//     .query<ISession[]>(
//       `SELECT s.* FROM sessions as s
//   INNER JOIN users_has_sessions as us ON s.id_session = us.id_session
//   WHERE us.id_user = ?`,
//       [id]
//     )
//     .then(([results]) => results);
// };

const findSessionsByIdUser = (idUser: number) => {
  return connection
    .promise()
    .query<ISession[]>(
      `SELECT s.id_session, s.name, DATE_FORMAT(s.date, "%Y/%m/%d %H:%i:%s") AS date, s.spot_name, s.address, s.nb_hiki_max, s.id_department, s.id_surf_style, s.carpool, s.id_user, DATE_FORMAT(s.date, "%d/%m/%Y") AS nice_date, DATE_FORMAT(s.date, "%kh%i") AS nice_time 
      FROM sessions s 
      INNER JOIN users_has_sessions us 
      ON s.id_session = us.id_session 
      AND us.id_user = ?`,
      [idUser]
    )
    .then(([results]) => {
      console.log(results);
      return results;
    });
};

export default {
  findSession,
  create,
  validateSession,
  findOne,
  update,
  sessionExists,
  checkIfUserHasSubscribe,
  destroy,
  findSessionsByIdUser,
  // findSessionByUser,
};
