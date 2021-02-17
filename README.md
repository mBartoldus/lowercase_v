# lowercase_v
> presently available as an ES6 module

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
4. Reading and Writing to Flat Arrays
5. Regarding Parameter Formats
6. v() Methods
7. m() Methods
8. Future Plans
9. Credits

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

## Reading and Writing
The Vec and Matrix classes included in this library share the following methods for interacting with flat arrays:

* .copy()
* .read()
* .write()

### .copy()
.copy() and .read() do similar things, and take the same kind of parameters. Let's start with .copy:

	let flat_array = [ 0,0,0,
			   1,2,3 ]

	let vector_1 = v(3).copy( flat_array, 1 )
							// vector_1 == [1,2,3]

By giving .copy() a large array followed by an index, the vector assumes the array is tightly packed with vectors of the same dimension, and populates itself with the values of the nth vector in that array.

> **.copy() assumes the input array's stride to equal the length of the calling object.** A 3x3 matrix will expect an array with a stride of 9, and would therefore fail to extract meaningful data from an array of 4x4s with stride 16

### .read()
.read() does the same as .copy(), but will remember the index as well as a reference to the parent array. This is useful when paired with .write() in situations involving persistent data.

> Avoid using .read() on temporary data. That held reference will prevent garbage collection.

### .write()
Just as .copy() and .read() takes data out of arrays, .write() puts them back in.

	v(3).randomize().write( flat_array, index )

You can explicitly state which array and index you're writing to, or you can leave out the parameters if you're writing to the same data you read from earlier. As a general rule of thumb, you should only rely on the default parameters in .read() and .write() as bookends in a chain. For example:

	v(3).read( flat_array, index )
		.add( displacement )
		.write()

The above example creates a temporary v(3), which then grabs a vector from an array, adds a displacement vector, and saves the result snugly back where you found it.

	v(3).read( Velocity, id )
		.bounce( surface_normal )
		.scale( 1 / damping )
		.write()

In this example, "Velocity" is a flat array, "id" is an integer reserved by an entity whose velocity is stored at that index. In this situation, the entity was moving in a direction, but has bounced off a surface, which has also slowed the velocity by some amount of damping.

> Writing to another vector is discouraged. The methods .read() and .write() should be reserved for large persistent flat arrays with shared indices, like those you might find in an ECS architecture. If you try reading or writing to a vector, the one calling these methods will likely remember an index from an earlier call, and try to access some out-of-bounds index. For those situations, use copy instead.

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

## v() Methods
v() has several methods expected of any vector library:

	.add( vector )
	.sub( vector )
	.scale( scalar )
	.dot( vector )
	.cross( vector )
	.magnitude()
	.normalize( new_magnitude = 1 )
	.clamp( min = -1, max = 1 )
	.quantize()

I'm sure you're familiar with adding and subtracting vectors, scaling, using dot and cross products, finding a vector's magnitude, etc. Aside from the aformentioned parameter formats, these methods require no further explanation. The following, however, do:

### .equals( vector, threshold = 0.0001 )
Checks the distance between two vectors and returns true if they're within a given threshold.

### .swizzle( indices )
Swizzling allows you to create a new vector from the values of another. .swizzle() accepts a vector of indices, and returns a new vector with the values taken from those indices.

	v( 1,2,3 ).swizzle( 0,0,0,1,2 ) 	// returns v(1,1,1,2,3)

You can also call this method as .swz()

### .randomize( range = 1, locus = v(this.length) )
Uses Math.random() to repopulate the vector with values clamped in given range of a locus. By default, the new vector is within the unit cube of the origin. It'd be nice if the result was spherically-distributed relative to the locus, but it is not.

### .v_scale( vector )
Scales the caller by a vector argument, elementwise. That is to say:

	v( 0,1,2 ).v_scale( 2,3,4 )		// returns v(0,3,8)

### .lerp( t, vector )
Linearly interpolates the caller towards another vector.

	point_A.lerp( t, point_B )

	// when t == 0	  point_A stays the same
	//	t == 0.5  point_A slides halfway to point_B
	// 	t == 1    point_A is now equal to point_B

### .slerp( t, vector )
.slerp(). **S**pherical **L**inear int**ERP**olation. Slerp. I swear I'm not making this up. https://en.wikipedia.org/wiki/Slerp

	point_A.slerp( t, point_B )

	// similar to linear interpolation, but instead of a straight line, point_A is rotated about the origin.
	// when point_A and point_B are different magnitudes, the resulting vector's magnitude is linearly interpolated

> Shoutout to tojiCode: A lot of this library was inspired by [gl-matrix](https://github.com/toji/gl-matrix), *especially* the slerp.

### .to_plane( normal, point_on_plane )
Calculates distance to a plane as defined by a point and a normal vector. A return value of 0 means your vactor is on the plane. A positive value means the vector is in front, and a negative means it is behind.

If all you need to know is whether the point is in front of or behind the plane, then the magnitude of the normal is not important. However, if the number of arbitrary units from the plane is important, then it's important to normalize your input first. This is useful for collision detection.

### .collapse( normal, point_on_plane )
"Projects" the vector onto a plane perpendicular to the given normal, or "kernel". In other words, it flattens the vector along a given axis

### .mirror( normal, point_on_plane )
For calculating the apparent position on the other side of a mirror. Like in Mario.

### .reflect( normal, point_on_plane )
For calculating specular reflections. This one's more useful on the GPU end... I'm not sure what you'd use this for on the CPU to be honest. I guess an ascii raytracer or some other niche project.

### .bounce( normal, point_on_plane )
Bounces the vector off a surface normal. Useful for changing velocity vectors during collision handling.

### .transform( matrix )
Transforms the vector by a given matrix.

### v Methods
Finally, there are a couple of functions on the v object itself. They are:

	v.midpoint( vector_a, vector_b )
	v.dot( vector_a, vector_b )
	v.cross( vector_a, vector_b )
	v.distance( vector_a, vector_b )

These return values without modifying the arguments. Other than that, they're redundant.

## m() Methods
### .row( index ), .column( index )
Returns the nth row or column of this matrix as a vector

	m.identity(3).row(0) // returns v(1,0,0)

### .assign( indices, value )
Assigns a value to the element at the given set of indices

	m(3).assign([1,1], 5) // returns a 3x3 matrix with 5 in the middle

### .from_rows( ...vectors ), .from_columns( ...vectors )
Assigns values to this matrix using row or column vectors. An empty string can be used to skip a row.

	m(2).from_rows([1,2], "")	// returns  1 2
				  	//	    0 0

	m(2).from_columns([3,4], "")	// returns  3 0
					//	    4 0

### .from_quaternion( quaternion )
Populates a 3x3 transformation matrix from a quaternion.

A quaternion is a normalized v(4) where the first three elements represent the axis of rotation, and the final element, commonly referred to as "w", is the inverse of rotation. When w == 0, the quaternion represents a 180° turn along the axis. When w == 1, there's no rotation. Therefore, v(0,0,0,1) is the identity quaternion.

	m.identity(3)
	m(3).from_quaternion(0,0,0,1) // these are equivalent

Practical use of this method might look something like this:

	m(3).from_quaternion( v(axis, 1-spin).normalize() )

> DON'T forget to normalize your quaternions.

### .transform( ...vectors )
Transforms vectors and returns them. If multiple vectors are given, the return value is an array

### .multiply( matrix )
Returns the left-multiplication of this and another matrix.

### .look_at( viewer, center, up = [0, 0, 1] )
This is for making cameras (projection matrices). This relies on the cross product and therefore only works in 3 dimensions. The matrix is constructed using three vectors:

* viewer: the camera's position
* center: the point being looked at
* up: what the camera perceives as "up"

By default, the Z-direction is "up". But imagine you're in space, hopping from planet to planet. To keep the camera upright relative to whatever planet you're on, you could write something like this:

	let current_up = v(camera_position).sub( center_of_gravity ).slerp( 0.9, prior_up )
	let camera_matrix = m(3).look_at( camera_position, point_of_focus, current_up )

> current_up is slerped to prior_up to provide smooth camera transitions. prior_up can be derived from the camera's rotation matrix as left by the prior animation frame.

### .face_towards( viewer, center, up = [0, 0, 1] )
Similar to .look_at(), but for things that aren't cameras.

Let's say character_A needs to face character_B, in an OOP engine where the character's location is stored in the property "loc", and their rotation matrix is stored in the property "rot".

	character_A.rot = m(3).face_towards( character_A.loc, character_B.loc )

> This method assumes the entity's local "forward" is negative Y, and that "up" is positive Z. These are the defaults in Blender.

### m.identity( n )
Returns an nxn identity matrix. This function is called from the m object itself.

## Future plans

The next version may include flat array classes.

	Flat_s( n_scalars )			// new Float32Array( n_scalars )
	Flat_v( n_vectors, dimension )		// new Float32Array( n_vectors * dimension )
	Flat_m( n_matrices, dimensions )	// new Float32Array( n_matrices * dimensions[0] * dimensions[1] )

Each of these classes will come with .get( index ) and .set( index, value ) methods.
Vectors and matrices returned from .get() would be initialized with references to the parent array for ease of writing

	let Velocity = Flat_v( n_entities, 3 )

	v(3).read( Velocity, entity_id ).bounce( normal ).write()	// present syntax

	Velocity.get( entity_id ).bounce( normal ).write()		// Flat_v syntax

## Credits
As mentioned before, [gl-matrix](https://github.com/toji/gl-matrix) was the inspiration for much of this.
Also, big thanks to William Rowan Hamilton for his exploration of quaternions, and numbers in general.
