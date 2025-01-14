import { appendErrors, FieldError, FieldErrors } from 'react-hook-form';
import { toNestError, validateFieldsNatively } from '@hookform/resolvers';
import type { Resolver } from './types';
import { Value, ValueError } from '@sinclair/typebox/value';

const parseErrorSchema = (
  _errors: ValueError[],
  validateAllFieldCriteria: boolean,
) => {
  const errors: Record<string, FieldError> = {};
  for (; _errors.length; ) {
    const error = _errors[0];
    const { type, message, path } = error;
    const _path = path.substring(1).replace(/\//g, '.');

    if (!errors[_path]) {
      errors[_path] = { message, type: '' + type };
    }

    if (validateAllFieldCriteria) {
      const types = errors[_path].types;
      const messages = types && types['' + type];

      errors[_path] = appendErrors(
        _path,
        validateAllFieldCriteria,
        errors,
        '' + type,
        messages
          ? ([] as string[]).concat(messages as string[], error.message)
          : error.message,
      ) as FieldError;
    }

    _errors.shift();
  }

  return errors;
};

export const typeboxResolver: Resolver =
  (schema) => async (values, _, options) => {
    const errors = Array.from(Value.Errors(schema, values));

    options.shouldUseNativeValidation && validateFieldsNatively({}, options);

    if (!errors.length) {
      return {
        errors: {} as FieldErrors,
        values,
      };
    }

    return {
      values: {},
      errors: toNestError(
        parseErrorSchema(
          errors,
          !options.shouldUseNativeValidation && options.criteriaMode === 'all',
        ),
        options,
      ),
    };
  };
