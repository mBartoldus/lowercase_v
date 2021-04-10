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

## v() Methods
v() has several methods expected of any vector library:

	.add( vector )
	.sub( vector )
	.scale( scalar )
	.dot( vector )
	.magnitude()
	.normalize( new_magnitude = 1 )
	.clamp( min = -1, max = 1 )
	.quantize()

I'm sure you're familiar with adding and subtracting vectors, scaling, using dot and cross products, finding a vector's magnitude, etc. Aside from the aformentioned parameter formats, these methods require no further explanation. The following, however, do:

### .equals( vector, threshold = 0.0001 )
Checks the distance between two vectors and returns true if they're within a given distance from each other.

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

### .transform_by( matrix )
Transforms the vector by a given matrix.

### Static Methods
Finally, there are a couple of functions on the v object itself. They are:

	v.midpoint( vector_a, vector_b )
	v.dot( vector_a, vector_b )
	v.cross( vector_a, vector_b )
	v.distance( vector_a, vector_b )

These return values without modifying the arguments. Other than that, they're redundant.
