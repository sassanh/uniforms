import { Bridge, UnknownObject } from 'uniforms';
import { ZodEffects, ZodError, ZodIssue, ZodObject, ZodRawShape, ZodType } from 'zod';
/** Option type used in SelectField or RadioField */
type Option<Value> = {
    disabled?: boolean;
    label?: string;
    key?: string;
    value: Value;
};
type BuildTuple<L extends number, T extends any[] = []> = T['length'] extends L ? T : BuildTuple<L, [...T, any]>;
type Decrement<N extends number> = BuildTuple<N> extends [any, ...infer R] ? R['length'] : never;
type NestedZodEffect<T extends ZodObject<any>, Depth extends number = 10> = Depth extends 0 ? T : ZodEffects<T | NestedZodEffect<T, Decrement<Depth>>>;
export default class ZodBridge<T extends ZodRawShape> extends Bridge {
    schema: ZodObject<T> | NestedZodEffect<ZodObject<T>>;
    provideDefaultLabelFromFieldName: boolean;
    constructor({ schema, provideDefaultLabelFromFieldName, }: {
        schema: ZodObject<T> | NestedZodEffect<ZodObject<T>>;
        provideDefaultLabelFromFieldName?: boolean;
    });
    getError(name: string, error: unknown): ZodIssue | null;
    getErrorMessage(name: string, error: unknown): string;
    getErrorMessages(error: unknown): string[];
    getField(name: string): ZodType<any, import("zod").ZodTypeDef, any>;
    getInitialValue(name: string): unknown;
    getProps(name: string): UnknownObject & {
        options?: Option<unknown>[];
    };
    getSubfields(name?: string): string[];
    getType(name: string): ObjectConstructor | ArrayConstructor | BooleanConstructor | DateConstructor | StringConstructor | NumberConstructor;
    getValidator(): (model: UnknownObject) => ZodError<import("zod").baseObjectInputType<T> extends infer T_1 ? { [k in keyof T_1]: import("zod").baseObjectInputType<T>[k]; } : never> | null;
}
export {};
//# sourceMappingURL=ZodBridge.d.ts.map