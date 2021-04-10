export const _quaternion = {

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