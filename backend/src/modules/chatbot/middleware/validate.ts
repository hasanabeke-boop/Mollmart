import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import Joi from 'joi';

type ValidationSchema = {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
};

export default function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sources: Array<keyof ValidationSchema> = ['params', 'query', 'body'];

    for (const source of sources) {
      const validator = schema[source];
      if (validator == null) {
        continue;
      }

      const { value, error } = validator.validate(req[source], {
        abortEarly: false,
        stripUnknown: true
      });

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

      req[source] = value;
    }

    next();
  };
}
