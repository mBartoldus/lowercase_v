//
// https://github.com/mBartoldus/lowercase_v/
//

/*----------------------------------------------------------------------*/

// PRIVATE FUNCTIONS

function _copy_at_index(output, input, index = 0) {
    let offset = output.length * index
    for (let i = 0; i < output.length; i++) output[i] = input[offset + i] || 0
    return output
}

function _interpret_s(interpreter, ...args) {
    let index = args[1] ?? (interpreter.index || 0)


    return typeof args[0] === "number" ? args[0] : args[0][index]
}

function _interpret_v(interpreter, ...args) {
    let domain = interpreter.domain ?? interpreter.length
    let L = args.length
    let n = args[0].length
    if (L === 1 && n === domain) {
        return args[0]
    }
    else if (n > domain && !(args[0] instanceof Matrix)) {
        let i = args[1] ?? interpreter.index
        return v(domain).read(args[0], i)
    }
    else {
        let vec = v(...args)
        if (vec.length !== domain) console.error("unexpected domain")
        return vec
    }
}
function _interpret_m(interpreter, ...args) {
    if (args[0] instanceof Matrix) return args[0]
    else {
        let {
            codomain = interpreter.length,
            domain = interpreter.length,
        } = interpreter
        let index = args[1] ?? interpreter.index
        let matrix = m(codomain, domain)
        return _copy_at_index(matrix, args[0], index)
    }
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

// CLASS METHODS

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

const _v3 = {
    cross(...vector) {
        let vec = _interpret_v(this, ...vector)
        let c = v.cross(this, vec)
        return _copy_at_index(this, c, 0)
    },
    rotate(rotation, ...axis) {
        if (typeof rotation === "number") {
            let matrix = m(3).from_axis(rotation, ...axis)
            return this.transform_by(matrix)
        } else {
            let q = rotation
            let xyz = v(3).copy(q)
            let w = q[3]
            let q_scalar = this.dot(xyz) * 2
            let v_scalar = w * w - xyz.dot(xyz)
            let cross = v(xyz).cross(this).scale(2 * w)
            for (let i = 0; i < 3; i++) {
                this[i] = xyz[i] * q_scalar + this[i] * v_scalar + cross[i]
            }
            return this
        }
    }
}

const _m3 = {
    from_quaternion(...quaternion) {
        let q = _interpret_v(v(4), ...quaternion)
        let mag = q.magnitude()
        let columns = []
        for (let i = 0; i < 3; i++) {
            let j = (i + 1) % 3
            let k = (i + 2) % 3
            let c = columns[i] = v(3)
            c[i] = 1 - 2 * (q[j] * q[j] + q[k] * q[k])
            c[j] = 2 * (q[i] * q[j] - q[k] * q[3])
            c[k] = 2 * (q[i] * q[k] + q[j] * q[3])
            c.scale(mag)
        }
        return this.from_columns(...columns)
    },
    from_q() { return this.from_quaternion(...arguments) },

    from_axis(rotation, ...axis) {
        axis = _interpret_v(this, ...axis)
        let radians = rotation * Math.PI
        let w = Math.cos(radians)
        let mag = Math.sin(radians)
        return this.from_quaternion(v(axis).normalize(mag), w)
    },

    look_at(viewer, center, up = [0, 0, 1]) {
        let z = v(viewer).to(center).normalize()
        let x = v.cross(z, up).normalize()
        let y = v.cross(x, z)
        return this.from_rows(x, y, z)
    },

    face_towards(viewer, center, up = [0, 0, 1]) {
        let y = v(viewer).sub(center).normalize()
        let x = v.cross(y, up).normalize()
        let z = v.cross(x, y)
        return this.from_columns(x, y, z)
    }
}

const _quaternion = {

    from_axis(rotation, ...axis) {
        axis = _interpret_v(this, ...axis)
        let radians = rotation * Math.PI
        let w = Math.cos(radians)
        let mag = Math.sin(radians)
        this.copy(v(axis).normalize(mag), w)
        return this
    },

    from_matrix(...matrix) {
        matrix = _interpret_m(v(3), ...matrix)
        let theta = Math.acos((matrix.trace() - 1) / 2) / 2
        let w = Math.cos(theta)
        let mag = Math.sin(theta)
        let mat = _interpret_m(3, matrix)
        let xyz = v(
            mat[7] - mat[5],
            mat[2] - mat[6],
            mat[3] - mat[1]
        ).normalize(mag)
        return this.copy([...xyz, w])
    },

    quaternion(rotation, ...axis) {
        return typeof rotation === "number" ?
            this.from_axis(rotation, ...axis) :
            this.from_matrix(...arguments)
    },

    compose(...quaternion) {
        let vec = _interpret_v(this, ...quaternion)
        let comp = v(4)
        comp[3] = this[3] * vec[3]
        for (let i = 0; i < 3; i++) {
            let j = (i + 1) % 3
            let k = (i + 2) % 3
            comp[i] = this[i] * vec[3]
                + this[3] * vec[i]
                + this[k] * vec[j]
                - this[j] * vec[k]
            comp[3] -= this[i] * vec[i]
        }
        return this.copy(comp)
    }
}

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

class Matrix extends Float32Array {
    constructor(n_rows, n_columns = n_rows) {
        // m( x, y ) == m([x, y])
        if (n_rows.length) {
            [n_rows, n_columns = n_rows] = n_rows
        }
        super(n_rows * n_columns)
        this.codomain = n_rows
        this.domain = n_columns
        Object.assign(this, _reading_and_writing)
        if(this.domain === 3 && this.codomain === 3) Object.assign(this, _m3)
    }
    *[Symbol.iterator]() {
        yield* this.rows()
    }
    toString() {
        let str = ""
        for (let row of this.rows()) str += row + "\n"
        return str
    }
    scale(scalar) {
        for (let i = 0; i < this.length; i++) this[i] *= scalar
        return this
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
    rows() {
        let rows = []
        for (let i = 0; i < this.codomain; i++) rows.push(this.row(i))
        return rows
    }
    columns() {
        let columns = []
        for (let i = 0; i < this.domain; i++) columns.push(this.column(i))
        return columns
    }
    transform(...vecs) {
        for (let n = 0; n < vecs.length; n++) {
            let vec = vecs[n]
            let n_rows = this.codomain
            let n_columns = this.domain
            if (vec.length != n_columns) { console.error("vector must inhabit matrix domain") }
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
    multiply(...matrix) {
        // A.multiply( B ) ==
        // ...transform_by( B ).transform_by( A )

        matrix = _interpret_m(this, ...matrix)
        if (this.domain != matrix.codomain) { console.error("parameter's codomain must match multiplicand's domain"); return }
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
    trace() {
        let n = this.domain === this.codomain ? this.domain : console.error("trace undefined for non-square matrix")
        let trace = 0
        for (let i = 0; i < n; i++) trace += this[i * n + i]
        return trace
    }
    transpose() {
        if (this.domain == this.codomain) {
            let dim = this.dimension
            let tmp
            let ur
            let bl
            for (let i = 0; i < dim; i++) {
                for (let j = i + 1; j < dim; j++) {
                    ur = i * dim + j
                    bl = j * dim + i
                    tmp = this[ur]
                    this[ur] = this[bl]
                    this[bl] = tmp
                }
            }
            return this
        } else {
            this.copy(m(this.domain, this.codomain).from_columns(...this.rows()))
            let domain = this.domain
            this.domain = this.codomain
            this.codomain = domain
            return this
        }
    }
}

export function m() { return new Matrix(...arguments) }

m.identity = function (n = 3) {
    let matrix = new Matrix(n)
    for (let i = 0; i < n; i++) { matrix[i * n + i] = 1 }
    return matrix
}
