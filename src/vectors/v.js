import { _v3 } from "../3D/3D.js"
import { _quaternion } from "../quaternions/q.js"
import {
    _interpret_s,
    _interpret_v,
    _interpret_m,
    _interpret_p,
    _reading_and_writing
} from "../reading_and_writing/R&R.js"

class Vec extends Float32Array {
    constructor() {
        if (1 < arguments.length) {
            let values = []
            for (let arg of arguments) { typeof arg === "number" ? values.push(arg) : values.push(...arg) }
            super(values)
        } else { super(arguments[0]) }
        Object.assign(this, _reading_and_writing)
        this.length === 3 && Object.assign(this, _v3)
        this.length === 4 && Object.assign(this, _quaternion)
    }

    swizzle(xyz) {
        xyz = v(...arguments)
        let out = v(xyz.length)
        for (let i = 0; i < xyz.length; i++) { out[i] = this[xyz[i]] }
        return out
    }

    swz(...xyz) { return this.swizzle(...xyz) }

    dot(...vector) {
        let vec = _interpret_v(this, ...vector)
        let length = this.length < vec.length ? this.length : vec.length
        let product = 0
        for (let i = 0; i < length; i++) { product += this[i] * vec[i] }
        return product
    }

    equals(vector, threshold = 0.0001) { return v.distance(this, vector) < threshold }

    randomize(range = 1, locus = v(this.length)) {
        for (let i = 0; i < this.length; i++) this[i] = (Math.random() - 0.5) * range + locus[i]
        return this
    }

    magnitude() { return Math.sqrt(this.dot(this)) }

    clamp(min = -1, max = 1) {
        for (let i = 0; i < this.length; i++) this[i] < min ? (this[i] = min) : this[i] > max && (this[i] = max)
        return this
    }

    quantize() {
        for (let i = 0; i < this.length; i++) this[i] = Math.round(this[i]) || 0
        return this
    }

    normalize(new_magnitude = 1) {
        let old_magnitude = this.magnitude()
        return old_magnitude === 0 ? this : this.scale(new_magnitude / old_magnitude)
    }

    scale(scalar = 1) {
        scalar = _interpret_s(this, ...arguments)
        for (let i = 0; i < this.length; i++) { this[i] *= scalar }
        return this
    }

    v_scale(...vector) {
        let vec = _interpret_v(this, ...vector)
        for (let i = 0; i < this.length; i++) { this[i] *= vec[i] }
        return this
    }
    add(...vector) {
        let vec = _interpret_v(this, ...vector)
        for (let i = 0; i < this.length; i++) { this[i] += vec[i] }
        return this
    }
    sub(...vector) {
        let vec = _interpret_v(this, ...vector)
        for (let i = 0; i < this.length; i++) { this[i] -= vec[i] }
        return this
    }
    to(...vector) {
        let vec = _interpret_v(this, ...vector)
        for (let i = 0; i < this.length; i++) { this[i] = vec[i] - this[i] }
        return this
    }

    to_plane(normal, point_on_plane) {
        [normal, point_on_plane] = _interpret_p(this.length, ...arguments)
        return v(this).sub(point_on_plane).dot(normal)
    }

    collapse(normal, point_on_plane) {
        [normal, point_on_plane] = _interpret_p(this.length, ...arguments)

        let rejection = this.to_plane(normal, point_on_plane)
        return this.sub(v(normal).scale(rejection))
    }

    mirror(normal, point_on_plane) {
        [normal, point_on_plane] = _interpret_p(this.length, ...arguments)
        let rejection = this.to_plane(normal, point_on_plane)
        return this.sub(v(normal).scale(rejection * 2))
    }
    reflect(normal) {
        [normal] = _interpret_p(this.length, ...arguments)
        return this.to(v(normal).scale(2 * this.dot(normal)))
    }
    bounce(normal) {
        [normal] = _interpret_p(this.length, ...arguments)
        return this.sub(v(normal).scale(2 * this.dot(normal)))
    }
    lerp(t, ...vector) {
        let vec = _interpret_v(this, ...vector)
        let one_minus_t = 1 - t
        for (let i = 0; i < this.length; i++) { this[i] = this[i] * one_minus_t + vec[i] * t }
        return this
    }
    slerp(t, ...vector) {
        let vec = _interpret_v(this, ...vector)
        let length = this.length

        if (vec.length === length) {

            let a = v(this)
            let b = v(vec)

            let a_mag = a.magnitude()
            let b_mag = b.magnitude()

            a_mag != 0 && a.scale(1 / a_mag)
            b_mag != 0 && b.scale(1 / b_mag)

            let mag = (1 - t) * a_mag + t * b_mag

            let cos = v.dot(a, b)

            if (cos >= 1) { return this }
            if (cos <= -1) {
                cos = 0
                t *= 2
                let tmp = b[0];
                for (let i = 1; i < length; i++) { b[i - 1] = b[i] }
                b[length - 1] = tmp
            }
            let theta = Math.acos(cos)
            let sin = Math.sin(theta)
            let scalar_a = Math.sin((1 - t) * theta) / sin
            let scalar_b = Math.sin(t * theta) / sin

            for (let i = 0; i < length; i++) { this[i] = (a[i] * scalar_a + b[i] * scalar_b) * mag }
            return this
        }
    }
    transform_by(...matrix) {
        matrix = _interpret_m(this, ...matrix)
        let rows = matrix.codomain
        let columns = matrix.domain
        if (rows === columns && columns === this.length) {
            let old = v(this)
            for (let i = 0; i < rows; i++) {
                this[i] = 0
                for (let j = 0; j < columns; j++) {
                    this[i] += old[j] * matrix[i * rows + j]
                }
            }
        }
        return this
    }
}

export function v() { return new Vec(...arguments) }

v.midpoint = function (...vecs) {
    let mid = v(vecs[0].length)
    for (let vec of vecs) {
        vec.length != mid.length && console.error("dimension mismatch")
        mid.add(vec)
    }
    return mid.scale(1 / arguments.length)
}
v.dot = function (a, b) {
    let length = a.length < b.length ? a.length : b.length
    let product = 0
    for (let i = 0; i < length; i++) { product += a[i] * b[i] }
    return product
}
v.cross = function (a, b) {
    if (a.length === b.length && a.length === 3) {
        let c = v(3)
        c[0] = a[1] * b[2] - a[2] * b[1]
        c[1] = a[2] * b[0] - a[0] * b[2]
        c[2] = a[0] * b[1] - a[1] * b[0]
        return c
    } else { return v(1, 0, 0) }
}
v.distance = function (a, b) { return v(a).sub(b).magnitude() }

v.q = function () {
    return v(4).quaternion(...arguments)
}
