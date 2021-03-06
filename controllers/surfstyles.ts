import { Request, Response, NextFunction } from 'express';
import express from 'express';
import SurfStyle from '../models/surfstyle';
import ISurfStyle from '../interfaces/ISurfStyle';
const surfStyleController = express.Router();

surfStyleController.get('/coucou', (req: Request, res: Response) => {
  res.status(200).send('hibou');
});

surfStyleController.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    SurfStyle.findAll()
      .then((surfstyles: ISurfStyle[]) => {
        res.json(surfstyles);
      })
      .catch((err: Error) => {
        next(err);
      });
  }
);

surfStyleController.get(
  '/:id_surf_style',
  async (req: Request, res: Response, next: NextFunction) => {
    const { id_surf_style } = req.params as ISurfStyle;
    try {
      const result: ISurfStyle = await SurfStyle.findSurfStyleById(
        id_surf_style
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default surfStyleController;
