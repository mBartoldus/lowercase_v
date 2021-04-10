## v(4)

There are many reasons you may want a 4-dimensional vector. One of those reasons is quaternions.

### What is a Quaternion

Quaternions are a representation of 3-dimensional rotation. They're computationally convenient, but can be tricky to think about. If nothing else, there's a few things you should know about quaternions:

* They have X Y and Z values, just like a 3D vector. This is related to the axis of rotation.
* They also have a W value, which is related to the amount of rotation.
* They should be normalized

This library stores quaternion values in the order [ x, y, z, w ].

### W

When w == 0, the quaternion represents a 180° rotation along the axis given by its XYZ values.
When w == 1, there's no rotation. Therefore, v(0,0,0,1) is the identity quaternion.

	m.identity(3)
	m(3).from_quaternion(0,0,0,1) // these are equivalent

## Methods exclusive to v(4)
### .from_axis( rotation, ...axis )
Constructs a quaternion from an axial representation.

### .from_matrix( ...matrix )
Constructs a quaternion from a rotation matrix.

### .quaternion( rotation, ...axis ) // .quaternion( ...matrix )
Constructs quaternion from either axial representation or rotation matrix.

### .compose( ...quaternion )
Constructs a quaternion representing the rotation resulting from performing one rotation after the other.

    let q_AB = v(q_A).compose( q_B )

    vec.rotate( q_AB )   // equivalent to vec.rotate( q_A ).rotate( q_B )