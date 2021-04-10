import { v } from "../vectors/v.js"
import { m } from "../matrices/m.js"

export class FlatArray extends Float32Array {
    constructor(n_instances, dimensions) {
        let class_constructor
        let stride
        switch (typeof dimensions) {
            case "number":
                class_constructor = v
                stride = dimensions
                break
            case "object":
                class_constructor = m
                stride = dimensions[0] * (dimensions[1] ?? dimensions[0])
                break
            default: break
        }
        if (typeof n_instances === "number") super(stride * n_instances)
        else super(n_instances)
        Object.assign(this, {
            stride,
            class_constructor,
            dimensions,
            n_instances: typeof n_instances == "number" ? n_instances : this.length / stride
        })
    }
    get(index) {
        return this.class_constructor ?
            (this.class_constructor(this.dimensions)).read(this, index) :
            this[index]
    }
    set(index, data) {
        if (data instanceof this.class) data.write(this, index)
        else {
            for (let i = 0; i < data.length; i++) {
                this[i] = data[i]
            }
        }
        return this
    }
}

export class WovenArray extends Float32Array {
    constructor(n_instances, format) {
        let stride = 0
        let offset = 0

        let strides = {}
        let offsets = {}

        for (let tag in format) {
            let dim = format[tag]
            let length = typeof dim == "number" ? dim : dim[0] * (dim[1] ?? dim[0])

            offsets[tag] = offset
            strides[tag] = length

            stride += length
            offset += length
        }

        if (typeof n_instances === "number") super(stride * n_instances)
        else super(n_instances)

        Object.assign(this, {
            stride,
            strides,
            format,
            offsets,
            n_instances: typeof n_instances == "number" ? n_instances : this.length / stride
        })
    }

    get(id, tag) {
        if (!tag) {
            return new WovenArray(1, this.format).copy(this, id)
        } else {
            let dim = this.format[tag]
            let value
            if (dim === 1) {
                value = this[id * this.stride + this.offsets[tag]]
            } else {
                if (typeof dim === "number") value = v(dim)
                else value = m(...dim)
                let offset = this.offsets[tag]
                for (let i = 0; i < value.length; i++) {
                    value[i] = this[id * this.stride + offset + i]
                }
                value.parent = this
                value.index = (id * this.stride + offset) / value.length
            }
            return value
        }
    }

    set(id, value, tag) {
        if (value.length) {
            let offset = this.offsets[tag] ?? 0
            let length = Math.min(this.strides[tag] ?? this.stride, value.length)
            for (let i = 0; i < length; i++) {
                this[id * this.stride + offset + i] = value[i]
            }
        } else {
            this[id * this.stride + this.offsets[tag]] = value
        }
        return this
    }

    reweave(format) {
        let rewoven = new WovenArray(this.n_instances, format)
        for (let tag in format) {
            if (tag in this.format) {
                for (let i = 0; i < this.n_instances; i++) {
                    rewoven.set(i, this.get(i, tag), tag)
                }
            }
        }
        return rewoven
    }

    weave(arrays = {}) {
        for (let tag in arrays) {
            let stride = this.strides[tag]
            let offset = this.offsets[tag]
            for (let id = 0; id < this.n_instances; id++) {
                for (let i = 0; i < stride; i++) {
                    this[id * this.stride + offset + i] = arrays[tag][id * stride + i]
                }
            }
        }
        return this
    }

    unravel(tag) {
        let stride = this.strides[tag]
        let offset = this.offsets[tag]
        let unraveled = new FlatArray(this.n_instances, this.format[tag])
        for (let id = 0; id < this.n_instances; id++) {
            for (let i = 0; i < stride; i++) {
                unraveled[id * stride + i] = this[id * this.stride + offset + i]
            }
        }
        return unraveled
    }
}