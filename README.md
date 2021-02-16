# lowercase_v

I started this library while messing around in webGL. I was typing vectors every day, so I wanted a class that was:

		chainable
    webgl-compliant
		friendly towards large flat arrays
		full of intuitive default parameters
		easy on the eyes

I think we could all agree "new Float32Array([...])" is not easy on the eyes. But how far was I willing to go in the opposite direction? Zealously devoted to my immersion in the hellscape of linear algebra, I settled on:

## v(...)

v() returns an object that extends Float32Array. What goes in the parenthesis, you ask? Anything you want. Let's say you wanted a 3-dimensional vector with elements [1,2,3].

    v(1,2,3)

That's valid.

		v([1,2], 3)

That's also valid.

		v([1], 2, new Float32Array([3]))

Worrying, but valid. These all return the vector [1,2,3]. I got this idea from glsl, where parameter concatenation is common in converting from vec3 to vec4. You can make quaternions, append alpha values to RGB, extend stencil shadow volumes to "infinity", etc.
	
But *ah!* I hear you say, *"what if I want a 100-dimensional vector? Do you expect me to type 100 arguments?"*

Nah:
	
		v(100)

When given a single number, the v() constructor will interpret this as the dimension, and will give you the corresponding 0 vector

*"Okay, but what if I wanted a 1d vector with the value 100?"*

Odd request, but here you go:

    v([100])

## Chaining

I like chaining. It's more readable to my English-speaking SVO-word-order-having homunculus brain. Let's look at some example code:

		let point_A = v(3).randomize()
		let point_B = v(3).randomize()

		let A_to_B = v(point_A).to(point_B)

A_to_B is a 3d vector pointing from A to B. Note the v() around point_A prior to calling "to()". That is essential! By default, each method which returns a same-dimensional vector, does so by modifying itself and returning "this". Therefore, if we just wrote:

		point_A.to(point_B)

The result would be that point_A is now overwritten, and A_to_B === point_A instead of being its own vector. This is probably the trickiest part of the library to remember, if I'm being honest. But it's also a reason I'm thankful the brevity of the v() constructor, as its presence doesn't harm the readability too much.

## Reading and Writing

// add introduction to .read() and .write()

Writing to another vector is discouraged. The methods .read() and .write() should be reserved for large persistent flat arrays with shared indices, like those you might find in an ECS architecture. If you try reading or writing to a vector, the one calling these methods will likely remember an index from an earlier call, and try to access some out-of-bounds index. For those situations, use copy instead.

As a general rule of thumb, you should only rely on the default parameters in .read() and .write() as bookends in a chain. For example:

	v(3).read(F, 10).add(displacement).write()

This creates a temporary v(3), which then grabs the 10th vector in flat array "F", adds some displacement vector, and saves the result snugly back where you found it. Let's look at a more practical application.

	v(3).read(Velocity, id).bounce(surface_normal).scale(1/damping).write()

"Velocity" is a flat array, "id" is an integer reserved by an entity whose velocity is stored at that index. In this situation, the entity was moving in a direction, but has bounced off a surface, which has also slowed the velocity by some amount of damping.

...


