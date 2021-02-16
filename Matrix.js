import v from "./Vec.js"
import { interpret_s, interpret_v, interpret_m } from "./interpret.js"

class Matrix extends Float32Array {
    constructor(n_rows = 3, n_columns = n_rows) {
        super(n_rows * n_columns)
        this.codomain = n_rows
        this.domain = n_columns
        this.index = undefined
        this.parent = undefined
    }
    // A.copy(B)
    // Copies the elements of B into A
    copy(matrix, index = this.index) { return copy_at_index(this, matrix, index) }

    // Copies the target elements, as well as holding reference to the copied array and index
    read(array, index = this.index) {
        this.parent = array
        this.index = index
        return copy_at_index(this, array, index)
    }

    // Copies into a target array at a given index
    // If no arguments are given, it will write back into the same array and index it was read from
    // If a new array is given, but no index, it will write to the same index of that array
    write(array = this.parent, index = this.index) {
        if (array && "length" in array) { this.parent = array }
        if (index != undefined) { this.index = index }
        for (let i = 0; i < this.length; i++) { this.parent[this.index * this.length + i] = this[i] }
        return this
    }

    // Returns the nth row of this matrix as a vector
    // m.identity(3).row(0) == v(1,0,0)
    row(index) {
        let d = this.domain, row = v(d)
        for (let i = 0; i < d; i++) {
            row[i] = this[i * this.codomain + index]
        }
        return row
    }
    // Returns the nth column of this matrix as a vector
    column(index) {
        let d = this.codomain, column = v(d)
        for (let i = 0; i < d; i++) { column[i] = this[index * d + i] }
        return column
    }

    // Transforms vectors and returns them
    // maybe make a different function for arrays vs single vec...
    // If multiple vectors are given, the return value is an array
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
    // returns the left-multiplication of this and another matrix
    multiply() {
        let matrix = interpret_m(this.domain, ...arguments)
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

    // Assigns values to this matrix using row vectors
    // An empty string can be used to skip a row
    // m(2).from_rows("", [1,2]) => [0,1,0,2]
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
    // Assigns values using column vectors
    // see from_rows for more detail
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
    // Assigns a value to the element at the given set of indices
    // m(3).assign([1,1], 5) => a 3x3 matrix with 5 in the middle
    assign(indices, value) {
        this[indices[1] * this.codomain + indices[1]] = value
        return this
    }
    // Builds a transformation matrix from a quaternion
    // A quaternion is a normalized v(4) where the first three elements represent the axis of rotation
    // and the final element is the inverse of rotation (1 == no rotation, 0 = 180 degrees)
    // v(0,0,0,1) is the identity quaternion; m(3).from_quaternion(0,0,0,1) == m.identity(3)
    // practical use might look something like this
    // m(3).from_quaternion(v(axis, 1-spin).normalize())
    // DON'T forget to normalize
    from_quaternion() {
        let q = interpret_v(4, ...arguments).normalize()
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

    // for when you don't want to spell things
    from_q() { return this.from_quaternion(...arguments) }

    // This is for making cameras (projection matrices)
    // viewer == v(3) camera's position
    // center == v(3) point being looked at
    // up == v(3) what direction is "up"?
    // By default, Z is up
    // But imagine you're in space, hopping from planet to planet
    // You could make "up" = the camera's position - the direction of gravity
    // That way the camera stays upright relative to whatever planet you're on
    look_at(viewer, center, up = [0, 0, 1]) {
        let z = v(viewer).to(center).normalize()
        let x = v.cross(z, up).normalize()
        let y = v.cross(x, z)
        return this.from_rows(x, y, z)
    }

    // This is for things that aren't cameras
    // Character A needs to face Character B
    // m(3).face_towards(A.loc, B.loc)
    // assumes the model's local "forward" is negative Y, "up" is positive Z
    // because those are the defaults in blender
    face_towards(viewer, center, up = [0, 0, 1]) {
        let y = v(viewer).sub(center).normalize()
        let x = v.cross(y, up).normalize()
        let z = v.cross(x, y)
        return this.from_columns(x, y, z)
    }
}

export default function m() { return new Matrix(...arguments) }

// An identity matrix
// Does absolutely nothing, but eh, sometimes that's what you need
m.identity = function (d = 3) {
    let m = new Matrix(d)
    for (let i = 0; i < d; i++) { m[i * d + i] = 1 }
    return m
}


/*
    transpose() {
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
    }
*/