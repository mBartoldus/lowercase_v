# lowercase_v
> Now available as a UMD (ES5) module, in addition to an ES6 module!

I started this library while messing around in webGL. I was typing vectors all day, so I wanted a class that was:

* chainable
* webGL-compliant
* friendly towards large flat arrays and other datatypes/libraries
* full of intuitive default parameters
* easy to read
* easy to type

If that sounds relevant to your interests, read on.

## Table of Contents
0. Intro
1. The v() constructor
2. The m() constructor
3. Regarding In-Place Methods
4. Regarding Parameter Formats
5. Credits

> Click on the "snippets" folder for more READMEs detailing parts of this project

## v(...)
v() returns an object that extends Float32Array. Passing a single number returns the zero vector of that dimension.

	v( 2 ) // returns [0,0]
	v( 3 ) // returns [0,0,0]
	v( 4 ) // returns [0,0,0,0] etc.

Alternatively, you can initialize the vector with a combination of numbers and iterables.

Let's say you wanted a 3-dimensional vector with elements [1,2,3]. Valid ways of declaring that vector include:

	v( 1,2,3 )
	v( [1,2], 3 )
	v( [1], 2, new Float32Array([3]) )

> This feature was inspired by GLSL, wherein parameter concatenation is useful in converting vec3 to vec4.
> You can use concatenation to make quaternions, append alpha values to RGB, extend stencil shadow volumes to "infinity", etc.

This leaves one Potential ambiguity to consider:

	v( 100 )	// returns a 100-dimensional vector
	v([100])	// returns a 1-dimensional vector with the value 100.

## m(...)
m() also extends Float32Array. Pass it a single number and it will give you the relevant n-by-n zero matrix.

	m( 3 )		// returns a blank 3x3 matrix
	
For an m-by-n matrix, pass two numbers.
The first will determine the number of rows ( the codomain ), and the second will determine the number of columns ( the domain ).
These numbers will be stored in the resulting matrix's .domain and .codomain properties.

	m( 2, 3 )	// returns a matrix with 2 rows and 3 columns

The m() constructor can't initialize values, as the domain and codomain need to be initialized first.
To populate the matrix, use the methods .assign(), .from_rows(), .from_columns(), .from_quaternion(), .look_at(), or .face_towards().

> Matrix elements are stored in column-major order, for compatibility with webgl and GLSL.

## In-Place Methods
By default, in most of the methods in this library, the object will modify itself, and return "this". That fact is important to remember, as it can cause some confusion:

	let A_to_B = point_A.to( point_B )

In the above example, point_A has modified itself, and worse yet - A_to_B is the same object as point_A. This is not what we wanted. You can fix this by wrapping point_A in the v() constructor to clarify its role as a new vector:

	let A_to_B = v( point_A ).to( point_B )

That way, new memory is only allocated when explicitly needed, and one can do so with brevity.

## Parameter Formats
Most methods on v() and m() will liberally interpret parameters. If you pass a combination of numbers and iterables to a method expecting a vector, it will concatenate them without need for the v() constructor.

	v(3).add(1,2,3)
	v(3).add(v(1,2,3))
						// these are equivalent

If you pass a large array (+ optionally index) to a method expecting a vector or a matrix, the parameters will be interpreted in the same way as .copy()

	v(3).add( flat_array, index )
	v(3).add( v(3).copy(flat_array, index) )
						// these are also equivalent

If you pass a large array with no index specified, an index may be remembered from a prior .read(). Again, this is useful when you have large persistent arrays with shared indices. But if you're feeling unsure, just specify the index.

Methods expecting a plane will look for a normal followed by a point on that plane. Parameters can be concatenated, but I'd advise against it, it can get messy. If no point on the plane is given, the method will assume the plane runs through the origin.

## Credits
As mentioned before, [gl-matrix](https://github.com/toji/gl-matrix) was the inspiration for much of this.
Also, big thanks to William Rowan Hamilton for his exploration of quaternions, and numbers in general.
