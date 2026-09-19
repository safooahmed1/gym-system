"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const errors_js_1 = require("../utils/errors.js");
function validate(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                return next(errors_js_1.AppError.validationError('Validation failed', details));
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validate.js.map