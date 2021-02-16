import { interpret_s, interpret_v, interpret_m, copy_at_index, interpret_p } from "./interpret.js"

class Vec extends Float32Array {
    constructor() {
        if (1 < arguments.length) {
            let values = []
            for (let arg of arguments) { typeof arg == "number" ? values.push(arg) : values.push(...arg) }
            super(values)
        } else { super(arguments[0]) }
        this.index = undefined
        this.parent = undefined
    }

    copy(vector, index = this.index) {
        return copy_at_index(this, vector, (this.length == vector.length ? 0 : index))
    }
    read(array, index = this.index) {
        this.parent = array
        this.index = index
        return copy_at_index(this, array, index)
    }
    write(array, index = this.index) {

        // u need a write at index function for this 

        if (array && "length" in array) { this.parent = array }
        if (index != undefined) { this.index = index }
        for (let i = 0; i < this.length; i++) { this.parent[this.index * this.length + i] = this[i] }
        return this
    }
    clear() {
        this.fill(0)
        this.parent = undefined
        this.index = undefined
        return this
    }

    swizzle(xyz) {
        xyz = v(...arguments)
        let out = v(xyz.length)
        for (let i = 0; i < xyz.length; i++) { out[i] = this[xyz[i]] }
        return out
    }

    swz(...xyz) { return this.swizzle(...xyz) }

    dot(vector, index = this.index) {
        let vec = interpret_v(this.length, vector, index)
        let length = this.length < vec.length ? this.length : vec.length
        let product = 0
        for (let i = 0; i < length; i++) { product += this[i] * vec[i] }
        return product
    }

    // this is some clunky syntax...
    cross(vector, index = this.index) {
        let vec = interpret_v(this.length, vector, index)
        let c = v.cross(this, vec)
        return copy_at_index(this, c, 0)
    }
    
    // .... not a gr8 look
    equals(vector, threshold = 0.0001) { return v.distance(this, vector) < threshold }

    randomize(range = 1, locus = v(this.length)) {
        for (let i = 0; i < this.length; i++) this[i] = (Math.random() - 0.5) * range + locus[i]
        return this
    }


    // Returns the vector's cartesian "length" (or distance from the origin)
    // v(1,0).magnitude() == v(0,1).magnitude() == 1
    magnitude() { return Math.sqrt(this.dot(this)) }

    // Assigns a constant to each element of the vector
    // v(8).fill(1) == v(1,1,1,1,1,1,1,1)
    fill(value) {                                                   // interpret?
        for (let i = 0; i < this.length; i++) this[i] = value
        return this
    }

    // Makes sure each element sits within a given range (-1 to 1 by default)
    // v(0.5,-50).clamp() == v(0.5,-1)
    clamp(min = -1, max = 1) {
        for (let i = 0; i < this.length; i++) this[i] < min ? (this[i] = min) : this[i] > max && (this[i] = max)
        return this
    }

    // Rounds each element to the nearest integer
    // v(0.1, 2.9).quantize() == v(0,3)
    quantize() {
        for (let i = 0; i < this.length; i++) this[i] = Math.round(this[i]) || 0
        return this
    }

    // Scale the vector to a desired magnitude (1 by default)
    // v(0,1,1).normalize() == v(0,0.7,0.7)
    // v(x,y,z).normalize(100).magnitude() == 100
    normalize(new_magnitude = 1) {
        let old_magnitude = this.magnitude()
        return old_magnitude == 0 ? this : this.scale(new_magnitude / old_magnitude)
    }

    // Scale each element by a single number
    // v(0,1,2).scale(2) == v(0,2,4)
    scale(scalar = 1, index = this.index) {
        let sc = interpret_s(...arguments)
        for (let i = 0; i < this.length; i++) { this[i] *= sc }
        return this
    }

    // Scale by another vector (elementwise)
    // v(1,2,3).v_scale(1,10,100) == v(1,20,300)
    v_scale(vector, index = this.index) {
        let vec = interpret_v(this.length, ...arguments)
        for (let i = 0; i < this.length; i++) { this[i] *= vec[i] }
        return this
    }

    // Adds values from another vector (elementwise)
    add(vector, index = this.index) {
        let vec = interpret_v(this.length, ...arguments)
        for (let i = 0; i < this.length; i++) { this[i] += vec[i] }
        return this
    }

    // Subtracts values from another vector (elementwise)
    sub(vector, index = this.index) {
        let vec = interpret_v(this.length, ...arguments)
        for (let i = 0; i < this.length; i++) { this[i] -= vec[i] }
        return this
    }

    // Gives the vector from point A to point B
    // A.to(B) == B.sub(A)
    to(vector, index = this.index) {
        let vec = interpret_v(this.length, ...arguments)
        for (let i = 0; i < this.length; i++) { this[i] = vec[i] - this[i] }
        return this
    }


    // Calculates distance to a plane (defined by a point and a normal)
    // "normal" is assumed to be normalized to a magnitude of 1
    // return values:
    // 0 - vector is on the plane
    // +x - x units in front of the plane
    // -x - x units behind the plane
    // Useful for collision detection amongst other things

    to_plane(normal, point_on_plane) {
        [normal, point_on_plane] = interpret_p(this.length, ...arguments)
        return v(this).sub(point_on_plane).dot(normal)
    }

    // "Projects" the vector onto a plane perpendicular to the given normal, or "kernel"
    // in other words, this flattens the vector along a given axis
    collapse(normal, point_on_plane) {
        [normal, point_on_plane] = interpret_p(this.length, ...arguments)

        let rejection = this.to_plane(normal, point_on_plane)
        return this.sub(v(normal).scale(rejection))
    }

    // For calculating the apparent position on the other side of a mirror
    mirror(normal, point_on_plane) {
        [normal, point_on_plane] = interpret_p(this.length, ...arguments)
        let rejection = this.to_plane(normal, point_on_plane)
        return this.sub(v(normal).scale(rejection * 2))
    }

    // For calculating reflections
    // more useful on the GPU end, not sure what you'd use this for here
    reflect(normal) {
        [normal] = interpret_p(this.length, ...arguments)
        return this.to(v(normal).scale(2 * this.dot(normal)))
    }

    // Bounces the vector off a surface normal
    bounce(normal) {
        [normal] = interpret_p(this.length, ...arguments)
        return this.sub(v(normal).scale(2 * this.dot(normal)))
    }


    // Linear Interpolation
    // A.lerp(t, B)
    // t == 0, return A
    // t == 1, A assumes B's position, return A
    // t == 0.5, A is now the midpoint between A's original value and B, и так далее и так далее
    lerp(t, vector, index = this.index) {
        let vec = interpret_v(this.length, vector, index)
        let one_minus_t = 1 - t
        for (let i = 0; i < this.length; i++) { this[i] = this[i] * one_minus_t + vec[i] * t }
        return this
    }

    // Spherical Linear Interpolation
    // A.lerp(t, B)
    // similar to Linear Interpolation, but instead of a straight line, we rotate around the origin
    // in cases where A and B are different magnitudes, the magnitude of the output linearly interpolates between them
    slerp(t, vector, index = this.index) {
        let vec = interpret_v(this.length, vector, index)
        let length = this.length

        if (vec.length == length) {

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

    // Transforms this vector by a given matrix
    // A.transform(m(3).look_at(B))
    transform(matri, index = this.index) {
        let matrix = interpret_m(this.length, ...arguments) // let...
        let rows = matrix.codomain
        let columns = matrix.domain
        if (rows == columns && columns == this.length) {
            let old = v(this)
            for (let i = 0; i < rows; i++) {
                this[i] = 0
                for (let j = 0; j < columns; j++) {
                    this[i] += old[j] * matrix[j * rows + i]
                }
            }
        }
        return this
    }

    cross() { }
}

export default function v() { return new Vec(...arguments) }

// Returns the midpoint/average of 2+ vectors
// The function gives a warning if the vectors aren't all the same dimension
// But it will still return output in spite of these warnings

v.midpoint = function (...vecs) {
    let mid = v(vecs[0].length)
    for (let vec of vecs) {
        vec.length != mid.length && console.error("dimension mismatch")
        mid.add(vec)
    }
    return mid.scale(1 / arguments.length)
}

// test this

v.weighted_midpoint = function (vecs, weights) {
    let mid = v(vecs[0].length)
    let total_weight = 0
    for (let i = 0; i < vecs.length; i++) {
        total_weight += weights[i]
        mid.add(v(vecs[i]).scale(weights[i]))
    }
    return mid.scale(1 / total_weight)
}

v.dot = function (a, b) {
    let length = a.length < b.length ? a.length : b.length
    let product = 0
    for (let i = 0; i < length; i++) { product += a[i] * b[i] }
    return product
}

// The cross product

v.cross = function (a, b) {
    if (a.length == b.length && a.length == 3) {
        let c = v(3)
        c[0] = a[1] * b[2] - a[2] * b[1]
        c[1] = a[2] * b[0] - a[0] * b[2]
        c[2] = a[0] * b[1] - a[1] * b[0]
        return c
    } else { return v(1, 0, 0) }
}

v.distance = function (a, b) { return v(a).sub(b).magnitude() }