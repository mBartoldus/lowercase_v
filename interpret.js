import v from "./Vec.js"
import m from "./Matrix.js"

// None of the functions in this file are meant to be part of the front-facing API
// streamline

// That ternary expression is there 
export function copy_at_index(output, input, index = 0) {
    let offset = output.length * index //(output.length == input.length ? 0 : index)
    for (let i = 0; i < output.length; i++) output[i] = input[offset + i] || 0
    return output
}

export const interpret_s = (input, index = 0) => typeof input == "number" ? input : input[index] || console.error()

// rename dimension domain perhaps
export function interpret_v(expected_dimension, input, index, ...etc) {
    if (typeof input == "number") { return v(input, index, etc) }
    else if (input.length == expected_dimension) { return input }
    else {
        let vec = v(expected_dimension)
        return copy_at_index(vec, input, index)
    }
}

export function interpret_m(expected_domain, input, index) {
    let { codomain = expected_domain, domain = expected_domain } = input
    let matrix = m(codomain, domain)
    return copy_at_index(matrix, input, index)
}

export function interpret_p(expected_dimension, ...input) {
    if (typeof input[0] == "object" && input[0].length == expected_dimension
        && typeof input[1] == "object" && input[1].length == expected_dimension) {
        return input
    } else {
        let args = v(expected_dimension * 2).copy(v(...input))
        let normal = v(expected_dimension).copy(args, 0)
        let point_on_plane = v(expected_dimension).copy(args, 1)
        return [normal, point_on_plane]
    }
}