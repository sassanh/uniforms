"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uniforms_1 = require("uniforms");
const zod_1 = require("zod");
uniforms_1.filterDOMProps.register('minCount', 'maxCount');
zod_1.z.ZodType.prototype.uniforms = function extend(uniforms) {
    this._uniforms = uniforms;
    return this;
};
