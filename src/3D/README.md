## Representations of 3D Rotation

This library supports 3 representations of 3-dimensional rotation:
* rotation about an axis
* matrices
* quaternions

Rotation about an axis follows the right-hand-rule. If your right hand's thumb is the axis, then the curl of your fingers shows the direction of rotation. Methods which take this representation accept the following format:

	( rotation, ...axis )

The "rotation" parameter is measured in turns - any whole number will give a 360° rotation.

    // 1 turn    === 360 degrees
    // 0.5 turn  === 180 degrees
    // 0.25 turn === 90 degrees

    v( 1,0,0 ).rotate( 1/4, [0,0,1] )       // returns [ 0,1,0 ]

For more information on matrices and quaternions, see their respective readmes.

## Methods exclusive to v(3)

### .rotate( rotation, ...axis ) // .rotate( ...quaternion )
If the first argument given is a number, this method will assume axial representation, and look for a 3D vector amongst the following arguments.

	v( 1,0,0 ).rotate( 0.1, [ x, y, z ] )

However, if the first argument is a vector or array, the method will interpret it as a quaternion.

	v( 1,0,0 ).rotate( [ x, y, z, w ] )

## Methods exclusive to m(3)
### .from_axis( rotation, ...axis )
Constructs a rotation matrix from the given axial representation.

### .from_quaternion( quaternion )
Constructs a transformation matrix from a quaternion.

> The magnitude of the quaternion will result in the scale of the matrix. In the case of a rotation matrix, you want that scale to be 1, so the quaternion should be normalized to 1. But, there are situations one could imagine in which that isn't the case.

### .look_at( viewer, center, up = [0, 0, 1] )
This is for making cameras (projection matrices). The matrix is constructed using three vectors:

* viewer: the camera's position
* center: the point being looked at
* up: what the camera perceives as "up"

By default, the Z-direction is "up". But imagine you're in space, hopping from planet to planet. To keep the camera upright relative to whatever planet you're on, you could write something like this:

	let current_up = v(camera_position).sub( center_of_gravity ).slerp( 0.9, prior_up )
	let camera_matrix = m(3).look_at( camera_position, point_of_focus, current_up )

> In this hypothetical example, current_up is slerped to prior_up to provide smooth camera transitions. prior_up can be derived from the camera's rotation matrix as left by the prior animation frame.

### .face_towards( viewer, center, up = [0, 0, 1] )
Similar to .look_at(), but for things that aren't cameras.

Let's say character_A needs to face character_B, in an OOP engine where the character's location is stored in the property "loc", and their rotation matrix is stored in the property "rot".

	character_A.rot = m(3).face_towards( character_A.loc, character_B.loc )

> This method assumes the entity's local "forward" is negative Y, and that "up" is positive Z. These are the defaults in Blender. It would be nice to be able to customize which axis is "up" and "forward", let me know if that's something I should prioritize implementing.