



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