import { NextFunction, Request, Response } from 'express';
import Joi, { ObjectSchema } from 'joi';
import httpStatus from 'http-status';

type ValidationSchema = Partial<Record<'body' | 'query' | 'params', ObjectSchema>>;

const validate =
  (schema: ValidationSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = Joi.object(schema).validate(
      {
        body: req.body,
        query: req.query,
        params: req.params
      },
      {
        abortEarly: false,
        stripUnknown: true
      }
    );

    if (error != null) {
      res.status(httpStatus.BAD_REQUEST).json({
        message: 'Validation failed',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
      return;
    }

    req.body = value.body;
    req.query = value.query;
    req.params = value.params;
    next();
  };

export default validate;
