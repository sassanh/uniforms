import { ConnectedField, UnknownObject } from 'uniforms';
import { ZodTypeAny } from 'zod';
declare module 'uniforms' {
    interface FilterDOMProps {
        minCount: never;
        maxCount: never;
    }
}
declare module 'zod' {
    interface ZodType {
        uniforms(uniforms: UnknownObject | ConnectedField<any>): ZodTypeAny;
        _uniforms: UnknownObject | ConnectedField<any>;
    }
}
//# sourceMappingURL=register.d.ts.map