/*----------------------------------------------------------------------------------------------------------*/
// Functions for handling parameter formats

function _copy_at_index(output, input, index = 0) {
    let offset = output.length * index
    for (let i = 0; i < output.length; i++) output[i] = input[offset + i] || 0
    return output
}
const _interpret_s = (input, index = 0) => typeof input === "number" ? input : input[index] || console.error()
function _interpret_v(expected_domain, input, index, ...etc) {
    if (typeof input === "number") { return v(input, index, etc) }
    else if (input.length === expected_domain) { return input }
    else {
        let vec = v(expected_domain)
        return _copy_at_index(vec, input, index)
    }
}
function _interpret_m(expected_domain, input, index) {
    let { codomain = expected_domain, domain = expected_domain } = input
    let matrix = m(codomain, domain)
    return _copy_at_index(matrix, input, index)
}
function _interpret_p(expected_domain, ...input) {
    if (typeof input[0] === "object" && input[0].length === expected_domain
        && typeof input[1] === "object" && input[1].length === expected_domain) {
        return input
    } else {
        let args = v(expected_domain * 2).copy(v(...input))
        let normal = v(expected_domain).copy(args, 0)
        let point_on_plane = v(expected_domain).copy(args, 1)
        return [normal, point_on_plane]
    }
}

// These methods are used by both vectors and matrices
const _reading_and_writing = {
    index: undefined,
    parent: undefined,
    copy(array, index = this.index) {
        return _copy_at_index(this, array, (this.length === array.length ? 0 : index))
    },
    read(array, index = this.index) {
        this.parent = array
        this.index = index
        return _copy_at_index(this, array, index)
    },
    write(array = this.parent, index = this.index) {
        if (array && "length" in array) { this.parent = array }
        if (index != undefined) { this.index = index }
        for (let i = 0; i < this.length; i++) { this.parent[this.index * this.length + i] = this[i] }
        return this
    },
    fill(value) {
        for (let i = 0; i < this.length; i++) this[i] = value
        return this
    },
    clear() {
        this.fill(0)
        this.parent = undefined
        this.index = undefined
        return this
    },
}

/*----------------------------------------------------------------------------------------------------------*/

class Vec extends Float32Array {
    constructor() {
        if (1 < arguments.length) {
            let values = []
            for (let arg of arguments) { typeof arg === "number" ? values.push(arg) : values.push(...arg) }
            super(values)
        } else { super(arguments[0]) }
        Object.assign(this, _reading_and_writing)
    }

    swizzle(xyz) {
        xyz = v(...arguments)
        let out = v(xyz.length)
        for (let i = 0; i < xyz.length; i++) { out[i] = this[xyz[i]] }
        return out
    }

    swz(...xyz) { return this.swizzle(...xyz) }

    dot(vector, index = this.index) {
        let vec = _interpret_v(this.length, vector, index)
        let length = this.length < vec.length ? this.length : vec.length
        let product = 0
        for (let i = 0; i < length; i++) { product += this[i] * vec[i] }
        return product
    }

    cross(vector, index = this.index) {
        let vec = _interpret_v(this.length, vector, index)
        let c = v.cross(this, vec)
        return _copy_at_index(this, c, 0)
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

    scale(scalar = 1, index = this.index) {
        scalar = _interpret_s(...arguments)
        for (let i = 0; i < this.length; i++) { this[i] *= scalar }
        return this
    }

    v_scale(vec, index = this.index) {
        vec = _interpret_v(this.length, ...arguments)
        for (let i = 0; i < this.length; i++) { this[i] *= vec[i] }
        return this
    }
    add(vec, index = this.index) {
        vec = _interpret_v(this.length, ...arguments)
        for (let i = 0; i < this.length; i++) { this[i] += vec[i] }
        return this
    }
    sub(vec, index = this.index) {
        vec = _interpret_v(this.length, ...arguments)
        for (let i = 0; i < this.length; i++) { this[i] -= vec[i] }
        return this
    }
    to(vec, index = this.index) {
        vec = _interpret_v(this.length, ...arguments)
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
    lerp(t, vector, index = this.index) {
        let vec = _interpret_v(this.length, vector, index)
        let one_minus_t = 1 - t
        for (let i = 0; i < this.length; i++) { this[i] = this[i] * one_minus_t + vec[i] * t }
        return this
    }
    slerp(t, vector, index = this.index) {
        let vec = _interpret_v(this.length, vector, index)
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
    transform(matrix, index = this.index) {
        matrix = _interpret_m(this.length, ...arguments)
        let rows = matrix.codomain
        let columns = matrix.domain
        if (rows === columns && columns === this.length) {
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

function v() { return new Vec(...arguments) }

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

/*----------------------------------------------------------------------------------------------------------*/

class Matrix extends Float32Array {
    constructor(n_rows = 3, n_columns = n_rows) {
        super(n_rows * n_columns)
        this.codomain = n_rows
        this.domain = n_columns
        Object.assign(this, _reading_and_writing)
    }
    row(index) {
        let d = this.domain, row = v(d)
        for (let i = 0; i < d; i++) {
            row[i] = this[i * this.codomain + index]
        }
        return row
    }
    column(index) {
        let d = this.codomain, column = v(d)
        for (let i = 0; i < d; i++) { column[i] = this[index * d + i] }
        return column
    }
    transform(...vecs) {
        for (let n = 0; n < vecs.length; n++) {
            let vec = vecs[n]
            let n_rows = this.codomain
            let n_columns = this.domain
            if (vec.length != n_columns) { console.error("thats no good") }
            let old = v(vec)
            let out = v(n_rows)
            for (let i = 0; i < n_rows; i++) {
                out[i] = 0
                for (let j = 0; j < n_columns; j++) {
                    out[i] += old[j] * this[j * n_rows + i]
                }
            }
            vecs[n] = out
        }
        return vecs.length > 1 ? vecs : vecs[0]
    }
    multiply() {
        let matrix = _interpret_m(this.domain, ...arguments)
        if (this.domain != matrix.codomain) { console.error("dimension mismatch"); return }
        let l = this.codomain
        let n = matrix.domain
        let columns = []
        for (let i = 0; i < n; i++) {
            let c = columns[i] = v(l)
            for (let j = 0; j < l; j++) {
                c[j] = v.dot(this.row(j), matrix.column(i))
            }
        }
        return m(l, n).from_columns(...columns)
    }
    from_rows(...vecs) {
        let n_rows = this.codomain
        let n_columns = this.domain
        for (let i = 0; i < n_rows; i++) {
            if (typeof vecs[i] != "string")
                for (let j = 0; j < n_columns; j++) {
                    this[j * n_rows + i] = vecs[i][j]
                }
        }
        return this
    }
    from_columns(...vecs) {
        let n_rows = this.codomain
        let n_columns = this.domain
        for (let j = 0; j < n_columns; j++) {
            if (typeof vecs[j] != "string")
                for (let i = 0; i < n_rows; i++) {
                    this[j * n_rows + i] = vecs[j][i]
                }
        }
        return this
    }
    assign(indices, value) {
        this[indices[1] * this.codomain + indices[1]] = value
        return this
    }
    from_quaternion() {
        let q = _interpret_v(4, ...arguments).normalize()
        let columns = []
        for (let i = 0; i < 3; i++) {
            let j = (i + 1) % 3
            let k = (i + 2) % 3
            let c = columns[i] = v(3)
            c[i] = 1 - 2 * (q[j] * q[j] + q[k] * q[k])
            c[j] = 2 * (q[i] * q[j] - q[k] * q[3])
            c[k] = 2 * (q[i] * q[k] + q[j] * q[3])
        }
        return this.from_columns(...columns)
    }
    from_q() { return this.from_quaternion(...arguments) }
    look_at(viewer, center, up = [0, 0, 1]) {
        let z = v(viewer).to(center).normalize()
        let x = v.cross(z, up).normalize()
        let y = v.cross(x, z)
        return this.from_rows(x, y, z)
    }
    face_towards(viewer, center, up = [0, 0, 1]) {
        let y = v(viewer).sub(center).normalize()
        let x = v.cross(y, up).normalize()
        let z = v.cross(x, y)
        return this.from_columns(x, y, z)
    }
}

function m() { return new Matrix(...arguments) }
m.identity = function (d = 3) {
    let matrix = new Matrix(d)
    for (let i = 0; i < d; i++) { matrix[i * d + i] = 1 }
    return matrix
}

/*----------------------------------------------------------------------------------------------------------*/

export { v, m }
