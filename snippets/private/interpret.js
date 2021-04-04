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
        return _copy_at_index(matrix, input, index)
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