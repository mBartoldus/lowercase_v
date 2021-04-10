import { _m3 } from "../3D/3D.js"
import {
    _interpret_s,
    _interpret_v,
    _interpret_m,
    _reading_and_writing
} from "../reading_and_writing/R&R.js"

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
        // interpret s
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
