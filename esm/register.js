import { filterDOMProps } from 'uniforms';
import { z } from 'zod';
filterDOMProps.register('minCount', 'maxCount');
z.ZodType.prototype.uniforms = function extend(uniforms) {
    this._uniforms = uniforms;
    return this;
};
