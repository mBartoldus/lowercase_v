# lowercase_v

I started this library while messing around in webGL. I was typing vectors every day, so I wanted a class that was:

* chainable
* webGL-compliant
* friendly towards large flat arrays
* full of intuitive default parameters
* easy to read
* easy to type

If that sounds relevant to your project, read on.

## Table of Contents

* the v() constructor
* the m() constructor
* Regarding In-Place Methods
* Reading and Writing to Flat Arrays
 * .copy()
 * .read()
 * .write()
* Regarding Parameter Formats
* v() Methods
* m() Methods

## v(...)

v() returns an object that extends Float32Array. You can pass it a single number to get the zero vector of that dimension.

	v(2) // returns [0,0]
	v(3) // returns [0,0,0]
	v(4) // returns [0,0,0,0] etc.

Alternatively, you can initialize the vector with any combination of numbers and iterables. Let's say you wanted a 3-dimensional vector with elements [1,2,3].

	v(1,2,3)
	v([1,2], 3)
	v([1], 2, new Float32Array([3])) // these all return [1,2,3]

I got this idea from glsl, where parameter concatenation is useful in converting vec3 to vec4. You can use this to make quaternions, append alpha values to RGB, extend stencil shadow volumes to "infinity", etc.

> Potential ambiguity to consider:
> * v(100) returns a 100-dimensional vector
> * v([100]) returns a 1-dimensional vector with the value 100.

## m(...)

m() also extends Float32Array. Pass it a single number and it will give you the relevant n-by-n zero matrix.

	m(3) // returns 3x3
	
For an m-by-n matrix, pass two numbers. The first will determine the number of rows (codomain), and the second will determine the number of columns (domain). These numbers will be stored in the resulting matrix's .domain and .codomain properties.

	m(2, 3) // returns a matrix with 2 rows and 3 columns

The m() constructor can't initialize values like v(), as the matrix's domain and codomain need to be initialized first. To populate the matrix, use the methods .assign(), .from_rows(), .from_columns(), .from_quaternion(), .look_at(), or .face_towards().

The values are stored in column-major order, for compatibility with webgl and GLSL.

## In-Place Methods

By default, in most of the methods in this library, the object will modify itself, and return "this". That fact is important to remember, as it can cause some confusion:

	let A_to_B = point_A.to(point_B)

In the above example, point_A has modified itself, and worse yet - A_to_B is the same object as point_A. This is not what we wanted. You can fix this by wrapping point_A in the v() constructor to clarify its role as a new vector:

	let A_to_B = v(point_A).to(point_B)

That way, you only allocate new memory when you explicitly need it, and you can do so with brevity.

## Reading and Writing

The Vec and Matrix classes included in this library share the following methods for interacting with flat arrays:

* .copy()
* .read()
* .write()

#### .copy()

.copy() and .read() do similar things, and take the same kind of parameters. Let's start with .copy:

	let flat_array = [ 0,0,0,
			   1,2,3 ]

	let vector_1 = v(3).copy(flat_array, 1) // vector_1 == [1,2,3]

By giving .copy() a large array followed by an index, the vector assumes the array is tightly packed with vectors of the same dimension, and populates itself with the values of the nth vector in that array.

> **.copy() assumes the input array's stride to equal the length of the calling object.** A 3x3 matrix will expect an array with a stride of 9, and would therefore fail to extract meaningful data from an array of 4x4s with stride 16

#### .read()

.read() does the same as .copy(), but will remember the index as well as a reference to the parent array. This is useful when paired with .write() in situations involving persistent data.

> Avoid using .read() on temporary data. That held reference will prevent garbage collection.

#### .write()

Just as .copy() and .read() takes data out of arrays, .write() puts them back in.

	v(3).randomize().write(flat_array, index)

You can explicitly state which array and index you're writing to, or you can leave out the parameters if you're writing to the same data you read from earlier. As a general rule of thumb, you should only rely on the default parameters in .read() and .write() as bookends in a chain. For example:

	v(3).read(flat_array, index).add(displacement).write()

The above example creates a temporary v(3), which then grabs a vector from an array, adds a displacement vector, and saves the result snugly back where you found it.

	v(3).read(Velocity, id).bounce(surface_normal).scale(1/damping).write()

In this example, "Velocity" is a flat array, "id" is an integer reserved by an entity whose velocity is stored at that index. In this situation, the entity was moving in a direction, but has bounced off a surface, which has also slowed the velocity by some amount of damping.

> Writing to another vector is discouraged. The methods .read() and .write() should be reserved for large persistent flat arrays with shared indices, like those you might find in an ECS architecture. If you try reading or writing to a vector, the one calling these methods will likely remember an index from an earlier call, and try to access some out-of-bounds index. For those situations, use copy instead.

## Parameter Formats

Most methods on v() and m() will liberally interpret parameters. If you pass a combination of numbers and iterables to a method expecting a vector, it will concatenate them without need for the v() constructor.

	v(3).add(1,2,3)
	v(3).add(v(1,2,3)) // these are equivalent

If you pass a large array (+ optionally index) to a method expecting a vector or a matrix, the parameters will be interpreted in the same way as .copy()

	v(3).add(flat_array, index)
	v(3).add(v(3).copy(flat_array, index)) // also equivalent

If you pass a large array with no index specified, an index may be remembered from a prior .read(). Again, this is useful when you have large persistent arrays with shared indices. But if you're feeling unsure, just specify the index.

## v() Methods

#### .swizzle()

Swizzling allows you to create a new vector from the values of another. .swizzle() accepts a vector of indices, and returns a new vector with the values taken from those indices.

	v(1,2,3).swizzle(0,0,0) // returns v(1,1,1)

You can also call this method as .swz()

#### .dot()
#### .cross()
#### .equals()
#### .randomize()
#### .magnitude()
#### .clamp()
#### .quantize()
#### .normalize()
#### .scale()
#### .v_scale()
#### .add()
#### .sub()
#### .to()
#### .lerp()
#### .slerp()

#### .to_plane()
#### .collapse()
#### .mirror()
#### .reflect()
#### .bounce()

#### .transform()

#### v.midpoint()
#### v.dot()
#### v.cross()
#### v.distance()

## m() Methods

#### .row(), .column()
#### .assign()
#### .from_rows(), .from_columns()
#### .from_quaternion()
#### .transform()
#### .multiply()

#### .look_at()
#### .face_towards()

#### m.identity()



