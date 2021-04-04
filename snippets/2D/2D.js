


const _v2 = {
    // rotate(rotation, ...axis) {
    //     if (typeof rotation === "number") {
    //         let matrix = m(3).from_axis(rotation, ...axis)
    //         return this.transform_by(matrix)
    //     } else {
    //         let q = rotation
    //         let xyz = v(3).copy(q)
    //         let w = q[3]
    //         let q_scalar = this.dot(xyz) * 2
    //         let v_scalar = w * w - xyz.dot(xyz)
    //         let cross = v(xyz).cross(this).scale(2 * w)
    //         for (let i = 0; i < 3; i++) {
    //             this[i] = xyz[i] * q_scalar + this[i] * v_scalar + cross[i]
    //         }
    //         return this
    //     }
}