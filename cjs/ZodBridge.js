"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const invariant_1 = tslib_1.__importDefault(require("invariant"));
const lowerCase_1 = tslib_1.__importDefault(require("lodash/lowerCase"));
const memoize_1 = tslib_1.__importDefault(require("lodash/memoize"));
const upperFirst_1 = tslib_1.__importDefault(require("lodash/upperFirst"));
const uniforms_1 = require("uniforms");
const zod_1 = require("zod");
function fieldInvariant(name, condition) {
    (0, invariant_1.default)(condition, 'Field not found in schema: "%s"', name);
}
function isNativeEnumValue(value) {
    return typeof value !== 'string';
}
function getLabel(value) {
    return (0, upperFirst_1.default)((0, lowerCase_1.default)((0, uniforms_1.joinName)(null, value).slice(-1)[0]));
}
function getFullLabel(path, indexes = []) {
    const lastElement = path[path.length - 1];
    if (typeof lastElement === 'number') {
        const slicedPath = path.slice(0, path.length - 1);
        return getFullLabel(slicedPath, [lastElement, ...indexes]);
    }
    return indexes.length > 0
        ? `${getLabel(path)} (${indexes.join(', ')})`
        : getLabel(path);
}
class ZodBridge extends uniforms_1.Bridge {
    constructor({ schema, provideDefaultLabelFromFieldName = true, }) {
        super();
        this.schema = schema;
        this.provideDefaultLabelFromFieldName = provideDefaultLabelFromFieldName;
        // Memoize for performance and referential equality.
        this.getField = (0, memoize_1.default)(this.getField.bind(this));
        this.getInitialValue = (0, memoize_1.default)(this.getInitialValue.bind(this));
        this.getProps = (0, memoize_1.default)(this.getProps.bind(this));
        this.getSubfields = (0, memoize_1.default)(this.getSubfields.bind(this));
        this.getType = (0, memoize_1.default)(this.getType.bind(this));
    }
    getError(name, error) {
        if (!(error instanceof zod_1.ZodError)) {
            return null;
        }
        return error.issues.find(issue => name === (0, uniforms_1.joinName)(issue.path)) || null;
    }
    getErrorMessage(name, error) {
        var _a;
        return ((_a = this.getError(name, error)) === null || _a === void 0 ? void 0 : _a.message) || '';
    }
    getErrorMessages(error) {
        if (error instanceof zod_1.ZodError) {
            return error.issues.map(issue => {
                const name = getFullLabel(issue.path);
                return `${name}: ${issue.message}`;
            });
        }
        if (error instanceof Error) {
            return [error.message];
        }
        return [];
    }
    getField(name) {
        let field = this.schema;
        while (field instanceof zod_1.ZodEffects) {
            field = field._def.schema;
        }
        for (const key of (0, uniforms_1.joinName)(null, name)) {
            if (field instanceof zod_1.ZodDefault) {
                field = field.removeDefault();
            }
            else if (field instanceof zod_1.ZodOptional) {
                field = field.unwrap();
            }
            if (key === '$' || key === '' + parseInt(key, 10)) {
                fieldInvariant(name, field instanceof zod_1.ZodArray);
                field = field.element;
            }
            else {
                fieldInvariant(name, field instanceof zod_1.ZodObject);
                field = field.shape[uniforms_1.joinName.unescape(key)];
            }
        }
        return field;
    }
    getInitialValue(name) {
        var _a, _b;
        let field = this.getField(name);
        if (field instanceof zod_1.ZodOptional) {
            field = field.unwrap();
        }
        if (field instanceof zod_1.ZodArray) {
            const item = this.getInitialValue((0, uniforms_1.joinName)(name, '$'));
            if (item === undefined) {
                return [];
            }
            const length = ((_a = field._def.minLength) === null || _a === void 0 ? void 0 : _a.value) || 0;
            return Array.from({ length }, () => item);
        }
        if (field instanceof zod_1.ZodDefault) {
            return field._def.defaultValue();
        }
        if (field instanceof zod_1.ZodNativeEnum) {
            const values = Object.values(field.enum);
            return (_b = values.find(isNativeEnumValue)) !== null && _b !== void 0 ? _b : values[0];
        }
        if (field instanceof zod_1.ZodObject) {
            const value = {};
            this.getSubfields(name).forEach(key => {
                const initialValue = this.getInitialValue((0, uniforms_1.joinName)(name, key));
                if (initialValue !== undefined) {
                    value[key] = initialValue;
                }
            });
            return value;
        }
        return undefined;
    }
    // eslint-disable-next-line complexity
    getProps(name) {
        const props = Object.assign(Object.assign({}, (this.provideDefaultLabelFromFieldName && {
            label: getLabel(name),
        })), { required: true });
        let field = this.getField(name);
        const uniforms = field._uniforms;
        if (typeof uniforms === 'function') {
            props.component = uniforms;
        }
        else {
            Object.assign(props, uniforms);
        }
        if (field instanceof zod_1.ZodDefault) {
            field = field.removeDefault();
            props.required = false;
        }
        else if (field instanceof zod_1.ZodOptional) {
            field = field.unwrap();
            props.required = false;
        }
        if (field instanceof zod_1.ZodArray) {
            if (field._def.maxLength) {
                props.maxCount = field._def.maxLength.value;
            }
            if (field._def.minLength) {
                props.minCount = field._def.minLength.value;
            }
        }
        else if (field instanceof zod_1.ZodEnum) {
            props.options = field.options.map(value => ({ value }));
        }
        else if (field instanceof zod_1.ZodNativeEnum) {
            const values = Object.values(field.enum);
            const nativeValues = values.filter(isNativeEnumValue);
            props.options = (nativeValues.length ? nativeValues : values).map(value => ({ value }));
        }
        else if (field instanceof zod_1.ZodNumber) {
            if (!field.isInt) {
                props.decimal = true;
            }
            const max = field.maxValue;
            if (max !== null) {
                props.max = max;
            }
            const min = field.minValue;
            if (min !== null) {
                props.min = min;
            }
            const step = field._def.checks.find((check) => check.kind === 'multipleOf');
            if (step) {
                props.step = step.value;
            }
        }
        return props;
    }
    getSubfields(name = '') {
        let field = this.getField(name);
        if (field instanceof zod_1.ZodDefault) {
            field = field.removeDefault();
        }
        else if (field instanceof zod_1.ZodOptional) {
            field = field.unwrap();
        }
        if (field instanceof zod_1.ZodArray) {
            return ['$'];
        }
        if (field instanceof zod_1.ZodObject) {
            return Object.keys(field.shape);
        }
        return [];
    }
    getType(name) {
        let field = this.getField(name);
        if (field instanceof zod_1.ZodDefault) {
            field = field.removeDefault();
        }
        else if (field instanceof zod_1.ZodOptional) {
            field = field.unwrap();
        }
        if (field instanceof zod_1.ZodArray) {
            return Array;
        }
        if (field instanceof zod_1.ZodBoolean) {
            return Boolean;
        }
        if (field instanceof zod_1.ZodDate) {
            return Date;
        }
        if (field instanceof zod_1.ZodEnum || field instanceof zod_1.ZodString) {
            return String;
        }
        if (field instanceof zod_1.ZodNativeEnum) {
            const values = Object.values(field.enum);
            return typeof values.find(isNativeEnumValue) === 'number'
                ? Number
                : String;
        }
        if (field instanceof zod_1.ZodNumber) {
            return Number;
        }
        if (field instanceof zod_1.ZodObject) {
            return Object;
        }
        (0, invariant_1.default)(false, 'Field "%s" has an unknown type', name);
    }
    getValidator() {
        return (model) => {
            // TODO: What about async schemas?
            const result = this.schema.safeParse(model);
            return result.success ? null : result.error;
        };
    }
}
exports.default = ZodBridge;
