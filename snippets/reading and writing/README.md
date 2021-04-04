
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